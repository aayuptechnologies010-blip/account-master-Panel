import { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import {
  Box, Flex, Input, Select, Button, HStack, IconButton, Table, Thead, Tbody, Tr, Th, Td, Text,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Badge, Spinner,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaBook, FaFileImport } from 'react-icons/fa';
import Pagination from './Pagination';
import ImportModal from './ImportModal';

export default function ClientsManager({ onDbChange }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);

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
  const [pageSize, setPageSize] = useState(10);

  // Ledger modal state
  const [ledgerClient, setLedgerClient] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const loadData = async () => {
    try {
      const res = await apiService.getClients({ search, area }, page, pageSize);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when search/area/page/pageSize change
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData intentionally excluded to avoid re-creating the effect every render
  }, [search, area, page, pageSize]);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

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

  const handleOpenLedger = async (client) => {
    setLedgerClient(client);
    setLedgerData(null);
    setLedgerLoading(true);
    try {
      const data = await apiService.getClientLedger(client._id);
      setLedgerData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      setLedgerClient(null);
    } finally {
      setLedgerLoading(false);
    }
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

        <HStack spacing={3}>
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline"
            colorScheme="sky"
            borderRadius="xl"
            px={6}
            leftIcon={<FaFileImport />}
            fontSize="sm"
          >
            Import
          </Button>
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
        </HStack>
      </Flex>

      {/* Clients Table */}
      <Box bg="white" borderRadius="2xl" border="1px" borderColor="sky.100" shadow="sm" overflow="hidden">
        <Box overflowX="auto">
          <Table variant="simple" size="sm" fontSize="14px">
            <Thead bg="sky.50">
              <Tr>
                <Th color="sky.900" fontSize="11px" fontWeight="bold">Party Code</Th>
                <Th color="sky.900" fontSize="11px" fontWeight="bold">Party Name</Th>
                <Th color="sky.900" fontSize="11px" fontWeight="bold">Contact Info</Th>
                <Th color="sky.900" fontSize="11px" fontWeight="bold">Area Code/Name</Th>
                <Th color="sky.900" fontSize="11px" fontWeight="bold">GSTIN No</Th>
                <Th color="sky.900" fontSize="11px" fontWeight="bold" textAlign="right">Outstanding</Th>
                <Th color="sky.900" fontSize="11px" fontWeight="bold" textAlign="center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody color="gray.600">
              {clients.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={8} color="gray.400" fontWeight="500">
                    No clients found matching search filters.
                  </Td>
                </Tr>
              ) : (
                clients.map(c => (
                  <Tr key={c._id} _hover={{ bg: 'sky.50/40' }}>
                    <Td fontWeight="bold" color="sky.700">{c.prtCd}</Td>
                    <Td fontWeight="600" color="gray.800">{c.partyName}</Td>
                    <Td>{c.contactNo || <Text as="span" color="gray.300">N/A</Text>}</Td>
                    <Td fontWeight="500" color="gray.700">{c.areaName || <Text as="span" color="gray.300">N/A</Text>}</Td>
                    <Td fontFamily="mono" fontSize="12px">{c.partyGstinNo || <Text as="span" color="gray.300">-</Text>}</Td>
                    <Td textAlign="right" fontWeight="700" color={c.outstandingBalance > 0 ? 'rose.600' : 'gray.500'}>
                      ₹{(c.outstandingBalance || 0).toLocaleString('en-IN')}
                    </Td>
                    <Td>
                      <HStack spacing={3} justify="center">
                        <IconButton
                          aria-label="View Ledger"
                          icon={<FaBook />}
                          size="sm"
                          bg="purple.50"
                          _hover={{ bg: 'purple.100' }}
                          color="purple.600"
                          onClick={() => handleOpenLedger(c)}
                        />
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
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalRecords={totalRecords} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
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

      {/* Client Ledger Modal */}
      <Modal isOpen={!!ledgerClient} onClose={() => setLedgerClient(null)} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="18px">
          <ModalHeader fontWeight="800">
            Ledger — {ledgerClient?.partyName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {ledgerLoading ? (
              <Flex justify="center" py={10}><Spinner color="sky.500" /></Flex>
            ) : ledgerData ? (
              <>
                <Flex justify="space-between" align="center" mb={4} p={3} bg="sky.50" borderRadius="10px">
                  <Text fontWeight="600" color="gray.700">Outstanding Balance</Text>
                  <Badge colorScheme={ledgerData.outstandingBalance > 0 ? 'red' : 'green'} fontSize="14px" px={3} py={1} borderRadius="10px">
                    ₹{ledgerData.outstandingBalance.toLocaleString('en-IN')}
                  </Badge>
                </Flex>
                <Box maxH="360px" overflowY="auto">
                  <Table size="sm" variant="simple">
                    <Thead bg="gray.50" position="sticky" top={0}>
                      <Tr>
                        <Th fontSize="10px">Voucher</Th>
                        <Th fontSize="10px">Date</Th>
                        <Th fontSize="10px" textAlign="right">Debit</Th>
                        <Th fontSize="10px" textAlign="right">Credit</Th>
                        <Th fontSize="10px" textAlign="right">Balance</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {ledgerData.ledger.length === 0 ? (
                        <Tr><Td colSpan={5} textAlign="center" py={6} color="gray.400">No transactions yet.</Td></Tr>
                      ) : ledgerData.ledger.map((e, i) => (
                        <Tr key={i}>
                          <Td fontFamily="mono" fontSize="12px">{e.voucherNo || '—'}</Td>
                          <Td fontSize="12px" color="gray.600">{new Date(e.date).toLocaleDateString()}</Td>
                          <Td textAlign="right" color="rose.600" fontSize="12px">{e.debit ? `₹${e.debit}` : ''}</Td>
                          <Td textAlign="right" color="green.600" fontSize="12px">{e.credit ? `₹${e.credit}` : ''}</Td>
                          <Td textAlign="right" fontWeight="700" fontSize="12px">₹{e.runningBalance.toLocaleString('en-IN')}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        resource="clients"
        resourceLabel="Clients"
        onImportComplete={() => { loadData(); if (onDbChange) onDbChange(); }}
      />
    </Box>
  );
}
