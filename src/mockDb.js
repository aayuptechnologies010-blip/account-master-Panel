// localMockDb.js - High-Fidelity Client-Side Backend Simulator

const SEED_CLIENTS = [
  { _id: "c1", prtCd: "RAM001", partyName: "Ramesh Stores", contactNo: "9876543210", areaName: "Karol Bagh", add1: "Shop 5", add2: "Main Market", pinCode: "110005", partyGstinNo: "07AAACV1234F1Z5" },
  { _id: "c2", prtCd: "SUR001", partyName: "Suresh Agency", contactNo: "9812345678", areaName: "Chandni Chowk", add1: "Shop 12", add2: "Katra Neel", pinCode: "110006", partyGstinNo: "07BBBCV5678G2Z1" },
  { _id: "c3", prtCd: "MOH001", partyName: "Mohit Traders", contactNo: "9955887766", areaName: "Lajpat Nagar", add1: "Block D-14", add2: "Near Metro Station", pinCode: "110024", partyGstinNo: "07CCCV9012H3Z2" },
  { _id: "c4", prtCd: "SHA001", partyName: "Sharma Provision Store", contactNo: "8800112233", areaName: "Karol Bagh", add1: "Shop 24", add2: "Arya Samaj Road", pinCode: "110005", partyGstinNo: "" },
  { _id: "c5", prtCd: "VER001", partyName: "Verma Supermart", contactNo: "7766554433", areaName: "Rohini", add1: "Sector 8", add2: "Pocket B", pinCode: "110085", partyGstinNo: "07DDDCV3456J4Z3" }
];

const SEED_ITEMS = [
  { _id: "i1", ipmrpCd: "ITM001", descript: "Basmati Rice 5kg", mrp: 450, salnetRt: 410, stkBal: 120, gstPc: 5, hsnCd: "1006", unit: "bag" },
  { _id: "i2", ipmrpCd: "ITM002", descript: "Fortune Soyabean Oil 1L", mrp: 180, salnetRt: 165, stkBal: 200, gstPc: 12, hsnCd: "1507", unit: "bottle" },
  { _id: "i3", ipmrpCd: "ITM003", descript: "Tata Salt 1kg", mrp: 28, salnetRt: 25, stkBal: 500, gstPc: 0, hsnCd: "2501", unit: "pkt" },
  { _id: "i4", ipmrpCd: "ITM004", descript: "Dettol Liquid Handwash 200ml", mrp: 99, salnetRt: 89, stkBal: 8, gstPc: 18, hsnCd: "3401", unit: "pcs" },
  { _id: "i5", ipmrpCd: "ITM005", descript: "Maggi Noodles 12-Pack", mrp: 168, salnetRt: 155, stkBal: 15, gstPc: 18, hsnCd: "1902", unit: "pack" },
  { _id: "i6", ipmrpCd: "ITM006", descript: "Aashirvaad Shudh Chakki Atta 10kg", mrp: 460, salnetRt: 430, stkBal: 5, gstPc: 5, hsnCd: "1101", unit: "bag" }
];

const SEED_SALESMEN = [
  { _id: "s1", code: "S001", name: "Rahul Kumar", contactNo: "9911223344" },
  { _id: "s2", code: "S002", name: "Vikram Singh", contactNo: "9922334455" },
  { _id: "s3", code: "S003", name: "Amit Patel", contactNo: "9933445566" }
];

const SEED_BILLS = [
  {
    _id: "b1",
    voucherNo: "SB0001",
    customerAc: "c1",
    salesmanId: "s1",
    salesmanName: "Rahul Kumar",
    osRefNo: "REF-1002",
    date: "2026-06-10T12:00:00.000Z",
    area: "Karol Bagh",
    gstin: "07AAACV1234F1Z5",
    creditAccounts: "Sundry Debtors",
    items: [
      { itemId: "i1", description: "Basmati Rice 5kg", qty: 2, price: 410, amount: 820 },
      { itemId: "i2", description: "Fortune Soyabean Oil 1L", qty: 5, price: 165, amount: 825 }
    ],
    amountR: 1645,
    qty: 7,
    amountParty: 1645,
    balance: 1645
  },
  {
    _id: "b2",
    voucherNo: "SB0002",
    customerAc: "c2",
    salesmanId: "s2",
    salesmanName: "Vikram Singh",
    osRefNo: "REF-1005",
    date: "2026-06-12T15:30:00.000Z",
    area: "Chandni Chowk",
    gstin: "07BBBCV5678G2Z1",
    creditAccounts: "Sundry Debtors",
    items: [
      { itemId: "i3", description: "Tata Salt 1kg", qty: 10, price: 25, amount: 250 },
      { itemId: "i5", description: "Maggi Noodles 12-Pack", qty: 1, price: 155, amount: 155 }
    ],
    amountR: 405,
    qty: 11,
    amountParty: 405,
    balance: 0
  }
];

const SEED_DEBIT_NOTES = [
  {
    _id: "dn1",
    type: "amount",
    voucherNo: "DNA0001",
    customerAc: "c1",
    salesmanId: "s1",
    salesmanName: "Rahul Kumar",
    osRefNo: "REF-1002",
    date: "2026-06-11T10:00:00.000Z",
    area: "Karol Bagh",
    gstin: "07AAACV1234F1Z5",
    creditAccounts: "Discount Offered",
    items: [],
    amountR: 100,
    qty: 0,
    amountParty: 100,
    balance: 100
  },
  {
    _id: "dn2",
    type: "item",
    voucherNo: "DNI0001",
    customerAc: "c3",
    salesmanId: "s3",
    salesmanName: "Amit Patel",
    osRefNo: "",
    date: "2026-06-13T09:15:00.000Z",
    area: "Lajpat Nagar",
    gstin: "07CCCV9012H3Z2",
    creditAccounts: "Sales Returns",
    items: [
      { itemId: "i4", description: "Dettol Liquid Handwash 200ml", qty: 1, price: 89, amount: 89 }
    ],
    amountR: 89,
    qty: 1,
    amountParty: 89,
    balance: 89
  }
];

// LocalStorage Initialization Helper
const initStorage = () => {
  if (!localStorage.getItem("am_clients")) {
    localStorage.setItem("am_clients", JSON.stringify(SEED_CLIENTS));
  }
  if (!localStorage.getItem("am_items")) {
    localStorage.setItem("am_items", JSON.stringify(SEED_ITEMS));
  }
  if (!localStorage.getItem("am_salesmen")) {
    localStorage.setItem("am_salesmen", JSON.stringify(SEED_SALESMEN));
  }
  if (!localStorage.getItem("am_bills")) {
    localStorage.setItem("am_bills", JSON.stringify(SEED_BILLS));
  }
  if (!localStorage.getItem("am_debit_notes")) {
    localStorage.setItem("am_debit_notes", JSON.stringify(SEED_DEBIT_NOTES));
  }
};

initStorage();

// Database Service Helper Class
export const mockDb = {
  // --- CLIENTS ---
  getClients: (filters = {}, page = 1, limit = 5) => {
    let list = JSON.parse(localStorage.getItem("am_clients") || "[]");
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c => 
        c.partyName.toLowerCase().includes(q) || 
        c.prtCd.toLowerCase().includes(q) ||
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

  addClient: (clientData) => {
    const list = JSON.parse(localStorage.getItem("am_clients") || "[]");
    
    // Generate Party Code from first 3 letters of Party Name + counter
    const prefix = (clientData.partyName || "PRT").substring(0, 3).toUpperCase();
    const matches = list.filter(c => c.prtCd.startsWith(prefix));
    const codeNum = String(matches.length + 1).padStart(3, '0');
    const prtCd = `${prefix}${codeNum}`;

    const newClient = {
      _id: "c_" + Date.now(),
      prtCd,
      partyName: clientData.partyName,
      contactNo: clientData.contactNo || "",
      areaName: clientData.areaName || "",
      add1: clientData.add1 || "",
      add2: clientData.add2 || "",
      pinCode: clientData.pinCode || "",
      partyGstinNo: clientData.partyGstinNo || ""
    };

    list.push(newClient);
    localStorage.setItem("am_clients", JSON.stringify(list));
    return newClient;
  },

  updateClient: (id, clientData) => {
    const list = JSON.parse(localStorage.getItem("am_clients") || "[]");
    const idx = list.findIndex(c => c._id === id);
    if (idx === -1) throw new Error("Client not found");

    list[idx] = { ...list[idx], ...clientData };
    localStorage.setItem("am_clients", JSON.stringify(list));
    return list[idx];
  },

  deleteClient: (id) => {
    let list = JSON.parse(localStorage.getItem("am_clients") || "[]");
    const initialLen = list.length;
    list = list.filter(c => c._id !== id);
    if (list.length === initialLen) throw new Error("Client not found");
    localStorage.setItem("am_clients", JSON.stringify(list));
    return true;
  },

  // --- ITEMS ---
  getItems: (filters = {}, page = 1, limit = 5) => {
    let list = JSON.parse(localStorage.getItem("am_items") || "[]");

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(i => 
        i.descript.toLowerCase().includes(q) || 
        i.ipmrpCd.toLowerCase().includes(q)
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

  addItem: (itemData) => {
    const list = JSON.parse(localStorage.getItem("am_items") || "[]");
    
    // Auto-generate code
    const ipmrpCd = `ITM${String(list.length + 1).padStart(3, '0')}`;

    const newItem = {
      _id: "i_" + Date.now(),
      ipmrpCd,
      descript: itemData.descript,
      mrp: Number(itemData.mrp) || 0,
      salnetRt: Number(itemData.salnetRt) || 0,
      stkBal: Number(itemData.stkBal) || 0,
      gstPc: Number(itemData.gstPc) || 0,
      hsnCd: itemData.hsnCd || "",
      unit: itemData.unit || "pcs"
    };

    list.push(newItem);
    localStorage.setItem("am_items", JSON.stringify(list));
    return newItem;
  },

  updateItem: (id, itemData) => {
    const list = JSON.parse(localStorage.getItem("am_items") || "[]");
    const idx = list.findIndex(i => i._id === id);
    if (idx === -1) throw new Error("Item not found");

    list[idx] = { 
      ...list[idx], 
      ...itemData,
      mrp: Number(itemData.mrp) ?? list[idx].mrp,
      salnetRt: Number(itemData.salnetRt) ?? list[idx].salnetRt,
      stkBal: Number(itemData.stkBal) ?? list[idx].stkBal,
      gstPc: Number(itemData.gstPc) ?? list[idx].gstPc
    };
    localStorage.setItem("am_items", JSON.stringify(list));
    return list[idx];
  },

  deleteItem: (id) => {
    let list = JSON.parse(localStorage.getItem("am_items") || "[]");
    const initialLen = list.length;
    list = list.filter(i => i._id !== id);
    if (list.length === initialLen) throw new Error("Item not found");
    localStorage.setItem("am_items", JSON.stringify(list));
    return true;
  },

  // --- SALESMEN ---
  getSalesmen: () => {
    return JSON.parse(localStorage.getItem("am_salesmen") || "[]");
  },

  // --- SALE BILLS ---
  getSaleBills: (filters = {}, page = 1, limit = 5) => {
    let list = JSON.parse(localStorage.getItem("am_bills") || "[]");
    const clients = JSON.parse(localStorage.getItem("am_clients") || "[]");

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(b => {
        const client = clients.find(c => c._id === b.customerAc);
        const partyName = client ? client.partyName.toLowerCase() : "";
        return b.voucherNo.toLowerCase().includes(q) || partyName.includes(q);
      });
    }

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    // Populate Customer info
    const populated = paginated.map(b => ({
      ...b,
      customer: clients.find(c => c._id === b.customerAc)
    }));

    return { bills: populated, totalCount, totalPages, currentPage: page };
  },

  addSaleBill: (billData) => {
    const bills = JSON.parse(localStorage.getItem("am_bills") || "[]");
    const items = JSON.parse(localStorage.getItem("am_items") || "[]");

    // Generate Voucher No
    const voucherNo = `SB${String(bills.length + 1).padStart(4, '0')}`;

    const newBill = {
      _id: "b_" + Date.now(),
      voucherNo,
      customerAc: billData.customerAc,
      salesmanId: billData.salesmanId || "",
      salesmanName: billData.salesmanName || "",
      osRefNo: billData.osRefNo || "",
      date: billData.date || new Date().toISOString(),
      area: billData.area || "",
      gstin: billData.gstin || "",
      creditAccounts: billData.creditAccounts || "Sundry Debtors",
      items: billData.items || [], // array of { itemId, description, qty, price, amount }
      amountR: Number(billData.amountR) || 0,
      qty: Number(billData.qty) || 0,
      amountParty: Number(billData.amountParty) || 0,
      balance: Number(billData.balance) ?? Number(billData.amountR)
    };

    // Deduct stock for all items
    if (newBill.items && newBill.items.length > 0) {
      newBill.items.forEach(billItem => {
        const idx = items.findIndex(i => i._id === billItem.itemId);
        if (idx !== -1) {
          items[idx].stkBal -= Number(billItem.qty);
        }
      });
      localStorage.setItem("am_items", JSON.stringify(items));
    }

    bills.push(newBill);
    localStorage.setItem("am_bills", JSON.stringify(bills));
    return newBill;
  },

  deleteSaleBill: (id) => {
    const bills = JSON.parse(localStorage.getItem("am_bills") || "[]");
    const items = JSON.parse(localStorage.getItem("am_items") || "[]");

    const idx = bills.findIndex(b => b._id === id);
    if (idx === -1) throw new Error("Sale bill not found");

    const bill = bills[idx];

    // Revert/increment stock balances back
    if (bill.items && bill.items.length > 0) {
      bill.items.forEach(billItem => {
        const itemIdx = items.findIndex(i => i._id === billItem.itemId);
        if (itemIdx !== -1) {
          items[itemIdx].stkBal += Number(billItem.qty);
        }
      });
      localStorage.setItem("am_items", JSON.stringify(items));
    }

    bills.splice(idx, 1);
    localStorage.setItem("am_bills", JSON.stringify(bills));
    return true;
  },

  // --- DEBIT NOTES ---
  getDebitNotes: (filters = {}, page = 1, limit = 5) => {
    let list = JSON.parse(localStorage.getItem("am_debit_notes") || "[]");
    const clients = JSON.parse(localStorage.getItem("am_clients") || "[]");

    if (filters.type) {
      list = list.filter(dn => dn.type === filters.type);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(dn => {
        const client = clients.find(c => c._id === dn.customerAc);
        const partyName = client ? client.partyName.toLowerCase() : "";
        return dn.voucherNo.toLowerCase().includes(q) || partyName.includes(q);
      });
    }

    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    const populated = paginated.map(dn => ({
      ...dn,
      customer: clients.find(c => c._id === dn.customerAc)
    }));

    return { notes: populated, totalCount, totalPages, currentPage: page };
  },

  addDebitNote: (noteData) => {
    const notes = JSON.parse(localStorage.getItem("am_debit_notes") || "[]");

    // Generate Voucher No based on Type
    const prefix = noteData.type === 'amount' ? 'DNA' : 'DNI';
    const sameTypeNotes = notes.filter(n => n.type === noteData.type);
    const voucherNo = `${prefix}${String(sameTypeNotes.length + 1).padStart(4, '0')}`;

    const newNote = {
      _id: "dn_" + Date.now(),
      type: noteData.type, // 'amount' or 'item'
      voucherNo,
      customerAc: noteData.customerAc,
      salesmanId: noteData.salesmanId || "",
      salesmanName: noteData.salesmanName || "",
      osRefNo: noteData.osRefNo || "",
      date: noteData.date || new Date().toISOString(),
      area: noteData.area || "",
      gstin: noteData.gstin || "",
      creditAccounts: noteData.creditAccounts || "",
      items: noteData.type === 'item' ? (noteData.items || []) : [],
      amountR: Number(noteData.amountR) || 0,
      qty: Number(noteData.qty) || 0,
      amountParty: Number(noteData.amountParty) || 0,
      balance: Number(noteData.balance) ?? Number(noteData.amountR)
    };

    // Debit notes do NOT modify inventory by design specification
    notes.push(newNote);
    localStorage.setItem("am_debit_notes", JSON.stringify(notes));
    return newNote;
  },

  deleteDebitNote: (id) => {
    const notes = JSON.parse(localStorage.getItem("am_debit_notes") || "[]");
    const idx = notes.findIndex(n => n._id === id);
    if (idx === -1) throw new Error("Debit note not found");

    notes.splice(idx, 1);
    localStorage.setItem("am_debit_notes", JSON.stringify(notes));
    return true;
  },

  // --- STATS / DASHBOARD INFO ---
  getDashboardStats: () => {
    const clients = JSON.parse(localStorage.getItem("am_clients") || "[]");
    const items = JSON.parse(localStorage.getItem("am_items") || "[]");
    const bills = JSON.parse(localStorage.getItem("am_bills") || "[]");
    const notes = JSON.parse(localStorage.getItem("am_debit_notes") || "[]");

    const totalSales = bills.reduce((acc, curr) => acc + curr.amountR, 0);
    const lowStockCount = items.filter(i => i.stkBal <= 10).length;

    return {
      totalClients: clients.length,
      totalItems: items.length,
      totalBills: bills.length,
      totalSales,
      lowStockCount,
      totalDebitNotes: notes.length
    };
  }
};
