import React from 'react';

export interface PanelProps {
  children?: React.ReactNode;
}

const Panel = ({ children }: PanelProps) => {
  return <div draggable>
    {children}
  </div>;
}

export default Panel;