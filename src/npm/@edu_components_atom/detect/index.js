import React from 'react';
import jQuery from 'jquery';
import _ from 'lodash';
import { connect } from 'dva';

import styles from './index.less';

@connect((state) => {
  return {
    visitorState: state.visitor,
  };
})
export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);

    debugAdd('detect', this);
    this.state = {
      domain: _.map(DEFINE_DETECT_DOMAIN, (elem) => {
        return elem;
      }),
      res: {},
      random: Math.random(),
    };
  }

  componentDidMount = () => {
    this.getDetection();
  }

  getDetection = () => {
    _.map(this.state.domain, (elem) => {
      jQuery.ajax({
        url: `${DEFINE_HAS_HTTPS_SERVER ? 'https:' : window.location.protocol}//${elem}/mechine_info.html`,
        dataType: 'html',
      }).then((res) => {
        this.state.res[elem] = res;
        this.setState({
          random: Math.random(),
        });
      });
    });
  }

  render() {
    return (<div id="detect" className={styles.detect} data-key={this.state.random}>
      <div>发布时间：{DEFINE_RELEASE_DATE}</div>
      <div>版本：{DEFINE_RELEASE_VERSION}</div>
      {
        _.map(this.state.domain, (domain) => {
          return (<div key={domain} className="domain">{domain}: {this.state.res[domain]}</div>);
        })
      }
    </div>);
  }
}
