import { Flex, Text, Button, Select } from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function Pagination({ page, totalPages, onChange, totalRecords, pageSize, onPageSizeChange }) {
  const from = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalRecords);

  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  return (
    <Flex
      direction={{ base: 'column', sm: 'row' }}
      align="center"
      justify="space-between"
      gap={3}
      px={5}
      py={3.5}
      borderTop="1px solid"
      borderColor="gray.100"
      bg="gray.50"
    >
      <Flex align="center" gap={4}>
        <Text fontSize="xs" color="gray.400" fontWeight="500">
          {totalRecords === 0 ? (
            'No records'
          ) : (
            <>Showing <Text as="strong" color="gray.600">{from}–{to}</Text> of <Text as="strong" color="gray.600">{totalRecords}</Text> records</>
          )}
        </Text>

        {onPageSizeChange && (
          <Flex align="center" gap={2}>
            <Text fontSize="xs" color="gray.400" fontWeight="500" whiteSpace="nowrap">Rows per page</Text>
            <Select
              size="xs"
              width="70px"
              borderRadius="8px"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Flex>
        )}
      </Flex>

      {totalPages > 1 && (
        <Flex align="center" gap={1.5}>
          <Button
            size="xs"
            onClick={() => onChange(page - 1)}
            isDisabled={page === 1}
            variant="outline"
            borderColor="gray.200"
            borderRadius="8px"
            minW="32px"
          >
            <FaChevronLeft size={11} />
          </Button>

          {getPages().map((p) => (
            <Button
              key={p}
              size="xs"
              onClick={() => onChange(p)}
              borderRadius="8px"
              minW="32px"
              fontWeight="600"
              {...(p === page
                ? {
                    bgGradient: 'linear(to-r, sky.500, blue.500)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(14,165,233,0.35)',
                    _hover: { bgGradient: 'linear(to-r, sky.600, blue.600)' },
                  }
                : {
                    variant: 'outline',
                    borderColor: 'gray.200',
                    color: 'gray.600',
                  })}
            >
              {p}
            </Button>
          ))}

          <Button
            size="xs"
            onClick={() => onChange(page + 1)}
            isDisabled={page === totalPages}
            variant="outline"
            borderColor="gray.200"
            borderRadius="8px"
            minW="32px"
          >
            <FaChevronRight size={11} />
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
