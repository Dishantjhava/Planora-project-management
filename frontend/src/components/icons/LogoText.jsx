import React from 'react';

const LogoText = ({ className, style, ...props }) => {
  const customA = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        height: '0.85em',
        width: '0.85em',
        display: 'inline-block',
        verticalAlign: 'middle',
        transform: 'translateY(-0.06em)',
        flexShrink: 0
      }}
    >
      <path
        d="M3.5 20.5L12 3.5L20.5 20.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20.5L12 15L14.5 20.5Z"
        fill="#00b4a6"
      />
    </svg>
  );

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.08em',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        ...style
      }}
      {...props}
    >
      <span>P</span>
      <span>L</span>
      {customA}
      <span>N</span>
      <span>O</span>
      <span>R</span>
      {customA}
    </span>
  );
};

export default LogoText;
