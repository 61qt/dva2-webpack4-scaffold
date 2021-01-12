import React from 'react';
import _ from 'lodash';
import jQuery from 'jquery';
import { Menu } from 'antd';
// Icon
import { connect } from 'dva';
import { NavLink } from '@/components_atom/router';
import pluralize from 'pluralize';
import Cookies from 'js-cookie';

import { notificationClose } from '@/utils/form_error_message_show';

import accessStyles from '@/npm/@edu_components_atom/access/index.less';
import Access, { checkIsHasAuth } from '@/npm/@edu_components_atom/access';
import MenuIcon from './menu_icon';


// import { modelResetListState } from '../../models';

import styles from './menu.less';

// 下一个进入的 list 页面的 model 是否需要进行 reset 的标志位。
let needResetCurrentModel = false;
export function nextModelNeedReset() {
  return needResetCurrentModel;
}
export function nextModelIsReseted() {
  needResetCurrentModel = false;
  return needResetCurrentModel;
}

// 所有的菜单项目的队列存储。用于查询打开的点击菜单。
function getAllMenuItem(menu, parent) {
  if (!menu) {
    return [];
  }

  const newMenu = menu;
  if (parent) {
    newMenu.parent = parent;
  }
  if (menu && menu.child) {
    return [menu].concat(...menu.child.map((elem) => {
      return getAllMenuItem(elem, menu);
    }));
  }

  return [menu];
}

const SIDERBAR_WIDTH_KEY = `SIDERBAR_WIDTH_KEY_${DEFINE_MODULE}`;
const SIDERBAR_MAX_WIDTH = 400;
const SIDERBAR_MIN_WIDTH = 160;
const SIDERBAR_INIT_WIDTH = ['bi'].includes(DEFINE_MODULE) ? 300 : SIDERBAR_MIN_WIDTH;

const sessionCookieOption = {
  path: '/',
};

@connect((state) => {
  const connectState = {
    resource: _.get(state, 'visitor.resource'),
    visitor: _.get(state, 'visitor.current'),
    menuConfig: state.menu_config.menu,
    supportDocumentUrl: _.get(state, 'visitor.supportDocumentUrl', ''),
  };

  // fixme: 后面要改进这个东西，删掉下面这段代码
  if ('site_manage' === DEFINE_MODULE) {
    _.assign(connectState, {
      schoolSiteAudit: state.school_site_audit.schoolSiteAudit,
    });
  }

  // if (_.includes(DEFINE_HAS_SUPPORT_DOCUMENT_MODULES, DEFINE_MODULE)) {
  //   const menuConfig = [..._.get(state, 'menu_config.menu')];
  //   menuConfig.push({
  //     name: '帮助中心',
  //     key: 'help_center',
  //     url: 'help_center',
  //     resourceKey: '',
  //   });
  //   _.assign(connectState, {
  //     menuConfig,
  //   });
  // }

  return connectState;
})
export default class Component extends React.PureComponent {
  static defaultProps = {
    collapsed: true,
  };

  constructor(props) {
    super(props);
    this.state = {
      theme: 'dark',
      unListen: () => {},
      // 用来查询快速查询是哪一个当前的 menu
      // 所有的菜单项目的队列存储。用于查询打开的点击菜单。
      allMenuItem: [].concat(...props.menuConfig.map((elem) => {
        return getAllMenuItem(elem);
      })),
    };
    _.assign(this.state, {
      ...this.stateChange(),
    });
    debugAdd('menu', this);
  }

  componentDidMount = () => {
    this.state.unListen = this.props.history.listen(() => {
      this.setState({
        ...this.stateChange(),
      });

      // 路由切换的时候，清除页面上的notification提示框
      notificationClose();
    });
    jQuery('body').addClass('menuFirstInit');
    // 拖动菜单大小。
    jQuery(document).on('mouseup', () => {
      jQuery('body').removeClass('dropingMenuSelectNone');
      jQuery(document).unbind('mousemove');
    });

    this.handleInitResizeSiderBar();
  }

  componentWillUnmount = () => {
    this.state.unListen();
    // 解除菜单拖动
    jQuery(document).unbind('mouseup');
  }

  // 算法复杂度 o(n);
  onOpenChange = (openKeys) => {
    const latestOpenKey = openKeys.find(key => !(-1 < this.state.openKeys.indexOf(key)));
    const latestCloseKey = this.state.openKeys.find(key => !(-1 < openKeys.indexOf(key)));

    let nextOpenKeys = [];
    if (latestOpenKey) {
      nextOpenKeys = this.getAncestorKeys(latestOpenKey).concat(latestOpenKey);
    }
    if (latestCloseKey) {
      nextOpenKeys = this.getAncestorKeys(latestCloseKey);
    }
    this.setState({ openKeys: nextOpenKeys });
  }

  onSubMenuMouseEnter = () => {
    jQuery('body').removeClass('menuFirstInit');
  }

  // 获取二级菜单的一级菜单，算法复杂度 o(n);
  getAncestorKeys = (key) => {
    if (__DEV__ && __PROD__) {
      window.console.log('getAncestorKeys key', key);
    }
    const keys = [];
    let item = _.find(this.state.allMenuItem, (elem) => {
      return [elem.key, elem.key2].includes(key);
    });

    if (item && item.child) {
      if (item.key) {
        keys.push(item.key);
      }
      if (item.key2) {
        keys.push(item.key2);
      }
      keys.push(`${item.key || ''}|${item.key2 || ''}`);
    }

    const parentKey = _.get(item, 'parent.key');
    const parentKey2 = _.get(item, 'parent.key2');
    while (item && item.parent && (parentKey || parentKey2)) {
      if (parentKey2) {
        keys.unshift(parentKey2);
      }

      if (parentKey) {
        keys.unshift(parentKey);
      }
      keys.unshift(`${parentKey || ''}|${parentKey2 || ''}`);

      item = item.parent;
    }

    return keys;
  }

  // 处理初始化的时候，如何使用菜单初始化的问题。
  // 这种情况为非hash ，另外的情况，需要进行针对的更改。
  // 算法复杂度 o(n);
  stateChange = () => {
    jQuery('.ant-layout').scrollTop(0);
    const regex = new RegExp(`${DEFINE_WEB_PREFIX}/([^/?]*)`);
    const match = (_.get(window, 'location.pathname') || '').match(regex);
    if (!match) {
      return {
        openKeys: ['/'],
        selectedKeys: '/',
      };
    }

    const pathname = match[1];
    const newPathname = (pathname || '').replace(/^\//, '').replace(/\/$/, '');
    // 匹配如 student_add || student_detail
    // 这种其实不应该匹配到，匹配到，说明格式书写不对
    const matchFallbackPrefixKey = newPathname.replace(/_add$/, '').replace(/_detail\//, '');
    let key = newPathname;

    // 判断路径的单复数
    if (_.find(this.state.allMenuItem, {
      // 直接传值模式
      key: newPathname,
    })) {
      key = newPathname;
    }
    // 判断路径的单复数
    else if (_.find(this.state.allMenuItem, {
      // 直接传值模式
      url: newPathname,
    })) {
      key = newPathname;
    }
    else if (_.find(this.state.allMenuItem, {
      // 转换成单数模式
      key: pluralize.plural(newPathname),
    })) {
      key = pluralize.plural(newPathname);
    }
    else if (_.find(this.state.allMenuItem, {
      // 转换成单数模式
      key: pluralize.singular(newPathname),
    })) {
      key = pluralize.singular(newPathname);
    }
    else if (_.find(this.state.allMenuItem, {
      key: matchFallbackPrefixKey,
    })) {
      key = matchFallbackPrefixKey;
    }
    else {
      key = newPathname;
    }

    const item = _.find(this.state.allMenuItem, (elem) => {
      return [elem.key, elem.key2].includes(key);
    });

    const selectedKeys = [];
    if (item) {
      if (item.key) {
        selectedKeys.push(item.key);
      }
      if (item.key2) {
        selectedKeys.push(item.key2);
      }

      selectedKeys.push(`${item.key}|${item.key2 || ''}`);
    }

    return {
      openKeys: this.getAncestorKeys(key || '/'),
      selectedKeys: !_.isEmpty(selectedKeys) ? selectedKeys : (key || 'home|'), // 系统默认跳转到 首页，这里直接默认 home
    };
  }

  handleTitleClick = (e) => {
    if (__PROD__ && window.console && window.console.log) {
      window.console.log(e);
    }
  }

  handleClick = (e) => {
    jQuery('.ant-menu-submenu-active').removeClass('ant-menu-submenu-active');
    jQuery('.ant-menu-submenu.ant-menu-submenu-popup.ant-menu-dark.ant-menu-submenu-placement-rightTop').addClass('ant-menu-submenu-hidden');
    jQuery('.ant-menu-submenu.ant-menu-submenu-popup.ant-menu-dark.ant-menu-submenu-placement-rightTop .ant-menu').addClass('ant-menu-hidden');
    if (e.key) {
      this.setState({ selectedKeys: e.key }, () => {
        jQuery('.ant-menu-submenu-active').removeClass('ant-menu-submenu-active');
        jQuery('.ant-menu-submenu.ant-menu-submenu-popup.ant-menu-dark.ant-menu-submenu-placement-rightTop').addClass('ant-menu-submenu-hidden');
        jQuery('.ant-menu-submenu.ant-menu-submenu-popup.ant-menu-dark.ant-menu-submenu-placement-rightTop .ant-menu').addClass('ant-menu-hidden');
      });
    }
  }

  handleMouseDown = (e) => {
    const left = e.pageX;
    const oldWidth = jQuery('.ant-layout-sider').width();

    const SPEED = 14;
    jQuery(document).on('mousemove', (event) => {
      const offset = event.pageX - left;
      let width = oldWidth + offset + SPEED;
      if (SIDERBAR_MAX_WIDTH < width) {
        width = SIDERBAR_MAX_WIDTH;
      }
      if (SIDERBAR_MIN_WIDTH > width) {
        width = SIDERBAR_MIN_WIDTH;
      }

      Cookies.set(SIDERBAR_WIDTH_KEY, width, sessionCookieOption);
      jQuery('body').addClass('dropingMenuSelectNone');
      jQuery('.ant-layout-sider').css({
        flex: `0 0 ${width}px`,
        maxWidth: `${width}px`,
        minWidth: `${width}px`,
        width: `${width}px`,
      });
    });
  }

  handleInitResizeSiderBar = () => {
    const width = (Cookies.get(SIDERBAR_WIDTH_KEY, sessionCookieOption) * 1) || SIDERBAR_INIT_WIDTH;
    jQuery('.ant-layout-sider').css({
      flex: `0 0 ${width}px`,
      maxWidth: `${width}px`,
      minWidth: `${width}px`,
      width: `${width}px`,
    });
  }

  // 每次点击左侧菜单，都重置掉整个 model ，避免搜索条件存储过久
  resetStateListState = () => {
    // 优化后：每次点击的时候，设置标志位，进入菜单时，进行 model 的判断 reset 处理。避免全量 reset 。
    // modelResetListState(this.props.dispatch);
    needResetCurrentModel = true;
  }

  // 算法复杂度 o(n平方);，需要进行优化。
  renderMenu = () => {
    const { resource } = this.props;
    const { allMenuItem } = this.state;

    // 当前menu 的横向总宽度， 32 为父元素的 padding-left
    const liMenuWidth = this.props.siderWidth - 32;

    const selectedKeys = _.isArray(this.state.selectedKeys) ? this.state.selectedKeys : [this.state.selectedKeys];

    // 处理菜单优化的问题。
    let subModules = [];
    _.map(selectedKeys, (key) => {
      _.map(allMenuItem, (elem) => {
        const elemKey = `${elem.key || ''}|${elem.key2 || ''}`;
        if ([elem.key, elem.key2].includes(key)) {
          if (elem.parent) {
            subModules = _.concat(subModules, elem.parent.subModules);
          }
          else {
            subModules = _.concat(subModules, elem.subModules);
          }
        }
        else if (elemKey === key) {
          if (elem.parent) {
            subModules = _.concat(subModules, elem.parent.subModules);
          }
          else {
            subModules = _.concat(subModules, elem.subModules);
          }
        }
      });
    });

    const menu = this.props.menuConfig.map((elem) => {
      let elemIsShow;
      let isModuleShow = true;
      if (subModules && 0 < _.get(subModules, 'length')) {
        if (elem.subModules && !_.get(_.intersection(subModules, elem.subModules), 'length')) {
          isModuleShow = false;
        }
      }

      if (!elem.resourceKey) {
        if (!isModuleShow && __PROD__) {
          elemIsShow = false;
        }
        else {
          elemIsShow = true;
        }
      }
      else if (__PROD__ && isModuleShow) {
        elemIsShow = checkIsHasAuth({
          auth: elem.resourceKey,
          resource: this.props.resource,
        });
      }
      else if (__PROD__ && !isModuleShow) {
        // 生产模式，不显示其他 modules
        elemIsShow = false;
      }
      else {
        elemIsShow = checkIsHasAuth({
          auth: elem.resourceKey,
          resource: this.props.resource,
        });
      }

      // 增加额外的判断，看看能不能显示该菜单。前提是有这个权限，再进行显示判断。
      if (elemIsShow && 'function' === typeof elem.customCheckAuth) {
        elemIsShow = elem.customCheckAuth({
          auth: elem.resourceKey,
          resource: this.props.resource,
          visitor: this.props.visitor,
        });
      }

      // 计算菜单名称
      let menuName = elem.name;
      if ('function' === typeof elem.name) {
        menuName = elem.name({
          auth: elem.resourceKey,
          resource: this.props.resource,
          visitor: this.props.visitor,
        });
      }

      let child = '';
      if (elem && elem.child && elem.child.length) {
        child = elem.child.map((childElem) => {
          let childElemIsShow;
          if (!childElem.resourceKey) {
            childElemIsShow = true;
          }
          else {
            childElemIsShow = checkIsHasAuth({
              auth: childElem.resourceKey,
              resource,
            });
          }

          // 增加额外的判断，看看能不能显示该菜单。前提是有这个权限，再进行显示判断。
          if (childElemIsShow && 'function' === typeof childElem.customCheckAuth) {
            childElemIsShow = childElem.customCheckAuth({
              auth: childElem.resourceKey,
              resource: this.props.resource,
              visitor: this.props.visitor,
            });
          }

          // 计算菜单名称
          let childMenuName = childElem.name;
          const menuNameFuncArgs = {
            auth: childElem.resourceKey,
            resource: this.props.resource,
            visitor: this.props.visitor,
          };

          if ('function' === typeof childElem.name) {
            childMenuName = childElem.name(menuNameFuncArgs);
          }

          const menuSubMenuItemStyles = {
            '--marginleft': 0 < liMenuWidth - 14 * childMenuName.length ? 0 : `${liMenuWidth - 14 * (childMenuName.length + 1)}px`,
          };
          const childElemKey = `${childElem.key || ''}|${childElem.key2 || ''}`;
          return (
            <Menu.Item
              data-is-module-show={isModuleShow}
              className={`${!childElemIsShow && __DEV__ ? accessStyles.accessHiddenDev : ''} ${!childElemIsShow && __PROD__ ? accessStyles.accessHidden : ''}`}
              key={childElemKey}
              data-key-content={childElemKey}>
              <Access auth={childElem.resourceKey}><NavLink
                data-key-content={childElemKey}
                onClick={this.resetStateListState}
                to={`${DEFINE_WEB_PREFIX}/${childElem.url}`}
                className={`layoutMenuItemLink ${styles.layoutMenuItemLink}`}
                title={childMenuName}>
                <span
                  className={`${styles.layoutMenuItemLinkContent} layoutMenuItemLinkContent`}
                  title={childMenuName}
                  length={childMenuName.length}
                  style={menuSubMenuItemStyles}>{childMenuName}</span>
              </NavLink></Access>
            </Menu.Item>
          );
        });

        // <Icon type={elem.icon} />
        const menuSubMenuStyles = {
          '--marginleft': 0 < liMenuWidth - 14 * menuName.length ? 0 : `${liMenuWidth - 14 * (menuName.length + 1)}px`,
        };
        const key = `${elem.key || ''}|${elem.key2 || ''}`;
        const iconName = elem.icon || elem.key || '';
        const iconType = elem.iconType || '';
        return (
          <Menu.SubMenu
            data-is-module-show={isModuleShow}
            onMouseEnter={this.onSubMenuMouseEnter}
            onTitleClick={this.handleTitleClick}
            className={`${!elemIsShow && __DEV__ ? accessStyles.accessHiddenDev : ''} ${!elemIsShow && __PROD__ ? accessStyles.accessHidden : ''}`}
            key={key}
            data-key-content={key}
            title={<span data-key-content={key} className={`layoutMenuItemLink ${styles.layoutMenuItemLink}`}>
              <div className={styles.menuIconLine}>
                <MenuIcon iconName={iconName} type={iconType} />
                <span
                  className={`${styles.layoutMenuItemLinkContent} layoutMenuItemLinkContent`}
                  title={menuName}
                  length={menuName.length}
                  style={menuSubMenuStyles}>{menuName}{__DEV__ && !isModuleShow ? '(模块隐藏)' : ''}</span>
              </div>
            </span>}>
            {child}
          </Menu.SubMenu>
        );
      }

      // <Icon type={elem.icon} />
      const menuItemStyles = {
        '--marginleft': 0 < liMenuWidth - 14 * menuName.length ? 0 : `${liMenuWidth - 14 * (menuName.length + 1)}px`,
      };
      const key = `${elem.key || ''}|${elem.key2 || ''}`;
      const iconName = elem.icon || elem.key || '';
      const iconType = elem.iconType || '';
      const linkProps = {
        'data-key-content': key,
        title: menuName,
        className: `layoutMenuItemLink ${styles.layoutMenuItemLink}`,
      };
      const linkChild = (<span
        className={`${styles.layoutMenuItemLinkContent} layoutMenuItemLinkContent`}
        title={menuName}
        length={menuName.length}
        style={menuItemStyles}>{menuName}{__DEV__ && !isModuleShow ? '(模块隐藏)' : ''}</span>);
      return (
        <Menu.Item
          data-is-module-show={isModuleShow}
          onClick={this.resetStateListState}
          key={key}
          data-key-content={key}
          className={`${!elemIsShow && __DEV__ ? accessStyles.accessHiddenDev : ''} ${!elemIsShow && __PROD__ ? accessStyles.accessHidden : ''}`} >
          {
            elem.isExtraUrl ? <a {...linkProps} target="_blank" href={`${elem.url}`}>
              {linkChild}
            </a> : <Access auth={elem.resourceKey}><NavLink {...linkProps} to={`${DEFINE_WEB_PREFIX}/${elem.url}`}>
              <div className={styles.menuIconLine}>
                <MenuIcon iconName={iconName} type={iconType} />
                {linkChild}
              </div>
            </NavLink></Access>
          }
        </Menu.Item>
      );
    });
    return menu;
  }

  render() {
    const { collapsed } = this.props;

    let height = window.innerHeight;
    height -= jQuery('.mainLayoutHeaderLogoContainer').outerHeight() || 0;
    height -= jQuery('.ant-layout-sider-trigger').outerHeight() || 0;
    const menuContainerStyle = {};
    const menuStyle = {};
    menuContainerStyle.height = height;
    menuContainerStyle.overflow = 'auto';
    if (collapsed) {
      const paddingBottom = 100;
      menuStyle.paddingBottom = paddingBottom;
    }

    const selectedKeys = _.isArray(this.state.selectedKeys) ? this.state.selectedKeys : [this.state.selectedKeys];
    return (
      <React.Fragment>
        <div className="mainLayoutMenuContainer" style={menuContainerStyle}>
          <Menu
            key={`menu_${JSON.stringify(collapsed)}`}
            inlineIndent={collapsed ? 0 : 16}
            theme={this.state.theme}
            mode={collapsed ? 'vertical' : 'inline'}
            openKeys={this.state.openKeys}
            selectedKeys={selectedKeys}
            onOpenChange={this.onOpenChange}
            onClick={this.handleClick}
            className={`${styles.normal || ''}`}
            style={menuStyle} >
            { this.renderMenu() }
          </Menu>
          {
            _.get(this.props, 'supportDocumentUrl') && <a className={styles.supportDocument} target="_blank" href={_.get(this.props, 'supportDocumentUrl')} >
              <MenuIcon iconName="help_center" />
              帮助中心</a>
          }
        </div>

        <div
          className="mainLayoutMenuContainerResizeDrop"
          onMouseDown={this.handleMouseDown} />
      </React.Fragment>);
  }
}
