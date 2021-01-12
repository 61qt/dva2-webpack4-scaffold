import _ from 'lodash';

import User from '@/utils/user';
import Filters from '@/filters';

export default function getUserTypeLabel() {
  let label = '未登录';
  const userType = _.get(User.decodeToken(), 'user_type');
  if (1 * userType) {
    label = Filters.dict(['user', 'user_type'], userType);
  }

  return label;
}

export function getUserAddrInfo(key = 'city_id') {
  const id = _.get(User.decodeToken(), key);
  if (!id) {
    return '';
  }

  return Filters.area(id) || '';
}
