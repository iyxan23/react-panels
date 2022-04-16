import React, { Component } from 'react';
import { PanelChildren } from './PanelContainer';
import { PanelContainerContext, Orientation } from './PanelContainerContext';

export interface PanelGroupProps {
  // sum of all of the ratio values in panels should be 100
  childrenRatio?: number[];
  children?: PanelChildren;
  orientation?: Orientation;
}

interface PanelGroupState {
  children?: PanelChildren,
  childrenRatio: number[];
  orientation: Orientation;
  length?: number;
}

export default class PanelGroup extends Component<PanelGroupProps, PanelGroupState> {
  static contextType?: React.Context<any> | undefined = PanelContainerContext;
  private rootRef: React.RefObject<HTMLDivElement>;

  constructor(props: PanelGroupProps) {
    super(props);

    let childrenRatio = props.childrenRatio;

    // this function verifies props and populates childrenRatio when it's undefined
    this.verifyProps = this.verifyProps.bind(this);
    this.verifyProps((newRatio) => {
      console.log(`populated ratio: ${newRatio}`);
      childrenRatio = newRatio;
    });

    this.state = {
      children: props.children,
      childrenRatio: childrenRatio!, // can not be undefined
      orientation: props.orientation ?? 'horizontal'
    };
    
    this.rootRef = React.createRef();

    // some functions
    this.recalculateLength = this.recalculateLength.bind(this);
    this.childResize = this.childResize.bind(this);
    console.log('init');
  }

  // updates childrenRatio according to children
  static getDerivedStateFromProps(nextProps: PanelGroupProps, prevState: PanelGroupState) {
    console.log('prevState & nextProps');
    console.log(prevState);
    console.log(nextProps);

    // todo: deal with unlikely edge cases like children going undefined
    if (prevState.children === nextProps.children) return null;
    if (nextProps.children === undefined || prevState.children === undefined) return null;

    // i hate how react gives an array of children when there are multiple children,
    // but only gives a single value when there is only one child aaaaAAAAAAAAAAAAARRRRRRRRGHHHHHHHHH
    if ('length' in nextProps.children && 'length' in prevState.children) {
      const delta = nextProps.children.length - prevState.children.length;
      const flatRatio = 1 / (nextProps.children.length + delta) * 100;

      let newChildrenRatio = [...prevState.childrenRatio];

      // create space for new panels
      for (let i = 0; i < newChildrenRatio.length; i++) {
        newChildrenRatio[i] +=
          flatRatio / newChildrenRatio.length
          * (delta < 0 ? -1 : 1); // convert to negative if delta is negative (a panel is removed)
      }

      // then add the new panels
      newChildrenRatio.push(...new Array(delta).fill(flatRatio) as number[]);

      console.log(`new childrenRatio: ${newChildrenRatio}`);

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

  componentDidMount() {
    // calculate length i guess?
    this.recalculateLength();
  }

  componentDidUpdate(prevProps: PanelGroupProps, prevState: PanelGroupState, snapshot: any) {
    console.log('componentDidUpdate();');
    console.log(snapshot);

    if (this.state.length === undefined) {
      console.log('recalculate :)');
      this.recalculateLength();
    }
  }

  // called whenever we wanted to re-fetch the length of the root container
  recalculateLength() {
    console.log('recalcualte length');
    if (this.state.children == undefined) return;

    const separatorCount = ('length' in this.state.children ? this.state.children.length : 1) - 1;
    const newLength =
      this.rootRef.current![this.state.orientation == 'vertical' ? 'offsetHeight' : 'offsetWidth']
      - (separatorCount * this.context.separatorWidth);

    console.log(`length: ${newLength} ${this.state.orientation}`);

    this.setState({ length: newLength });
  }

  childResize(
    event: React.MouseEvent<HTMLDivElement>,
    childRef: React.RefObject<HTMLDivElement>,
    separatorRef: React.RefObject<HTMLDivElement>,

    index: number
  ) {
    event.preventDefault();

    const child = childRef.current;
    const separator = separatorRef.current;

    if (separator == null || child == null) return;

    const vertical = this.state.orientation == 'vertical';

    const separatorBounds = separator.getBoundingClientRect();
    const rootBounds = this.rootRef.current!.getBoundingClientRect();

    this.context.showResizeIndicator(
      separatorBounds.y, separatorBounds.x,
      separatorBounds.height, separatorBounds.width,
      this.state.orientation,

      vertical ? rootBounds.y : rootBounds.x,
      vertical ? rootBounds.y + rootBounds.height
                : rootBounds.x + rootBounds.width,

      (mousePosition: number) => {
        // would be better when the cursor is right in the center of the separator when resizing
        mousePosition -= this.context.separatorWidth / 2;

        console.log(`mouse up s! ${mousePosition} / ${this.state.length}`);
        if (childRef == null) return;

        const childBounds = child.getBoundingClientRect();
        const childOffset = vertical ? childBounds.top : childBounds.left;

        const percentage = (mousePosition - childOffset) / this.state.length! * 100;

        this.setState((prev) => {
          console.log(`prev ratio: ${prev.childrenRatio}`);

          let newChildrenRatio = [...prev.childrenRatio];

          newChildrenRatio[index + 1] += prev.childrenRatio[index] - percentage;
          newChildrenRatio[index] = percentage;

          console.log(`new ratio: ${newChildrenRatio}`);

          return { childrenRatio: newChildrenRatio };
        });
      }
    );
  }

  render() {
    const vertical = this.state.orientation == 'vertical';
    const children = React.Children.toArray(this.state.children);

    return <div
      ref={this.rootRef}
      style={{
        width: '100%', height: '100%',
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row'
      }}>

      {
        this.state.length &&
        this.state.children !== undefined &&

        children.map((child, idx) => {
            const ratio = this.state.childrenRatio[idx];
            const lengthProp = vertical ? 'height' : 'width';

            console.log(`rendering child index ${idx} with ratio ${ratio}`);

            // creates styles for child and separator
            let style: React.CSSProperties = {};
            style[lengthProp] = ratio / 100 * this.state.length!;
            style['transition'] = 'all .25s';

            console.log('resulting child style:');
            console.log(style);

            let separatorStyle: React.CSSProperties = {};
            separatorStyle[lengthProp] = this.context.separatorWidth;
            separatorStyle['cursor'] = vertical ? 'row-resize' : 'col-resize';

            let childRef = React.createRef<HTMLDivElement>();
            let separatorRef = React.createRef<HTMLDivElement>();

            return <>
              <div ref={childRef} key={idx} style={style}>{child}</div>

              {children.length - 1 == idx ||
                <div
                  ref={separatorRef}
                  className='separator'
                  style={separatorStyle}
                  onMouseDown={(e) => this.childResize(e, childRef, separatorRef, idx)} />
              }
            </>;
          })
      }

    </div>;
  }

  // verifies children and childrenRatio props
  // and also populates childrenRatio if it's undefined
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