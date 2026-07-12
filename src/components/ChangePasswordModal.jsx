import { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Input, InputGroup, InputRightElement, Icon, Button, VStack, useToast,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { apiService } from '../apiService';

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const reset = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPwd(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Weak password', description: 'New password must be at least 6 characters.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', status: 'warning', duration: 3000, isClosable: true });
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.changePassword(oldPassword, newPassword);
      if (res.success) {
        toast({ title: 'Password changed successfully', description: 'Please log in again with your new password.', status: 'success', duration: 3000, isClosable: true });
        reset();
        onClose();
        if (onSuccess) await onSuccess();
      } else {
        toast({ title: 'Could not change password', description: res.message, status: 'error', duration: 4000, isClosable: true });
      }
    } catch (err) {
      toast({ title: 'Could not change password', description: err.response?.data?.message || err.message, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="18px">
        <form onSubmit={handleSubmit}>
          <ModalHeader fontWeight="800">Change Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Current Password</FormLabel>
                <Input
                  type={showPwd ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  borderRadius="10px"
                  placeholder="Enter current password"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="600" fontSize="sm" color="gray.600">New Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    borderRadius="10px"
                    placeholder="Minimum 6 characters"
                  />
                  <InputRightElement cursor="pointer" onClick={() => setShowPwd(!showPwd)}>
                    <Icon as={showPwd ? FaEyeSlash : FaEye} color="gray.400" />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="600" fontSize="sm" color="gray.600">Confirm New Password</FormLabel>
                <Input
                  type={showPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  borderRadius="10px"
                  placeholder="Re-enter new password"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} borderRadius="10px">Cancel</Button>
            <Button
              type="submit"
              colorScheme="sky"
              bgGradient="linear(to-r, sky.500, blue.500)"
              color="white"
              borderRadius="10px"
              leftIcon={<FaLock />}
              isLoading={loading}
              _hover={{ bgGradient: 'linear(to-r, sky.600, blue.600)' }}
            >
              Update Password
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
