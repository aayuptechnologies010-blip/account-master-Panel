import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  Heading,
  useToast,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { FaEnvelope, FaLock, FaWarehouse, FaEye, FaEyeSlash } from 'react-icons/fa';
import { apiService } from '../apiService';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: 'Invalid Email Address', description: 'Enter a valid email address.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters.', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.login(email, password);

      if (res.success) {
        toast({ title: 'Login Successful', status: 'success', duration: 2000, isClosable: true });
        onLoginSuccess();
      } else {
        toast({ title: 'Login Failed', description: res.message || 'An error occurred.', status: 'error', duration: 3000, isClosable: true });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || err.message || 'Could not reach server.', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgGradient="linear(to-tr, #0f172a, #1e293b, #0369a1)"
      px={4}
    >
      <Box
        maxW="420px"
        w="full"
        bg="white"
        p={8}
        borderRadius="24px"
        boxShadow="0 10px 40px rgba(0,0,0,0.3)"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-50px"
          right="-50px"
          w="150px"
          h="150px"
          borderRadius="full"
          bg="sky.300"
          filter="blur(50px)"
          opacity={0.3}
        />

        <VStack spacing={6} align="stretch">
          <HStack spacing={3} justify="center" mb={2}>
            <Box
              bgGradient="linear(to-br, #0ea5e9, #6366f1)"
              p={3}
              borderRadius="16px"
              boxShadow="0 4px 14px rgba(14,165,233,0.4)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FaWarehouse} color="white" w={6} h={6} />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" color="gray.800" fontWeight="800" letterSpacing="-0.5px">
                Account Master
              </Heading>
              <Text fontSize="xs" color="gray.400" fontWeight="600">
                Billing & Inventory Admin
              </Text>
            </VStack>
          </HStack>

          <VStack spacing={1} align="center">
            <Heading size="lg" fontWeight="800" color="gray.800">
              Sign In
            </Heading>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Enter your email and password to access the dashboard.
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontWeight="600" color="gray.600" fontSize="sm">
                  Email Address
                </FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaEnvelope} color="sky.500" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    borderRadius="12px"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'sky.500', boxShadow: '0 0 0 1px #0ea5e9' }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="600" color="gray.600" fontSize="sm">Password</FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaLock} color="sky.500" />
                  </InputLeftElement>
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    borderRadius="12px"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'sky.500', boxShadow: '0 0 0 1px #0ea5e9' }}
                  />
                  <InputRightElement cursor="pointer" onClick={() => setShowPwd(!showPwd)}>
                    <Icon as={showPwd ? FaEyeSlash : FaEye} color="gray.400" />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="sky"
                bgGradient="linear(to-r, sky.500, blue.500)"
                color="white"
                w="full"
                size="lg"
                borderRadius="12px"
                isLoading={loading}
                loadingText="Signing in..."
                _hover={{ bgGradient: 'linear(to-r, sky.600, blue.600)', transform: 'translateY(-1px)' }}
                _active={{ transform: 'translateY(0)' }}
                boxShadow="0 4px 14px rgba(14,165,233,0.3)"
              >
                Sign In
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Box>
  );
}
