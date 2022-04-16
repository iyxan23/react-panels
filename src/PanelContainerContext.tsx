import { createContext } from 'react';

export type Orientation = 'vertical' | 'horizontal';

export interface PanelContainerContextObject {
  separatorWidth: number;

  // called by a PanelGroup when the cursor drags the separator
  // 
  // here we're going to show an indicator of the user dragging (we
  // don't want to re-render everytime the user resizes the panel group)
  //
  // or is it actually okay to re-render? I've heard react only updates the
  // necessary views
  showResizeIndicator: (
    // absolute location of the separator relative to the page (use pageY and pageX)
    y: number, x: number,

    // the height and width of the separator
    height: number, width: number,

    orientation: Orientation,

    // the bounds of this resize operation, depends on orientation
    //
    //         start -> end
    // vertical:   y -> y+ (down)
    // horizontal: x -> x+ (right)
    limitStart: number, limitEnd: number,

    // gives how much the mouse has moved relative to limitStart (in the
    // direction of the given orientation)
    //
    // x+ or y+
    callback: (mouseDelta: number) => void
  ) => void;
}

export const PanelContainerContext = createContext<PanelContainerContextObject>(null!);