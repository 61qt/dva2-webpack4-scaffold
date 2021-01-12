import _ from 'lodash';
import moment from 'moment';
import Filters from '../filters';

function buildClassNameWithGrade(options) {
  const classObj = _.get(options, 'class', {}) || {};
  if (_.isEmpty(classObj) || !_.isObject(classObj)) {
    return '';
  }

  const name = [];

  if (classObj.grade) {
    name.push(Filters.dict(['class', 'grade'], classObj.grade));
  }

  if (classObj.class_name) {
    name.push(`${classObj.class_name}班`);
  }

  return name.join(' ');
}

function buildClassNameWithYearAndStage(options) {
  const classObj = _.get(options, 'class', {}) || {};
  if (_.isEmpty(classObj) || !_.isObject(classObj)) {
    return '';
  }

  const name = [];

  if (classObj.edu_stage) {
    name.push(Filters.dict(['department', 'edu_stage'], classObj.edu_stage) || '');
  }

  if (classObj.entrance_year) {
    if (moment.isMoment(classObj.entrance_year)) {
      name.push(`${classObj.entrance_year.format('YYYY')}级`);
    }
    else {
      name.push(`${classObj.entrance_year}级`);
    }
  }

  if (classObj.class_name) {
    name.push(`${classObj.class_name}班`);
  }

  return name.join(' ');
}

const buildClassName = (() => {
  return DEFINE_APP_CHANGE_GRADE_NAME ? buildClassNameWithGrade : buildClassNameWithYearAndStage;
})();

export default buildClassName;
