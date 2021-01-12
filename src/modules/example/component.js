import React from 'react';
import { connect } from 'dva';
import jQuery from 'jquery';
// import CONSTANTS from '../../constants';
import MLayout from '../../components_atom/m_layout';
import Router from './router';

import responsive from '../../utils/responsive';
import './index.less';

// 响应式
responsive();
jQuery(window).resize(() => {
  responsive();
});

@connect((state) => {
  debugAdd('state', state);
  return {};
})
export default class Component extends React.PureComponent {
  render() {
    return (<MLayout>
      <Router {...this.props} />
    </MLayout>);
  }
}
