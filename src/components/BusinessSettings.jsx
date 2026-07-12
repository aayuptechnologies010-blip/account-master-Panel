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
import { FaBuilding, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaSave, FaEdit } from 'react-icons/fa';
import { apiService } from '../apiService';

export default function BusinessSettings() {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
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
        address
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
