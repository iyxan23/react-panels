import React, { Component } from 'react';
import { PanelChildren } from './PanelContainer';
import { PanelContainerContext, Orientation } from './PanelContainerContext';

export interface PanelGroupProps {
  // sum of all of the ratio values in panels should be 100
  childrenRatio?: number[];
  children?: PanelChildren;
  orientation: Orientation;
}

interface PanelGroupState {
  children?: PanelChildren,
  childrenRatio: number[];
  length?: number;
}


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

export default class PanelGroup extends Component<PanelGroupProps, PanelGroupState> {
  private rootRef: React.RefObject<HTMLDivElement>;

  constructor(props: PanelGroupProps) {
    super(props);

    let childrenRatio = props.childrenRatio;

    // this function verifies props and populates childrenRatio when it's undefined
    this.verifyProps = this.verifyProps.bind(this);
    this.verifyProps((newRatio) => {
      childrenRatio = newRatio;
    });

    this.state = {
      children: props.children,
      childrenRatio: childrenRatio!, // can not be undefined
    };
    
    this.rootRef = React.createRef();
  }

  // updates childrenRatio according to children
  static getDerivedStateFromProps(nextProps: PanelGroupProps, prevState: PanelGroupState) {
    // todo: deal with these unlikely edge cases
    if (prevState.children !== nextProps.children) return null;
    if (nextProps.children === undefined || prevState.children === undefined) return null;

    // i hate how react gives an array of children when there are multiple children,
    // but only gives a single value when there is only one child aaaaAAAAAAAAAAAAARRRRRRRRGHHHHHHHHH
    if ('length' in nextProps.children && 'length' in prevState.children) {
      const delta = nextProps.children.length - prevState.children.length;
      const flatRatio = 1 / (nextProps.children.length + delta) * 100;

      let newChildrenRatio = [...prevState.childrenRatio];

      // create space for new panels
      for (let i = 0; i <= newChildrenRatio.length; i++) {
        newChildrenRatio[i] +=
          flatRatio / newChildrenRatio.length
          * (delta < 0 ? -1 : 1); // convert to negative if delta is -1 (a panel is removed)
      }

      // then add the new panels
      newChildrenRatio.push(...new Array(delta).fill(flatRatio) as number[]);

      return {
        ...prevState,
        children: nextProps.children,
        childrenRatio: newChildrenRatio,
      };

    } else if ('length' in nextProps.children) {
      // nextProps has 1+ children, prevState has only 1
      // fill ratio with 1 / length * 100
      const length = nextProps.children.length;

      return {
        ...prevState,
        children: nextProps.children,
        childrenRatio: new Array(length).fill(1 / length * 100),
      };

    } else if ('length' in prevState.children) {
      // nextProps has only 1 child, prevState has 1+ chidlren
      return {
        ...prevState,
        children: nextProps.children,
        childrenRatio: [100],
      };
    }
  }

  render() {
    return <div
      ref={this.rootRef}
      style={{
        width: '100%', height: '100%',
        display: 'flex',
        flexDirection: this.props.orientation == 'vertical' ? 'column' : 'row'
      }}/>;
  }

  // verifies children and childrenRatio props
  // and also populates childrenRatio when it's undefined
  verifyProps(updateChildrenRatio: (n: number[]) => void) {
    const childrenRatio = this.props.childrenRatio;
    const children = this.props.children;

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

      updateChildrenRatio(new Array(numberOfChildren).fill(value));
    }
  }
}

const PanelGroupFC = ({ childrenRatio, children, orientation }: PanelGroupProps): JSX.Element => {
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
    const newLength =
      root.current![orientation == 'vertical' ? 'offsetHeight' : 'offsetWidth']
      - (separatorCount * panelContainerContext.separatorWidth);

    console.log(`length: ${newLength} ${orientation}`);

    setLength(newLength);
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

                      const childBounds = childRef.getBoundingClientRect();
                      const childOffset = vertical ? childBounds.top : childBounds.left;

                      const percentage = (mousePosition - childOffset) / length! * 100;

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
