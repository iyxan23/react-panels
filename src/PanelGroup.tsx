import React, { Component } from 'react';
import { PanelChild, PanelChildren } from './PanelContainer';
import { PanelContainerContext, Orientation } from './PanelContainerContext';

export interface PanelGroupProps {
  id: any;
  // sum of all of the ratio values in panels should be 100
  childrenRatio?: Map<any, number>;
  children?: PanelChildren;
  orientation?: Orientation;
}

interface PanelGroupState {
  // stores the children of this group mapped to its own ids
  children?: Map<any, PanelChild>,

  // stores the ratios of the children of this group, mapped to the children's id
  childrenRatio: Map<any, number>;

  // stores the order of children, a list of ids that can be indexed on childrenRatio or children
  childrenOrder: any[];

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
      console.log('populated ratio: ');
      console.log(newRatio);
      childrenRatio = newRatio;
    });

    let [children, childrenOrder] = mapChildren(props.children);

    this.state = {
      children,
      childrenRatio: childrenRatio!, // can not be undefined
      childrenOrder,
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
    if (nextProps.children === undefined || prevState.children === undefined) return null;
    if (Array.from(prevState.children.values()) === nextProps.children) return null; // todo: this doesnt do anything

    if ('length' in nextProps.children && prevState.children.size > 1) {
      console.log('new child!!!');
      const delta = nextProps.children.length - prevState.children.size;
      const flatRatio = 1 / (prevState.children.size + delta) * 100;

      const [mappedChildren, newChildrenOrder] = mapChildren(nextProps.children);

      // when delta is 0 (there is no child addition/removal), we dont need to update the ratio
      if (delta == 0) {
        return {
          ...prevState,
          children: mappedChildren,
          childrenOrder: newChildrenOrder,
        };
      }

      let newChildrenRatio = new Map(prevState.childrenRatio);

      // create space for new panels
      for (const id of prevState.childrenOrder) {
        newChildrenRatio.set(
          id,
          newChildrenRatio.get(id)! +
            flatRatio / newChildrenRatio.size
            * (delta < 0 ? 1 : -1)
        );
      }

      if (delta > 0) {
        // then add the new panels
        // loops from the back of newChildrenOrder for `delta` times
        for (let i = newChildrenOrder.length - 1; i >= newChildrenOrder.length - delta; i--) {
          newChildrenRatio.set(newChildrenOrder[i], flatRatio);
        }
      } else if (delta < 0) {
        // todo: delete the panels that got deleted on newChildrenOrder from childrenOrder
        // prevState.childrenOrder
      }

      console.log('new childrenRatio & order');
      console.log(newChildrenRatio);
      console.log(newChildrenOrder);

      return {
        ...prevState,
        children: mappedChildren,
        childrenRatio: newChildrenRatio,
        childrenOrder: newChildrenOrder
      };

    } else if ('length' in nextProps.children) {
      // nextProps has 1+ children, prevState has only 1
      // fill ratio with 1 / length * 100
      const ratio = 1 / nextProps.children.length * 100;
      const [children, childrenOrder] = mapChildren(nextProps.children);

      return {
        ...prevState,
        children,
        childrenRatio: new Map(childrenOrder.map((id) => [id, ratio])),
        childrenOrder,
      };

    } else if ('length' in prevState.children) {
      // nextProps has only 1 child, prevState has 1+ chidlren
      const [children, childrenOrder] = mapChildren(nextProps.children);

      // retrieves the first and only child and set the ratio to 100
      let childrenRatio = new Map();
      const [id, _] = children.entries().next().value;
      childrenRatio.set(id, 100);

      return {
        ...prevState,
        children,
        childrenRatio,
        childrenOrder,
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

    const separatorCount = this.state.children.size - 1;
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

    childId: any
  ) {
    event.preventDefault();

    const child = childRef.current;
    const separator = separatorRef.current;

    if (separator == null || child == null) return;

    const vertical = this.state.orientation == 'vertical';

    const separatorBounds = separator.getBoundingClientRect();
    const rootBounds = this.rootRef.current!.getBoundingClientRect();
    const childBounds = child.getBoundingClientRect();

    const nextChildId =
      this.state.childrenOrder[
        this.state.childrenOrder.findIndex((v) => v == childId) + 1
      ];

    this.context.showResizeIndicator(
      separatorBounds.y, separatorBounds.x,
      separatorBounds.height, separatorBounds.width,
      this.state.orientation,

      vertical ? childBounds.y : childBounds.x,
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
          let newChildrenRatio = new Map(prev.childrenRatio);

          // get the next child and add / subtract its ratio based on how much space it lost / gained
          newChildrenRatio.set(
            nextChildId,
            newChildrenRatio.get(nextChildId)! + prev.childrenRatio.get(childId)! - percentage
          );


          newChildrenRatio.set(
            childId,
            percentage
          );

          return { childrenRatio: newChildrenRatio };
        });
      }
    );
  }

  render() {
    const vertical = this.state.orientation == 'vertical';

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

        this.state.childrenOrder.map((id, idx) => {
          const child = this.state.children!.get(id);
          const ratio = this.state.childrenRatio.get(id)!;
          const lengthProp = vertical ? 'height' : 'width';

          console.log(`rendering child with id ${id} with ratio ${ratio}`);

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
            <div ref={childRef} key={id} style={style}>{child}</div>

            {this.state.childrenRatio.size - 1 == idx ||
              <div
                ref={separatorRef}
                className='separator'
                style={separatorStyle}
                onMouseDown={(e) => this.childResize(e, childRef, separatorRef, id)} />
            }
          </>;
        })
      }

    </div>;
  }

  // verifies children and childrenRatio props
  // and also populates childrenRatio if it's undefined
  verifyProps(updateChildrenRatio: (n: Map<any, number>) => void) {
    const childrenRatio = this.props.childrenRatio;
    const children = this.props.children;

    if (childrenRatio !== undefined && children !== undefined && 'length' in children) {
      // verify childrenRatio's length against children's
      if (childrenRatio.size !== children.length) {
        throw new Error('childrenRatio and children does not have the same length');
      }
    }

    if (childrenRatio !== undefined) {
      // when childrenRatio is filled
      // verify childrenRatio if it sums up to 100 (or close to it)
      const childrenRatioSum = Array.from(childrenRatio.values())?.reduce((prev, cur) => prev + cur);
      if (childrenRatioSum < 99 || childrenRatioSum > 101) {
        throw new Error(`sum of childrenRatio is not close to 100 (${childrenRatioSum})`);
      }

      // and check for negative numbers, i really hate them - unsigned ints on js wen
      for (const [ _, n ] of childrenRatio) {
        if (n < 0) throw new Error(`childrenRatio must not contain negative numbers`);
      }

    } else if (children !== undefined) {
      // when children is filled but childrenRatio is not, make em all equal
      const numberOfChildren = 'length' in children ? children.length : 1;
      const value = 100 / numberOfChildren;

      console.log(`verifyProps: settin val ${value} to kids`);

      // map children keys to the equal value
      updateChildrenRatio(new Map(
        Array.from(mapChildren(children)[0].keys())
          .map((key) => [key, value])
      ));
    }
  }
}

// Maps panel children according to their ids
function mapChildren(children?: PanelChildren): [Map<any, PanelChild>, any[]] {
  let result = new Map();
  let order: any[] = [];

  React.Children.forEach(children, (child) => {
    if (!child) return;

    result.set(child.props.id, child);
    order.push(child.props.id);
  });

  return [result, order];
}