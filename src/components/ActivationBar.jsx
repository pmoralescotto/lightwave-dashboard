import { Box, HStack, Text, VStack } from '@chakra-ui/react';

const ActivationBar = ({ rate, activeCount, totalUnits }) => {
  const pct = parseFloat(rate) || 0;

  const color =
    pct >= 70 ? '#16a34a' :
    pct >= 40 ? '#f59e0b' :
                '#ef4444';

  return (
    <Box p="6" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
      <HStack justify="space-between" mb="3" flexWrap="wrap" gap="2">
        <VStack align="start" gap="0">
          <Text fontWeight="700" fontSize="md" color="gray.900">
            Portfolio Activation Rate
          </Text>
          <Text fontSize="sm" color="gray.500">
            {activeCount.toLocaleString()} active out of {totalUnits.toLocaleString()} total units
          </Text>
        </VStack>
        <Text fontSize="3xl" fontWeight="900" style={{ color }}>
          {pct.toFixed(1)}%
        </Text>
      </HStack>

      {/* Track */}
      <Box bg="gray.100" borderRadius="full" h="14px" overflow="hidden">
        <Box
          h="100%"
          borderRadius="full"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            transition: 'width 1s ease',
          }}
        />
      </Box>

      <HStack justify="space-between" mt="2">
        <Text fontSize="xs" color="gray.400">0%</Text>
        <HStack gap="4">
          <HStack gap="1">
            <Box w="8px" h="8px" borderRadius="full" bg="green.500" />
            <Text fontSize="xs" color="gray.500">≥70% Good</Text>
          </HStack>
          <HStack gap="1">
            <Box w="8px" h="8px" borderRadius="full" bg="yellow.500" />
            <Text fontSize="xs" color="gray.500">40–70% Fair</Text>
          </HStack>
          <HStack gap="1">
            <Box w="8px" h="8px" borderRadius="full" bg="red.500" />
            <Text fontSize="xs" color="gray.500">&lt;40% Low</Text>
          </HStack>
        </HStack>
        <Text fontSize="xs" color="gray.400">100%</Text>
      </HStack>
    </Box>
  );
};

export default ActivationBar;
