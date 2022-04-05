import React, { useRef, createContext } from 'react';
import { PanelProps } from './Panel';
import PanelGroup, { Orientation, PanelGroupProps } from './PanelGroup';

export type PanelChild = React.ReactElement<PanelProps | PanelGroupProps>;
export type PanelChildren = PanelChild[] | PanelChild;

export interface PanelContainerProps {
  // Panel and PanelGroup are the only elements allowed here
  children?: PanelChildren;

  /**
   * The separator width used to separate panels defined in px, defaults to 10
   */
  separatorWidth?: number;

  /**
   * The orientation of this panel container
   */
  orientation: Orientation;
}

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

const PanelContainer = ({ children, separatorWidth, orientation }: PanelContainerProps) => {
  const indicator = useRef<HTMLDivElement>(null);

  return <PanelContainerContext.Provider value={{
      separatorWidth: separatorWidth ?? 10,
      showResizeIndicator:
      (
        y, x, height, width,
        orientation,
        limitStart, limitEnd,
        callback
      ) => {
        // im really anxious about the possiblity of the user just "mouse upped" right away
        // and this function got executed after mouseup lol

        const vertical = orientation == 'vertical';

        // mouse position relative to the page
        // depends on orientation, y on vertical, x on horizontal
        let mousePosition: number;

        document.onmousemove = (e) => {
          const newMousePosition = vertical ? e.pageY : e.pageX;

          // don't update if the mousePosition has moved past the defined limits
          if (newMousePosition < limitStart || newMousePosition > limitEnd) { return; }

          mousePosition = newMousePosition;

          if (indicator.current != null) {
            indicator.current.style.opacity = '50%';

            if (vertical) {
              indicator.current.style.transform =
                `translateX(${x}px) translateY(${mousePosition}px) scaleX(${width}px) scaleY(${height}px)`;
            } else {
              indicator.current.style.transform =
                `translateX(${mousePosition}px) translateY(${y}px) scaleX(${width}px) scaleY(${height}px)`;
            }
          }
        }

        document.onmouseup = (e) => {
          mousePosition = vertical ? e.pageY : e.pageX;

          if (indicator.current != null) { indicator.current.style.opacity = '0%'; }

          document.onmousemove = null;
          document.onmouseup = null;

          callback((vertical ? y : x) - mousePosition);
        }
      }
    }}>

    {/* indicator */}
    <div
      ref={indicator}
      style={{
        display: 'fixed',
        zIndex: '10',
        opacity: '0%',
        backgroundColor: 'black',
        transition: 'transform .1s ease-in-out'
      }}>&nbsp;</div>

    <PanelGroup orientation={orientation}>
      {children}
    </PanelGroup>
  </PanelContainerContext.Provider>;
};

export default PanelContainer;