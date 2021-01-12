import React from 'react';
import _ from 'lodash';
import { connect } from 'dva';

@connect((state) => {
  return {
    treeState: state.area,
  };
})
export default class Component extends React.PureComponent {
  static defaultProps = {
    // area state
    treeState: {},
    // department id
    id: 0,
  }

  constructor(props) {
    super(props);

    debugAdd('area', this);
  }

  render() {
    if (!this.props.id) {
      return (<span />);
    }
    const label = _.get(this.props.treeState, `key.${this.props.id}.label`) || this.props.id || '';
    return (<span>{ label }</span>);
  }
}
