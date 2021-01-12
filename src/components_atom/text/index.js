import _ from 'lodash';
import $ from 'jquery';
import ReactDOM from 'react-dom';
import React from 'react';

export default class Component extends React.Component {
  static defaultProps = {
    // react props.children
    children: null,
    // 是否居中
    alignCenter: false,
  }

  constructor(props) {
    super(props);
    debugAdd('text', this);

    this.divRef = React.createRef();
    this.spanRef = React.createRef();

    this.state = {
      snapshot: {
        width: 0,
        pWidth: 0,
      },
    };

    if (__DEV__) {
      window.console.log('Text 启用，暂时不适用这个');
    }
  }

  componentDidMount = () => {
    setTimeout(() => {
      const snapshot = this.getWidth();
      this.setState({
        snapshot,
      });
    }, 50);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!_.isEqual(snapshot, this.state.snapshot)) {
      this.setNewSnapshot(snapshot);
    }
    else if (this.props.children !== prevProps.children) {
      setTimeout(() => {
        const snapshotTemp = this.getWidth();
        this.setState({
          snapshot: snapshotTemp,
        });
      }, 50);
    }
  }

  getWidth = () => {
    // eslint-disable-next-line react/no-find-dom-node
    const $spanNode = $(ReactDOM.findDOMNode(this.spanRef.current));
    // eslint-disable-next-line react/no-find-dom-node
    const $divNode = $(ReactDOM.findDOMNode(this.divRef.current));
    return {
      width: $spanNode.width(),
      pWidth: $divNode.width(),
    };
  }

  getSnapshotBeforeUpdate = () => {
    return this.getWidth();
  }

  setNewSnapshot = (snapshot) => {
    this.setState({
      snapshot,
    });
  }

  renderText = () => {
    const pWidth = _.get(this.state.snapshot, 'pWidth', 0);
    const width = _.get(this.state.snapshot, 'width', 0);
    const commonStyle = {
      whiteSpace: 'nowrap',
      wordBreak: 'keep-all',
      position: 'absolute',
      display: 'block',
      textOverflow: 'unset',
    };

    const style = {
      ...commonStyle,
      zIndex: '-1',
      color: 'transparent',
      visibility: 'hidden',
    };

    const viewStyle = {
      ...commonStyle,
      top: 0,
      left: 0,
      transformOrigin: 'top left',
    };

    if (pWidth && width) {
      if (pWidth < width) {
        viewStyle.transform = `scale(${pWidth / width})`;
      }
      else if (this.props.alignCenter) {
        viewStyle.left = (pWidth - width) / 2;
      }
    }

    const divStyle = {
      position: 'relative',
      width: '100%',
      // overflow: 'hidden',
    };

    return (<div ref={this.divRef} style={divStyle} className={this.props.className || ''}>
      <span ref={this.spanViewRef} data-width={width} data-p-width={pWidth} style={viewStyle}>{this.props.children}</span>
      <span ref={this.spanRef} style={style}>{this.props.children}</span>
      <span>&nbsp;</span>
    </div>);
  }

  render() {
    return this.renderText();
  }
}
