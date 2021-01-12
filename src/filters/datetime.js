import moment from 'moment';
import leftPad from 'left-pad';

export default function (date, options = {}) {
  const {
    format = 'YYYY-MM-DD',
    type = 'unix',
    offsetView = false,
  } = options;

  let $moment = moment();
  if (!date) {
    return '';
  }

  if ('unix' === type && 0 === date) {
    return '';
  }

  if ('unix' === type) {
    $moment = moment.unix(date);
  }
  else if ('24hour' === type) {
    $moment = moment(leftPad(date, 4, '0'), 'HHmm');
  }
  else if ('TIMESTAMP' === type) {
    // type = 'TIMESTAMP';
    // TIMESTAMP 模式
    $moment = moment(date);
  }
  else {
    $moment = moment(date);
  }

  // // TODO ADD offsetView datetime format
  if (__DEV__ && __PROD__) {
    window.console.log('offsetView', offsetView);
  }
  // if (offsetView) {
  //   const dayFormat = 'YYYY-MM-DD';
  //   // 最近天数的 format
  //   const todayFormat = moment().format(dayFormat);
  //   const yesterdayFormat = moment().add(-1, 'days').format(dayFormat);
  //   const tomorrowFormat = moment().add(-1, 'days').format(dayFormat);

  //   const nowUnix = moment().unix();

  //   const $momentUnix = $moment.unix();
  //   const $momentDayFormat = $moment.format(dayFormat);

  //   const unixOffset = nowUnix - $momentUnix;
  //   const oneHourMaxUnixRange = 60 * 60 - 1;
  //   if (unixOffset < nowUnix && unixOffset + oneHourMaxUnixRange > nowUnix) {
  //     return `${Math.floor(unixOffset / 60)}分钟前`;
  //   }

  // }

  return $moment.format(format);
}
