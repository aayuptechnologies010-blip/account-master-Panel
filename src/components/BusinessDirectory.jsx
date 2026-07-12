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
  Button,
  useToast,
} from '@chakra-ui/react';
import { FaSearch, FaWarehouse, FaArrowRight, FaSignOutAlt } from 'react-icons/fa';
import { apiService } from '../apiService';
import Pagination from './Pagination';

export default function BusinessDirectory({ onSelectBusiness, onLogout }) {
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const toast = useToast();

  const fetchBusinesses = async () => {
    try {
      const data = await apiService.getBusinesses();
      setBusinesses(data || []);
    } catch (err) {
      toast({
        title: "Error fetching businesses",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load business directory on mount
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchBusinesses is stable for this component's lifetime
  }, []);

  const filtered = businesses.filter(b =>
    (b.businessName || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.userId?.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.phone || '').includes(search)
  );

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const handleSelect = (b) => {
    if (!b.userId?._id) {
      toast({ title: "This business has no linked owner account", status: "warning", duration: 3000 });
      return;
    }
    apiService.setViewingOwner(b.userId._id, b.businessName);
    onSelectBusiness();
  };

  return (
    <Box minH="100vh" bg="gray.50" py={10} px={4}>
      <Box maxW="1100px" mx="auto">
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={0}>
            <Heading size="lg" fontWeight="800" color="gray.800">
              Business Directory
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Pick a business to view its dashboard, clients, stock and bills.
            </Text>
          </VStack>
          <Button leftIcon={<FaSignOutAlt />} variant="ghost" color="gray.500" onClick={onLogout}>
            Sign Out
          </Button>
        </Flex>

        <Box bg="white" p={6} borderRadius="16px" border="1px solid #e2e8f0" boxShadow="0 1px 8px rgba(0,0,0,0.05)">
          <Flex mb={5}>
            <InputGroup maxW="360px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search by business, owner, email or phone..."
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
                  <Th color="gray.500" fontSize="xs" fontWeight="700">Business</Th>
                  <Th color="gray.500" fontSize="xs" fontWeight="700">Owner</Th>
                  <Th color="gray.500" fontSize="xs" fontWeight="700">Contact</Th>
                  <Th color="gray.500" fontSize="xs" fontWeight="700">Status</Th>
                  <Th color="gray.500" fontSize="xs" fontWeight="700" textAlign="right">Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paged.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={10} color="gray.400" fontSize="sm">
                      No businesses found.
                    </Td>
                  </Tr>
                ) : (
                  paged.map((b) => (
                    <Tr key={b._id} _hover={{ bg: 'sky.50' }} cursor="pointer" onClick={() => handleSelect(b)}>
                      <Td>
                        <Flex align="center" gap={2}>
                          <Icon as={FaWarehouse} color="sky.500" />
                          <Text fontWeight="700" color="gray.800">{b.businessName || '—'}</Text>
                        </Flex>
                      </Td>
                      <Td color="gray.700">{b.ownerName || '—'}</Td>
                      <Td color="gray.600" fontSize="sm">
                        <Text>{b.userId?.email || b.email || '—'}</Text>
                        <Text fontSize="xs" color="gray.400">{b.userId?.phone || b.phone || ''}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={b.userId?.isBlocked ? 'red' : 'green'} borderRadius="20px" px={2.5} py={0.5} fontSize="10px" fontWeight="700">
                          {b.userId?.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </Badge>
                      </Td>
                      <Td textAlign="right">
                        <Button size="xs" rightIcon={<FaArrowRight />} colorScheme="sky" variant="outline" borderRadius="8px">
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} totalRecords={totalRecords} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
        </Box>
      </Box>
    </Box>
  );
}
