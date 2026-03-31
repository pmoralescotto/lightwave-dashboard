import { Box, VStack, Text } from '@chakra-ui/react';

const ChartCard = ({ title, subtitle, children }) => (
  <Box p="6" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
    <VStack align="start" gap="4">
      <VStack align="start" gap="0">
        <Text fontWeight="600" fontSize="md" color="gray.900">{title}</Text>
        {subtitle && <Text fontSize="sm" color="gray.500">{subtitle}</Text>}
      </VStack>
      {children}
    </VStack>
  </Box>
);

export default ChartCard;
