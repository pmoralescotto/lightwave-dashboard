import { Box, HStack, VStack, Text, SimpleGrid } from '@chakra-ui/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TopPerformers = ({ data }) => {
  const withData = data.filter((d) => d.totalUnits > 0);
  if (withData.length < 2) return null;

  const sorted = [...withData].sort(
    (a, b) => parseFloat(b.activationRate) - parseFloat(a.activationRate)
  );
  const top3 = sorted.slice(0, 3);
  const bottom3 = [...sorted.slice(-3)].reverse();

  const Row = ({ item, rank, type }) => {
    const isTop = type === 'top';
    return (
      <HStack
        justify="space-between"
        p="3"
        borderRadius="lg"
        bg={isTop ? 'green.50' : 'red.50'}
        border="1px solid"
        borderColor={isTop ? 'green.100' : 'red.100'}
      >
        <HStack gap="2">
          <Box
            w="22px" h="22px" borderRadius="full"
            bg={isTop ? 'green.500' : 'red.400'}
            display="flex" alignItems="center" justifyContent="center"
          >
            <Text fontSize="10px" fontWeight="800" color="white">{rank}</Text>
          </Box>
          <Text fontSize="sm" fontWeight="600" color="gray.800">{item.property}</Text>
        </HStack>
        <HStack gap="2">
          <Text fontSize="xs" color="gray.500">{item.activeCount}/{item.totalUnits}</Text>
          <Text fontSize="sm" fontWeight="800" color={isTop ? 'green.600' : 'red.600'}>
            {item.activationRate}
          </Text>
        </HStack>
      </HStack>
    );
  };

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
      <Box p="5" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
        <HStack mb="3" gap="2">
          <TrendingUp size={16} color="#16a34a" />
          <Text fontWeight="700" fontSize="sm" color="green.700">Top Performers</Text>
        </HStack>
        <VStack gap="2" align="stretch">
          {top3.map((p, i) => <Row key={p.property} item={p} rank={i + 1} type="top" />)}
        </VStack>
      </Box>

      <Box p="5" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" boxShadow="sm">
        <HStack mb="3" gap="2">
          <TrendingDown size={16} color="#dc2626" />
          <Text fontWeight="700" fontSize="sm" color="red.700">Needs Attention</Text>
        </HStack>
        <VStack gap="2" align="stretch">
          {bottom3.map((p, i) => <Row key={p.property} item={p} rank={i + 1} type="bottom" />)}
        </VStack>
      </Box>
    </SimpleGrid>
  );
};

export default TopPerformers;
