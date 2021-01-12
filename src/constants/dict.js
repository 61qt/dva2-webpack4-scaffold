// import _ from 'lodash';

const GENDER = {
  MALE: 1,
  ___MALE: '男',
  FEMALE: 2,
  ___FEMALE: '女',
  UNKNOW: 0,
  ___UNKNOW: '未知',
};


const YES_NO_DICT = {
  // 是否的字典
  YES: 1,
  ___YES: '是',
  NO: 0,
  ___NO: '否',
};

const STATUS = {
  NORMAL: 0,
  ___NORMAL: '正常',
  BAN: 1,
  ___BAN: '禁用',
};

const WEEK = {
  MONDAY: 1,
  ___MONDAY: '周一',
  TUESDAY: 2,
  ___TUESDAY: '周二',
  WEDNESDAY: 3,
  ___WEDNESDAY: '周三',
  THURSDAY: 4,
  ___THURSDAY: '周四',
  FRIDAY: 5,
  ___FRIDAY: '周五',
  SATURDAY: 6,
  ___SATURDAY: '周六',
  SUNDAY: 7,
  ___SUNDAY: '周日',
};

export default {
  GENDER: GENDER,
  STUDENT: {
    STATUS: {
      ...STATUS
    },
    GENDER: GENDER,
    IS_THREE_GOOD: {
      ...YES_NO_DICT,
    }
  },
};
