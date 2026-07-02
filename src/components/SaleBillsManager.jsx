import React, { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { Input, Select, Button, SimpleGrid, Text, Badge, HStack } from '@chakra-ui/react';
import { FaPlus, FaTrash, FaArrowLeft, FaFileInvoiceDollar } from 'react-icons/fa';
import Pagination from './Pagination';

const label = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' };
const card = { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' };
const thStyle = { padding: '12px 16px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '13px 16px', fontSize: '13px', borderBottom: '1px solid #f8fafc' };

export default function SaleBillsManager({ onDbChange }) {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 8;

  const [isCreating, setIsCreating] = useState(false);
  const [viewDetail, setViewDetail] = useState(null);
  const [clients, setClients] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [billForm, setBillForm] = useState({ customerAc: '', salesmanId: '', osRefNo: '', date: new Date().toISOString().split('T')[0], creditAccounts: 'Sundry Debtors', items: [] });

  const loadData = async () => {
    try {
      const res = await apiService.getSaleBills({ search }, page, PAGE_SIZE);
      setBills(res.bills || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalCount || (res.bills || []).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const fetchDropdowns = async () => {
      try {
        const cRes = await apiService.getClients({}, 1, 1000);
        setClients(cRes.clients || []);
        const iRes = await apiService.getItems({}, 1, 1000);
        setItemsList(iRes.items || []);
        const sRes = await apiService.getSalesmen();
        setSalesmen(sRes || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDropdowns();
  }, [search, page]);

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setBillForm({ customerAc: '', salesmanId: '', osRefNo: '', date: new Date().toISOString().split('T')[0], creditAccounts: 'Sundry Debtors', items: [{ itemId: '', description: '', qty: 1, price: 0, amount: 0 }] });
    setIsCreating(true);
  };

  const handleClientChange = async (clientId) => {
    const party = clients.find(c => c._id === clientId);
    setSelectedClient(party);
    try {
      const pastBillsRes = await apiService.getSaleBills({}, 1, 100);
      const pastBills = (pastBillsRes.bills || []).filter(b => {
        const custId = typeof b.customerAc === 'object' ? String(b.customerAc?._id) : String(b.customerAc);
        return custId === String(clientId);
      });
      const osRefNo = pastBills.map(b => b.osRefNo).filter(Boolean)[0] || '';
      setBillForm(prev => ({ ...prev, customerAc: clientId, osRefNo, area: party?.areaName || '', gstin: party?.partyGstinNo || '' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLineChange = (idx, field, value) => {
    const updated = [...billForm.items];
    const line = { ...updated[idx] };
    if (field === 'itemId') {
      const item = itemsList.find(i => i._id === value);
      line.itemId = value; line.description = item?.descript || ''; line.price = item?.salnetRt || 0; line.amount = line.price * line.qty;
      if (item && item.stkBal < line.qty) toast.warning(`Only ${item.stkBal} left in stock!`);
    } else if (field === 'qty') {
      line.qty = Number(value) || 0; line.amount = line.price * line.qty;
      const item = itemsList.find(i => i._id === line.itemId);
      if (item && item.stkBal < line.qty) toast.warning(`Only ${item.stkBal} left in stock!`);
    } else if (field === 'price') { line.price = Number(value) || 0; line.amount = line.price * line.qty; }
    updated[idx] = line;
    setBillForm(prev => ({ ...prev, items: updated }));
  };

  const totalQty = billForm.items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const totalAmount = billForm.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!billForm.customerAc) { toast.error('Please select a customer!'); return; }
    if (billForm.items.some(i => !i.itemId)) { toast.error('Please fill all item lines!'); return; }
    try {
      const salesman = salesmen.find(s => s._id === billForm.salesmanId);
      await apiService.addSaleBill({ ...billForm, salesmanName: salesman?.name || '', qty: totalQty, amountR: totalAmount, amountParty: totalAmount, balance: totalAmount });
      toast.success('Sale Bill created!'); setIsCreating(false); if (onDbChange) onDbChange(); loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = (id) => {
    Swal.fire({ title: 'Delete bill?', text: 'Stock will be restored!', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete' })
      .then(async (r) => {
        if (r.isConfirmed) {
          try {
            await apiService.deleteSaleBill(id);
            toast.success('Deleted. Stock reverted!');
            if (onDbChange) onDbChange();
            loadData();
          } catch (err) {
            toast.error(err.message);
          }
        }
      });
  };

  if (viewDetail) return (
    <div style={{ ...card, padding: '32px', maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Sale Invoice Voucher</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>{viewDetail._id}</div>
        </div>
        <button onClick={() => setViewDetail(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
          <FaArrowLeft style={{ fontSize: '11px' }} /> Back
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', fontSize: '13px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Customer</div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{viewDetail.customer?.partyName || '—'}</div>
          <div style={{ color: '#475569' }}>Contact: {viewDetail.customer?.contactNo || 'N/A'}</div>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>GSTIN: {viewDetail.customer?.partyGstinNo || 'Unregistered'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Voucher Info</div>
          <div style={{ fontWeight: '800', fontSize: '15px', color: '#0ea5e9' }}>{viewDetail.voucherNo}</div>
          <div style={{ color: '#475569' }}>Date: {new Date(viewDetail.date).toLocaleDateString()}</div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Area: {viewDetail.area || 'N/A'} · Ref: {viewDetail.osRefNo || 'N/A'}</div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['Item Name', 'Unit Price', 'Qty', 'Subtotal'].map((h, i) => (
              <th key={h} style={{ ...thStyle, textAlign: i > 0 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {viewDetail.items.map((line, idx) => (
            <tr key={idx}>
              <td style={tdStyle}>{line.description}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>₹{line.price}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }}>{line.qty}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '800' }}>₹{line.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
            <span>Total Qty:</span><span>{viewDetail.qty} items</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '800', color: '#0f172a', borderTop: '2px solid #f1f5f9', paddingTop: '8px' }}>
            <span>Grand Total:</span><span>₹{viewDetail.amountR}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#dcfce7', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#15803d' }}>
            <span>Paid:</span><span>₹{viewDetail.amountR - viewDetail.balance}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isCreating) return (
    <form onSubmit={handleSaveBill}>
      <div style={{ ...card, padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaFileInvoiceDollar style={{ color: '#0ea5e9', fontSize: '20px' }} />
            <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Generate Outward Sale Bill</span>
          </div>
          <button type="button" onClick={() => setIsCreating(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
            <FaArrowLeft style={{ fontSize: '11px' }} /> Back
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={label}>Customer / Party *</label>
            <Select size="sm" value={billForm.customerAc} onChange={e => handleClientChange(e.target.value)} required>
              <option value="">Select Customer</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.partyName} ({c.prtCd})</option>)}
            </Select>
          </div>
          <div>
            <label style={label}>Salesman</label>
            <Select size="sm" value={billForm.salesmanId} onChange={e => setBillForm({ ...billForm, salesmanId: e.target.value })}>
              <option value="">Select Salesman</option>
              {salesmen.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </Select>
          </div>
          <div>
            <label style={label}>OS Reference</label>
            <Input size="sm" value={billForm.osRefNo} onChange={e => setBillForm({ ...billForm, osRefNo: e.target.value })} placeholder="Auto Reference" />
          </div>
          <div>
            <label style={label}>Date *</label>
            <Input size="sm" type="date" value={billForm.date} onChange={e => setBillForm({ ...billForm, date: e.target.value })} required />
          </div>
          {selectedClient && (
            <div style={{ gridColumn: 'span 4', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '24px', fontSize: '12px', fontWeight: '600', color: '#0369a1' }}>
              <span>Area: <strong>{selectedClient.areaName || 'N/A'}</strong></span>
              <span>Contact: <strong>{selectedClient.contactNo || 'N/A'}</strong></span>
              <span>GSTIN: <strong style={{ fontFamily: 'monospace' }}>{selectedClient.partyGstinNo || 'Unregistered'}</strong></span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Invoice Line Items</span>
          <button type="button" onClick={() => setBillForm(p => ({ ...p, items: [...p.items, { itemId: '', description: '', qty: 1, price: 0, amount: 0 }] }))}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0369a1', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            <FaPlus /> Add Line
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Stock Item *', 'Net Price (₹)', 'Qty', 'Line Total', ''].map(h => (
                <th key={h} style={{ ...thStyle }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {billForm.items.map((line, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '10px 16px', width: '35%' }}>
                  <Select size="xs" required value={line.itemId} onChange={e => handleLineChange(idx, 'itemId', e.target.value)}>
                    <option value="">Select Item</option>
                    {itemsList.map(item => <option key={item._id} value={item._id}>{item.descript} (Stock: {item.stkBal} | ₹{item.salnetRt})</option>)}
                  </Select>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <Input size="xs" type="number" step="0.01" value={line.price} onChange={e => handleLineChange(idx, 'price', e.target.value)} style={{ width: '90px' }} />
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <Input size="xs" type="number" min="1" value={line.qty} onChange={e => handleLineChange(idx, 'qty', e.target.value)} style={{ width: '70px' }} />
                </td>
                <td style={{ padding: '10px 16px', fontWeight: '700', color: '#0f172a' }}>₹{line.amount}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <button type="button" onClick={() => { const u = [...billForm.items]; u.splice(idx, 1); setBillForm(p => ({ ...p, items: u })); }}
                    disabled={billForm.items.length === 1}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#fff1f2', color: '#dc2626', cursor: 'pointer' }}><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '10px 20px', display: 'flex', gap: '24px', fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>
            <span>Total Qty: <strong style={{ color: '#0f172a' }}>{totalQty}</strong></span>
            <span>Net Total: <strong style={{ color: '#0ea5e9', fontSize: '16px' }}>₹{totalAmount}</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => setIsCreating(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button type="submit" style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>Post Sale Bill</button>
          </div>
        </div>
      </div>
    </form>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ ...card, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <input placeholder="Search bills by voucher number or party..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, maxWidth: '360px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' }} />
        <button onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>
          <FaPlus /> Generate Sale Bill
        </button>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Voucher No', 'Customer Name', 'Date', 'Net Amount', 'Salesman', 'Items', 'Actions'].map(h => (
                  <th key={h} style={{ ...thStyle, textAlign: h === 'Actions' ? 'center' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No sale bills found.</td></tr>
              ) : bills.map(b => (
                <tr key={b._id} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ ...tdStyle, fontWeight: '700', color: '#0369a1', fontFamily: 'monospace', fontSize: '12px' }}>{b.voucherNo}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{b.customer?.partyName || '—'}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Area: {b.area || 'N/A'}</div>
                  </td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{new Date(b.date).toLocaleDateString()}</td>
                  <td style={{ ...tdStyle, fontWeight: '800', color: '#0ea5e9' }}>₹{b.amountR}</td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{b.salesmanName || 'N/A'}</td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{b.qty}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => setViewDetail(b)} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#f0f9ff', color: '#0369a1', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>View</button>
                      <button onClick={() => handleDelete(b._id)} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#dc2626', cursor: 'pointer' }}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalRecords={totalRecords} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
