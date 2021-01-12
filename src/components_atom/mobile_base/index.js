import React from 'react';
import { NavBar } from 'antd-mobile';
// import _ from 'lodash';
import Filters from '../../filters';

import styles from './index.less';

export default class Component extends React.PureComponent {
  static defaultProps = {
    title: '',
    nbLeftContent: '',
    nbRightContent: '',
    hiddenTabBar: true,
    backgroundColor: '',
  }
  constructor(props) {
    super(props);
    debugAdd('mobile_base', this);
  }

  handleHome = () => {
    if (this.props.history && 'function' === typeof this.props.history.push) {
      this.props.history.push(Filters.path('home'));
    }
  }

  renderTitle = () => {
    if ('string' === typeof this.props.title) {
      if (this.props.hiddenTitle) {
        return null;
      }
      const defaultRightContent = (<span className="sp sp-asset-m-icon-home" onClick={this.handleHome} />);
      return (<div className={styles.nav}>
        <NavBar
          mode="dark"
          leftContent={this.props.nbLeftContent}
          rightContent={this.props.nbRightContent || defaultRightContent}>
          {this.props.title}
        </NavBar>
      </div>);
    }

    return null;
  }

  render() {
    const height = this.props.hiddenTabBar ? document.body.clientHeight : document.body.clientHeight - 50;
    return (<div className={styles.baseWrap} style={{ height, backgroundColor: `${_.get(this.props, 'backgroundColor', 'inherit')}` }}>
      { this.renderTitle() }
      <div className={this.props.hiddenTitle ? styles.contentWraphiddenTitle : styles.contentWrap}>
        { this.props.children }
      </div>
    </div>
    );
  }
}
