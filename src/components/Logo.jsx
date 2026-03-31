const Logo = ({ size = 'lg' }) => {
  const heights = { sm: '28px', md: '36px', lg: '44px', xl: '56px' };

  return (
    <img
      src="/Lightwave Color Version.png"
      alt="LIGHTWAVE"
      style={{ height: heights[size] || heights.lg, objectFit: 'contain' }}
    />
  );
};

export default Logo;
