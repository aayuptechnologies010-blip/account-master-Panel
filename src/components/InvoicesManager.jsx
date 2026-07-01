import React, { useState, useEffect } from 'react';
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
  Select,
  Badge,
  HStack,
  NumberInput,
  NumberInputField,
  Divider
} from '@chakra-ui/react';
import { FaSearch, FaFileInvoice, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { apiService } from '../apiService';
import Pagination from './Pagination';
import Swal from 'sweetalert2';

export default function InvoicesManager() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Form values
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState('pending');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchInvoices = async () => {
    try {
      const res = await apiService.getInvoices({ search }, page, 6);
      setInvoices(res.invoices || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      toast({
        title: "Error fetching invoices",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search]);

  const handleOpenAdd = () => {
    setSelectedInvoice(null);
    setCustomerName('');
    setProductName('');
    setQuantity(1);
    setPrice(0);
    setStatus('pending');
    onOpen();
  };

  const handleOpenEdit = (inv) => {
    setSelectedInvoice(inv);
    setCustomerName(inv.customer_name);
    setProductName(inv.product_name || '');
    setQuantity(inv.quantity || 1);
    setPrice(inv.price || 0);
    setStatus(inv.status || 'pending');
    onOpen();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!customerName || !price) {
      toast({
        title: "Validation Error",
        description: "Customer Name and Price are required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const payload = {
      customer_name: customerName,
      product_name: productName,
      quantity: Number(quantity),
      price: Number(price),
      total: Number(quantity) * Number(price),
      status
    };

    try {
      if (selectedInvoice) {
        await apiService.updateInvoice(selectedInvoice._id, payload);
        toast({
          title: "Invoice Updated",
          status: "success",
          duration: 3000,
        });
      } else {
        await apiService.addInvoice(payload);
        toast({
          title: "Invoice Generated",
          status: "success",
          duration: 3000,
        });
      }
      onClose();
      fetchInvoices();
    } catch (err) {
      toast({
        title: "Error saving invoice",
        description: err.message,
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Remove this invoice record permanently?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteInvoice(id);
          toast({
            title: "Invoice Deleted",
            status: "success",
            duration: 3000,
          });
          fetchInvoices();
        } catch (err) {
          toast({
            title: "Error deleting invoice",
            description: err.message,
            status: "error",
            duration: 3000,
          });
        }
      }
    });
  };

  const getStatusBadgeColor = (s) => {
    switch (s) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box bg="white" p={6} borderRadius="16px" border="1px solid #e2e8f0" boxShadow="0 1px 8px rgba(0,0,0,0.05)">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={4} mb={6}>
        <VStack align="start" spacing={0}>
          <Heading size="md" fontWeight="800" color="gray.800">
            Invoice Console
          </Heading>
          <Text fontSize="xs" color="gray.400">
            Create and monitor custom product invoices
          </Text>
        </VStack>

        <Flex gap={3} w={{ base: 'full', md: 'auto' }}>
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.300" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search Invoices..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              borderRadius="10px"
            />
          </InputGroup>

          <Button
            leftIcon={<FaPlus />}
            colorScheme="sky"
            bgGradient="linear(to-r, sky.500, blue.500)"
            color="white"
            onClick={handleOpenAdd}
            borderRadius="10px"
            _hover={{ bgGradient: "linear(to-r, sky.600, blue.600)" }}
          >
            Create Invoice
          </Button>
        </Flex>
      </Flex>

      <Box overflowX="auto" mb={4}>
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Client / Party</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Product</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Qty × Price</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Total Amount</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Status</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700" textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {invoices.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={10} color="gray.400" fontSize="sm">
                  No invoice records found.
                </Td>
              </Tr>
            ) : (
              invoices.map((inv) => (
                <Tr key={inv._id}>
                  <Td fontWeight="700" color="gray.700">{inv.customer_name}</Td>
                  <Td color="gray.600">{inv.product_name || '—'}</Td>
                  <Td fontSize="sm" color="gray.500">
                    {inv.quantity} × ₹{inv.price}
                  </Td>
                  <Td fontWeight="bold" color="gray.800">
                    ₹{inv.total?.toLocaleString('en-IN')}
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusBadgeColor(inv.status)} borderRadius="20px" px={3} py={1} fontSize="10px" fontWeight="700">
                      {inv.status?.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td textAlign="right">
                    <Flex justify="end" gap={2}>
                      <Button
                        size="xs"
                        leftIcon={<FaEdit />}
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => handleOpenEdit(inv)}
                        borderRadius="6px"
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        leftIcon={<FaTrash />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(inv._id)}
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

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          totalRecords={totalCount}
          pageSize={6}
        />
      )}

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="18px">
          <form onSubmit={handleSave}>
            <ModalHeader fontWeight="800">
              {selectedInvoice ? 'Modify Invoice Record' : 'Generate New Invoice'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Customer Name</FormLabel>
                  <Input
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    borderRadius="10px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Product Name</FormLabel>
                  <Input
                    placeholder="Enter product description"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    borderRadius="10px"
                  />
                </FormControl>

                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Quantity</FormLabel>
                    <NumberInput min={1} value={quantity} onChange={(val) => setQuantity(Number(val) || 1)}>
                      <NumberInputField borderRadius="10px" />
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Unit Price (₹)</FormLabel>
                    <NumberInput min={0} value={price} onChange={(val) => setPrice(Number(val) || 0)}>
                      <NumberInputField borderRadius="10px" />
                    </NumberInput>
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Status</FormLabel>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)} borderRadius="10px">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </Select>
                </FormControl>

                <Divider />

                <Flex w="full" justify="space-between" px={2}>
                  <Text fontWeight="700" color="gray.500">Estimated Total:</Text>
                  <Text fontWeight="800" color="sky.600" fontSize="lg">
                    ₹{(quantity * price).toLocaleString('en-IN')}
                  </Text>
                </Flex>
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
                {selectedInvoice ? 'Save Changes' : 'Generate'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}
