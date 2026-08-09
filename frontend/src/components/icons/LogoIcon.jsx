import React from 'react';
import logoImg from '../../assets/logo.jpg';

const LogoIcon = ({ className, style, ...props }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...style
      }}
      {...props}
    >
      <img
        src={logoImg}
        alt="Planora Logo"
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(2.1)', // Increased zoom to 2.1x to perfectly isolate the stylized 'P' icon
          transformOrigin: '50% 30%', // Focused vertically to center the 'P' and completely push the bottom text ('PLANORA') outside the viewport
          display: 'block',
          borderRadius: 'inherit'
        }}
      />
    </div>
  );
};

export default LogoIcon;
