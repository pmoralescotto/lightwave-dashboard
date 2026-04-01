import { Box } from '@chakra-ui/react';

const sizeMap = { sm: '28px', md: '36px', lg: '44px', xl: '56px' };

const resolveHeight = (size) => {
  if (typeof size === 'string') return sizeMap[size] || sizeMap.lg;
  // Responsive object: { base: 'sm', md: 'md' } → { base: '28px', md: '36px' }
  if (typeof size === 'object' && size !== null) {
    return Object.fromEntries(
      Object.entries(size).map(([bp, s]) => [bp, sizeMap[s] || sizeMap.lg])
    );
  }
  return sizeMap.lg;
};

const Logo = ({ size = 'lg' }) => {
  const height = resolveHeight(size);
  return (
    <Box as="img"
      src="/Lightwave Color Version.png"
      alt="LIGHTWAVE"
      h={height}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;
