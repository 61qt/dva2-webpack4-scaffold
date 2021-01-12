import React from 'react';
import jQuery from 'jquery';
import _ from 'lodash';
import { connect } from 'dva';
import { NavLink } from '@/components_atom/router';
import { Icon, Layout, Menu } from 'antd';
import { userRoleOptimize } from '@/models/visitor';

import HeaderAccount from './header_account';
import HeaderUserRole from './header_user_role';
import styles from './header.less';
import CONSTANTS from '../../constants';
import Filters from '../../filters';
import User from '../../utils/user';
import Svg from '../../components_atom/svg';
import { DownloadProgressTask } from '../../components_atom/download';

const taskIcon = require('../../assets/icon/task.svg');

@connect((state) => {
  return {
    visitorState: state.visitor,
  };
})
export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);

    debugAdd('header', this);
    this.preDebugCount = 0;
  }

  // closePreDebugEnv = () => {
  //   User.pre = false;
  //   // eslint-disable-next-line no-alert
  //   window.alert('已经关闭了测试模式，刷新页面即可生效，即将为你刷新页面');
  //   location.reload();
  // }

  logout = () => {
    jQuery(window).trigger(CONSTANTS.EVENT.CAS_LOGOUT);
  }

  preDebugEnv = () => {
    if (this.preDebugEnvTimeoutSave) {
      clearTimeout(this.preDebugEnvTimeoutSave);
    }
    this.preDebugCount += 1;
    if (!User.pre && 20 <= this.preDebugCount) {
      User.pre = true;
      // eslint-disable-next-line no-alert
      window.alert('已经开启了测试模式，刷新页面即可生效，关闭浏览器就会退出测试模式，即将为你刷新页面');
      location.reload();
    }
    this.preDebugEnvTimeoutSave = setTimeout(() => {
      this.preDebugCount = 0;
    }, 1000);
  }

  render() {
    const LOGO_TEXT_WHITE = _.get(CONSTANTS, `SYSTEM_CONFIG.CONFIG.${`${DEFINE_MODULE || ''}`.toUpperCase()}.LOGO_TEXT_WHITE`) || '';
    const APP_NAME = _.get(CONSTANTS, `SYSTEM_CONFIG.CONFIG.${`${DEFINE_MODULE || ''}`.toUpperCase()}.APP_NAME`) || '';
    return (
      <Layout.Header className={`globalHeader ${styles.normal}`} onClick={this.preDebugEnv}>
        <div className={`mainLayoutHeaderLogoContainer ${styles.headerLogoContainer} clearfix`}>
          <div className={styles.headerCenter}>
            <a href="/">
              <img className={styles.headerLogoImg} src={CONSTANTS.LOGO.LOGO_WHITE} alt="云 logo" />
              {/* <img className={styles.headerLogoImgText} src={CONSTANTS.LOGO.TEXT_WHITE} alt="云" /> */}
            </a>
            <div style={{ textAlign: 'left' }}>
              <a href="/" className={styles.headerLogoHomeImgText}>
                <div className={styles.headerLogoText}>
                  <div>
                    <img className={styles.headerLogoImgText} src={CONSTANTS.LOGO.TEXT_WHITE} alt="管理平台" />
                  </div>
                </div>
              </a>

              {
                LOGO_TEXT_WHITE ? (<NavLink
                  to={Filters.path('home')}
                  className={_.get(this.props, 'visitorState.current.orgDepartment.name') &&
                  ![_.get(CONST_DICT, 'users.user_type.USER_TYPE_SUPER')].includes(_.get(this.props, 'visitorState.current.user_type')) ? styles.headerAppName : styles.headerNotAppName}>
                  <span style={{ margin: '0 2px', color: '#ffffff' }}>·</span>
                  <img className={styles.headerLogoImgText} src={LOGO_TEXT_WHITE} alt={APP_NAME || '管理平台'} />
                </NavLink>) : null
              }
              {
                APP_NAME && !LOGO_TEXT_WHITE ? (<NavLink
                  to={Filters.path('home')}
                  className={_.get(this.props, 'visitorState.current.orgDepartment.name') &&
                  ![_.get(CONST_DICT, 'users.user_type.USER_TYPE_SUPER')].includes(_.get(this.props, 'visitorState.current.user_type')) ? styles.headerAppName : styles.headerNotAppName}>
                  <span style={{ margin: '0 2px', color: '#ffffff' }}>·</span>
                  <span style={{ margin: '0', color: '#ffffff', fontSize: '14px', fontWeight: '300' }}>{APP_NAME}</span>
                </NavLink>) : null
              }
              <div style={{ textAlign: 'left', paddingLeft: '10px' }}>
                {
                  _.get(this.props, 'visitorState.current.orgDepartment.name') ? (<a href="/" style={{ fontSize: '12px', fontWeight: '300', color: '#fff' }}>
                    {
                      `${_.get(this.props, 'visitorState.current.orgDepartment.name')}空间`
                    }
                  </a>) : null
                }
              </div>
            </div>
            <span className={`${styles.headerName} ant-hide`}>管理系统</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Menu mode="horizontal" className={styles.menu} selectedKeys={[]} defaultSelectedKeys={[]} openKeys={[]} defaultOpenKeys={[]}>
            {/* {
              User.pre ? <Menu.Item key="preDebug" className={`${styles.menuItem}`}>
                <span className="text-red">当前在开发环境</span>
                <Button ghost size="small" onClick={this.closePreDebugEnv}>关闭</Button>
              </Menu.Item> : null
            } */}
            {
              __DEV__ ? <Menu.Item key="innerWidth" className={`${styles.menuItem} ${__DEV__ ? '' : 'ant-hide'}`}>
                [视窗: {this.props.innerWidth} * {this.props.innerHeight}]
              </Menu.Item> : null
            }
            <Menu.Item key="task" className={styles.menuItem}>
              <DownloadProgressTask title={<span><Icon type="info-circle" theme="filled" className="text-yellow" />&nbsp;&nbsp;<span>我的任务</span></span>}>
                <Svg link={taskIcon} className={`${styles.taskIcon} home-taskIcon`} />
              </DownloadProgressTask>
            </Menu.Item>
            <Menu.Item key="account" className={styles.menuItem}>
              <HeaderAccount {...this.props} />
            </Menu.Item>
            {
              _.get(CONST_DICT, 'users.user_type.USER_TYPE_SUPER') !== _.get(this.props.visitorState, 'current.user_type') && userRoleOptimize() ? <Menu.Item key="userRole" className={styles.menuItem}>
                <HeaderUserRole {...this.props} />
              </Menu.Item> : null
            }
            <Menu.Item key="logout" className={`${styles.menuItem} ${styles.menuItemNorderBorder}`}>
              <div onClick={this.logout} className="text-white">
                <span>退出</span>&nbsp;
                <Icon type="logout" />
              </div>
            </Menu.Item>
          </Menu>
        </div>
      </Layout.Header>
    );
  }
}
