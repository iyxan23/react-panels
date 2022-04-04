import React, { useContext, useEffect, useRef, useState } from 'react';
import { PanelChildren, PanelContainerContext } from './PanelContainer';

export interface PanelGroupProps {
  // sum of all of the ratio values in panels should be 100
  childrenRatio?: Array<number>;
  children?: PanelChildren;
  orientation: Orientation
}

export type Orientation = 'vertical' | 'horizontal';

const PanelGroup = ({ childrenRatio, children, orientation }: PanelGroupProps): JSX.Element => {
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

  } else if (children !== undefined) {
    // when children is filled but childrenRatio is not
    const numberOfChildren = 'length' in children ? children.length : 1;
    const value = 100 / numberOfChildren;

    childrenRatio = new Array(numberOfChildren).fill(value);
  }

  const panelContainerContext = useContext(PanelContainerContext);

  if (panelContainerContext == null) {
    throw new Error('PanelGroup can only be used under a PanelContainer');
  }

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
          const ratio = childrenRatio![idx];
          const lengthProperty = orientation == 'vertical' ? 'height' : 'width';

          // not the prettiest solution
          let style: React.CSSProperties = {};
          style[lengthProperty] = (ratio / 100) * length!;

          let separatorStyle: React.CSSProperties = {};
          separatorStyle[lengthProperty] = panelContainerContext.separatorWidth;

          return <>
            <div key={idx} style={style}>{child}</div>

            {children.length - 1 == idx || <div className='separator' style={separatorStyle} />}
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