import React from 'react';
import _ from 'lodash';
import Qs from 'qs';
import { Button } from 'antd';
import styles from './index.less';

const config = {
  403: {
    img: 'https://gw.alipayobjects.com/zos/rmsportal/wZcnGqRDyhPOEYFcZDnb.svg',
    title: '403',
    desc: '抱歉，你无权访问该页面',
  },
  404: {
    img: 'https://gw.alipayobjects.com/zos/rmsportal/KpnpchXsobRgLElEozzI.svg',
    title: '404',
    desc: '抱歉，你访问的页面不存在',
  },
  500: {
    img: 'https://gw.alipayobjects.com/zos/rmsportal/RVRUAYdCGeYNBWoKiIwB.svg',
    title: '500',
    desc: '抱歉，服务器出错了',
  },
  502: {
    img: 'https://gw.alipayobjects.com/zos/rmsportal/RVRUAYdCGeYNBWoKiIwB.svg',
    title: '502',
    desc: '抱歉，服务器出错了',
  },
};


export default class Component extends React.PureComponent {
  // constructor(props) {
  //   super(props);
  // }

  render() {
    const pageType = this.props.type in config ? this.props.type : '404';
    const msg = _.get(Qs.parse(window.location.search.replace(/^\?/, '')), 'msg') || '';

    return (<div className={`${styles.exception} ${this.props.className}`} {...this.props}>
      <div className={styles.imgBlock}>
        <div
          className={styles.imgEle}
          style={{ backgroundImage: `url(${this.props.img || config[pageType].img})` }} />
      </div>
      <div className={styles.content}>
        <h1>{this.props.title || config[pageType].title}</h1>
        <div className={styles.desc}>
          {this.props.desc || config[pageType].desc}
          <br />
          {msg}
        </div>
        <div className={styles.actions}>
          {this.props.actions}

          <a href={DEFINE_WEB_PREFIX || '/'}><Button type="primary">返回首页</Button></a>
        </div>
      </div>
    </div>);
  }
}
