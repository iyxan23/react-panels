import React from 'react';
import { PanelProps } from './Panel';
import PanelGroup, { Orientation, PanelGroupProps } from './PanelGroup';

export type PanelChild = React.ReactElement<PanelProps | PanelGroupProps>;
export type PanelChildren = PanelChild[] | PanelChild;

export interface PanelContainerProps {
  // Panel and PanelGroup are the only elements allowed here
  children?: PanelChildren;

  // in px, defaults to 10
  separatorWidth?: number;

  orientation: Orientation
}

export interface PanelContainerContextObject {
  separatorWidth: number;
}

export const PanelContainerContext = React.createContext<PanelContainerContextObject>(null!);

const PanelContainer = ({ children, separatorWidth, orientation }: PanelContainerProps) => {
  return <PanelContainerContext.Provider value={{ separatorWidth: separatorWidth ?? 10 }}>
    <PanelGroup orientation={orientation}>
      {children}
    </PanelGroup>
  </PanelContainerContext.Provider>;
};

export default PanelContainer;