import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Td,
  Th,
  Tr,
  Badge,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
} from '@chakra-ui/react';
import { FaSearch, FaBan, FaCheckCircle, FaThumbsUp, FaThumbsDown, FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaIdCard, FaShieldAlt } from 'react-icons/fa';
import { apiService } from '../apiService';
import Pagination from './Pagination';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data || []);
      // If a user was selected, update their data in detail view
      if (selectedUser) {
        const updated = (data || []).find(x => x._id === selectedUser._id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err) {
      toast({
        title: "Error fetching users",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || '').includes(search)
  );

  const totalRecords = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const handleToggleBlock = async (u) => {
    try {
      const res = await apiService.toggleBlockUser(u._id);
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isBlocked: res.isBlocked } : x));
      if (selectedUser && selectedUser._id === u._id) {
        setSelectedUser(prev => ({ ...prev, isBlocked: res.isBlocked }));
      }
      toast({ title: res.message, status: "success", duration: 2500, isClosable: true });
    } catch (err) {
      toast({
        title: "Error updating user",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleApprove = async (u) => {
    try {
      const res = await apiService.approveUser(u._id);
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, status: res.status } : x));
      if (selectedUser && selectedUser._id === u._id) {
        setSelectedUser(prev => ({ ...prev, status: res.status }));
      }
      toast({ title: "User approved", status: "success", duration: 2500, isClosable: true });
    } catch (err) {
      toast({ title: "Error approving user", description: err.response?.data?.message || err.message, status: "error", duration: 3000, isClosable: true });
    }
  };

  const handleReject = async (u) => {
    try {
      const res = await apiService.rejectUser(u._id);
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, status: res.status } : x));
      if (selectedUser && selectedUser._id === u._id) {
        setSelectedUser(prev => ({ ...prev, status: res.status }));
      }
      toast({ title: "User rejected", status: "success", duration: 2500, isClosable: true });
    } catch (err) {
      toast({ title: "Error rejecting user", description: err.response?.data?.message || err.message, status: "error", duration: 3000, isClosable: true });
    }
  };

  // Render detail view if a user is selected
  if (selectedUser) {
    return (
      <Box bg="white" p={8} borderRadius="24px" border="1px solid #e2e8f0" boxShadow="0 10px 30px rgba(0,0,0,0.04)">
        <HStack spacing={4} mb={6}>
          <IconButton
            icon={<FaArrowLeft />}
            onClick={() => setSelectedUser(null)}
            variant="ghost"
            borderRadius="12px"
            aria-label="Back to List"
            color="gray.600"
            _hover={{ bg: 'gray.100' }}
          />
          <Heading size="md" color="gray.800" fontWeight="800">
            User Details
          </Heading>
        </HStack>

        <Flex direction={{ base: 'column', md: 'row' }} gap={8} align="stretch">
          {/* Left panel card */}
          <Box flex={1} bg="slate.50" p={6} borderRadius="20px" border="1px solid" borderColor="gray.100" bgGradient="linear(to-b, gray.50, white)">
            <VStack spacing={5} align="center" py={4}>
              <Box
                w="90px"
                h="90px"
                borderRadius="full"
                bgGradient="linear(to-br, sky.400, blue.500)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontSize="3xl"
                fontWeight="bold"
                boxShadow="0 8px 20px rgba(14,165,233,0.3)"
              >
                {selectedUser.name ? selectedUser.name.substring(0, 2).toUpperCase() : 'US'}
              </Box>
              <VStack spacing={1}>
                <Heading size="md" color="gray.800" fontWeight="800">{selectedUser.name || 'Anonymous User'}</Heading>
                <Text color="gray.400" fontSize="sm">{selectedUser.phone || 'No phone number'}</Text>
              </VStack>

              <HStack spacing={3} mt={2}>
                <Badge colorScheme={selectedUser.status === 'rejected' ? 'red' : selectedUser.status === 'pending' ? 'yellow' : 'green'} borderRadius="20px" px={3} py={1} fontSize="xs" fontWeight="700">
                  {selectedUser.status?.toUpperCase() || 'APPROVED'}
                </Badge>
                <Badge colorScheme={selectedUser.isBlocked ? 'red' : 'green'} borderRadius="20px" px={3} py={1} fontSize="xs" fontWeight="700">
                  {selectedUser.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                </Badge>
              </HStack>

              <Divider py={2} />

              <VStack w="full" spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text color="gray.500" fontSize="sm">Status</Text>
                  <Text fontWeight="600" color={selectedUser.isBlocked ? "red.500" : "green.500"} fontSize="sm">
                    {selectedUser.isBlocked ? "Suspended" : "Authorized"}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.500" fontSize="sm">Registered On</Text>
                  <Text fontWeight="600" color="gray.700" fontSize="sm">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() + ' ' + new Date(selectedUser.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Box>

          {/* Right details content */}
          <Box flex={2}>
            <Heading size="sm" color="gray.600" textTransform="uppercase" letterSpacing="1px" mb={4}>
              Account Information
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6} mb={8}>
              <HStack spacing={3} align="start">
                <Icon as={FaUser} color="sky.500" mt={1} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="gray.400" fontWeight="600">Full Name</Text>
                  <Text fontWeight="600" color="gray.800">{selectedUser.name || '—'}</Text>
                </VStack>
              </HStack>

              <HStack spacing={3} align="start">
                <Icon as={FaEnvelope} color="sky.500" mt={1} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="gray.400" fontWeight="600">Email Address</Text>
                  <Text fontWeight="600" color="gray.800">{selectedUser.email || '—'}</Text>
                </VStack>
              </HStack>

              <HStack spacing={3} align="start">
                <Icon as={FaPhone} color="sky.500" mt={1} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="gray.400" fontWeight="600">Phone Number</Text>
                  <Text fontWeight="600" color="gray.800">{selectedUser.phone || '—'}</Text>
                </VStack>
              </HStack>

              <HStack spacing={3} align="start">
                <Icon as={FaCalendarAlt} color="sky.500" mt={1} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="gray.400" fontWeight="600">Registration Date</Text>
                  <Text fontWeight="600" color="gray.800">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—'}
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={3} align="start" gridColumn={{ sm: "span 2" }}>
                <Icon as={FaIdCard} color="sky.500" mt={1} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="gray.400" fontWeight="600">Firebase UID</Text>
                  <Text fontFamily="mono" fontSize="sm" color="gray.700">{selectedUser.firebaseUid || '—'}</Text>
                </VStack>
              </HStack>
            </SimpleGrid>

            <Divider mb={6} />

            <Heading size="sm" color="gray.600" textTransform="uppercase" letterSpacing="1px" mb={4}>
              Change Login Permissions
            </Heading>
            <Text fontSize="sm" color="gray.500" mb={6}>
              Toggle access permissions below. When a user is <strong>Blocked</strong>, they will be instantly signed out and prevented from logging in on the mobile app.
            </Text>

            <HStack spacing={4}>
              {selectedUser.status === 'pending' ? (
                <>
                  <Button
                    leftIcon={<FaThumbsUp />}
                    colorScheme="green"
                    onClick={() => handleApprove(selectedUser)}
                    px={6}
                    borderRadius="12px"
                  >
                    Approve Request
                  </Button>
                  <Button
                    leftIcon={<FaThumbsDown />}
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleReject(selectedUser)}
                    px={6}
                    borderRadius="12px"
                  >
                    Reject Request
                  </Button>
                </>
              ) : (
                <Button
                  leftIcon={selectedUser.isBlocked ? <FaCheckCircle /> : <FaBan />}
                  colorScheme={selectedUser.isBlocked ? 'green' : 'red'}
                  onClick={() => handleToggleBlock(selectedUser)}
                  px={6}
                  borderRadius="12px"
                >
                  {selectedUser.isBlocked ? 'Unblock User (Active)' : 'Block User (Inactive)'}
                </Button>
              )}
            </HStack>
          </Box>
        </Flex>
      </Box>
    );
  }

  // Render standard list table
  return (
    <Box bg="white" p={6} borderRadius="16px" border="1px solid #e2e8f0" boxShadow="0 1px 8px rgba(0,0,0,0.05)">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={4} mb={6}>
        <VStack align="start" spacing={0}>
          <Heading size="md" fontWeight="800" color="gray.800">
            Registered App Users
          </Heading>
          <Text fontSize="xs" color="gray.400">
            Everyone who has registered or logged into the mobile app
          </Text>
        </VStack>

        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            borderRadius="10px"
          />
        </InputGroup>
      </Flex>

      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Name</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Email</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Phone</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Approval</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Access</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700">Registered On</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="700" textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pagedUsers.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={10} color="gray.400" fontSize="sm">
                  No users found.
                </Td>
              </Tr>
            ) : (
              pagedUsers.map((u) => (
                <Tr key={u._id}>
                  <Td fontWeight="600" color="gray.700">{u.name || '—'}</Td>
                  <Td color="gray.600">{u.email || '—'}</Td>
                  <Td color="gray.600">{u.phone || '—'}</Td>
                  <Td>
                    <Badge
                      colorScheme={u.status === 'rejected' ? 'red' : u.status === 'pending' ? 'yellow' : 'green'}
                      borderRadius="20px" px={2.5} py={0.5} fontSize="10px" fontWeight="700"
                    >
                      {(u.status || 'approved').toUpperCase()}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={u.isBlocked ? 'red' : 'green'} borderRadius="20px" px={2.5} py={0.5} fontSize="10px" fontWeight="700">
                      {u.isBlocked ? 'INACTIVE' : 'ACTIVE'}
                    </Badge>
                  </Td>
                  <Td color="gray.500" fontSize="sm">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </Td>
                  <Td textAlign="right">
                    <HStack spacing={2} justify="flex-end">
                      <Button
                        size="xs"
                        colorScheme="sky"
                        variant="solid"
                        bgGradient="linear(to-r, sky.400, blue.500)"
                        color="white"
                        borderRadius="8px"
                        onClick={() => setSelectedUser(u)}
                        _hover={{ bgGradient: "linear(to-r, sky.500, blue.600)" }}
                      >
                        View
                      </Button>
                      {u.status === 'pending' ? (
                        <>
                          <Button size="xs" leftIcon={<FaThumbsUp />} colorScheme="green" variant="outline" borderRadius="8px" onClick={() => handleApprove(u)}>
                            Approve
                          </Button>
                          <Button size="xs" leftIcon={<FaThumbsDown />} colorScheme="red" variant="outline" borderRadius="8px" onClick={() => handleReject(u)}>
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="xs"
                          leftIcon={u.isBlocked ? <FaCheckCircle /> : <FaBan />}
                          colorScheme={u.isBlocked ? 'green' : 'red'}
                          variant="outline"
                          borderRadius="8px"
                          onClick={() => handleToggleBlock(u)}
                        >
                          {u.isBlocked ? 'Active' : 'Inactive'}
                        </Button>
                      )}
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
  );
}
