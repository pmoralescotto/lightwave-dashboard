import { useEffect } from 'react';
import { Box, Container, VStack, Heading, Text, Button, Spinner, Alert } from '@chakra-ui/react';
import { useOAuth } from '../hooks/useOAuth';
import Logo from './Logo';

const LoginPage = () => {
  const { isAuthenticated, loading, error, login, handleCallback } = useOAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      handleCallback(code).then((success) => {
        window.history.replaceState({}, document.title, '/');
        if (success) window.location.href = '/';
      });
    }
  }, [handleCallback]);

  useEffect(() => {
    if (isAuthenticated && !window.location.search.includes('code')) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <Box bg="gray.50" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap="4">
          <Spinner size="xl" color="cyan.500" />
          <Text color="gray.500">Authenticating...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="500px">
        <VStack
          gap="8"
          p="8"
          bg="white"
          borderRadius="2xl"
          border="1px solid"
          borderColor="gray.200"
          boxShadow="lg"
        >
          <Logo size="xl" />

          <VStack gap="3" textAlign="center">
            <Heading size="lg" fontWeight="700" color="gray.900">
              ISP Dashboard
            </Heading>
            <Text color="gray.600" fontSize="md">
              Portfolio-wide view of internet activation performance across managed properties
            </Text>
          </VStack>

          {error && (
            <Alert.Root colorPalette="red" width="full">
              <Alert.Indicator />
              <Alert.Title>Authentication Failed</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}

          <VStack gap="4" width="full">
            <Button colorPalette="blue" size="lg" width="full" onClick={login} disabled={loading}>
              Sign In with Monday.com
            </Button>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Secure authentication to access your workspace data.
            </Text>
          </VStack>

          <Box pt="4" borderTop="1px solid" borderColor="gray.200" width="full">
            <Text fontSize="xs" color="gray.400" textAlign="center">
              Secure authentication · Your data remains protected
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default LoginPage;
