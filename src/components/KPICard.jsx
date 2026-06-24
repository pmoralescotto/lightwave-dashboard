import { useState } from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import { Copy, Check } from 'lucide-react';

const colorMap = {
  cyan:  { border: '#06b6d4', icon: '#06b6d4', value: '#0e7490' },
  green: { border: '#22c55e', icon: '#16a34a', value: '#15803d' },
  red:   { border: '#f87171', icon: '#ef4444', value: '#dc2626' },
  blue:  { border: '#60a5fa', icon: '#3b82f6', value: '#1d4ed8' },
  gray:   { border: '#94a3b8', icon: '#64748b', value: '#475569' },
  purple: { border: '#a855f7', icon: '#9333ea', value: '#7c3aed' },
  orange: { border: '#fb923c', icon: '#f97316', value: '#ea580c' },
};

const KPICard = ({ value, label, icon, color = 'cyan' }) => {
  const colors = colorMap[color] || colorMap.cyan;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${label}: ${value}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
      position="relative"
      cursor="pointer"
      onClick={handleCopy}
      title={`Click to copy: ${label}: ${value}`}
    >
      {/* Copy indicator */}
      <Box position="absolute" top="3" right="3" color="gray.300" _hover={{ color: 'gray.500' }}>
        {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
      </Box>

      <VStack align="start" gap="3">
        <Box style={{ color: colors.icon }}>{icon}</Box>
        <Text fontSize="2xl" fontWeight="800" lineHeight="1" style={{ color: colors.value }}>
          {value}
        </Text>
        <Text fontSize="sm" color="gray.500" fontWeight="500">
          {label}
        </Text>
      </VStack>

      {copied && (
        <Box
          position="absolute"
          bottom="2"
          right="3"
          fontSize="10px"
          color="green.600"
          fontWeight="600"
        >
          Copied!
        </Box>
      )}
    </Box>
  );
};

export default KPICard;
