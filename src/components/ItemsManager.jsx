import { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Badge, HStack, IconButton, Text } from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaFileImport } from 'react-icons/fa';
import Pagination from './Pagination';
import ImportModal from './ImportModal';

const label = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' };

export default function ItemsManager({ onDbChange }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ descript: '', mrp: '', salnetRt: '', stkBal: '', gstPc: '18', hsnCd: '', unit: 'pcs' });

  const loadData = async () => {
    try {
      const res = await apiService.getItems({ search, lowStock, threshold: 10 }, page, pageSize);
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalCount || (res.items || []).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when search/lowStock/page/pageSize change
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData intentionally excluded to avoid re-creating the effect every render
  }, [search, lowStock, page, pageSize]);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({ descript: '', mrp: '', salnetRt: '', stkBal: '', gstPc: '18', hsnCd: '', unit: 'pcs' });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item._id);
    setFormData({ descript: item.descript, mrp: String(item.mrp), salnetRt: String(item.salnetRt || item.unitPrice), stkBal: String(item.stkBal), gstPc: String(item.gstPc), hsnCd: item.hsnCd || '', unit: item.unit || 'pcs' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.descript.trim()) { toast.error('Item Description is required!'); return; }
    try {
      const parsed = { ...formData, mrp: Number(formData.mrp) || 0, salnetRt: Number(formData.salnetRt) || 0, stkBal: Number(formData.stkBal) || 0, gstPc: Number(formData.gstPc) || 0 };
      if (editId) {
        await apiService.updateItem(editId, parsed);
        toast.success('Stock Item updated!');
      } else {
        await apiService.addItem(parsed);
        toast.success('Stock Item created!');
      }
      setShowModal(false);
      if (onDbChange) onDbChange();
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = (id) => {
    Swal.fire({ title: 'Are you sure?', text: 'This item will be removed!', icon: 'warning', showCancelButton: true, confirmButtonColor: '#0ea5e9', cancelButtonColor: '#f43f5e', confirmButtonText: 'Yes, delete' })
      .then(async (r) => {
        if (r.isConfirmed) {
          try {
            await apiService.deleteItem(id);
            toast.success('Deleted!');
            if (onDbChange) onDbChange();
            loadData();
          } catch (err) {
            toast.error(err.message);
          }
        }
      });
  };

  const f = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <input placeholder="Search items by description or code..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, maxWidth: '360px' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={lowStock} onChange={e => { setLowStock(e.target.checked); setPage(1); }} style={{ width: '15px', height: '15px', accentColor: '#0ea5e9' }} />
            Low Stock Only (≤ 10)
          </label>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowImportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '10px', border: '1px solid #bae6fd', background: 'white', color: '#0369a1', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            <FaFileImport /> Import
          </button>
          <button onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>
            <FaPlus /> Add New Item
          </button>
        </div>
      </div>

      {/* Table */}
      <Box bg="white" borderRadius="16px" border="1px solid #e2e8f0" boxShadow="0 1px 8px rgba(0,0,0,0.05)" overflow="hidden">
        <Box overflowX="auto">
          <Table variant="simple" size="sm" fontSize="13px">
            <Thead>
              <Tr bg="gray.50" borderBottom="1px solid #f1f5f9">
                {['Item Code', 'Description', 'MRP', 'Net Sale Rate', 'Stock Balance', 'GST % / HSN', 'Actions'].map(h => (
                  <Th key={h} color="gray.500" fontSize="11px" fontWeight="700" textAlign={h === 'Actions' ? 'center' : 'left'}>{h}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {items.length === 0 ? (
                <Tr><Td colSpan={7} textAlign="center" py={10} color="gray.400">No items found.</Td></Tr>
              ) : items.map(i => (
                <Tr key={i._id} _hover={{ bg: 'gray.50' }}>
                  <Td fontWeight="700" color="sky.700" fontFamily="mono" fontSize="12px">{i.ipmrpCd}</Td>
                  <Td fontWeight="600" color="gray.800">{i.descript}</Td>
                  <Td fontWeight="600">₹{i.mrp}</Td>
                  <Td fontWeight="700" color="sky.500">₹{i.salnetRt}</Td>
                  <Td>
                    <Badge borderRadius="20px" px={2.5} py={0.5} fontSize="11px" fontWeight="700" colorScheme={i.stkBal <= 10 ? 'red' : 'green'}>
                      {i.stkBal} {i.unit}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="12px" fontWeight="600" color="gray.600">{i.gstPc}% GST</Text>
                    <Text fontSize="11px" color="gray.400">HSN: {i.hsnCd || '—'}</Text>
                  </Td>
                  <Td>
                    <HStack spacing={2} justify="center">
                      <IconButton aria-label="Edit Item" icon={<FaEdit />} size="sm" bg="sky.50" _hover={{ bg: 'sky.100' }} color="sky.600" onClick={() => handleOpenEdit(i)} />
                      <IconButton aria-label="Delete Item" icon={<FaTrash />} size="sm" bg="rose.50" _hover={{ bg: 'rose.100' }} color="rose.600" onClick={() => handleDelete(i._id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalRecords={totalRecords} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
      </Box>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '16px' }}>{editId ? 'Edit Stock Item' : 'Add New Item'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Item Description / Name *</label>
                  <input style={inputStyle} value={formData.descript} onChange={f('descript')} placeholder="Enter item description..." required />
                </div>
                <div>
                  <label style={label}>MRP Price (₹) *</label>
                  <input style={inputStyle} type="number" step="0.01" value={formData.mrp} onChange={f('mrp')} placeholder="0.00" required />
                </div>
                <div>
                  <label style={label}>Net Sale Rate (₹) *</label>
                  <input style={inputStyle} type="number" step="0.01" value={formData.salnetRt} onChange={f('salnetRt')} placeholder="0.00" required />
                </div>
                <div>
                  <label style={label}>Stock Balance *</label>
                  <input style={inputStyle} type="number" value={formData.stkBal} onChange={f('stkBal')} placeholder="0" required />
                </div>
                <div>
                  <label style={label}>Unit</label>
                  <select style={inputStyle} value={formData.unit} onChange={f('unit')}>
                    {['pcs','bag','bottle','pkt','box','kg'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>GST Slab (%)</label>
                  <select style={inputStyle} value={formData.gstPc} onChange={f('gstPc')}>
                    {[0,5,12,18,28].map(g => <option key={g} value={g}>{g}% GST</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>HSN Code</label>
                  <input style={inputStyle} value={formData.hsnCd} onChange={f('hsnCd')} placeholder="HSN Code" />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        resource="items"
        resourceLabel="Items / Stock"
        onImportComplete={() => { loadData(); if (onDbChange) onDbChange(); }}
      />
    </div>
  );
}
