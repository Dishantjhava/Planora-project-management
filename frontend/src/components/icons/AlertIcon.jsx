import React from 'react';

const AlertIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" />
    </svg>
);

export default AlertIcon;
