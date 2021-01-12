import moment from 'moment';
import _ from 'lodash';

export function isIgnoreCtrlD() {
  const disabledModule = ['cas', 'exam_m', 'exam_statistic_m', 'duty_m', 'asset_m', 'attendance_m', 'student_family_notice_m'];
  return _.includes(disabledModule, DEFINE_MODULE) || DEFINE_IS_MOBILE;
}

function checkoutCtrlD() {
  if (isIgnoreCtrlD()) {
    return;
  }

  // 旧的收藏夹问题。
  const ctrlDMatch = window.location.hash.match(/ctrl_d=([\d-]+)/);
  const today = moment().format('YYYY-MM-DD');

  const hash = window.location.hash.replace(/&*?ctrl_d=([\d-]+)/ig, '').replace(/^#/, '');
  if (ctrlDMatch && today !== ctrlDMatch[1]) {
    const jumpUrl = _.get(location.pathname.match(/(\/[^/]+\/).*/), '[1]') || '/';
    window.location.replace(jumpUrl);
  }
  else {
    window.location.hash = `${hash}${hash ? '&' : ''}ctrl_d=${today}`.replace(/^&/ig, '').replace(/^#&/ig, '');
  }
}

checkoutCtrlD();

export default 'ctrl_d';
