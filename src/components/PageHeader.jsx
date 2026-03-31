import { VStack, Text } from '@chakra-ui/react';

const PageHeader = ({ title, subtitle }) => (
  <VStack align="start" gap="1">
    <Text fontSize="2xl" fontWeight="700" color="gray.900" lineHeight="1.2">
      {title}
    </Text>
    <Text fontSize="sm" color="gray.500">
      {subtitle}
    </Text>
  </VStack>
);

export default PageHeader;
