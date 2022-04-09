import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import { PanelChildren, PanelContainerContext } from './PanelContainer';

export interface PanelGroupProps {
  // sum of all of the ratio values in panels should be 100
  childrenRatio?: Array<number>;
  children?: PanelChildren;
  orientation: Orientation
}

export type Orientation = 'vertical' | 'horizontal';

// returns a generated childrenRatio if it wasn't specified
function verifyChildren(childrenRatio?: Array<number>, children?: PanelChildren): Array<number> | undefined {
  if (childrenRatio !== undefined && children !== undefined && 'length' in children) {
    // verify childrenRatio's length against children's
    if (childrenRatio.length !== children.length) {
      throw new Error('childrenRatio and children does not have the same length');
    }
  }

  if (childrenRatio !== undefined) {
    // when childrenRatio is filled
    // verify childrenRatio if it sums up to 100 (or close to it)
    const childrenRatioSum = childrenRatio?.reduce((prev, cur) => prev + cur);
    if (childrenRatioSum < 99 || childrenRatioSum > 101) {
      throw new Error(`sum of childrenRatio is not close to 100 (${childrenRatioSum})`);
    }

    // and check for negative numbers, i really hate them - unsigned ints on js wen
    for (const n of childrenRatio) {
      if (n < 0) throw new Error(`childrenRatio must not contain negative numbers`);
    }

  } else if (children !== undefined) {
    // when children is filled but childrenRatio is not
    const numberOfChildren = 'length' in children ? children.length : 1;
    const value = 100 / numberOfChildren;

    return new Array(numberOfChildren).fill(value);
  }

  return undefined;
}

const PanelGroup = ({ childrenRatio, children, orientation }: PanelGroupProps): JSX.Element => {
  // verify props
  childrenRatio = useMemo(() => verifyChildren(childrenRatio, children), []) ?? childrenRatio;

  let [childrenRatioState, setChildrenRatioState] = useState<Array<number>>(childrenRatio!);
  console.log(`children ratio state: ${childrenRatioState}`)

  const panelContainerContext = useContext(PanelContainerContext);
  if (panelContainerContext == null) throw new Error('PanelGroup can only be used under a PanelContainer');

  let root = useRef<HTMLDivElement>(null);

  // can be either width / height, depends on the orientation
  let [length, setLength] = useState<number | null>(null);

  const calculateLength = () => {
    console.log('calculate length');

    // we dont really need to do anything when there isnt any children lol
    if (children == undefined) return;

    const separatorCount = ('length' in children ? children.length : 1) - 1;

    setLength(
      root.current!.offsetWidth - (separatorCount * panelContainerContext.separatorWidth)
    );
  }

  useEffect(calculateLength, []);

  // this might not be a good idea when there are a lot of content in the panels
  // we'll need to update our panels everytime the window resizes
  // but this rarely ever happen, soooooooooo

  // fixme: should've re-render on PanelContainer instead
  // since PanelGroups can nest together, this would be a mess
  window.onresize = calculateLength;

  // this looks kinda dumb, but we at first render this div, after that we retrieve the width / height
  // of this depending on the orientation, and use that length to calculate the width / height of our
  // children that'll be rendered next
  return <div
    ref={root}
    style={{
      width: '100%', height: '100%',
      display: 'flex',
      flexDirection: orientation == 'vertical' ? 'column' : 'row'
    }}>

      {/* when we got the length and have a children */}
      {length !== null &&
       children !== undefined &&

      ('length' in children ? // check if its an array or an object
        children.map((child, idx) => {
          const ratio = childrenRatioState![idx];
          console.log(`ratio: ${ratio}`);
          const lengthProperty = orientation == 'vertical' ? 'height' : 'width';

          // not the prettiest solution
          let style: React.CSSProperties = {};
          style[lengthProperty] = ratio / 100 * length!;
          style['transition'] = 'all .25s';

          let separatorStyle: React.CSSProperties = {};
          separatorStyle[lengthProperty] = panelContainerContext.separatorWidth;
          separatorStyle['cursor'] = orientation == 'vertical' ? 'row-resize' : 'col-resize';

          console.log(`result: ${style[lengthProperty]}`);

          let separatorRef: HTMLDivElement | null = null;
          let childRef: HTMLDivElement | null = null;

          return <>
            <div ref={(cr) => childRef = cr} key={idx} style={style}>{child}</div>

            {children.length - 1 == idx ||
              <div
                ref={(sr) => separatorRef = sr}
                className='separator'
                style={separatorStyle}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (separatorRef == null || childRef == null) return;

                  const vertical = orientation == 'vertical';

                  const separatorBounds = separatorRef.getBoundingClientRect();
                  const rootBounds = root.current!.getBoundingClientRect();

                  panelContainerContext.showResizeIndicator(
                    separatorBounds.y, separatorBounds.x,
                    separatorBounds.height, separatorBounds.width,
                    orientation,

                    vertical ? rootBounds.y : rootBounds.x,
                    vertical ? rootBounds.y + rootBounds.height
                              : rootBounds.x + rootBounds.width,

                    (mousePosition) => {
                      console.log(`mouse up s! ${mousePosition} / ${length}`);
                      if (childRef == null) return;
                      console.log('mouse up!');

                      const percentage = (mousePosition / length!) * 100;

                      setChildrenRatioState((val) => {
                        console.log(`previous: ${val}`);
                        let cr = [...val];

                        cr[idx + 1] += val[idx] - percentage;
                        cr[idx] = percentage;

                        console.log(`updated to ${cr}`);

                        return cr;
                      });
                    }
                  );
                }} />}
          </>;

        }) : (function() { // when its an object
          const lengthProperty = orientation == 'vertical' ? 'height' : 'width';

          let style: React.CSSProperties = {};
          style[lengthProperty] = length!;

          return <div style={style}>{children}</div>;
        })())}

    </div>;
}

export default PanelGroup;