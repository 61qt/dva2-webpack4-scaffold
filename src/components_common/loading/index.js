import React from 'react';
import { connect } from 'dva';
import { Spin } from 'antd';
import Qs from 'qs';

import Filters from '../../filters';
import styles from './index.less';

@connect(() => {
  return {};
})
export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    debugAdd('loading', this);
  }

  componentDidMount = () => {
    this.props.dispatch({
      type: 'breadcrumb/current',
      payload: [
        {
          name: '跳转中',
          url: Filters.path('loading', {}),
        },
      ],
    });

    const query = Qs.parse(window.location.search.replace(/^\?/, ''));
    setTimeout(() => {
      if (query.dt) {
        this.props.history.replace(query.dt);
      }
      else {
        this.props.history.goBack();
      }
    }, 500);
  }

  render() {
    const loading = true;
    return (<Spin spinning={loading}>
      <div className={styles.normal} />
    </Spin>);
  }
}
