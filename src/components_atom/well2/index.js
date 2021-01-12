import React from 'react';
import { Spin } from 'antd';

import styles from './index.less';

export default class Component extends React.PureComponent {
  state = {}

  render() {
    const {
      holderplace = false,
      loading = false,
      title = '',
      footer = '',
      children = null,
      className = '',
      free,
    } = this.props;

    return (
      <Spin spinning={loading}>
        <div className={`${holderplace ? 'well hidden-border' : ''} ${className}`}>
          <div className={`${styles.normal} well-content-warper`}>
            { title ? (<div className={`${styles.title} well-title`}>{title}</div>) : null }
            <div className={`${styles.content} well-content ${free ? styles.free : ''}`}>{children}</div>
            { footer ? (<div className={`${styles.footer} well-footer`}>{footer}</div>) : null }
          </div>
        </div>
      </Spin>
    );
  }
}
