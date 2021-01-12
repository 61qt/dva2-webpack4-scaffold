import moment from 'moment';

import CONSTANTS from '@/constants';
import StudentService from '@/services/student';
import TeacherService from '@/services/teacher';
import formErrorMessageShow from '@/utils/form_error_message_show';

export const trim = str => (str ? str.replace(/(^\s*)|(\s*$)/g, '') : str); // 去除左右空格

// REG
export const eMailReg = /^([a-zA-Z\d])(\w|-)+@[a-zA-Z\d]+\.[a-zA-Z]{2,4}$/;

export const phoneReg = /^1[3456789]\d{9}$/;

export const idNumberReg = /^[1-8]\d{5}(19|20)\d{2}(01|02|03|04|05|06|07|08|09|10|11|12)([0123])\d{4}(\d|x|X)$/;

export const nameReg = /^[\u4e00-\u9fa5]{1,5}$/;

// 学籍号正则
export const studentNoReg = /^[GL][a-zA-Z\d]{18,}$/;
// 学前学籍号正则
export const preStudentNoReg = /^LG[a-zA-Z\d]{18,}$/;


// 教职工号正则
export const facultyNumberReg = /^\d+$/;

export const usernameReg = /^(1[3456789]\d{9})|([1-8]\d{5}(19|20)\d{2}(01|02|03|04|05|06|07|08|09|10|11|12)([0123])\d{4}(\d|x|X))$/; // 手机或者身份证

export function phoneValidator(options = { message: '手机号码格式不正确' }) {
  return (rule, value, cb) => {
    let newValue = value;
    if (options.pattern) {
      newValue = newValue.replace(options.pattern, '');
    }
    if (!phoneReg.test(trim(newValue))) {
      cb(options.message);
    }
    else {
      cb();
    }
  };
}

export function eMailValidator(options = { message: '邮箱格式不正确' }) {
  return (rule, value, cb) => {
    if (value && !eMailReg.test(trim(value))) {
      cb(options.message);
    }
    else {
      cb();
    }
  };
}

export function idNumberValidator(options = { message: '身份证号码格式不正确' }) {
  return (rule, value, cb) => {
    if (value) {
      if (!idNumberReg.test(trim(value))) {
        cb(options.message);
      }
      else {
        const birthdayStr = _.get(String(value).match(CONSTANTS.ID_NUMBER_REGEX), '1');
        const birthdayStrLen = 8;
        if (birthdayStrLen !== String(birthdayStr).length) {
          cb();
        }
        const date = moment(birthdayStr, 'YYYYMMDD');
        if (!date.isValid()) {
          cb(options.message);
        }
      }
    }

    cb();
  };
}

export function nameValidator(options = { message: '姓名只能是1到5个中文字符串' }) {
  return (rule, value, cb) => {
    if (value && !nameReg.test(trim(value))) {
      cb(options.message);
    }
    else {
      cb();
    }
  };
}

export function usernameValidator(options = { message: '格式不正确，请填写手机号码或身份证号' }) {
  return (rule, value, cb) => {
    if (value && !usernameReg.test(trim(value))) {
      cb(options.message);
    }
    else {
      cb();
    }
  };
}

export function studentNoIsExistValidator(options = { message: '学生已存在，请重新输入' }) {
  return (rule, value, callback) => {
    if (studentNoReg.test(value)) {
      StudentService.graphqlList({
        filter: [
          ['student_no', '=', value],
        ],
      }).then((res) => {
        const data = _.get(res, 'data.data');
        if (!_.isEmpty(data)) {
          return callback(options.message);
        }
        else {
          return callback();
        }
      }).catch((rej) => {
        formErrorMessageShow(rej);
        return callback();
      });
      return;
    }

    callback();
  };
}

const debounceIdNumberSearch = _.debounce((idNumber, options = {}, callback) => {
  return StudentService.graphqlList({
    filter: [
      ['id_number', '=', idNumber],
    ],
  }).then((res) => {
    const data = _.get(res, 'data.data');
    if (!_.isEmpty(data)) {
      return callback(options.message);
    }
    else {
      return callback();
    }
  }).catch((rej) => {
    formErrorMessageShow(rej);
    return callback();
  });
}, 500);
export function studentIdNumberIsExistValidator(options = { message: '学生已存在，请重新输入' }) {
  return (rule, value, callback) => {
    if (value) {
      debounceIdNumberSearch(value, options, callback);
      return;
    }

    callback();
  };
}

const debounceTeacherNoSearch = _.debounce((teacherNo, options = {}, callback) => {
  if (facultyNumberReg.test(teacherNo)) {
    TeacherService.graphqlList({
      filter: [
        ['id', '!=', options.teacherId],
        ['department_id', '=', options.departmentId],
        ['teacher_no', '=', teacherNo],
      ],
    }).then((res) => {
      const data = _.get(res, 'data.data');
      if (!_.isEmpty(data)) {
        callback(options.message || '该校已存在此教职工号');
      }
      else {
        callback();
      }
    }).catch((rej) => {
      formErrorMessageShow(rej);
      callback();
    });
  }
  else {
    callback();
  }
}, 500);
export function teacherNoIsExistValidator(options = { teacherId: '', departmentId: '', message: '该校已存在此教职工号' }) {
  return (rule, value, callback) => {
    if (value) {
      debounceTeacherNoSearch(value, options, callback);
    }
    else {
      callback();
    }
  };
}
