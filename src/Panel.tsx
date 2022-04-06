import React from 'react';

export interface PanelProps {
  children?: React.ReactNode;
}

const Panel = ({ children }: PanelProps) => {
  return <div style={{ width: '100%', height: '100%' }}>
    {children}
  </div>;
}

export default Panel;