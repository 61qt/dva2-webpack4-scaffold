import _ from 'lodash';
import jQuery from 'jquery';
import { Modal, version, Layout, Icon, Tooltip } from 'antd';
import React from 'react';
import { connect } from 'dva';
import formErrorMessageShow from '@/utils/form_error_message_show';

import ServicesCommon from '@/services/common';
import Detect from '@/npm/@edu_components_atom/detect';
import User, { IS_OPERATIONS_PLATFORM } from '@/utils/user';
import CONSTANTS from '@/constants';
import Header from './header';

import OperationPlatformHeader from './header_operation_platform';

import AppMenu from './menu';
import styles from './index.less';


@connect(() => {
  return {};
})
export default class Component extends React.PureComponent {
  static defaultProps = {
    // location,
    // history,
  };

  constructor(props) {
    super(props);
    debugAdd('layout', this);
    this.state = {
      collapsed: false,
      modalVisible: false,
      forceModelHide: false,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      siderWidth: DEFINE_SIDER_WIDTH,
      systems: [],
    };

    this.changeInnerWidth = _.debounce(this.changeInnerWidth, 1000);
  }

  componentDidMount = () => {
    jQuery(window).on('resize', () => {
      this.changeInnerWidth();
    });
    jQuery(window).on('focus', () => {
      this.handleGlobalClick({});
    });

    const unSetForceModelHide = () => {
      this.setState({
        forceModelHide: true,
      });
      setTimeout(() => {
        this.setState({
          forceModelHide: false,
        });
      }, 60 * 1000);
    };

    jQuery(window).on(CONSTANTS.EVENT.CAS_LOGOUT, unSetForceModelHide);
    jQuery(window).on(CONSTANTS.EVENT.CAS_JUMP_AUTH, unSetForceModelHide);
    jQuery(window).on(CONSTANTS.EVENT.OPERATIONS_PLATFORM_CAS_JUMP_AUTH, unSetForceModelHide);
    jQuery(window).on(CONSTANTS.EVENT.OPERATIONS_PLATFORM_CAS_LOGOUT, unSetForceModelHide);

    if (IS_OPERATIONS_PLATFORM) {
      this.getSystems();
    }
  }

  componentWillReceiveProps = () => {
  }

  getSystems = () => {
    ServicesCommon.getSystemCategory().then((res) => {
      const systems = _.get(res, 'data', []);
      this.setState({ systems });
    }).catch((rej) => {
      formErrorMessageShow(rej);
    });
  }

  getRightLayout = () => {
    return (
      <Layout.Content className={`rightLayout ${styles.rightLayout}`}>
        { this.props.children }
      </Layout.Content>
    );
  }

  getTrigger = () => {
    return (<Tooltip mouseEnterDelay={3} mouseLeaveDelay={0} overlayClassName="cyan-tooltip" placement="top" title={`${this.state.collapsed ? '展开' : '收起'}菜单`}>
      <div className={styles.collapseTrigger}>
        <a>
          { this.state.collapsed ? (<Icon type="menu-unfold" />) : (<Icon type="menu-fold" />) }
        </a>
      </div>
    </Tooltip>);
  }

  changeInnerWidth = () => {
    this.setState({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    });
  }

  handleModelClose = () => {
    this.setState({
      modalVisible: false,
    });
  }

  handleModelOk = () => {
    this.setState({
      modalVisible: false,
    }, () => {
      setTimeout(() => {
        if (IS_OPERATIONS_PLATFORM) {
          return jQuery(window).trigger(CONSTANTS.EVENT.OPERATIONS_PLATFORM_CAS_JUMP_AUTH);
        }
        jQuery(window).trigger(CONSTANTS.EVENT.CAS_JUMP_AUTH);
      }, 1000);
    });
  }

  handleCollapse = (collapsed) => {
    this.setState({
      collapsed,
    });
  }

  handleGlobalClick = (e) => {
    // 检测其他网页已经切换了用户
    if (User.id && this.state.modalVisible) {
      this.setState({
        modalVisible: false,
      });
    }
    else if (!User.id && !this.state.modalVisible) {
      this.setState({
        modalVisible: true,
      });
    }

    const target = _.get(e, 'target');
    // eslint-disable-next-line no-underscore-dangle
    if (window && window._hmt && window._hmt.push && target && target.children && 0 === target.children.length && -1 < ['a', 'button', 'span', 'i'].indexOf(target.tagName.toLowerCase()) && 1000 > target.outerHTML.length) {
      // 全局统计事件绑定。
      let length = 0;
      const clickList = [];
      let current = target;
      while (11 > length && current) {
        let select = current.tagName.toLowerCase();
        length += 1;
        if (current.id) {
          select = `${select}#${current.id}`;
          length += 10;
        }
        else if (current.className) {
          select = `${select}.${current.className.replace(/\s+/ig, '.')}`;
          length += 3;
        }
        current = current.parentNode;
        clickList.unshift(select);
      }

      // eslint-disable-next-line no-underscore-dangle
      window._hmt.push(['_trackEvent', 'global', 'click', clickList.join(' > '), target.outerHTML]);
    }
  }

  render() {
    const { location, history } = this.props;

    const layoutStyle = {};
    if (this.state.collapsed) {
      // 因为侧导航要滚动的问题，所以必须设置最小高度。
      // layoutStyle.minHeight = $('.mainLayoutHeaderLogoContainer').outerHeight() + $('.mainLayoutMenuContainer').outerHeight();
    }

    let globalStyle = '';
    // 生产环境也显示
    if (__DEV__ || __PROD__) {
      globalStyle = `
        #print-table {
          display: block;
        }
      `;
    }

    const key = `${User.id}`;

    return (
      <Layout key={key} data-key={key} onClick={this.handleGlobalClick} className={styles.layout} data-antd-version={version} style={layoutStyle}>
        <style>{globalStyle}</style>
        {
          (__DEV__ || DEFINE_SHOW_HOST_INFO) ? <Detect /> : null
        }
        {
          IS_OPERATIONS_PLATFORM ? <OperationPlatformHeader {...this.props} {...this.state} systems={this.state.systems} className="header" /> : <Header {...this.props} {...this.state} className="header" />
        }
        <Layout>
          <Layout.Sider width={this.state.siderWidth} className={`${this.props.hideAppMenu ? 'ant-hide' : ''} ${styles.sider}`}>
            <AppMenu siderWidth={this.state.siderWidth} collapsed={this.state.collapsed} location={location} history={history} />
          </Layout.Sider>
          <Layout>
            { this.getRightLayout() }
            <Modal
              title="登录状态提示"
              visible={this.state.modalVisible && !this.state.forceModelHide}
              onOk={this.handleModelOk}
              onCancel={this.handleModelClose}
              cancelText="关闭"
              okText="跳转至登录页面">
              <div>
                检测到已经退出登录了。
                <br />
                请重新登录之后再进行操作，如果已经登录或在其他页面登录，关闭此弹窗即可。
                <br />
              </div>
            </Modal>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}
