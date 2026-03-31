import { Box } from '@chakra-ui/react';

const Logo = ({ size = 'lg' }) => {
  const fontSize = { sm: 'xl', md: '2xl', lg: '2xl', xl: '3xl' }[size] || '2xl';

  return (
    <Box
      fontSize={fontSize}
      fontWeight="800"
      letterSpacing="-0.02em"
      bgGradient="to-r"
      gradientFrom="#1e3a44"
      gradientVia="#0891b2"
      gradientTo="#38bdf8"
      bgClip="text"
      lineHeight="1"
      userSelect="none"
    >
      LIGHTWAVE
    </Box>
  );
};

export default Logo;
