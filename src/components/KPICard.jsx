import { Box, VStack, Text } from '@chakra-ui/react';

const KPICard = ({ value, label, icon }) => (
  <Box p="6" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
    <VStack align="start" gap="3">
      <Box color="cyan.500">{icon}</Box>
      <Text fontSize="2xl" fontWeight="800" color="gray.900" lineHeight="1">
        {value}
      </Text>
      <Text fontSize="sm" color="gray.500" fontWeight="500">
        {label}
      </Text>
    </VStack>
  </Box>
);

export default KPICard;
