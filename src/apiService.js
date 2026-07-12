// apiService.js - Unified Data Access Layer (Live Express API / Mock DB)
import axios from 'axios';
import { mockDb } from './mockDb';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Axios instance with default configurations
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Authorization token (and, for an admin
// viewing a specific business, the ownerId query param) dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('am_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const ownerId = localStorage.getItem('am_viewing_owner_id');
    if (localStorage.getItem('am_role') === 'admin' && ownerId) {
      config.params = { ...config.params, ownerId };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to determine if we are in API mode
export const isApiMode = () => true;

export const setApiMode = () => {
  // Always API mode
};

export const apiService = {
  // --- AUTHENTICATION ---
  login: async (email, password) => {
    if (!isApiMode()) {
      localStorage.setItem('am_token', 'mock-jwt-token');
      localStorage.setItem('am_user', JSON.stringify({ email, name: 'Admin User' }));
      return { success: true, token: 'mock-jwt-token', user: { email, name: 'Admin User' } };
    }
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success && res.data.token) {
      localStorage.setItem('am_token', res.data.token);
      localStorage.setItem('am_user', JSON.stringify({ email }));
      localStorage.removeItem('am_role');
      localStorage.removeItem('am_viewing_owner_id');
      localStorage.removeItem('am_viewing_owner_name');
    }
    return res.data;
  },

  register: async (email, password) => {
    if (!isApiMode()) {
      localStorage.setItem('am_token', 'mock-jwt-token');
      localStorage.setItem('am_user', JSON.stringify({ email, name: 'Admin User' }));
      return { success: true, token: 'mock-jwt-token', user: { email, name: 'Admin User' } };
    }
    const res = await api.post('/auth/register', { email, password });
    if (res.data.success && res.data.token) {
      localStorage.setItem('am_token', res.data.token);
      localStorage.setItem('am_user', JSON.stringify({ email }));
    }
    return res.data;
  },

  adminLogin: async (identifier, password) => {
    const isEmail = identifier.includes('@');
    const payload = isEmail ? { email: identifier, password } : { phone: identifier, password };
    const res = await api.post('/admin/login', payload);
    if (res.data.success && res.data.token) {
      localStorage.setItem('am_token', res.data.token);
      localStorage.setItem('am_user', JSON.stringify(res.data.admin || { email: identifier }));
      localStorage.setItem('am_role', 'admin');
    }
    return res.data;
  },

  logout: async () => {
    if (isApiMode()) {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.error('Logout request failed', e);
      }
    }
    localStorage.removeItem('am_token');
    localStorage.removeItem('am_user');
    localStorage.removeItem('am_role');
    localStorage.removeItem('am_viewing_owner_id');
    localStorage.removeItem('am_viewing_owner_name');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('am_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('am_token');
  },

  isAdmin: () => {
    return localStorage.getItem('am_role') === 'admin';
  },

  changePassword: async (oldPassword, newPassword) => {
    const endpoint = apiService.isAdmin() ? '/admin/change-password' : '/auth/change-password';
    const res = await api.put(endpoint, { oldPassword, newPassword });
    return res.data;
  },

  getViewingOwner: () => {
    const id = localStorage.getItem('am_viewing_owner_id');
    if (!id) return null;
    return { id, name: localStorage.getItem('am_viewing_owner_name') };
  },

  setViewingOwner: (id, name) => {
    localStorage.setItem('am_viewing_owner_id', id);
    localStorage.setItem('am_viewing_owner_name', name || '');
  },

  clearViewingOwner: () => {
    localStorage.removeItem('am_viewing_owner_id');
    localStorage.removeItem('am_viewing_owner_name');
  },

  getBusinesses: async () => {
    const res = await api.get('/admin/businesses');
    return res.data.businesses || [];
  },

  // --- BUSINESS PROFILE ---
  getBusinessProfile: async () => {
    if (!isApiMode()) {
      let mockProfile = localStorage.getItem('am_business');
      if (!mockProfile) {
        mockProfile = JSON.stringify({
          businessName: 'Ayup Technologies',
          ownerName: 'Ayup',
          phone: '9876543210',
          email: 'info@ayup.co',
          address: 'Main Market, Karol Bagh, Delhi'
        });
        localStorage.setItem('am_business', mockProfile);
      }
      return JSON.parse(mockProfile);
    }
    const res = await api.get('/business');
    return res.data.business || res.data;
  },

  updateBusinessProfile: async (profileData) => {
    if (!isApiMode()) {
      localStorage.setItem('am_business', JSON.stringify(profileData));
      return { success: true };
    }
    const backendData = {
      businessName: profileData.businessName,
      ownerName: profileData.ownerName,
      phone: profileData.phone,
      email: profileData.email,
      address: profileData.address,
    };
    const res = await api.put('/business', backendData);
    return res.data;
  },

  // --- CLIENTS ---
  getClients: async (filters = {}, page = 1, limit = 5) => {
    if (!isApiMode()) {
      return mockDb.getClients(filters, page, limit);
    }
    // Fetch all, then filter/paginate client-side if server has no paginated search,
    // or pass params to API.
    const res = await api.get('/clients');
    let list = res.data.clients || res.data;
    
    // Normalize properties
    list = list.map(c => ({
      ...c,
      _id: c._id || c.id,
      partyGstinNo: c.partyGstinNo || c.gstinNo
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c => 
        (c.partyName && c.partyName.toLowerCase().includes(q)) || 
        (c.prtCd && c.prtCd.toLowerCase().includes(q)) ||
        (c.contactNo && c.contactNo.includes(q))
      );
    }
    if (filters.area) {
      list = list.filter(c => c.areaName === filters.area);
    }

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return { clients: paginated, totalCount, totalPages, currentPage: page };
  },

  addClient: async (clientData) => {
    if (!isApiMode()) {
      return mockDb.addClient(clientData);
    }
    const backendData = {
      partyName: clientData.partyName,
      contactNo: clientData.contactNo,
      areaName: clientData.areaName,
      add1: clientData.add1,
      add2: clientData.add2,
      pinCode: clientData.pinCode,
      partyGstinNo: clientData.partyGstinNo,
    };
    const res = await api.post('/clients', backendData);
    return res.data.client || res.data;
  },

  updateClient: async (id, clientData) => {
    if (!isApiMode()) {
      return mockDb.updateClient(id, clientData);
    }
    const backendData = {
      partyName: clientData.partyName,
      contactNo: clientData.contactNo,
      areaName: clientData.areaName,
      add1: clientData.add1,
      add2: clientData.add2,
      pinCode: clientData.pinCode,
      partyGstinNo: clientData.partyGstinNo,
    };
    const res = await api.put(`/clients/${id}`, backendData);
    return res.data;
  },

  deleteClient: async (id) => {
    if (!isApiMode()) {
      return mockDb.deleteClient(id);
    }
    const res = await api.delete(`/clients/${id}`);
    return res.data;
  },

  getClientLedger: async (id) => {
    const res = await api.get(`/clients/${id}/ledger`);
    return res.data;
  },

  // --- BULK IMPORT ---
  previewImport: async (resource, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/import/${resource}/preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Uses raw fetch (not the shared axios instance) so we can read the
  // Server-Sent Events stream chunk-by-chunk for real progress updates.
  runImport: async (resource, file, onProgress) => {
    const token = localStorage.getItem('am_token');
    const ownerId = localStorage.getItem('am_viewing_owner_id');
    const isAdminViewing = localStorage.getItem('am_role') === 'admin' && ownerId;
    const url = `${API_BASE_URL}/import/${resource}${isAdminViewing ? `?ownerId=${ownerId}` : ''}`;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      let message = 'Import failed to start';
      try { message = JSON.parse(text).message || message; } catch { /* not JSON */ }
      throw new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalSummary = null;
    let streamError = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const eventMatch = rawEvent.match(/^event: (.+)$/m);
        const dataMatch = rawEvent.match(/^data: (.+)$/m);
        if (!dataMatch) continue;
        const eventType = eventMatch ? eventMatch[1].trim() : 'message';
        const data = JSON.parse(dataMatch[1]);

        if (eventType === 'progress' && onProgress) {
          onProgress(data);
        } else if (eventType === 'complete') {
          finalSummary = data;
        } else if (eventType === 'error') {
          streamError = data.message || 'Import failed';
        }
      }
    }

    if (streamError) throw new Error(streamError);
    if (!finalSummary) throw new Error('Import did not complete');
    return finalSummary;
  },

  downloadFailedReport: async (resource, importId, format = 'csv') => {
    const token = localStorage.getItem('am_token');
    const ownerId = localStorage.getItem('am_viewing_owner_id');
    const isAdminViewing = localStorage.getItem('am_role') === 'admin' && ownerId;
    const params = new URLSearchParams({ format });
    if (isAdminViewing) params.set('ownerId', ownerId);
    const url = `${API_BASE_URL}/import/${resource}/download-failed/${importId}?${params.toString()}`;

    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error('Failed to download report');
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `failed-records.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // --- PAYMENTS ---
  getPayments: async (filters = {}) => {
    const res = await api.get('/payments', { params: filters });
    return res.data.payments || [];
  },

  // --- ITEMS / STOCK ---
  getItems: async (filters = {}, page = 1, limit = 5) => {
    if (!isApiMode()) {
      return mockDb.getItems(filters, page, limit);
    }
    const res = await api.get('/items');
    let list = res.data.items || res.data;

    // Normalize properties
    list = list.map(i => ({
      ...i,
      _id: i._id || i.id,
      descript: i.descript || i.itemName,
      stkBal: i.stkBal !== undefined ? i.stkBal : i.stockQty,
      unitPrice: i.unitPrice || i.salnetRt
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(i => 
        (i.descript && i.descript.toLowerCase().includes(q)) || 
        (i.ipmrpCd && i.ipmrpCd.toLowerCase().includes(q))
      );
    }

    if (filters.lowStock) {
      const threshold = Number(filters.threshold) || 10;
      list = list.filter(i => i.stkBal <= threshold);
    }

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return { items: paginated, totalCount, totalPages, currentPage: page };
  },

  addItem: async (itemData) => {
    if (!isApiMode()) {
      return mockDb.addItem(itemData);
    }
    const backendData = {
      descript: itemData.descript,
      mrp: Number(itemData.mrp) || 0,
      salnetRt: Number(itemData.salnetRt) || 0,
      stkBal: Number(itemData.stkBal) || 0,
      gstPc: Number(itemData.gstPc) || 0,
      hsnCd: itemData.hsnCd || '',
      unit: itemData.unit || 'pcs',
    };
    const res = await api.post('/items', backendData);
    return res.data;
  },

  updateItem: async (id, itemData) => {
    if (!isApiMode()) {
      return mockDb.updateItem(id, itemData);
    }
    const backendData = {
      descript: itemData.descript,
      mrp: Number(itemData.mrp) || 0,
      salnetRt: Number(itemData.salnetRt) || 0,
      stkBal: Number(itemData.stkBal) || 0,
      gstPc: Number(itemData.gstPc) || 0,
      hsnCd: itemData.hsnCd || '',
      unit: itemData.unit || 'pcs',
    };
    const res = await api.put(`/items/${id}`, backendData);
    return res.data;
  },

  deleteItem: async (id) => {
    if (!isApiMode()) {
      return mockDb.deleteItem(id);
    }
    const res = await api.delete(`/items/${id}`);
    return res.data;
  },

  // --- APP USERS (registered/logged-in via the mobile app; admin-only) ---
  getUsers: async () => {
    if (!isApiMode()) {
      return [];
    }
    const res = await api.get('/auth/users');
    return res.data.users || res.data;
  },

  toggleBlockUser: async (id) => {
    const res = await api.put(`/auth/users/${id}/block`);
    return res.data;
  },

  approveUser: async (id) => {
    const res = await api.put(`/auth/users/${id}/approve`);
    return res.data;
  },

  rejectUser: async (id) => {
    const res = await api.put(`/auth/users/${id}/reject`);
    return res.data;
  },

  // --- SALESMEN ---
  getSalesmen: async () => {
    if (!isApiMode()) {
      return mockDb.getSalesmen();
    }
    const res = await api.get('/salesmen');
    return res.data.salesmen || res.data;
  },

  addSalesman: async (salesmanData) => {
    if (!isApiMode()) {
      const list = mockDb.getSalesmen();
      const code = `S${String(list.length + 1).padStart(3, '0')}`;
      const newSalesman = {
        _id: 's_' + Date.now(),
        code,
        name: salesmanData.name,
        contactNo: salesmanData.contactNo || salesmanData.phone || ''
      };
      list.push(newSalesman);
      localStorage.setItem('am_salesmen', JSON.stringify(list));
      return newSalesman;
    }
    const backendData = {
      name: salesmanData.name,
      phone: salesmanData.phone || salesmanData.contactNo,
      area: salesmanData.area || ''
    };
    const res = await api.post('/salesmen', backendData);
    return res.data;
  },

  updateSalesman: async (id, salesmanData) => {
    if (!isApiMode()) {
      const list = mockDb.getSalesmen();
      const idx = list.findIndex(s => s._id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...salesmanData };
        localStorage.setItem('am_salesmen', JSON.stringify(list));
      }
      return list[idx];
    }
    const backendData = {
      name: salesmanData.name,
      phone: salesmanData.phone || salesmanData.contactNo,
      area: salesmanData.area || ''
    };
    const res = await api.put(`/salesmen/${id}`, backendData);
    return res.data;
  },

  deleteSalesman: async (id) => {
    if (!isApiMode()) {
      let list = mockDb.getSalesmen();
      list = list.filter(s => s._id !== id);
      localStorage.setItem('am_salesmen', JSON.stringify(list));
      return true;
    }
    const res = await api.delete(`/salesmen/${id}`);
    return res.data;
  },

  getSalesmanActivity: async (id) => {
    const res = await api.get(`/salesmen/${id}/activity`);
    return res.data;
  },

  // --- SALE BILLS ---
  getSaleBills: async (filters = {}, page = 1, limit = 5) => {
    if (!isApiMode()) {
      return mockDb.getSaleBills(filters, page, limit);
    }
    const res = await api.get('/outward-bills/sale-bill');
    let list = res.data.bills || res.data;

    // Backend already populates customerAc via .populate() — use it directly as 'customer'
    list = list.map(b => ({
      ...b,
      _id: b._id || b.id,
      customer: typeof b.customerAc === 'object' ? b.customerAc : null,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(b => {
        const partyName = b.customer?.partyName ? b.customer.partyName.toLowerCase() : '';
        return (b.voucherNo || '').toLowerCase().includes(q) || partyName.includes(q);
      });
    }

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return { bills: paginated, totalCount, totalPages, currentPage: page };
  },

  addSaleBill: async (billData) => {
    if (!isApiMode()) {
      return mockDb.addSaleBill(billData);
    }
    const res = await api.post('/outward-bills/sale-bill', billData);
    return res.data;
  },

  deleteSaleBill: async (id) => {
    if (!isApiMode()) {
      return mockDb.deleteSaleBill(id);
    }
    const res = await api.delete(`/outward-bills/sale-bill/${id}`);
    return res.data;
  },

  // --- DEBIT NOTES ---
  getDebitNotes: async (filters = {}, page = 1, limit = 5) => {
    if (!isApiMode()) {
      return mockDb.getDebitNotes(filters, page, limit);
    }
    const res = await api.get('/outward-bills/debit-note');
    let list = res.data.notes || res.data;

    if (filters.type) {
      list = list.filter(dn => dn.type === filters.type);
    }

    // Backend already populates customerAc via .populate() — use it directly as 'customer'
    list = list.map(dn => ({
      ...dn,
      _id: dn._id || dn.id,
      customer: typeof dn.customerAc === 'object' ? dn.customerAc : null,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(dn => {
        const partyName = dn.customer?.partyName ? dn.customer.partyName.toLowerCase() : '';
        return (dn.voucherNo || '').toLowerCase().includes(q) || partyName.includes(q);
      });
    }

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return { notes: paginated, totalCount, totalPages, currentPage: page };
  },

  addDebitNote: async (noteData) => {
    if (!isApiMode()) {
      return mockDb.addDebitNote(noteData);
    }
    const res = await api.post('/outward-bills/debit-note', noteData);
    return res.data;
  },

  deleteDebitNote: async (id) => {
    if (!isApiMode()) {
      return mockDb.deleteDebitNote(id);
    }
    const res = await api.delete(`/outward-bills/debit-note/${id}`);
    return res.data;
  },

  // --- INVOICES ---
  getInvoices: async (filters = {}, page = 1, limit = 5) => {
    if (!isApiMode()) {
      let mockList = localStorage.getItem('am_invoices');
      if (!mockList) {
        mockList = JSON.stringify([
          { _id: 'i_1', customer_name: 'Sharma Provision Store', product_name: 'Basmati Rice 5kg', quantity: 10, price: 410, total: 4100, status: 'pending', created_at: new Date().toISOString() },
          { _id: 'i_2', customer_name: 'Ramesh Stores', product_name: 'Tata Salt 1kg', quantity: 20, price: 25, total: 500, status: 'paid', created_at: new Date().toISOString() }
        ]);
        localStorage.setItem('am_invoices', mockList);
      }
      let list = JSON.parse(mockList);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(inv => inv.customer_name.toLowerCase().includes(q) || inv.product_name.toLowerCase().includes(q));
      }
      const totalCount = list.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const paginated = list.slice(startIndex, startIndex + limit);
      return { invoices: paginated, totalCount, totalPages, currentPage: page };
    }
    const res = await api.get('/invoices');
    let list = res.data.invoices || res.data;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(inv => inv.customer_name.toLowerCase().includes(q) || (inv.product_name && inv.product_name.toLowerCase().includes(q)));
    }
    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);
    return { invoices: paginated, totalCount, totalPages, currentPage: page };
  },

  addInvoice: async (invoiceData) => {
    if (!isApiMode()) {
      let list = JSON.parse(localStorage.getItem('am_invoices') || '[]');
      const newInvoice = {
        _id: 'i_' + Date.now(),
        ...invoiceData,
        total: Number(invoiceData.quantity) * Number(invoiceData.price),
        created_at: new Date().toISOString()
      };
      list.push(newInvoice);
      localStorage.setItem('am_invoices', JSON.stringify(list));
      return newInvoice;
    }
    const res = await api.post('/invoices', invoiceData);
    return res.data;
  },

  updateInvoice: async (id, invoiceData) => {
    if (!isApiMode()) {
      let list = JSON.parse(localStorage.getItem('am_invoices') || '[]');
      const idx = list.findIndex(i => i._id === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...invoiceData,
          total: Number(invoiceData.quantity) * Number(invoiceData.price)
        };
        localStorage.setItem('am_invoices', JSON.stringify(list));
      }
      return list[idx];
    }
    const res = await api.put(`/invoices/${id}`, invoiceData);
    return res.data;
  },

  deleteInvoice: async (id) => {
    if (!isApiMode()) {
      let list = JSON.parse(localStorage.getItem('am_invoices') || '[]');
      list = list.filter(i => i._id !== id);
      localStorage.setItem('am_invoices', JSON.stringify(list));
      return true;
    }
    const res = await api.delete(`/invoices/${id}`);
    return res.data;
  },

  // --- DASHBOARD STATS ---
  getDashboardStats: async () => {
    if (!isApiMode()) {
      return mockDb.getDashboardStats();
    }
    try {
      const clients = await apiService.getClients({}, 1, 9999);
      const items = await apiService.getItems({}, 1, 9999);
      const bills = await apiService.getSaleBills({}, 1, 9999);
      const notes = await apiService.getDebitNotes({}, 1, 9999);
      const salesmen = await apiService.getSalesmen();

      const totalSales = bills.bills.reduce((acc, curr) => acc + (curr.amountR || 0), 0);
      const lowStockCount = items.items.filter(i => i.stkBal <= 10).length;

      const todayStr = new Date().toDateString();
      const todaySales = bills.bills
        .filter(b => new Date(b.date).toDateString() === todayStr)
        .reduce((acc, curr) => acc + (curr.amountR || 0), 0);

      const activeSalesmenToday = salesmen.filter(s => s.activeToday).length;

      let pendingUsersCount = null;
      if (apiService.isAdmin()) {
        try {
          const users = await apiService.getUsers();
          pendingUsersCount = users.filter(u => u.status === 'pending').length;
        } catch {
          pendingUsersCount = null;
        }
      }

      return {
        totalClients: clients.totalCount,
        totalItems: items.totalCount,
        totalBills: bills.totalCount,
        totalSales,
        todaySales,
        totalSalesmen: salesmen.length,
        activeSalesmenToday,
        lowStockCount,
        totalDebitNotes: notes.totalCount,
        pendingUsersCount,
      };
    } catch (e) {
      console.error('Error fetching dashboard stats from API', e);
      return mockDb.getDashboardStats(); // Fallback
    }
  },

  getActivityFeed: async () => {
    if (!isApiMode()) {
      return [];
    }
    const res = await api.get('/dashboard/activity');
    return res.data.activity || [];
  }
};
