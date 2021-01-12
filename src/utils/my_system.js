/**
 * systemCategory 为当前权限下的移动端应用，通过调用common/systemCategory获取
 * skipRoles 为该用户是否跳过权限限制（目前超管为true）
 * userRoles 即visitor.current里面的userRoles
 * systems 为当前localstorage常用应用的记录
 * roles 为当前用户的所有权限列表
 * systemsHasRole 为读取接口获得的当前用户拥有权限的应用数组
 * mySystemIds 为最新的常用里应用id数组
 * idsOfSystemsHasRole 为systemsHasRole里应用id的数组
 */
/**
 * 该方法用于更新当前用户的常用应用列表，数据存在localstorage，流程：
 * 1、获取最新用户应用权限
 * 2、通过对比systemCategory（即当前权限下的移动端应用），如果systemCategory里已经没有，而本地缓存仍然存留的应用，将其删掉
 */
import _ from 'lodash';
import User from './user';

export const IMPORTANT_MY_SYSTEMS_U_TOKEN_KEY_PREFIX = 'important_my_systems_u_ids_';

export default function updateMySystem(options) {
  const userRoles = options.userRoles || [];
  const skinRoles = _.includes([_.get(CONST_DICT, 'users.user_type.USER_TYPE_SUPER')], options.userType);
  const systemCategory = options.systemCategory;


  const systems = JSON.parse(localStorage.getItem(`${IMPORTANT_MY_SYSTEMS_U_TOKEN_KEY_PREFIX}${User.id}`) || '[]');
  const systemIds = [];
  const mySystemIds = [];

  // 构建权限列表
  _.each(userRoles, (role) => {
    const sysmteId = _.get(role, 'system.id');
    systemIds.push(sysmteId);
  });

  _.map(systems, (system) => {
    if (skinRoles || _.includes(systemIds, system.id)) {
      mySystemIds.push({ id: system.id });
    }
  });

  const systemsHasRole = [];

  if (systemCategory) {
    // systemCategory是键值对数组，将其转换成一维数组systemsHasRole
    _.forIn(systemCategory, (item) => {
      systemsHasRole.push(...item);
    });

    // 根据应用id匹配，idsOfSystemsHasRole(最新数据)没有，mySystemIds（缓存数据）还存留的应用，将其删掉
    const idsOfSystemsHasRole = [];

    _.map(systemsHasRole, (item) => {
      idsOfSystemsHasRole.push(_.get(item, 'id'));
    });


    _.map(mySystemIds, (item, index) => {
      if (0 !== _.get(mySystemIds, 'length') && 0 !== _.get(idsOfSystemsHasRole, 'length') && !_.includes(idsOfSystemsHasRole, _.get(item, 'id'))) {
        mySystemIds.splice(index, 1);
      }
    });
  }

  localStorage.setItem(`${IMPORTANT_MY_SYSTEMS_U_TOKEN_KEY_PREFIX}${User.id}`, JSON.stringify(mySystemIds));
}
