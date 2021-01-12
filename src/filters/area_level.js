// import moment from 'moment';
import _ from 'lodash';

import { getState } from '../utils/get_app';

/*
 * 快速获取地区列表的 filters
 * @param {number} id 需要获取哪个城市名字的 id
 * @param { number } parentId 如果不传输 id 参数(或者强制写成 undefined) ，就返回一个当前城市下所有的区组装成的 options 结构数组。
 * @return {Object or String} 如果传输 id ，就会返回 该 id 对应的 name 或者 id，否则返回一个限定区域下面的一级行政区域组装成的 options 列表。
*/
export default function (id) {
  const state = getState();
  const areaState = _.get(state, 'area');
  const nameArr = [];
  const idArr = [];
  let area = _.get(areaState, `key[${id}]`);
  while (area && area.value) {
    if (_.includes(idArr, area.value)) {
      // 循环了。跳出
      area = undefined;
    }
    else {
      idArr.push(area.value);
      nameArr.unshift(area.label);
      area = _.get(areaState, `key[${area.pid}]`) || undefined;
    }
  }

  return nameArr.join(' ');
}
