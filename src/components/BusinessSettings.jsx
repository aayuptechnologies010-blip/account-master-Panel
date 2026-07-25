import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Grid,
  GridItem,
  Textarea,
  HStack,
  Icon,
  Divider
} from '@chakra-ui/react';
import { FaBuilding, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaSave, FaEdit, FaGlobe, FaIdCard, FaImage, FaUniversity, FaQrcode } from 'react-icons/fa';
import { apiService } from '../apiService';

export default function BusinessSettings() {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToast();

  const fetchProfile = async () => {
    try {
      const data = await apiService.getBusinessProfile();
      if (data) {
        setBusinessName(data.businessName || data.business_name || '');
        setOwnerName(data.ownerName || data.owner_name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setWebsite(data.website || '');
        setGstNumber(data.gstNumber || '');
        setLogoUrl(data.logoUrl || '');
        setBankName(data.bankName || '');
        setBankAccountName(data.bankAccountName || '');
        setBankAccountNo(data.bankAccountNo || '');
        setIfscCode(data.ifscCode || '');
        setUpiId(data.upiId || '');
        setIsEditing(!(data.businessName || data.business_name));
      }
    } catch (err) {
      toast({
        title: "Error fetching profile",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load profile on mount
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchProfile is stable for this component's lifetime
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!businessName) {
      toast({
        title: "Validation Error",
        description: "Business name is required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.updateBusinessProfile({
        businessName,
        ownerName,
        phone,
        email,
        address,
        website,
        gstNumber,
        logoUrl,
        bankName,
        bankAccountName,
        bankAccountNo,
        ifscCode,
        upiId,
      });
      if (res.success || res) {
        toast({
          title: "Business Settings Saved",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setIsEditing(false);
      }
    } catch (err) {
      toast({
        title: "Error saving profile",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="white" p={8} borderRadius="16px" border="1px solid #e2e8f0" boxShadow="0 1px 8px rgba(0,0,0,0.05)" maxW="800px" mx="auto">
      <HStack justify="space-between" align="start" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="md" fontWeight="800" color="gray.800">
            Business Profile Settings
          </Heading>
          <Text fontSize="xs" color="gray.400">
            Configure business name, address, tax information and contact preferences.
          </Text>
        </VStack>
        {!isEditing && (
          <Button
            leftIcon={<FaEdit />}
            size="sm"
            variant="outline"
            colorScheme="sky"
            borderRadius="10px"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </HStack>
      <Divider mb={6} />

      <form onSubmit={handleSave}>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <FormControl isRequired>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaBuilding} color="sky.500" />
                  <Text>Business Name</Text>
                </HStack>
              </FormLabel>
              <Input
                placeholder="e.g. Ramesh Enterprises"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                borderRadius="10px"
                size="lg"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaUser} color="sky.500" />
                  <Text>Owner / Partner Name</Text>
                </HStack>
              </FormLabel>
              <Input
                placeholder="Owner full name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaPhone} color="sky.500" />
                  <Text>Contact Phone</Text>
                </HStack>
              </FormLabel>
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaEnvelope} color="sky.500" />
                  <Text>Email Address</Text>
                </HStack>
              </FormLabel>
              <Input
                type="email"
                placeholder="billing@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaMapMarkerAlt} color="sky.500" />
                  <Text>Full Business Address</Text>
                </HStack>
              </FormLabel>
              <Textarea
                placeholder="Write full address here..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                borderRadius="10px"
                rows={3}
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaGlobe} color="sky.500" />
                  <Text>Website</Text>
                </HStack>
              </FormLabel>
              <Input
                placeholder="www.yourbusiness.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaIdCard} color="sky.500" />
                  <Text>GST Number</Text>
                </HStack>
              </FormLabel>
              <Input
                placeholder="e.g. 07AAACV1234F1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaImage} color="sky.500" />
                  <Text>Logo URL</Text>
                </HStack>
              </FormLabel>
              <Input
                placeholder="Link to a hosted logo image (used on printed invoices)"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <HStack spacing={2} mt={2}>
              <Icon as={FaUniversity} color="sky.500" />
              <Text fontWeight="700" fontSize="sm" color="gray.700">Bank & Payment Details</Text>
            </HStack>
            <Text fontSize="xs" color="gray.400">Shown on printed invoices under "Payment Details".</Text>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Bank Name</FormLabel>
              <Input
                placeholder="e.g. HDFC Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Account Holder Name</FormLabel>
              <Input
                placeholder="Name on the bank account"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Account Number</FormLabel>
              <Input
                placeholder="Bank account number"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">IFSC Code</FormLabel>
              <Input
                placeholder="e.g. HDFC0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <FormControl>
              <FormLabel fontWeight="600" fontSize="sm" color="gray.600">
                <HStack spacing={2}>
                  <Icon as={FaQrcode} color="sky.500" />
                  <Text>UPI ID</Text>
                </HStack>
              </FormLabel>
              <Input
                placeholder="e.g. yourbusiness@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                borderRadius="10px"
                isReadOnly={!isEditing}
                bg={isEditing ? 'white' : 'gray.50'}
              />
              <Text fontSize="xs" color="gray.400" mt={1}>A scannable UPI QR code is generated automatically on printed invoices.</Text>
            </FormControl>
          </GridItem>
        </Grid>

        {isEditing && (
          <HStack mt={8} spacing={3}>
            <Button
              type="submit"
              flex={1}
              colorScheme="sky"
              bgGradient="linear(to-r, sky.500, blue.500)"
              color="white"
              size="lg"
              borderRadius="12px"
              leftIcon={<FaSave />}
              isLoading={loading}
              _hover={{ bgGradient: "linear(to-r, sky.600, blue.600)" }}
            >
              Save Settings
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              borderRadius="12px"
              onClick={fetchProfile}
            >
              Cancel
            </Button>
          </HStack>
        )}
      </form>
    </Box>
  );
}
