import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  Text,
  VStack,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { FaSearch, FaUserPlus, FaEdit, FaTrash, FaEye, FaFileImport } from 'react-icons/fa';
import { apiService } from '../apiService';
import Swal from 'sweetalert2';
import Pagination from './Pagination';
import ImportModal from './ImportModal';

export default function SalesmenManager({ onDbChange }) {
  const [salesmen, setSalesmen] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Form values
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Activity modal state
  const [activitySalesman, setActivitySalesman] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchSalesmen = async () => {
    try {
      const data = await apiService.getSalesmen();
      setSalesmen(data);
    } catch (err) {
      toast({
        title: "Error fetching salesmen",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load salesmen on mount
    fetchSalesmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchSalesmen is stable for this component's lifetime
  }, []);

  const handleOpenAdd = () => {
    setSelectedSalesman(null);
    setName('');
    setPhone('');
    setArea('');
    onOpen();
  };

  const handleOpenEdit = (s) => {
    setSelectedSalesman(s);
    setName(s.name);
    setPhone(s.phone || s.contactNo || '');
    setArea(s.area || '');
    onOpen();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (selectedSalesman) {
        // Edit mode
        await apiService.updateSalesman(selectedSalesman._id, { name, phone, contactNo: phone, area });
        toast({
          title: "Salesman Updated",
          status: "success",
          duration: 3000,
        });
      } else {
        // Add mode
        await apiService.addSalesman({ name, phone, contactNo: phone, area });
        toast({
          title: "Salesman Added",
          status: "success",
          duration: 3000,
        });
      }
      onClose();
      fetchSalesmen();
      if (onDbChange) onDbChange();
    } catch (err) {
      toast({
        title: "Error saving salesman",
        description: err.message,
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteSalesman(id);
          toast({
            title: "Salesman Deleted",
            status: "success",
            duration: 3000,
          });
          fetchSalesmen();
          if (onDbChange) onDbChange();
        } catch (err) {
          toast({
            title: "Error deleting salesman",
            description: err.message,
            status: "error",
            duration: 3000,
          });
        }
      }
    });
  };

  const filteredSalesmen = salesmen.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || s.contactNo)?.includes(search)
  );

  const totalRecords = filteredSalesmen.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pagedSalesmen = filteredSalesmen.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const handleViewActivity = async (s) => {
    setActivitySalesman(s);
    setActivityData(null);
    setActivityLoading(true);
    try {
      const data = await apiService.getSalesmanActivity(s._id);
      setActivityData(data);
    } catch (err) {
      toast({ title: "Error fetching activity", description: err.response?.data?.message || err.message, status: "error", duration: 3000 });
      setActivitySalesman(null);
    } finally {
      setActivityLoading(false);
    }
  };

  return (
    <Box bg="white" p={6} borderRadius="16px" border="1px solid #e2e8f0" boxShadow="0 1px 8px rgba(0,0,0,0.05)">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={4} mb={6}>
        <VStack align="start" spacing={0}>
          <Heading size="md" fontWeight="800" color="gray.800">
            Salesmen Directory
          </Heading>
          <Text fontSize="xs" color="gray.400">
            Manage field agents and reference codes
          </Text>
        </VStack>
        
        <Flex gap={3} w={{ base: 'full', md: 'auto' }}>
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.300" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search Salesmen..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              borderRadius="10px"
            />
          </InputGroup>

          <Button
            leftIcon={<FaFileImport />}
            variant="outline"
            colorScheme="sky"
            onClick={() => setShowImportModal(true)}
            borderRadius="10px"
            flexShrink={0}
          >
            Import
          </Button>

          <Button
            leftIcon={<FaUserPlus />}
            colorScheme="sky"
            bgGradient="linear(to-r, sky.500, blue.500)"
            color="white"
            onClick={handleOpenAdd}
            borderRadius="10px"
            px={6}
            flexShrink={0}
            _hover={{ bgGradient: "linear(to-r, sky.600, blue.600)" }}
          >
            Add Salesman
          </Button>
        </Flex>
      </Flex>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Code</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Name</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Phone</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Target Area</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700" textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pagedSalesmen.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={10} color="gray.400" fontSize="sm">
                  No salesmen found. Click 'Add Salesman' to create one.
                </Td>
              </Tr>
            ) : (
              pagedSalesmen.map((s) => (
                <Tr key={s._id}>
                  <Td fontWeight="bold" fontFamily="monospace" fontSize="sm" color="sky.600">
                    {s.code || '—'}
                  </Td>
                  <Td fontWeight="600" color="gray.700">
                    <Flex align="center" gap={2}>
                      <Box
                        w="8px" h="8px" borderRadius="full"
                        bg={s.activeToday ? 'green.400' : 'gray.300'}
                        title={s.activeToday ? 'Active today' : 'No activity today'}
                      />
                      {s.name}
                    </Flex>
                  </Td>
                  <Td color="gray.600">
                    {s.phone || s.contactNo || '—'}
                  </Td>
                  <Td color="gray.600">
                    {s.area || '—'}
                  </Td>
                  <Td textAlign="right">
                    <Flex justify="end" gap={2}>
                      <Button
                        size="xs"
                        leftIcon={<FaEye />}
                        variant="outline"
                        colorScheme="purple"
                        onClick={() => handleViewActivity(s)}
                        borderRadius="6px"
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        leftIcon={<FaEdit />}
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => handleOpenEdit(s)}
                        borderRadius="6px"
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        leftIcon={<FaTrash />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(s._id)}
                        borderRadius="6px"
                      >
                        Delete
                      </Button>
                    </Flex>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} totalRecords={totalRecords} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="18px">
          <form onSubmit={handleSave}>
            <ModalHeader fontWeight="800">
              {selectedSalesman ? 'Edit Salesman Info' : 'Register New Salesman'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Salesman Name</FormLabel>
                  <Input
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    borderRadius="10px"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Phone Number</FormLabel>
                  <Input
                    type="tel"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    borderRadius="10px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Assigned Area</FormLabel>
                  <Input
                    placeholder="e.g. Karol Bagh, Rohini"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    borderRadius="10px"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose} borderRadius="10px">
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="sky"
                bgGradient="linear(to-r, sky.500, blue.500)"
                color="white"
                borderRadius="10px"
                _hover={{ bgGradient: "linear(to-r, sky.600, blue.600)" }}
              >
                {selectedSalesman ? 'Save Changes' : 'Register'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Activity Modal */}
      <Modal isOpen={!!activitySalesman} onClose={() => setActivitySalesman(null)} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="18px">
          <ModalHeader fontWeight="800">
            Today's Activity — {activitySalesman?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {activityLoading ? (
              <Flex justify="center" py={10}><Spinner color="sky.500" /></Flex>
            ) : activityData ? (
              <VStack align="stretch" spacing={4}>
                <Flex justify="space-between" align="center" p={3} bg="green.50" borderRadius="10px">
                  <Text fontWeight="600" color="gray.700">Cash Collected Today</Text>
                  <Badge colorScheme="green" fontSize="14px" px={3} py={1} borderRadius="10px">
                    ₹{activityData.totalCashCollected.toLocaleString('en-IN')}
                  </Badge>
                </Flex>

                <Box>
                  <Text fontWeight="700" fontSize="sm" color="gray.700" mb={2}>
                    Invoices Created Today ({activityData.bills.length})
                  </Text>
                  {activityData.bills.length === 0 ? (
                    <Text fontSize="sm" color="gray.400">No invoices created today.</Text>
                  ) : (
                    <VStack align="stretch" spacing={2}>
                      {activityData.bills.map((b) => (
                        <Flex key={b._id} justify="space-between" fontSize="sm" p={2} bg="gray.50" borderRadius="8px">
                          <Text color="gray.700">{b.voucherNo} — {b.customerAc?.partyName || 'Unknown'}</Text>
                          <Text fontWeight="700" color="sky.600">₹{b.amountR}</Text>
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="700" fontSize="sm" color="gray.700" mb={2}>
                    Payments Collected Today ({activityData.payments.length})
                  </Text>
                  {activityData.payments.length === 0 ? (
                    <Text fontSize="sm" color="gray.400">No payments collected today.</Text>
                  ) : (
                    <VStack align="stretch" spacing={2}>
                      {activityData.payments.map((p) => (
                        <Flex key={p._id} justify="space-between" fontSize="sm" p={2} bg="gray.50" borderRadius="8px">
                          <Text color="gray.700">{p.voucherNo} — {p.customerAc?.partyName || 'Unknown'}</Text>
                          <Text fontWeight="700" color="green.600">₹{p.amount}</Text>
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </Box>
              </VStack>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        resource="salesmen"
        resourceLabel="Salesmen"
        onImportComplete={() => { fetchSalesmen(); if (onDbChange) onDbChange(); }}
      />
    </Box>
  );
}
