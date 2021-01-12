import { AUTH_REG } from '@/npm/@edu_components_atom/access';
import { getState } from '../utils/get_app';

// 循环获取需要的权限。
function getMiniAuthCircle({
  menu,
}) {
  const state = getState();
  const currentMenus = _.get(state, 'visitor.currentMenus');
  const currentMenusKey = _.get(state, 'visitor.currentMenusKey');

  let arr = [];
  if (menu.pid && currentMenusKey[menu.pid]) {
    arr.push(currentMenusKey[menu.pid]);
    arr = _.concat(arr, getMiniAuthCircle({
      menu: currentMenusKey[menu.pid],
      currentMenus,
      currentMenusKey,
    }));
  }

  // 菜单类型，0 位总系统/功能名称，1为查看权限，2为更新权限，3为导入权限，4为导出权限
  if ([0].includes(menu.type)) {
    const viewAuth = _.find(currentMenus, {
      type: 1,
      pid: menu.id,
    });
    if (viewAuth) {
      arr.push(viewAuth);
    }
  }
  else if ([2, 3, 4].includes(menu.type)) {
    const viewAuth = _.find(currentMenus, {
      type: 1,
      pid: menu.pid,
    });
    if (viewAuth) {
      arr.push(viewAuth);
    }
  }

  return arr;
}

const getMiniDependAuthCache = {};
export default function getMiniDependAuth(auth) {
  if (getMiniDependAuthCache[auth]) {
    return getMiniDependAuthCache[auth];
  }
  // 取并集，无论auth返回true或false都计算，由auth外层考虑判断逻辑
  // test auth = '我的信息 && (学籍信息 || abc)'
  // authMenusArr = [{id: 3000, pid: 3, resource: "学籍信息", type: 0, splitResource: Array(1)} ,get_mini_depend_auth.js:64 {id: 3305, pid: 3, resource: "我的信息", type: 0, splitResource: Array(1)}]
  const authArr = auth.match(AUTH_REG);

  const state = getState();
  const currentMenus = _.get(state, 'visitor.currentMenus');
  const currentMenusKey = _.get(state, 'visitor.currentMenusKey');

  // 直接权限菜单
  const authMenusArr = [];
  _.map(currentMenus, (elem) => {
    if (authArr.some((authItem => _.includes(elem.splitResource, authItem)))) {
      authMenusArr.push(elem);
    }
    else if (!elem.id) {
      authMenusArr.push(elem);
    }
  });
  // 具备层级依赖关系的权限菜单
  let allAuthMenusArr = [...authMenusArr];
  _.map(authMenusArr, (menu) => {
    const menuRelyArr = getMiniAuthCircle({
      menu,
      currentMenus,
      currentMenusKey,
    });
    allAuthMenusArr = _.concat(allAuthMenusArr, menuRelyArr);
  });

  const allAuthResource = {};
  _.map(allAuthMenusArr, (menu) => {
    if (menu.splitResource) {
      _.map(menu.splitResource, (elem) => {
        if (elem) {
          allAuthResource[elem] = true;
        }
      });
    }
  });

  getMiniDependAuthCache[auth] = allAuthResource;

  return allAuthResource;
}

window.getMiniDependAuth = getMiniDependAuth;
