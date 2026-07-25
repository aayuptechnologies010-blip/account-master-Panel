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
  Select,
  Badge,
  HStack,
  NumberInput,
  NumberInputField,
  Divider,
  IconButton
} from '@chakra-ui/react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaPrint, FaTimes } from 'react-icons/fa';
import { apiService } from '../apiService';
import Pagination from './Pagination';
import Swal from 'sweetalert2';

const EMPTY_ITEM = { name: '', description: '', quantity: 1, unitPrice: 0 };

function computeTotals(items, discountPercent, gstPercent, shippingCharge) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const discountAmount = subtotal * (Number(discountPercent) || 0) / 100;
  const taxable = subtotal - discountAmount;
  const gstAmount = taxable * (Number(gstPercent) || 0) / 100;
  const grandTotal = taxable + gstAmount + (Number(shippingCharge) || 0);
  return { subtotal, discountAmount, gstAmount, grandTotal };
}

export default function InvoicesManager() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form values
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchInvoices = async () => {
    try {
      const res = await apiService.getInvoices({ search }, page, pageSize);
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

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when page/search/pageSize change
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchInvoices intentionally excluded to avoid re-creating the effect every render
  }, [page, search, pageSize]);

  const resetForm = () => {
    setCustomerName('');
    setCustomerId('');
    setCustomerAddress('');
    setCustomerPhone('');
    setCustomerEmail('');
    setItems([{ ...EMPTY_ITEM }]);
    setDiscountPercent(0);
    setGstPercent(18);
    setShippingCharge(0);
    setDueDate('');
    setStatus('pending');
  };

  const handleOpenAdd = () => {
    setSelectedInvoice(null);
    resetForm();
    onOpen();
  };

  const handleOpenEdit = (inv) => {
    setSelectedInvoice(inv);
    setCustomerName(inv.customer_name || '');
    setCustomerId(inv.customer_id ?? '');
    setCustomerAddress(inv.customerAddress || '');
    setCustomerPhone(inv.customerPhone || '');
    setCustomerEmail(inv.customerEmail || '');
    setItems(
      Array.isArray(inv.items) && inv.items.length
        ? inv.items.map((it) => ({ name: it.name || '', description: it.description || '', quantity: it.quantity || 1, unitPrice: it.unitPrice || 0 }))
        : [{ name: inv.product_name || '', description: '', quantity: inv.quantity || 1, unitPrice: inv.price || 0 }]
    );
    setDiscountPercent(inv.discountPercent || 0);
    setGstPercent(inv.gstPercent || 0);
    setShippingCharge(inv.shippingCharge || 0);
    setDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '');
    setStatus(inv.status || 'pending');
    onOpen();
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const handleAddItemRow = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const handleRemoveItemRow = (index) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const { subtotal, discountAmount, gstAmount, grandTotal } = computeTotals(items, discountPercent, gstPercent, shippingCharge);

  const handleSave = async (e) => {
    e.preventDefault();
    const validItems = items.filter((it) => it.name.trim() && Number(it.unitPrice) > 0);
    if (!customerName || validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Customer name and at least one product/service line are required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const payload = {
      customer_name: customerName,
      customer_id: customerId ? Number(customerId) : undefined,
      customerAddress,
      customerPhone,
      customerEmail,
      items: validItems.map((it) => ({ name: it.name, description: it.description, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
      discountPercent: Number(discountPercent) || 0,
      gstPercent: Number(gstPercent) || 0,
      shippingCharge: Number(shippingCharge) || 0,
      dueDate: dueDate || undefined,
      status,
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

  const handlePrint = async (id) => {
    try {
      await apiService.openInvoicePdf(id);
    } catch (err) {
      toast({
        title: "Error generating PDF",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 3000,
      });
    }
  };

  const getStatusBadgeColor = (s) => {
    switch (s) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  const describeItems = (inv) => {
    const list = Array.isArray(inv.items) && inv.items.length ? inv.items : (inv.product_name ? [{ name: inv.product_name, quantity: inv.quantity }] : []);
    if (list.length === 0) return '—';
    if (list.length === 1) return list[0].name;
    return `${list[0].name} +${list.length - 1} more`;
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
              <Th color="gray.500" fontSize="xs" fontWeight="700">Product(s)</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Total Amount</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Status</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700" textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {invoices.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={10} color="gray.400" fontSize="sm">
                  No invoice records found.
                </Td>
              </Tr>
            ) : (
              invoices.map((inv) => (
                <Tr key={inv._id}>
                  <Td fontWeight="700" color="gray.700">{inv.customer_name}</Td>
                  <Td color="gray.600">{describeItems(inv)}</Td>
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
                        leftIcon={<FaPrint />}
                        variant="outline"
                        colorScheme="sky"
                        onClick={() => handlePrint(inv._id)}
                        borderRadius="6px"
                      >
                        Print
                      </Button>
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

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        totalRecords={totalCount}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="18px">
          <form onSubmit={handleSave}>
            <ModalHeader fontWeight="800">
              {selectedInvoice ? 'Modify Invoice Record' : 'Generate New Invoice'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text fontWeight="700" fontSize="sm" color="gray.700">Bill To</Text>
                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Customer Name</FormLabel>
                    <Input
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      borderRadius="10px"
                    />
                  </FormControl>
                  <FormControl maxW="160px">
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Customer ID</FormLabel>
                    <Input
                      placeholder="Optional"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      borderRadius="10px"
                    />
                  </FormControl>
                </HStack>
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Phone</FormLabel>
                    <Input
                      placeholder="Customer phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      borderRadius="10px"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Email</FormLabel>
                    <Input
                      placeholder="Customer email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      borderRadius="10px"
                    />
                  </FormControl>
                </HStack>
                <FormControl>
                  <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Address</FormLabel>
                  <Input
                    placeholder="Customer address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    borderRadius="10px"
                  />
                </FormControl>

                <Divider />

                <Flex justify="space-between" align="center">
                  <Text fontWeight="700" fontSize="sm" color="gray.700">Products / Services</Text>
                  <Button size="xs" leftIcon={<FaPlus />} variant="outline" colorScheme="sky" onClick={handleAddItemRow} borderRadius="6px">
                    Add Line
                  </Button>
                </Flex>

                {items.map((item, index) => (
                  <Box key={index} p={3} border="1px solid #e2e8f0" borderRadius="10px">
                    <HStack spacing={2} mb={2}>
                      <Input
                        placeholder="Product / Service name"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        borderRadius="8px"
                        size="sm"
                      />
                      <IconButton
                        aria-label="Remove line"
                        icon={<FaTimes />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        isDisabled={items.length === 1}
                        onClick={() => handleRemoveItemRow(index)}
                      />
                    </HStack>
                    <Input
                      placeholder="Description (optional)"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      borderRadius="8px"
                      size="sm"
                      mb={2}
                    />
                    <HStack spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.500" mb={1}>Qty</FormLabel>
                        <NumberInput min={1} size="sm" value={item.quantity} onChange={(val) => handleItemChange(index, 'quantity', Number(val) || 1)}>
                          <NumberInputField borderRadius="8px" />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.500" mb={1}>Unit Price (₹)</FormLabel>
                        <NumberInput min={0} size="sm" value={item.unitPrice} onChange={(val) => handleItemChange(index, 'unitPrice', Number(val) || 0)}>
                          <NumberInputField borderRadius="8px" />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.500" mb={1}>Line Total</FormLabel>
                        <Text fontWeight="700" fontSize="sm" pt={1}>
                          ₹{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN')}
                        </Text>
                      </FormControl>
                    </HStack>
                  </Box>
                ))}

                <Divider />

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Discount (%)</FormLabel>
                    <NumberInput min={0} max={100} value={discountPercent} onChange={(val) => setDiscountPercent(Number(val) || 0)}>
                      <NumberInputField borderRadius="10px" />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">GST (%)</FormLabel>
                    <NumberInput min={0} max={100} value={gstPercent} onChange={(val) => setGstPercent(Number(val) || 0)}>
                      <NumberInputField borderRadius="10px" />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Shipping (₹)</FormLabel>
                    <NumberInput min={0} value={shippingCharge} onChange={(val) => setShippingCharge(Number(val) || 0)}>
                      <NumberInputField borderRadius="10px" />
                    </NumberInput>
                  </FormControl>
                </HStack>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Due Date</FormLabel>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} borderRadius="10px" />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Status</FormLabel>
                    <Select value={status} onChange={(e) => setStatus(e.target.value)} borderRadius="10px">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </Select>
                  </FormControl>
                </HStack>

                <Divider />

                <VStack spacing={1} align="stretch" bg="gray.50" p={3} borderRadius="10px">
                  <Flex justify="space-between"><Text fontSize="sm" color="gray.500">Sub Total</Text><Text fontSize="sm">₹{subtotal.toLocaleString('en-IN')}</Text></Flex>
                  {discountAmount > 0 && (
                    <Flex justify="space-between"><Text fontSize="sm" color="green.600">Discount</Text><Text fontSize="sm" color="green.600">- ₹{discountAmount.toLocaleString('en-IN')}</Text></Flex>
                  )}
                  {gstAmount > 0 && (
                    <Flex justify="space-between"><Text fontSize="sm" color="gray.500">GST</Text><Text fontSize="sm">₹{gstAmount.toLocaleString('en-IN')}</Text></Flex>
                  )}
                  {Number(shippingCharge) > 0 && (
                    <Flex justify="space-between"><Text fontSize="sm" color="gray.500">Shipping</Text><Text fontSize="sm">₹{Number(shippingCharge).toLocaleString('en-IN')}</Text></Flex>
                  )}
                  <Divider />
                  <Flex justify="space-between">
                    <Text fontWeight="800" color="gray.700">Grand Total</Text>
                    <Text fontWeight="800" color="sky.600" fontSize="lg">₹{grandTotal.toLocaleString('en-IN')}</Text>
                  </Flex>
                </VStack>
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
