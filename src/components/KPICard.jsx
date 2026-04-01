import { Box, VStack, Text } from '@chakra-ui/react';

const colorMap = {
  cyan:  { border: '#06b6d4', icon: '#06b6d4', value: '#0e7490' },
  green: { border: '#22c55e', icon: '#16a34a', value: '#15803d' },
  red:   { border: '#f87171', icon: '#ef4444', value: '#dc2626' },
  blue:  { border: '#60a5fa', icon: '#3b82f6', value: '#1d4ed8' },
  gray:  { border: '#94a3b8', icon: '#64748b', value: '#475569' },
};

const KPICard = ({ value, label, icon, color = 'cyan' }) => {
  const colors = colorMap[color] || colorMap.cyan;

  return (
    <Box
      p="6"
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="sm"
      borderTop="4px solid"
      borderTopColor={colors.border}
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: 'md' }}
    >
      <VStack align="start" gap="3">
        <Box style={{ color: colors.icon }}>{icon}</Box>
        <Text fontSize="2xl" fontWeight="800" lineHeight="1" style={{ color: colors.value }}>
          {value}
        </Text>
        <Text fontSize="sm" color="gray.500" fontWeight="500">
          {label}
        </Text>
      </VStack>
    </Box>
  );
};

export default KPICard;
