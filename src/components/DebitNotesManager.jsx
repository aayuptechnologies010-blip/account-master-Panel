import React, { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { Input, Select, Button } from '@chakra-ui/react';
import { FaPlus, FaTrash, FaArrowLeft, FaReceipt } from 'react-icons/fa';
import Pagination from './Pagination';

const label = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' };
const card = { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' };
const thStyle = { padding: '12px 16px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '13px 16px', fontSize: '13px', borderBottom: '1px solid #f8fafc' };

export default function DebitNotesManager({ onDbChange }) {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
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
  const [noteForm, setNoteForm] = useState({ type: 'amount', customerAc: '', salesmanId: '', osRefNo: '', date: new Date().toISOString().split('T')[0], creditAccounts: 'Discount Allowed', items: [], amountR: '' });

  const loadData = async () => {
    try {
      const res = await apiService.getDebitNotes({ search, type }, page, PAGE_SIZE);
      setNotes(res.notes || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalCount || (res.notes || []).length);
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
  }, [search, type, page]);

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setNoteForm({ type: 'amount', customerAc: '', salesmanId: '', osRefNo: '', date: new Date().toISOString().split('T')[0], creditAccounts: 'Discount Allowed', items: [{ itemId: '', description: '', qty: 1, price: 0, amount: 0 }], amountR: '' });
    setIsCreating(true);
  };

  const handleClientChange = async (clientId) => {
    const party = clients.find(c => c._id === clientId);
    setSelectedClient(party);
    try {
      const pastBillsRes = await apiService.getSaleBills({}, 1, 100);
      const osRefNo = (pastBillsRes.bills || []).filter(b => {
        const custId = typeof b.customerAc === 'object' ? String(b.customerAc?._id) : String(b.customerAc);
        return custId === String(clientId);
      }).map(b => b.osRefNo).filter(Boolean)[0] || '';
      setNoteForm(prev => ({ ...prev, customerAc: clientId, osRefNo, area: party?.areaName || '', gstin: party?.partyGstinNo || '' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLineChange = (idx, field, value) => {
    const updated = [...noteForm.items];
    const line = { ...updated[idx] };
    if (field === 'itemId') { const item = itemsList.find(i => i._id === value); line.itemId = value; line.description = item?.descript || ''; line.price = item?.salnetRt || 0; line.amount = line.price * line.qty; }
    else if (field === 'qty') { line.qty = Number(value) || 0; line.amount = line.price * line.qty; }
    else if (field === 'price') { line.price = Number(value) || 0; line.amount = line.price * line.qty; }
    updated[idx] = line;
    setNoteForm(prev => ({ ...prev, items: updated }));
  };

  const totalItemQty = noteForm.type === 'item' ? noteForm.items.reduce((s, i) => s + (Number(i.qty) || 0), 0) : 0;
  const totalItemAmount = noteForm.type === 'item' ? noteForm.items.reduce((s, i) => s + (Number(i.amount) || 0), 0) : 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!noteForm.customerAc) { toast.error('Please select a customer!'); return; }
    const finalAmount = noteForm.type === 'amount' ? Number(noteForm.amountR) : totalItemAmount;
    const finalQty = noteForm.type === 'item' ? totalItemQty : 0;
    if (finalAmount <= 0) { toast.error('Please enter a valid amount!'); return; }
    try {
      const salesman = salesmen.find(s => s._id === noteForm.salesmanId);
      await apiService.addDebitNote({ ...noteForm, salesmanName: salesman?.name || '', qty: finalQty, amountR: finalAmount, amountParty: finalAmount, balance: finalAmount });
      toast.success('Debit Note recorded!'); setIsCreating(false); if (onDbChange) onDbChange(); loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = (id) => {
    Swal.fire({ title: 'Delete?', text: 'This removes from ledger!', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete' })
      .then(async (r) => {
        if (r.isConfirmed) {
          try {
            await apiService.deleteDebitNote(id);
            toast.success('Deleted!');
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
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Debit Note Credit Voucher</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>{viewDetail._id}</div>
        </div>
        <button onClick={() => setViewDetail(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
          <FaArrowLeft style={{ fontSize: '11px' }} /> Back
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', fontSize: '13px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Customer</div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{viewDetail.customer?.partyName || '—'}</div>
          <div style={{ color: '#475569' }}>Contact: {viewDetail.customer?.contactNo || 'N/A'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Reference</div>
          <div style={{ fontWeight: '800', fontSize: '15px', color: '#0ea5e9' }}>{viewDetail.voucherNo}</div>
          <div style={{ color: '#475569' }}>{new Date(viewDetail.date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{viewDetail.type === 'amount' ? 'Amount-Wise' : 'Item-Wise'}</div>
        </div>
      </div>

      {viewDetail.type === 'item' ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
          <thead><tr>{['Item', 'Rate', 'Qty', 'Subtotal'].map((h, i) => <th key={h} style={{ ...thStyle, textAlign: i > 0 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
          <tbody>{viewDetail.items.map((line, idx) => (
            <tr key={idx}>
              <td style={tdStyle}>{line.description}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>₹{line.price}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }}>{line.qty}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '800' }}>₹{line.amount}</td>
            </tr>
          ))}</tbody>
        </table>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '16px 20px', fontSize: '13px', color: '#475569' }}>
          <div>Ledger: <strong style={{ color: '#0f172a' }}>{viewDetail.creditAccounts}</strong></div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>No inventory affected.</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '800', color: '#0f172a', width: '260px', borderTop: '2px solid #f1f5f9', paddingTop: '12px' }}>
          <span>Grand Credit:</span><span style={{ color: '#0ea5e9' }}>₹{viewDetail.amountR}</span>
        </div>
      </div>
    </div>
  );

  if (isCreating) return (
    <form onSubmit={handleSave}>
      <div style={{ ...card, padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaReceipt style={{ color: '#0ea5e9', fontSize: '18px' }} />
            <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Generate Debit Note Voucher</span>
          </div>
          <button type="button" onClick={() => setIsCreating(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
            <FaArrowLeft style={{ fontSize: '11px' }} /> Back
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={label}>Note Type *</label>
            <Select size="sm" value={noteForm.type} onChange={e => setNoteForm({ ...noteForm, type: e.target.value, amountR: '' })}>
              <option value="amount">Amount Wise</option>
              <option value="item">Item Wise</option>
            </Select>
          </div>
          <div>
            <label style={label}>Customer *</label>
            <Select size="sm" value={noteForm.customerAc} onChange={e => handleClientChange(e.target.value)} required>
              <option value="">Select Customer</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.partyName} ({c.prtCd})</option>)}
            </Select>
          </div>
          <div>
            <label style={label}>Salesman</label>
            <Select size="sm" value={noteForm.salesmanId} onChange={e => setNoteForm({ ...noteForm, salesmanId: e.target.value })}>
              <option value="">Select Salesman</option>
              {salesmen.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </Select>
          </div>
          <div>
            <label style={label}>Date *</label>
            <Input size="sm" type="date" value={noteForm.date} onChange={e => setNoteForm({ ...noteForm, date: e.target.value })} required />
          </div>
        </div>

        {noteForm.type === 'amount' ? (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Credit Adjustment</div>
            <div>
              <label style={label}>Ledger Account</label>
              <Input size="sm" value={noteForm.creditAccounts} onChange={e => setNoteForm({ ...noteForm, creditAccounts: e.target.value })} placeholder="e.g. Discount Allowed" />
            </div>
            <div>
              <label style={label}>Credit Amount (₹) *</label>
              <Input size="sm" type="number" value={noteForm.amountR} onChange={e => setNoteForm({ ...noteForm, amountR: e.target.value })} placeholder="0.00" required />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Return Line Items</span>
              <button type="button" onClick={() => setNoteForm(p => ({ ...p, items: [...p.items, { itemId: '', description: '', qty: 1, price: 0, amount: 0 }] }))}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0369a1', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                <FaPlus /> Add Line
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <thead><tr style={{ background: '#f8fafc' }}>{['Item *', 'Rate (₹)', 'Qty', 'Subtotal', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {noteForm.items.map((line, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 16px', width: '35%' }}>
                      <Select size="xs" required value={line.itemId} onChange={e => handleLineChange(idx, 'itemId', e.target.value)}>
                        <option value="">Select Item</option>
                        {itemsList.map(item => <option key={item._id} value={item._id}>{item.descript}</option>)}
                      </Select>
                    </td>
                    <td style={{ padding: '10px 16px' }}><Input size="xs" type="number" step="0.01" value={line.price} onChange={e => handleLineChange(idx, 'price', e.target.value)} style={{ width: '90px' }} /></td>
                    <td style={{ padding: '10px 16px' }}><Input size="xs" type="number" min="1" value={line.qty} onChange={e => handleLineChange(idx, 'qty', e.target.value)} style={{ width: '70px' }} /></td>
                    <td style={{ padding: '10px 16px', fontWeight: '700' }}>₹{line.amount}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <button type="button" onClick={() => { const u = [...noteForm.items]; u.splice(idx, 1); setNoteForm(p => ({ ...p, items: u })); }}
                        disabled={noteForm.items.length === 1}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#fff1f2', color: '#dc2626', cursor: 'pointer' }}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>
            {noteForm.type === 'amount'
              ? <span>Credit: <strong style={{ color: '#0ea5e9', fontSize: '16px' }}>₹{Number(noteForm.amountR) || 0}</strong></span>
              : <span>Qty: <strong>{totalItemQty}</strong> · Credit: <strong style={{ color: '#0ea5e9', fontSize: '16px' }}>₹{totalItemAmount}</strong></span>}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => setIsCreating(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button type="submit" style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>Save Debit Note</button>
          </div>
        </div>
      </div>
    </form>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ ...card, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <input placeholder="Search debit notes..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, maxWidth: '300px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' }} />
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc', color: '#475569' }}>
            <option value="">All Types</option>
            <option value="amount">Amount Wise</option>
            <option value="item">Item Wise</option>
          </select>
        </div>
        <button onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>
          <FaPlus /> Create Debit Note
        </button>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>{['Voucher No', 'Type', 'Customer Name', 'Date', 'Credit Amount', 'Salesman', 'Actions'].map(h => (
                <th key={h} style={{ ...thStyle, textAlign: h === 'Actions' ? 'center' : 'left' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {notes.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No debit notes recorded.</td></tr>
              ) : notes.map(n => (
                <tr key={n._id} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ ...tdStyle, fontWeight: '700', color: '#0369a1', fontFamily: 'monospace', fontSize: '12px' }}>{n.voucherNo}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: n.type === 'amount' ? '#ede9fe' : '#fff7ed', color: n.type === 'amount' ? '#7c3aed' : '#c2410c' }}>
                      {n.type === 'amount' ? 'Amount-Wise' : 'Item-Wise'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '600', color: '#1e293b' }}>{n.customer?.partyName || '—'}</td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{new Date(n.date).toLocaleDateString()}</td>
                  <td style={{ ...tdStyle, fontWeight: '800', color: '#0f172a' }}>₹{n.amountR}</td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{n.salesmanName || 'N/A'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => setViewDetail(n)} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#f0f9ff', color: '#0369a1', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Details</button>
                      <button onClick={() => handleDelete(n._id)} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#dc2626', cursor: 'pointer' }}><FaTrash /></button>
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
