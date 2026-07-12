import { useState, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Box, Text, Button, Icon, Badge, Table, Thead, Tbody, Tr, Th, Td, Progress,
  VStack, HStack, SimpleGrid, useToast, Menu, MenuButton, MenuList, MenuItem,
} from '@chakra-ui/react';
import { FaCloudUploadAlt, FaFileCsv, FaCheckCircle, FaDownload, FaChevronDown } from 'react-icons/fa';
import { apiService } from '../apiService';

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json'];

const STATUS_COLORS = { valid: 'green', invalid: 'red', duplicate: 'yellow' };

function getExtension(fileName) {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx).toLowerCase();
}

export default function ImportModal({ isOpen, onClose, resource, resourceLabel, onImportComplete }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | summary
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0, percent: 0 });
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreviewData(null);
    setProgress({ processed: 0, total: 0, percent: 0 });
    setSummary(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelected = async (selectedFile) => {
    if (!selectedFile) return;
    const ext = getExtension(selectedFile.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast({ title: 'Unsupported file type', description: `Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`, status: 'error', duration: 4000, isClosable: true });
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    try {
      const data = await apiService.previewImport(resource, selectedFile);
      setPreviewData(data);
      setStep('preview');
    } catch (err) {
      toast({ title: 'Error reading file', description: err.response?.data?.message || err.message, status: 'error', duration: 4000, isClosable: true });
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    handleFileSelected(dropped);
  };

  const handleStartImport = async () => {
    setStep('importing');
    setProgress({ processed: 0, total: previewData?.totalRecords || 0, percent: 0 });
    try {
      const result = await apiService.runImport(resource, file, (p) => setProgress(p));
      setSummary(result);
      setStep('summary');
      if (onImportComplete) onImportComplete();
    } catch (err) {
      toast({ title: 'Import failed', description: err.message, status: 'error', duration: 5000, isClosable: true });
      setStep('preview');
    }
  };

  const handleDownloadFailed = async (format) => {
    try {
      await apiService.downloadFailedReport(resource, summary.importLogId, format);
    } catch (err) {
      toast({ title: 'Could not download report', description: err.message, status: 'error', duration: 4000, isClosable: true });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="2xl" closeOnOverlayClick={step !== 'importing'}>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="18px">
        <ModalHeader fontWeight="800">Import {resourceLabel}</ModalHeader>
        {step !== 'importing' && <ModalCloseButton />}
        <ModalBody pb={6}>

          {step === 'upload' && (
            <Box
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={handleDrop}
              border="2px dashed"
              borderColor={dragActive ? 'sky.400' : 'gray.200'}
              bg={dragActive ? 'sky.50' : 'gray.50'}
              borderRadius="14px"
              py={12}
              px={6}
              textAlign="center"
              transition="all 0.15s"
            >
              <Icon as={FaCloudUploadAlt} boxSize={10} color="sky.400" mb={3} />
              <Text fontWeight="700" color="gray.700" mb={1}>
                {loading ? 'Reading file...' : 'Drag & drop your file here'}
              </Text>
              <Text fontSize="sm" color="gray.400" mb={4}>
                Supports .csv, .xlsx, .xls, .json
              </Text>
              <Button
                colorScheme="sky"
                bgGradient="linear(to-r, sky.500, blue.500)"
                color="white"
                borderRadius="10px"
                isLoading={loading}
                onClick={() => fileInputRef.current?.click()}
                _hover={{ bgGradient: 'linear(to-r, sky.600, blue.600)' }}
              >
                Browse File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelected(e.target.files?.[0])}
              />
            </Box>
          )}

          {step === 'preview' && previewData && (
            <VStack align="stretch" spacing={4}>
              <HStack spacing={2}>
                <Icon as={FaFileCsv} color="sky.500" />
                <Text fontWeight="600" color="gray.700" fontSize="sm">{file?.name}</Text>
              </HStack>

              <SimpleGrid columns={4} spacing={3}>
                <Box bg="gray.50" p={3} borderRadius="10px" textAlign="center">
                  <Text fontSize="xs" color="gray.400" fontWeight="700">TOTAL</Text>
                  <Text fontSize="xl" fontWeight="800" color="gray.800">{previewData.totalRecords}</Text>
                </Box>
                <Box bg="green.50" p={3} borderRadius="10px" textAlign="center">
                  <Text fontSize="xs" color="green.600" fontWeight="700">VALID</Text>
                  <Text fontSize="xl" fontWeight="800" color="green.700">{previewData.validRecords}</Text>
                </Box>
                <Box bg="yellow.50" p={3} borderRadius="10px" textAlign="center">
                  <Text fontSize="xs" color="yellow.700" fontWeight="700">DUPLICATE</Text>
                  <Text fontSize="xl" fontWeight="800" color="yellow.700">{previewData.duplicateRecords}</Text>
                </Box>
                <Box bg="red.50" p={3} borderRadius="10px" textAlign="center">
                  <Text fontSize="xs" color="red.600" fontWeight="700">INVALID</Text>
                  <Text fontSize="xl" fontWeight="800" color="red.700">{previewData.invalidRecords}</Text>
                </Box>
              </SimpleGrid>

              <Box maxH="280px" overflowY="auto" borderRadius="10px" border="1px solid" borderColor="gray.100">
                <Table size="sm" variant="simple">
                  <Thead bg="gray.50" position="sticky" top={0}>
                    <Tr>
                      <Th fontSize="10px">Row</Th>
                      <Th fontSize="10px">Data</Th>
                      <Th fontSize="10px">Status</Th>
                      <Th fontSize="10px">Reason</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {previewData.sample.map((r) => (
                      <Tr key={r.row}>
                        <Td fontSize="12px" color="gray.500">{r.row}</Td>
                        <Td fontSize="12px" color="gray.700" maxW="220px" isTruncated>
                          {Object.values(r.data).filter(Boolean).join(', ')}
                        </Td>
                        <Td>
                          <Badge colorScheme={STATUS_COLORS[r.status]} borderRadius="8px" fontSize="10px">
                            {r.status.toUpperCase()}
                          </Badge>
                        </Td>
                        <Td fontSize="11px" color="gray.500">{r.reason || '—'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              {previewData.totalRecords > previewData.sample.length && (
                <Text fontSize="xs" color="gray.400">Showing first {previewData.sample.length} of {previewData.totalRecords} records.</Text>
              )}
            </VStack>
          )}

          {step === 'importing' && (
            <VStack spacing={5} py={8}>
              <Text fontWeight="700" color="gray.700">Importing records...</Text>
              <Box w="full">
                <Progress value={progress.percent} size="lg" colorScheme="sky" borderRadius="8px" hasStripe isAnimated />
                <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                  {progress.percent}% — {progress.processed} / {progress.total}
                </Text>
              </Box>
            </VStack>
          )}

          {step === 'summary' && summary && (
            <VStack align="stretch" spacing={4}>
              <SimpleGrid columns={2} spacing={3}>
                <Box bg="gray.50" p={4} borderRadius="10px" textAlign="center">
                  <Text fontSize="xs" color="gray.400" fontWeight="700">TOTAL</Text>
                  <Text fontSize="2xl" fontWeight="800" color="gray.800">{summary.totalRecords}</Text>
                </Box>
                <Box bg="green.50" p={4} borderRadius="10px" textAlign="center">
                  <Text fontSize="xs" color="green.600" fontWeight="700">IMPORTED</Text>
                  <Text fontSize="2xl" fontWeight="800" color="green.700">{summary.imported}</Text>
                </Box>
                <Box bg="yellow.50" p={4} borderRadius="10px" textAlign="center">
                  <Text fontSize="xs" color="yellow.700" fontWeight="700">SKIPPED</Text>
                  <Text fontSize="2xl" fontWeight="800" color="yellow.700">{summary.skipped}</Text>
                </Box>
                <Box bg="red.50" p={4} borderRadius="10px" textAlign="center">
                  <Text fontSize="xs" color="red.600" fontWeight="700">FAILED</Text>
                  <Text fontSize="2xl" fontWeight="800" color="red.700">{summary.failed}</Text>
                </Box>
              </SimpleGrid>
              <HStack justify="center" spacing={2}>
                <Icon as={FaCheckCircle} color="green.500" />
                <Text fontSize="sm" color="gray.500">Completed in {(summary.durationMs / 1000).toFixed(1)}s</Text>
              </HStack>
            </VStack>
          )}

        </ModalBody>

        <ModalFooter>
          {step === 'preview' && (
            <HStack spacing={3}>
              <Button variant="ghost" onClick={reset} borderRadius="10px">Cancel</Button>
              <Button
                colorScheme="sky"
                bgGradient="linear(to-r, sky.500, blue.500)"
                color="white"
                borderRadius="10px"
                isDisabled={previewData.validRecords === 0}
                onClick={handleStartImport}
                _hover={{ bgGradient: 'linear(to-r, sky.600, blue.600)' }}
              >
                Start Import
              </Button>
            </HStack>
          )}

          {step === 'summary' && (
            <HStack spacing={3}>
              {summary.failed > 0 && (
                <Menu>
                  <MenuButton as={Button} rightIcon={<FaChevronDown />} leftIcon={<FaDownload />} variant="outline" colorScheme="red" borderRadius="10px">
                    Download Failed Records
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<FaFileCsv />} onClick={() => handleDownloadFailed('csv')}>as CSV</MenuItem>
                    <MenuItem icon={<FaFileCsv />} onClick={() => handleDownloadFailed('xlsx')}>as Excel</MenuItem>
                  </MenuList>
                </Menu>
              )}
              <Button colorScheme="sky" bgGradient="linear(to-r, sky.500, blue.500)" color="white" borderRadius="10px" onClick={handleClose} _hover={{ bgGradient: 'linear(to-r, sky.600, blue.600)' }}>
                Close
              </Button>
            </HStack>
          )}

          {step === 'upload' && (
            <Button variant="ghost" onClick={handleClose} borderRadius="10px">Cancel</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
