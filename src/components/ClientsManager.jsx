import React, { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { Box, Flex, Input, Select, Button, HStack, IconButton } from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Pagination from './Pagination';

export default function ClientsManager({ onDbChange }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    partyName: '',
    contactNo: '',
    areaName: '',
    add1: '',
    add2: '',
    pinCode: '',
    partyGstinNo: ''
  });

  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 8;

  const loadData = async () => {
    try {
      const res = await apiService.getClients({ search, area }, page, PAGE_SIZE);
      setClients(res.clients || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalCount || (res.clients || []).length);

      const allRes = await apiService.getClients({}, 1, 1000);
      const allClients = allRes.clients || [];
      const uniqAreas = [...new Set(allClients.map(c => c.areaName).filter(Boolean))];
      setAreas(uniqAreas);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, area, page]);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      partyName: '',
      contactNo: '',
      areaName: '',
      add1: '',
      add2: '',
      pinCode: '',
      partyGstinNo: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (client) => {
    setEditId(client._id);
    setFormData({
      partyName: client.partyName,
      contactNo: client.contactNo || '',
      areaName: client.areaName || '',
      add1: client.add1 || '',
      add2: client.add2 || '',
      pinCode: client.pinCode || '',
      partyGstinNo: client.partyGstinNo || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.partyName.trim()) {
      toast.error("Party Name is required!");
      return;
    }

    try {
      if (editId) {
        await apiService.updateClient(editId, formData);
        toast.success("Client updated successfully!");
      } else {
        await apiService.addClient(formData);
        toast.success("Client added successfully!");
      }
      setShowModal(false);
      if (onDbChange) onDbChange();
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this client details!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Yes, delete client'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteClient(id);
          toast.success("Client deleted successfully!");
          if (onDbChange) onDbChange();
          loadData();
        } catch (err) {
          toast.error(err.message);
        }
      }
    });
  };

  return (
    <Box spaceY={6} className="animate-fadeIn">
      {/* Filters */}
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} bg="white" p={6} borderRadius="2xl" border="1px" borderColor="sky.100" shadow="sm">
        <HStack spacing={4} flex={1} maxW="xl">
          <Box position="relative" flex={1}>
            <Input
              placeholder="Search clients by name, code or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              bg="sky.50/50"
              borderColor="sky.100"
              borderRadius="xl"
              py={5}
              pl={4}
              fontSize="sm"
              _focus={{ borderColor: 'sky.300', bg: 'white' }}
            />
          </Box>

          <Select
            value={area}
            onChange={(e) => { setArea(e.target.value); setPage(1); }}
            bg="sky.50/50"
            borderColor="sky.100"
            borderRadius="xl"
            maxW="200px"
            fontSize="sm"
            _focus={{ borderColor: 'sky.300', bg: 'white' }}
          >
            <option value="">All Areas</option>
            {areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </HStack>

        <Button
          onClick={handleOpenAdd}
          colorScheme="sky"
          bg="sky.500"
          _hover={{ bg: 'sky.600' }}
          color="white"
          borderRadius="xl"
          px={6}
          leftIcon={<FaPlus />}
          fontSize="sm"
          shadow="md"
        >
          Add New Client
        </Button>
      </Flex>

      {/* Clients Table */}
      <Box bg="white" borderRadius="2xl" border="1px" borderColor="sky.100" shadow="sm" overflow="hidden">
        <Box overflowX="auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ background: 'rgba(240,249,255,0.4)' }}>
              <tr style={{ borderBottom: '1px solid #e0f2fe' }}>
                {['Party Code','Party Name','Contact Info','Area Code/Name','GSTIN No','Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: '#0c4a6e', fontSize: '11px', fontWeight: 'bold', textAlign: h === 'Actions' ? 'center' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ color: '#475569', fontSize: '14px' }}>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontWeight: '500' }}>
                    No clients found matching search filters.
                  </td>
                </tr>
              ) : (
                clients.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #f0f9ff' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0369a1' }}>{c.prtCd}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>{c.partyName}</td>
                    <td style={{ padding: '12px 16px' }}>{c.contactNo || <span style={{ color: '#cbd5e1' }}>N/A</span>}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#334155' }}>{c.areaName || <span style={{ color: '#cbd5e1' }}>N/A</span>}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>{c.partyGstinNo || <span style={{ color: '#cbd5e1' }}>-</span>}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <HStack spacing={3} justify="center">
                        <IconButton
                          aria-label="Edit Client"
                          icon={<FaEdit />}
                          size="sm"
                          bg="sky.50"
                          _hover={{ bg: 'sky.100' }}
                          color="sky.600"
                          onClick={() => handleOpenEdit(c)}
                        />
                        <IconButton
                          aria-label="Delete Client"
                          icon={<FaTrash />}
                          size="sm"
                          bg="rose.50"
                          _hover={{ bg: 'rose.100' }}
                          color="rose.600"
                          onClick={() => handleDelete(c._id)}
                        />
                      </HStack>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalRecords={totalRecords} pageSize={PAGE_SIZE} />
      </Box>

      {/* Modal for Add/Edit Client */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ background: '#f0f9ff', borderBottom: '1px solid #e0f2fe', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#0c4a6e', fontSize: '16px' }}>{editId ? 'Modify Client Settings' : 'Add New Client Profile'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Party / Store Name *</label>
                  <Input value={formData.partyName} onChange={(e) => setFormData({ ...formData, partyName: e.target.value })} placeholder="Enter store name..." bg="slate.50" _focus={{ bg: 'white', borderColor: 'sky.300' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Contact Phone</label>
                  <Input value={formData.contactNo} onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })} placeholder="e.g. 9876543210" bg="slate.50" _focus={{ bg: 'white', borderColor: 'sky.300' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Market Area / Route</label>
                  <Input value={formData.areaName} onChange={(e) => setFormData({ ...formData, areaName: e.target.value })} placeholder="e.g. Karol Bagh" bg="slate.50" _focus={{ bg: 'white', borderColor: 'sky.300' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Address Lane</label>
                  <Input value={formData.add1} onChange={(e) => setFormData({ ...formData, add1: e.target.value })} placeholder="Address Line 1" bg="slate.50" mb={2} _focus={{ bg: 'white', borderColor: 'sky.300' }} />
                  <Input value={formData.add2} onChange={(e) => setFormData({ ...formData, add2: e.target.value })} placeholder="Address Line 2 (Optional)" bg="slate.50" _focus={{ bg: 'white', borderColor: 'sky.300' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Postal PIN Code</label>
                  <Input value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })} placeholder="e.g. 110005" bg="slate.50" _focus={{ bg: 'white', borderColor: 'sky.300' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Party GSTIN Number</label>
                  <Input value={formData.partyGstinNo} onChange={(e) => setFormData({ ...formData, partyGstinNo: e.target.value.toUpperCase() })} placeholder="15-digit GSTIN (Optional)" fontFamily="mono" bg="slate.50" _focus={{ bg: 'white', borderColor: 'sky.300' }} />
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" bg="sky.500" color="white" _hover={{ bg: 'sky.600' }}>Save Profile</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Box>
  );
}
