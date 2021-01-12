import React from 'react';
// import _ from 'lodash';
// import { Breadcrumb } from 'antd';
// import { NavLink } from '@/components_atom/router';
import { connect } from 'dva';

import styles from './index.less';
// import Filters from '../../filters';

@connect(() => {
  return {};
})
export default class Component extends React.PureComponent {
  static defaultProps = {
  }

  constructor(props) {
    super(props);
    debugAdd('m_layout', this);
  }

  render() {
    return (
      <div
        className={`page-layout ${this.props.className || ''} ${styles.normal || ''}`} >
        <div className="page-layout-content m-page-layout-content">
          {this.props.children}
        </div>
      </div>
    );
  }
}
