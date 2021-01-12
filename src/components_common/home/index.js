import _ from 'lodash';
import React from 'react';
import { connect } from 'dva';

import styles from './index.less';
import Filters from '../../filters';
// eslint-disable-next-line import/first
import { checkIsHasAuth } from '@/npm/@edu_components_atom/access';

@connect((state) => {
  return {
    visitorState: state.visitor,
  };
})
export default class Component extends React.PureComponent {
  static defaultProps = {
  }
  constructor(props) {
    super(props);
    debugAdd('home', this);

    this.state = {};
  }

  componentDidMount = () => {
    this.props.dispatch({
      type: 'breadcrumb/current',
      payload: [],
    });
  }

  render() {
    return (
      <div className={styles.normal}>
        <div>
          <div className={styles.welcome} />
          <ul className={styles.list}>
            <li>管理平台，快速新增删除，多入口打包</li>
          </ul>
        </div>
      </div>
    );
  }
}
