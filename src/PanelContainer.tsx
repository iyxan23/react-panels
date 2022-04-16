import React, { useRef } from 'react';
import { PanelProps } from './Panel';
import PanelGroup, { PanelGroupProps } from './PanelGroup';
import { PanelContainerContext, Orientation } from './PanelContainerContext';

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
   * The orientation of this panel container, defaults to horizontal
   */
  orientation?: Orientation;
}

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
        console.log(`called with limits of ${limitStart} ${limitEnd}`);
        // im really anxious about the possiblity of the user just "mouse upped" right away
        // and this function got executed after mouseup lol

        const vertical = orientation == 'vertical';

        // mouse position relative to the page
        // depends on orientation, y on vertical, x on horizontal
        let mousePosition: number;

        document.onmousemove = (e) => {
          const newMousePosition = vertical ? e.clientY : e.clientX;

          // don't update if the mousePosition has moved past the defined limits
          if (newMousePosition < limitStart || newMousePosition > limitEnd) { return; }

          mousePosition = newMousePosition;

          if (indicator.current != null) {
            indicator.current.style.display = '';

            if (vertical) {
              indicator.current.style.transform =
                `translateX(${(x + width/2)-5}px) translateY(${mousePosition - height/2}px) scaleX(${width/10}) scaleY(${height/10})`;
              indicator.current.style.cursor = 'row-resize';
            } else {
              indicator.current.style.transform =
                `translateX(${mousePosition - width/2}px) translateY(${(y + height/2)-5}px) scaleX(${width/10}) scaleY(${height/10})`;
              indicator.current.style.cursor = 'col-resize';
            }

            // console.log(`transform: ${indicator.current.style.transform}`);
          }
        }

        document.onmouseup = (e) => {
          mousePosition = vertical ? e.clientY : e.clientX;

          if (indicator.current != null) { 
            console.log('gone');
            indicator.current.style.display = 'none';
          }

          document.onmousemove = null;
          document.onmouseup = null;

          callback(mousePosition);
        }
      }
    }}>

    {/* indicator */}
    <div
      ref={indicator}
      style={{
        width: '10px',
        height: '10px',
        position: 'fixed',
        zIndex: '10',
        opacity: '0.5',
        backgroundColor: 'black',
        transition: 'opacity .25s ease-in-out',
        transform: 'initial',
        display: 'none'
      }}>&nbsp;</div>

    <PanelGroup orientation={orientation ?? 'horizontal'}>
      {children}
    </PanelGroup>
  </PanelContainerContext.Provider>;
};

export default PanelContainer;