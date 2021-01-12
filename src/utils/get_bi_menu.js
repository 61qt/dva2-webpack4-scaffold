import _ from 'lodash';

function getVisitorLevel(visitor = {}) {
  const orgDepartment = _.get(visitor, 'orgDepartment') || {};
  const orgDepartmentType = orgDepartment.type;
  const districtId = orgDepartment.district_id;
  let level = '';

  if ([
    _.get(CONST_DICT, 'departments.type.TYPE_SCHOOL'),
    _.get(CONST_DICT, 'departments.type.TYPE_CENTER_SCHOOL'),
  ].includes(orgDepartmentType)) {
    level = 'school';
  }
  else if (districtId && orgDepartmentType === _.get(CONST_DICT, 'departments.type.TYPE_OFFICE')) {
    level = 'district';
  }
  else if (!districtId && orgDepartmentType === _.get(CONST_DICT, 'departments.type.TYPE_OFFICE')) {
    level = 'city';
  }
  // 超级管理员
  else if (undefined === orgDepartmentType) {
    level = 'city';
  }

  return level;
}

export default function getBiMenu({ menuConfig = [] }) {
  const hasAuthBiMenu = [];
  _.each(menuConfig, (menu) => {
    const moduleHasCurrentMenu = (_.get(menu, 'module') || []).includes(DEFINE_MODULE);
    if (!moduleHasCurrentMenu) {
      return;
    }

    const childMenus = _.get(menu, 'child') || [];
    const authChildMenu = _.reduce(childMenus, (res, childMenu) => {
      const moduleHasCurrentSubMenu = (_.get(childMenu, 'module') || []).includes(DEFINE_MODULE);
      if (moduleHasCurrentSubMenu) {
        const childMenuObj = { ...childMenu };
        // 存储旧的数据。
        // eslint-disable-next-line no-underscore-dangle
        childMenuObj.__url = childMenuObj.url;
        childMenuObj.url = `code_url_${childMenuObj.url}`;
        // 存储旧的数据。
        // eslint-disable-next-line no-underscore-dangle
        childMenuObj.__key = childMenuObj.key;
        childMenuObj.key = `code_url_${childMenuObj.key}`;
        childMenuObj.isBiMenu = true;
        // todo 注意一下调用之前定义的判断方法。
        childMenuObj.customCheckAuth = ({ visitor }) => {
          return (_.get(childMenuObj, 'level') || []).includes(getVisitorLevel(visitor));
        };
        res.push(childMenuObj);
      }

      return res;
    }, []);

    if (0 < authChildMenu.length) {
      const menuObj = { ...menu };
      menuObj.isBiMenu = true;
      if (menuObj.key) {
        // eslint-disable-next-line no-underscore-dangle
        menuObj.__key = menuObj.key;
        menuObj.key = `code_url_${menuObj.key}`;
      }
      if (menuObj.url) {
        // eslint-disable-next-line no-underscore-dangle
        menuObj.__url = menuObj.url;
        menuObj.url = `code_url_${menuObj.url}`;
      }
      // bi报表统一icon
      menuObj.icon = 'code_url_bi_icon';
      // todo 注意一下调用之前定义的判断方法。
      menuObj.customCheckAuth = ({ visitor }) => {
        return (_.get(menuObj, 'level') || []).includes(getVisitorLevel(visitor));
      };
      hasAuthBiMenu.push({
        ...menuObj,
        child: authChildMenu,
      });
    }
  });

  return hasAuthBiMenu;
}
