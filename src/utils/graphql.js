import _ from 'lodash';
import pluralize from 'pluralize';

import {
  toUnderlineCamelCase,
} from '@/utils/letter_case_up_lower';
import '@/utils/debug_add';
import { getState } from '@/utils/get_app';
import CONSTANTS from '@/constants';

import buildSchemeBFS from './grpqhql_bfs';
import getMiniDependAuth from './get_mini_depend_auth';

// 这里存储下那些尚未配置权限的字段。方便打印出来，让后端增加处理。
export const noAuthFieldArr = [];
export const noAuthObjArr = [];
debugAdd('noAuthFieldArr', noAuthFieldArr);
debugAdd('noAuthObjArr', noAuthObjArr);

export const GRAPH_LEVEL_MAX_DEEP = 3;

// LIST type 最小层级
export const GRAPHQL_LIST_TYPE_LEVEL_WHITELIST_MIN_DEEP = 2;

// 自动过滤重复的查询。把那些错误的重复查询自动过滤掉，除非加入 autoSchemeTreeWhiteList 白名单。不自动过滤的那些非重复的查询，加入 autoSchemeTreeBlackList 即可过滤掉
// list type 关联查询白名单 e.g. 'hseAdmissionStudent.hseStudentWish.studentWishRelations.wishSchool'
export const autoSchemeTreeWhiteList = [
  // 这个并非重复查询，因为在报到时候会判断该学生有没有已经报道过了，如果报到过了，就不让报到
  'kdeStudentWishPagination.items.student.kdeStudentWish',
  'studentFillingPagination.items.student.studentFilling',
  'studentFilling.student.studentFilling',
  'bookPagination.items.bookDetails.bookshelf',
  'bookPagination.items.bookDetails.bookshelf.parentBookshelf',
];

// 不进行自动创建语法的 scheme 语法分之。
export const autoSchemeTreeBlackList = [
  // bug
  'adminPagination.items.userRoles',
  // 循环查询
  'admin.userGroups.users',
  'admin.userGroups.department',
  // bug
  'users.last_login_at',
  'users.created_at',
  'user.userRoles.users',
  'userPagination.items.userGroups',
  'userPagination.items.userRoles',
  'makerActivityWinnerPagination.items.makerActivityWork.makerActivityWorkContent',
  // 这类型的已经自动化识别去掉了。
  // 'bookPagination.items.bookDetails.book',  // 自动识别去掉了。
  // 'bookDetailPagination.items.book.bookDetails',  // 自动识别去掉了。
  // 'bookBorrowLogPagination.items.bookDetail.book.bookDetails',  // 自动识别去掉了。
  // 'bookDetail.book.bookDetails',  // 自动识别去掉了。
  // 'book.bookDetails.book',  // 自动识别去掉了。
  // 'expiredBookBorrowLog.book.bookDetails.book',  // 自动识别去掉了。

  // 这个也会用到。
  // 'childrenPagination.items.department',
  // 这个目前会用到。孩子的班级
  // 'childrenPagination.items.classes',
  'childrenPagination.items.user.department',

  'userAuditLogPagination.items.applyUser.department',
  'userAuditLogPagination.items.applyUser.orgDepartment',
  'userAuditLogPagination.items.student.user',
  'userAuditLogPagination.items.student.studentFamilies',
  'userAuditLogPagination.items.user.familyInfos',
  'userAuditLogPagination.items.applyUser.familyInfos',
  'userAuditLogPagination.items.auditUser.familyInfos',

  // 循环查询
  // 'studentTranscriptPagination.items.student.studentTranscript',  // 自动识别去掉了。
  // 'studentTranscriptPagination.items.student.user',
  // 'studentTranscriptPagination.items.user.department',
  // bug
  'studentTranscriptPagination.items.studentWish.firstWishSchool',
  'studentTransferLogGraduatePagination.items.fromDistrict',
  'studentTransferLogGraduatePagination.items.toDistrict',
  'studentTransferLogGraduatePagination.items.transferOutOperator',
  'studentTransferLogPagination.items.transferOutOperator',
  'studentTransferLogPagination.items.transferredOperator',
  'userAuditLogPagination.items.user.department',
  'userAuditLogPagination.items.user.district',
  'siteArticlePagination.items.content',
  'siteArticlePagination.items.siteArticleContent',

  // 循环查询
  // 'registrationPagination.items.wishSchools.registrations',  // 自动识别去掉了。
  // 'wishSchoolPagination.items.registrations.wishSchools',  // 自动识别去掉了。

  // bug
  // 'studentAdmissionPagination.items.student.studentAdmissions',  // 自动识别去掉了。

  // bug
  'studentAdmissionPagination.items.graduateDepartment',
  'studentAdmissionPagination.items.admissionDepartment',

  // 测试的不用的字段
  'userRolePagination.items.userMenus.pid',

  // 循环查询
  // 'student.transcript.student',  // 自动识别去掉了。

  // 循环查询
  // 'studentTranscript.student.studentTranscript',  // 自动识别去掉了。

  // bug
  'studentPagination.items.studentWish.firstWishSchool',

  // 循环查询
  // 'studentPagination.items.studentTranscript.student',  // 自动识别去掉了。
  // 'studentPagination.items.studentEnrollSubjects.student',  // 自动识别去掉了。
  'studentPagination.items.user.department',
  // 'studentPagination.items.studentAdmissions.student',  // 自动识别去掉了。
  'studentPagination.items.studentAdmissions',

  // bug
  'visitor.userRoles.department_id',
  'visitor.userGroups',
  'visitor.userGroups.users',
  'visitor.userGroups.department',
  'visitor.department.registrations',
  'visitor.userRoles.userMenus',
  'visitor.subDepartments',
  'visitor.department',
  // bug
  // 'visitor.userRoles',

  // bug
  'departmentTree.registrations',

  // bug
  'departmentTree.kdeSchoolNatureConfig',

  // bug
  'exportableList.columns.name',
  'exportableList.columns.value',

  // bug
  'studentFillingPagination.items.student.department',
  'studentFillingPagination.items.student.classes',
  'studentFillingPagination.items.student.user',
  // 这个并非重复查询，因为在报到时候会判断该学生有没有已经报道过了，如果报到过了，就不让报到
  // 'kdeStudentWishPagination.items.student.kdeStudentWish',
  // 'studentFillingPagination.items.student.studentFilling',

  // bug
  'scoreLinePagination.items.district',

  //
  'boardSpecialArticlePagination.items.editor.department',
  'boardSpecialArticlePagination.items.editor.orgDepartment',
  'boardSpecialArticlePagination.items.editor.department_id',


  // 不需要这个字段
  'studentHealthDetailPagination.items.healthItem.healthItemDetails',
  'studentHealthDetailPagination.items.healthItem.healthExtraPoints',
  'studentHealthDetailPagination.items.student',
  'healthDistrictItemStatPagination.items.healthItem.healthItemDetails',
  'healthCityItemStatPagination.items.healthItem.healthItemDetails',
  'healthSchoolItemStatPagination.items.healthItem.healthItemDetails',

  'messagePagination.items.system.systemCategory',
  'systemMessageStatistics.system.systemCategory',
  'messageStatisticPagination.items.message.params',
  'messageStatisticPagination.items.message.content',
  'messageStatisticPagination.items.message.system',
  'messageStatisticPagination.items.system.systemCategory',

  'siteArticlePagination.items.siteSpecial.parentSpecial',

  // 选修方案（electivePlan） 关联选修课程（electivePlanCourses）再重复循环
  'electivePlanCourse.electivePlan.electivePlanCourses',
  // 选修方案关联选修课程再重复循环
  'electivePlanCoursePagination.items.electivePlan.electivePlanCourses',
  'electiveEnrollment.electivePlanCourse.electivePlan.electivePlanCourses',
  'electiveEnrollmentPagination.items.electivePlanCourse.electivePlan.electivePlanCourses',
  'myStudentEnrollment.electivePlanCourse.electivePlan.electivePlanCourses',
  'myStudentEnrollmentPagination.items.electivePlanCourse.electivePlan.electivePlanCourses',
  'classmateEnrollment.electivePlanCourse.electivePlan.electivePlanCourses',
  'classmateEnrollmentPagination.items.electivePlanCourse.electivePlan.electivePlanCourses',
  'classmateEnrollmentList.electivePlan.electivePlanCourses.electivePlan',
  'classmateEnrollmentList.electivePlanCourse.electivePlan.electivePlanCourses',

  'electivePlan.electivePlanCourses.electivePlan',
  'electivePlanPagination.items.electivePlanCourses.electivePlan',
  'electiveEnrollment.electivePlan.electivePlanCourses.electivePlan',
  'electiveEnrollmentPagination.items.electivePlan.electivePlanCourses.electivePlan',
  'electiveCourseStatistic.electivePlan.electivePlanCourses.electivePlan',
  'electiveCourseStatisticPagination.items.electivePlan.electivePlanCourses.electivePlan',
  'myStudentEnrollment.electivePlan.electivePlanCourses.electivePlan',
  'myStudentEnrollmentPagination.items.electivePlan.electivePlanCourses.electivePlan',

  // 这个是 record 字段开始，union 查询。里面会组合超大

  ...(function buildIssueItem() {
    const subfixs = [
      // issuePagination.items.record 的特殊拉黑 begin

      // 目前系统用的 assetDetails 的地方是 model: 'asset_detail' 的 dataSource.assetDetails。不影响
      'assetFix.assetFixPictures',
      'assetPurchase.applyUser',
      'assetApply.applyUser',
      'assetFix.applyUser',
      'assetFix.assetDetail.user',
      'assetFix.assetDetail.asset',
      'assetFix.assetDetail.assetCategory',

      // 目前这个都是详情才用，跟 Pagination 联系不大
      'assetFix.asset.assetDetails',
      'assetFix.asset.assetCategory',

      'assetApply.asset.assetDetails',
      'assetApply.asset.assetCategory',

      'assetPurchase.assetPurchasePictures',
      'assetFix.assetPurchasePictures',

      'assetPurchase.applyDepartment',
      'assetApply.applyDepartment',

      'assetApply.assetApplyDetails',

      'assetFix.handleUser',
      'assetFix.fixUser',

      'assetPurchase.purchaseUser',
      // issuePagination items record end
    ];

    const prefixs = [
      'issuePagination',
      'myIssuePagination',
    ];
    const arr = [];
    _.map(subfixs, (subfix) => {
      _.map(prefixs, (prefix) => {
        arr.push(`${prefix}.items.record.${subfix}`);
      });
    });
    return arr;
  }()),

  // exam 的拉黑
  'examPagination.items.examRooms.examStudents',
  'examPagination.items.examRooms.department',
  'examPagination.items.examDetails.examRoom',
  'examPagination.items.examSubjects.department',

  // exam 的拉黑 end

  // 系统公告的content拉黑
  'systemAnnouncementPagination.items.systemAnnouncementContent',
  'systemAnnouncement.editor',

  // 这个不要查询
  'bookCategoryPagination.items.parents',

  // board模块的拉黑
  'boardMessagePagination.items.boardMessageContent',
  'boardBroadcastPagination.items.boardBroadcastDetail.content',

  // 专栏模块拉黑
  'myBoardSpecialArticlePagination.items.content',

  // 帮助中心
  'systemSupportDocuments.supportDocumentContent.content',
];

// 页面级 不进行自动创建语法的 scheme 语法，
// key值为页面路径，可以写正则，兼容detail页面之类的路径，
// 如：app/student/1051732/edit 可以写为 /app\/student\/\d+\/edit/
// fixme: 目前的实现在不开启语法优化（SERVICE_SCHEME_OPTIMIZE_MODULES）的情况下，无法拉黑
const hseAdmissionVocationBlackFields = [
  'hseAdmissionStudentPagination.items.studentEnroll.cultureSubjects',
  'hseAdmissionStudentPagination.items.studentEnroll.studentScores',
  'hseAdmissionStudentPagination.items.studentEnroll.studentWishRelations',
  'hseAdmissionStudentPagination.items.studentEnroll.studentTranscript',
  'hseAdmissionStudentPagination.items.hseStudentWish.studentTranscript',
  'hseAdmissionStudentPagination.items.hseStudentWish.studentWishRelations',

  'hseAdmissionStudent.studentEnroll.cultureSubjects',
  'hseAdmissionStudent.studentEnroll.studentScores',
  'hseAdmissionStudent.studentEnroll.studentWishRelations',
  'hseAdmissionStudent.studentEnroll.studentTranscript',
  'hseAdmissionStudent.studentEnroll.hseStudentTranscript.hseStudentEnrollSubjects',
  'hseAdmissionStudent.studentEnroll.hseStudentTranscript.studentScores',
  'hseAdmissionStudent.hseStudentWish.studentTranscript',
];
const pageSchemeTreeBlack = [
  {
    key: '/hse_enrollment/my_enter_high_progress',
    value: [
      'hseStudentTranscriptPagination.items.degree_result',
      'hseStudentTranscriptPagination.items.degree_result_code',
      'hseStudentTranscriptPagination.items.is_degree_pass',
      'hseStudentTranscriptPagination.items.is_specialty_pass',
      'hseStudentWishPagination.items.studentEnrollAdditions',
      'hseStudentWishPagination.items.studentTranscript',
      'middleThreeStudentEnrollPagination.items.is_return',
      'middleThreeStudentEnrollPagination.items.is_supplement',
      'middleThreeStudentEnrollPagination.items.specialtySubjects',
      'middleThreeStudentEnroll.hseStudentTranscript',
      'middleThreeStudentEnroll.specialtySubjects',
      'middleThreeStudentEnroll.is_return',
      'middleThreeStudentEnroll.is_supplement',
    ],
  },
  {
    key: '/hse_enrollment/hse_admission_vocation',
    value: hseAdmissionVocationBlackFields,
  },
  {
    key: '/hse_audit_vocation/\\d+/\\d+/list',
    value: hseAdmissionVocationBlackFields,
  },
  {
    key: /\/(book_borrow_log)|(book)|(borrow)/,
    value: [
      'bookBorrowLogPagination.items.user.student',
      'bookBorrowLogPagination.items.student.classes',
      'bookBorrowLogPagination.items.classes.teacher',
      'bookBorrowLogPagination.items.classes.department',
    ],
  },
  {
    key: /\/dashboard\/(normal|city|district|normal)/,
    value: [
      'bookBorrowLogPagination.items.user.student',
      'bookBorrowLogPagination.items.student',
    ],
  },
  {
    key: '/dashboard',
    value: [
      'issuePagination.items.record.assetPurchase.applyUser',
      'issuePagination.items.record.assetPurchase.applyDepartment',
      'issuePagination.items.record.assetPurchase.purchaseUser',
      'issuePagination.items.record.assetFix.fixUser',
      'issuePagination.items.record.assetFix.handleUser',
      'issuePagination.items.record.assetApply.applyUser',
      'issuePagination.items.record.assetApply.applyDepartment',
    ],
  },
  {
    key: /\/snom\/*/,
    value: [
      'transferLogGraduatePagination.items.user',
      'transferLogPagination.items.user',
    ],
  },
  {
    key: /^\/website_support_document\/support_document\/\d+$/,
    value: [
      'supportDocumentPagination.items.supportDocumentContent',
    ],
  },
  {
    key: '/support_document/user_question',
    value: [
      'userQuestionPagination.items.userQuestionContent',
      'userQuestionPagination.items.userQuestionReplies',
    ],
  },
  {
    key: '/support_document/support_document',
    value: [
      'supportDocumentPagination.items.supportDocumentContent',
    ],
  },
  {
    key: '/makerspace/production_manage',
    value: [
      'makerWorkPagination.items.makerWorkContent',
    ],
  },
  {
    key: '/subject_manage/course_manage',
    value: [
      'classesPagination.items.classLecturers',
    ],
  },
];

export const teacherTablesMap = {
  teacher_artistic_work: 'teacher',
  teacher_assessment: 'teacher',
  teacher_award: 'teacher',
  teacher_cert_type: 'teacher',
  teacher_contact_info: 'teacher',
  teacher_exchange: 'teacher',
  teacher_job_appointment: 'teacher',
  teacher_language: 'teacher',
  teacher_learn: 'teacher',
  teacher_medical_cert: 'teacher',
  teacher_overseas_train: 'teacher',
  teacher_paper: 'teacher',
  teacher_patent: 'teacher',
  teacher_profession_appointment: 'teacher',
  teacher_project: 'teacher',
  teacher_punish: 'teacher',
  teacher_qualified: 'teacher',
  teacher_research_report: 'teacher',
  teacher_reward: 'teacher',
  teacher_skills: 'teacher',
  teacher_standard: 'teacher',
  teacher_student_award: 'teacher',
  teacher_talent: 'teacher',
  teacher_teaching_info: 'teacher',
  teacher_train: 'teacher',
  teacher_treatment: 'teacher',
  teacher_work_exp: 'teacher',
  teacher_writings: 'teacher',
  teacher_year_check: 'teacher',
};

// 字段名跟实际表明的映射关系。
// 左为字段的 graphql 查询的属性对象名，右为实际的权限表明。表明对应为单数的，使用的时候会自动转化为复数。
export const modelTableMap = {
  visitor: 'user',
  admin: 'user',
  backendUser: 'user',
  // apply_users: 'user',
  // apply_user: 'user',
  // 映射时候，parent 是关键字，做不了单数映射，所以写多点，不管了
  parents: 'user',
  parent: 'user',

  myIssue: 'issue',
  todoIssue: 'issue',
  handledIssue: 'issue',
  processedIssue: 'issue_handler',

  currentDutyGroup: 'duty_group',

  userRoleCombine: 'user_role',
  userRoleCombineUser: 'user_role',

  systemMessage: 'message_statistic',
  eventMessage: 'message_statistic',

  classmateEnrollment: 'elective_plan_course',
  myStudentEnrollment: 'elective_enrollment',
  portalArticleCategory: 'category',
  myTeachClass: 'classes',
  myTeachClasses: 'classes',
};

// 自动填充分页时候的不存在的权限配置的字段名。直接白名单走过。
const autoAddAuthField = [
  'perPage',
  'total',
  'currentPage',
  'lastPage',
  'hasMorePages',
  // 'items',
];

// autoAddAuthField 满足的前提下 typeName 必须满足的规则。
// 大部分分页都是 Pagination 结尾，其他字符串的，就是特定的了。
const autoAddAuthFieldWithPageListNameArr = [
  /Pagination$/,
  'messageStatistics', // 消息中心的统计，集合的特定分页查询
  'systemMessageStatistics', // 消息中心的统计，集合的特定分页查询
];

// 角色写死的权限，自动填充的，无权限判断。
const roleAutoTypeField = [
  'children',
  'user_menus',
  // 'user_menu',
  // 'userMenus',
  // 'userMenu',
  'myQuestion',
  'menus',
  // 'userRole',
  // 'userRoles',
  // 'user_role',
  // 'user_roles',
];
// 没用的查询，前端能直接知道的，就不查询的那些表格字段信息。
const autoBalckField = [
  // 'area',
];

// 深度增加1的查询
const queryDeepAddOneArr = [
  // 特殊处理 electivePlan ，需要查询教师信息，放大。
  'electivePlan',
  'book',
  'electivePlanCourse',
];

function getQueryDeepAddTwoArr() {
  const deepArr = [
    // 特殊处理 boardDuty ，需要查询值日信息，放大。
    'boardDuty',
    'bookPagination',
    'bookBorrowLogPagination',
    'electivePlanCoursePagination',
    'electiveCourseSummaryPagination',
    'electiveCourseSummary',
    'electivePlanCourse',
    'electiveEnrollmentPagination',
    'electivePlan',
    'hseStudentWishPagination',
    'middleThreeSchoolAudit',
    'middleThreeStudentEnroll',
    'middleThreeDistrictAudit',
    'nationSchoolAudit',
    'nationDistrictAudit',
    'hseAdmissionStudentPagination',
    'hseAdmissionStudent',
    'hseAdmissionResult',
    'schoolHseAdmissionResult',
    'middleThreeStudentEnrollPagination',
    'hseStudentWish',
    'hseGraduateSchoolStatisticPagination',
    'user',
  ];

  if ('subject_manage' === DEFINE_MODULE) {
    deepArr.push('classesPagination');
  }
  return deepArr;
}
// 深度增加2的查询
const queryDeepAddTwoArr = getQueryDeepAddTwoArr();

// 是否有某个字段的权限。
export function hasAuthResource({
  // 挂载的类型的名字， typeName 指向是真正的权限表明。name 是挂载查询出该 fieldName 的对象的名字
  // name,
  // 用户权限
  resource = {},
  // 等于表名之类的, 如果这个时候，表明和实际的名字不同，需要做 modelTableMap 映射。
  typeName,
  // 等于字段名
  fieldName,
  // type,
  autoTableMap = true,
  // eslint-disable-next-line no-unused-vars
  forceNotSuper = false,
}) {
  // 以下的 if 顺序不能乱，不然可能会造成穿越判断的问题。有些权限是必须先判断的。

  // window.console.log('typeName', typeName, 'fieldName', fieldName);
  if (roleAutoTypeField.includes(typeName)) {
    return true;
  }

  if (autoBalckField.includes(typeName)) {
    // 当他的 typeName 为 items 的时候，就可以直接返回了。
    return false;
  }

  // 这里是成绩计算的计分公式那边的字段。特定写死。
  if (['key', 'value'].includes(fieldName)) {
    // 这几个是固定的查询，直接返回了。
    if ('formula' === typeName || 'expressionOutput' === typeName) {
      return true;
    }
  }

  if (autoAddAuthField.includes(fieldName)) {
    let flag = false;
    _.map(autoAddAuthFieldWithPageListNameArr, (elem) => {
      if (_.isRegExp(elem) && elem.test(typeName)) {
        flag = true;
      }
      else if (_.isString(elem) && elem === typeName) {
        flag = true;
      }
    });

    if (flag) {
      return true;
    }
    else if (__DEV__) {
      // 出书调试
      window.console.log('看看是否特定的列表', 'fieldName', fieldName, 'typeName', typeName);
    }
  }

  let tableName = typeName;
  if (autoTableMap) {
    tableName = modelTableMap[typeName] || typeName;
  }

  // 这里判断，需要判断子类是否存在权限。
  // // object类型，非最小节点，当表名和别名
  // if ('object' === type) {
  //   const objectName = `${pluralize(toUnderlineCamelCase(fieldName))}`;
  //   const objectSingleName = `${toUnderlineCamelCase(fieldName)}`;
  //   const objectType = `${pluralize(toUnderlineCamelCase(tableName))}`;
  //   const objectSingleType = `${toUnderlineCamelCase(tableName)}`;
  //   const keysString = _.keys(resource).join(',');
  //   const nameReg = new RegExp(`${objectName}\\.|${objectSingleName}\\.`);
  //   const typeReg = new RegExp(`${objectType}\\.|${objectSingleType}\\.`);
  //   // 在resource存在 user.或者users.字段，就证明有users的权限，会继续递归构建，否则就不构建
  //   return nameReg.test(keysString) || typeReg.test(keysString);
  // }

  // 匹配是否存在这个字段权限。
  const resourceName = `${pluralize(toUnderlineCamelCase(tableName))}.${fieldName}`;
  const resourceSingleName = `${toUnderlineCamelCase(tableName)}.${fieldName}`;
  const resourceAllName = `${pluralize(toUnderlineCamelCase(tableName))}.*`;
  const resourceSingleAllName = `${toUnderlineCamelCase(tableName)}.*`;
  // 兼容一些没有复数形式的单词pluralize函数转换不了 但是后端resource又强行加了s的情况
  // const resourceErrorName = `${pluralize(toUnderlineCamelCase(tableName))}s.*`;

  // if (resource[resourceErrorName]) {
  //   return true;
  // }
  if (resource[resourceAllName]) {
    return true;
  }
  if (resource[resourceSingleAllName]) {
    return true;
  }
  if (resource[resourceSingleName]) {
    return true;
  }
  if (resource[resourceName]) {
    return true;
  }
  if (__DEV__ || -1 < window.location.href.indexOf('debug')) {
    let ignoreFlag = false;
    const ignoreArr = [
      'user_roles.created_at',
      'user_roles.department_id',
    ];

    if (ignoreArr.includes(resourceName)) {
      // 这个被忽略了。
      ignoreFlag = true;
    }

    const startOfArr = [
      'users.',
      'areas.',
      'parents.',
      'admins.',
      'departments.',
    ];
    if (!ignoreFlag) {
      _.each(startOfArr, (start) => {
        if (!ignoreFlag && resourceName.startsWith(start)) {
          ignoreFlag = true;
        }
      });
    }

    // if (!ignoreFlag) {
    //   const visitor = _.get(getState(), 'visitor', {});
    //   window.console.warn(`[__DEV__] 不存在的权限 resourceName ${resourceName} , ${visitor.resource[resourceName]}, typeName ${typeName}`);
    // }
  }

  // 开发及超管模式下，会判断用户的权限，避免出现开发的时候字段不全需要后端总是配合的问题。
  // super user
  // TODO: 需要开放。不然调试阶段很麻烦
  // if (__DEV__) {
  //   const visitor = _.get(getState(), 'visitor', {});
  //   if (!forceNotSuper && _.get(CONST_DICT, 'users.user_type.USER_TYPE_SUPER') === _.get(visitor, 'current.user_type') * 1) {
  //     return true;
  //   }
  // }

  return false;
}

// 查询这个字段是否存在权限
export function checkIsConfigAuthNotWithAutoMap({
  // 挂载的类型的名字， typeName 指向是真正的权限表明。name 是挂载查询出该 fieldName 的对象的名字
  name,
  resource,
  // 等于表名之类的, 如果这个时候，表明和实际的名字不同，需要做 modelTableMap 映射。
  // typeName,
  // 等于字段名
  fieldName,
}) {
  // window.console.log('checkIsConfigAuthNotWithAutoMap name', name, 'resource', resource, 'fieldName', fieldName);
  const flag = hasAuthResource({
    resource,
    typeName: name,
    fieldName,
    autoTableMap: false,
    // eslint-disable-next-line no-unused-vars
    forceNotSuper: true,
  });
  // window.console.log('name', name, 'fieldName', fieldName, 'flag', flag);
  return flag;
}
// window.checkIsConfigAuthNotWithAutoMap = checkIsConfigAuthNotWithAutoMap;

/**
 * 获取当前页面需要拉黑的字段
 */
export function getPageBlackFileds() {
  const url = window.location.pathname;
  let blackFileds = [];

  for (let i = 0; i < pageSchemeTreeBlack.length; i += 1) {
    const info = pageSchemeTreeBlack[i];
    const path = info.key;

    if (_.isString(path) && 0 <= url.indexOf(path)) {
      blackFileds = info.value;
      break;
    }
    else if (_.isRegExp(path) && path.test(url)) {
      blackFileds = info.value;
      break;
    }
  }

  return blackFileds;
}

// 循环创建该类型下面的字段
function buildFileds({
  types,
  name,
  // 目前这个默认都是 OBJECT 了，可能存在的参数是 UNION ，不过目前有这个接口，但是还没时间去弄。用了个暴力点的手段解决。
  kind = 'OBJECT',
  typeName,
  deep = 1,
  maxDeep = GRAPH_LEVEL_MAX_DEEP,
  resource,
  branch = [],
  keyBranch = [],
  args = [],
  parentFieldTypeIsList = false,
}) {
  const fields = [];
  let fieldKeys = [];
  const fieldObject = _.find(types, {
    kind,
    name: typeName,
  });

  // window.console.info('fieldObject', fieldObject, 'typeName', typeName, 'name', name);
  // if (!fieldObject) {
  //   window.console.info('fieldObject', fieldObject, 'typeName', typeName, 'name', name);
  // }

  const fieldObjectFields = _.get(fieldObject, 'fields') || [];
  const fieldObjectPossibleTypes = _.get(fieldObject, 'possibleTypes') || [];
  const fieldObjectMapFields = [...fieldObjectFields, ...fieldObjectPossibleTypes];
  // if (_.get(fieldObject, 'possibleTypes')) {
  //   window.console.log('fieldObjectMapFields', fieldObjectMapFields);
  // }

  // 获取该页面需要拉黑的字段集合
  const pageBlackFileds = getPageBlackFileds();

  if (deep <= maxDeep && fieldObject && fieldObjectMapFields.length) {
    _.map(fieldObjectMapFields, (field) => {
      const childBranch = [].concat(branch).concat(field.name);
      const childBranchStr = childBranch.join('.');

      let childKeyBranch = [].concat(keyBranch).concat(field.name);
      if ('LIST' === _.get(field, 'type.kind')) {
        childKeyBranch = [].concat(keyBranch).concat(`${field.name}[i]`);
      }

      // window.console.log(childBranch.join('.'), 'field check black');
      // window.console.log(childKeyBranch.join('.'), 'field check key black');
      if (autoSchemeTreeBlackList.includes(childBranchStr)) {
        // window.console.log('field blacked SCALAR', childBranch.join('.'));
        // 已经到了多重冗余，不查询了
        // 已经到了黑名单，不查询了
        return false;
      }
      // 页面级别拉黑
      else if (pageBlackFileds.includes(childBranchStr)) {
        return false;
      }
      else if (autoSchemeTreeWhiteList.includes(childBranchStr)) {
        // 这里是白名单，不进行特殊的处理，直接下一步进行优化处理了。
      }
      else if (!['SCALAR', 'NON_NULL'].includes(_.get(field, 'type.kind'))) {
        // 判断是不是特定的嵌套，去掉重复的循环嵌套

        // 需要进行特殊的处理。
        const formatedChildBranchStr = childBranchStr.replace(/(\.items|Pagination)/ig, '');
        const formatedChildBranch = _.split(formatedChildBranchStr, '.');

        // 当前 1，直接放行
        if (1 === formatedChildBranch.length) {
          // 直接放行
        }
        // 直接判断是不是重复的。
        else if (_.uniq([].concat(formatedChildBranch)).length !== formatedChildBranch.length) {
          if (__DEV__) {
            // 这里的 siteSpecial 有父级的，所以可能死循环，也报错。但是不管他，让他输出吧。
            // 其他类型的父级是同类型的，都可能这样子。
            // window.console.log('不转换直接重复了', _.get(field, 'type.kind'), formatedChildBranchStr, 'childBranchStr', childBranchStr);
          }
          return false;
        }
        else {
          // 判断复数重复
          const pluralizeFormatedChildBranch = _.map(formatedChildBranch, (elem) => {
            return pluralize(elem);
          });
          if (_.uniq([].concat(pluralizeFormatedChildBranch)).length !== pluralizeFormatedChildBranch.length) {
            if (__DEV__) {
              // 这里的 siteSpecial 有父级的，所以可能死循环，也报错。但是不管他，让他输出吧。
              // 其他类型的父级是同类型的，都可能这样子。
              // window.console.log('复数直接重复了', _.get(field, 'type.kind'), formatedChildBranchStr, 'childBranchStr', childBranchStr);
            }
            return false;
          }
        }
        // window.console.log(_.get(field, 'type.kind'), formatedChildBranchStr, childBranchStr);
        // window.console.log(_.get(field, 'type.kind'), formatedChildBranchStr);
      }

      // 父级 field 是 LIST 类型时，检查父级下的 OBJECT field 在不在白名单内
      if (CONSTANTS.CURRENT_MODULE_PAGINATION_QUERY_SHOULD_OPTIMIZE && parentFieldTypeIsList) {
        const isPaginationSchema = _.endsWith(childBranch[0], 'Pagination');
        if (
          // 分页类型语法深度要超过 GRAPH_LEVEL_MAX_DEEP，才需要进行白名单校验
          isPaginationSchema && childBranch.length > GRAPH_LEVEL_MAX_DEEP
          // 非分页类型语法深度要超过 GRAPHQL_LIST_TYPE_LEVEL_WHITELIST_MIN_DEEP，才需要进行白名单校验
          || !isPaginationSchema && childBranch.length > GRAPHQL_LIST_TYPE_LEVEL_WHITELIST_MIN_DEEP
        ) {
          const fieldTypeIsObject = 'OBJECT' === _.get(field, 'type.kind');
          // 对象类型是不是不在白名单内
          if (fieldTypeIsObject && !_.includes(autoSchemeTreeWhiteList, childBranchStr)) {
            return false;
          }
        }
      }

      // 已经是原子字段了。
      if ('SCALAR' === _.get(field, 'type.kind') || 'SCALAR' === _.get(field, 'type.ofType.kind')) {
        if (__DEV__) {
          let checkIsConfigAuthNotWithAutoMapName = `${['items'].includes(name) ? typeName : name}`.replace(/(Export|List|Tree)$/, '');
          // 看看是不是前端已知映射字段
          checkIsConfigAuthNotWithAutoMapName = modelTableMap[checkIsConfigAuthNotWithAutoMapName] || checkIsConfigAuthNotWithAutoMapName;
          // 判断如果没权限，就进行记录，方便查看调试。
          if (!checkIsConfigAuthNotWithAutoMap({
            name: checkIsConfigAuthNotWithAutoMapName,
            resource,
            // typeName,
            fieldName: field.name,
          })) {
            // // 先看看是不是表和挂载名相同，如果不同，才增加。
            // if (pluralize(toUnderlineCamelCase(checkIsConfigAuthNotWithAutoMapName)) !== pluralize(toUnderlineCamelCase(typeName))) {
            //   // 再看看是不是直接教师忽略的那些表。
            //   if (teacherTablesMap[toUnderlineCamelCase(checkIsConfigAuthNotWithAutoMapName)]) {
            //     // 这里是教师的特殊表
            //   }
            //   else {
            //     // 这里存储下那些 尚未配置权限的字段
            //     noAuthObjArr.push(checkIsConfigAuthNotWithAutoMapName);
            //     noAuthFieldArr.push(`${checkIsConfigAuthNotWithAutoMapName}.${field.name}`);
            //   }
            // }

            // 判断是不是存在该权限。这种情况下面，不同角色下面，应该经常的出现
            // 再看看是不是直接教师忽略的那些表。
            if (teacherTablesMap[toUnderlineCamelCase(checkIsConfigAuthNotWithAutoMapName)]) {
              // 这里是教师的特殊表
            }
            else {
              // 这里存储下那些 尚未配置权限的字段
              noAuthObjArr.push(checkIsConfigAuthNotWithAutoMapName);
              noAuthFieldArr.push(`${checkIsConfigAuthNotWithAutoMapName}.${field.name}`);
            }
          }
        }

        if (hasAuthResource({
          // name,
          resource,
          typeName,
          fieldName: field.name,
        })) {
          fieldKeys.push({
            type: _.get(field, 'type.ofType.name') || _.get(field, 'type.name'),
            key: childKeyBranch.slice(1).join('.'),
          });
          if (field.name) {
            fields.push(field.name);
          }
          return true;
        }
        return false;
      }

      // 对象类型的语法 build
      if ('OBJECT' === _.get(field, 'type.kind') || 'OBJECT' === _.get(field, 'type.ofType.kind')) {
        // window.console.info('field.name', field.name);

        // 加回 object 是否拥有权限的判断，不过这段代码有bug，后面需要进行特殊处理才能判断下。
        // // 如果是object类型，先判断当前object有没权限再进行递归
        // if (!hasAuthResource({
        //   // name,
        //   resource,
        //   typeName,
        //   fieldName: field.name,
        //   type: 'object',
        // })) {
        //   return false;
        // }

        const {
          scheme,
          fieldKeys: elemFieldKeys,
          fields: elemFields,
          // eslint-disable-next-line no-use-before-define
        } = buildScheme({
          types,
          name: field.name,
          typeName: _.get(field, 'type.ofType.name') || _.get(field, 'type.name'),
          // 这里是同级别的，不需要 deep 加深
          deep: deep + 1,
          maxDeep,
          resource,
          args: _.get(field, 'args'),
          branch: childBranch,
          keyBranch: childKeyBranch,
          parentFieldTypeIsList: 'LIST' === _.get(field, 'type.kind'),
        });

        if (elemFields && elemFields.length) {
          fieldKeys.push({
            // 语法优化，增加括号，把算是优先级弄好可阅读
            type: 'LIST' === _.get(field, 'type.kind') ? 'LIST' : (_.get(field, 'type.ofType.kind') || _.get(field, 'type.kind')),
            key: childKeyBranch.slice(1).join('.'),
          });

          fieldKeys = [].concat(fieldKeys).concat(elemFieldKeys);
          if (scheme) {
            fields.push(scheme);
          }
          return true;
        }
        return false;
      }

      // TODO add union type
      if ('UNION' === _.get(field, 'type.kind')) {
        const unionName = _.get(field, 'name');
        const unionTypeName = _.get(field, 'type.name');

        // todo 直接使用 buildFileds 获取数据。
        // const {
        //   fields: unionFields,
        //   fieldKeys: unionFieldKeys,
        //   argsObj: unionArgsObj,
        // } = buildFileds({
        //   types,
        //   kind: 'UNION',
        //   name: unionName,
        //   typeName: unionTypeName,
        //   deep: deep + 1,
        //   maxDeep,
        //   resource,
        //   branch: [branch, unionName],
        //   keyBranch: [branch, unionName],
        //   args: [],
        // });

        // window.console.log('unionName', unionName, 'unionTypeName', unionTypeName, 'unionFields', unionFields, 'unionFieldKeys', unionFieldKeys, 'unionArgsObj', unionArgsObj);

        const unionFieldObject = _.find(types, {
          kind: 'UNION',
          name: unionTypeName,
        });
        const unionPossibleTypes = _.get(unionFieldObject, 'possibleTypes', []);

        // window.console.log('unionTypeName', unionTypeName, 'unionFieldObject', unionFieldObject, 'unionPossibleTypes', unionPossibleTypes);

        if (_.isArray(unionPossibleTypes) && unionPossibleTypes.length) {
          const unionSchemeFieldsArray = [];
          _.map(unionPossibleTypes, (elem) => {
            // 这个目前应该肯定是 object，不然就得等接口再写语法。
            const possibleTypesElemType = _.get(elem, 'kind');
            if ('OBJECT' !== possibleTypesElemType) {
              window.console.log('这里为 union 的多重查询，但是目前不是 OBJECT 类型的还没创建。需要等有新接口是这个类型才能创建');
              return;
            }

            // 枚举类型的名称。
            const possibleTypesElemName = _.get(elem, 'name');

            const possibleTypesElemNameChildBranch = [...branch, unionName, possibleTypesElemName];
            const possibleTypesElemNameChildBranchStr = possibleTypesElemNameChildBranch.join('.');

            // 枚举里面，继续判断黑名单
            if (autoSchemeTreeBlackList.includes(possibleTypesElemNameChildBranchStr)) {
              // window.console.log('枚举的黑名单测试成功');
              // window.console.log('field blacked SCALAR', childBranch.join('.'));
              // 已经到了多重冗余，不查询了
              // 已经到了黑名单，不查询了
              return false;
            }
            // 页面级别拉黑
            else if (pageBlackFileds.includes(childBranchStr)) {
              return false;
            }

            // const possibleTypesElemNameObject = _.find(types, {
            //   name: possibleTypesElemName,
            // });

            // 开始创建这个枚举类型名称的语法
            // window.console.info('field.name', field.name);
            const {
              scheme,
              // eslint-disable-next-line no-unused-vars
              fieldKeys: elemFieldKeys,
              // eslint-disable-next-line no-unused-vars
              fields: elemFields,
              // eslint-disable-next-line no-use-before-define
            } = buildScheme({
              types,
              name: possibleTypesElemName,
              typeName: possibleTypesElemName,
              // 这里是同级别的，不需要 deep 加深
              deep,
              // deep: deep + 1,
              maxDeep,
              resource,
              // todo fixed args
              args: [],
              branch: [...childBranch, possibleTypesElemName],
              keyBranch: [...childKeyBranch, possibleTypesElemName],
              parentFieldTypeIsList: 'LIST' === _.get(field, 'type.kind'),
            });

            // if (__DEV__ && __PROD__) {
            //   window.console.log(
            //     'possibleTypesElemType', possibleTypesElemType,
            //     'possibleTypesElemName', possibleTypesElemName,
            //     'scheme', scheme,
            //     'elemFieldKeys', elemFieldKeys,
            //     'elemFields', elemFields,
            //   );
            // }

            if (scheme && fields.length) {
              unionSchemeFieldsArray.push(scheme.replace(/^([\s\n]+)?([^\s\n]{1})/, '$1 ...on $2'));
            }
          });

          const unionSchemeFieldsStr = unionSchemeFieldsArray.join('\n');
          // window.console.log('unionSchemeFieldsStr', unionSchemeFieldsStr);

          if (unionSchemeFieldsStr) {
            fieldKeys.push({
              type: 'LIST' === _.get(field, 'type.kind') ? 'LIST' : (_.get(field, 'type.ofType.kind') || _.get(field, 'type.kind')),
              key: childKeyBranch.slice(1).join('.'),
            });

            // fieldKeys = [].concat(fieldKeys).concat(elemFieldKeys);

            if (unionSchemeFieldsStr) {
              fields.push(` ${unionName} { ${unionSchemeFieldsStr} }`);
            }

            return true;
          }
        }
      }

      // window.console.warn(`graphql 未知 kind:${_.get(field, 'type.kind')}, name: ${name}, field.name: ${field.name}, deep: ${deep}`);
      // window.console.log('filed: ', field, 'childBranchStr', childBranchStr, 'childBranch', childBranch, '\n\n');

      return false;
    });
  }

  const argsObj = {};

  _.each(args, (elem) => {
    const type = _.get(elem, 'type.ofType.name') || _.get(elem, 'type.name') || '';
    if (elem.name && type) {
      argsObj[elem.name] = type;
    }
  });

  if (__DEV__ && __PROD__ && _.get(noAuthObjArr, 'length')) {
    window.console.log('部分权限不存在，请查看是否已经配置。', '查阅 _.uniq(debugAddSave.noAuthObjArr) 和 _.uniq(debugAddSave.noAuthFieldArr)');
  }

  return {
    argsObj,
    fieldKeys,
    fields,
  };
}

// 创建语法，这个考虑全局权限
export function buildScheme({
  types,
  name,
  typeName,
  deep = 1,
  maxDeep = GRAPH_LEVEL_MAX_DEEP,
  resource,
  branch = [],
  keyBranch = [],
  args = [],
  parentFieldTypeIsList = false,
}) {
  // window.console.log('typeName', typeName);
  const {
    fields,
    fieldKeys,
    argsObj,
  } = buildFileds({
    types,
    name,
    typeName,
    deep,
    maxDeep,
    resource,
    branch,
    keyBranch,
    args,
    parentFieldTypeIsList,
  });

  const argsStrArr = [];
  _.each(_.entries(argsObj), ([k]) => {
    argsStrArr.push(`${k}: $${k}`);
  });
  let argsStr = '';
  if (argsStrArr && argsStrArr.length) {
    argsStr = `(${argsStrArr.join(', ')})`;
  }
  if (__DEV__ && __PROD__) {
    window.console.log('argsStr', argsStr);
  }

  const prefixSpace = _.map(_.range(0, deep), '').join('  ');
  // const scheme = `\n${prefixSpace}${name} ${argsStr} {\n  ${prefixSpace}${fields.join('  ')}\n${prefixSpace}}`.replace(/\s+\n/ig, '\n');
  const scheme = `\n${prefixSpace}${name} {\n  ${prefixSpace}${fields.join('  ')}\n${prefixSpace}}`.replace(/\s+\n/ig, '\n');

  // if (__DEV__) {
  if (__DEV__ && __PROD__) {
    window.console.log('fieldKeys', fieldKeys);
    // window.console.log('scheme', scheme);
  }

  // if (_.entries(argsObj).length) {
  //   window.console.log('argsObj', name, argsObj);
  // }

  return {
    scheme,
    fields,
    // fieldKeys,
    argsObj,
  };
}

// 获取查询的最大层级
export function getMaxDeep({
  name,
}) {
  // 如果这里是分页类型，这个没算作一层，最大层级就加一。
  let maxDeep = `${name || ''}`.endsWith('Pagination') ? GRAPH_LEVEL_MAX_DEEP + 1 : GRAPH_LEVEL_MAX_DEEP;
  if (_.includes(queryDeepAddOneArr, name)) {
    maxDeep = GRAPH_LEVEL_MAX_DEEP + 1;
  }

  if (_.includes(queryDeepAddTwoArr, name)) {
    maxDeep = GRAPH_LEVEL_MAX_DEEP + 2;
  }

  return maxDeep;
}

// 通过 name 查询最小层级，这个是主动查询。
export function buildMinifyAuthScheme({
  name,
  auth,
  ...option
}) {
  const state = getState();
  const graphqlState = state.graphql;
  const visitorState = state.visitor;
  const resource = visitorState.resource;
  const queryTypeField = _.find(_.get(graphqlState, 'queryObject.fields', []), { name });
  const typeName = _.get(queryTypeField, 'type.ofType.name', '') || _.get(queryTypeField, 'type.name', '');
  let miniAuthResource = resource;
  if (auth) {
    miniAuthResource = getMiniDependAuth(auth);
  }

  let scheme = '';
  if (option.bfs) {
    scheme = buildSchemeBFS({
      types: graphqlState.typesObject,
      name,
      typeName,
      deep: 1,
      args: _.get(queryTypeField, 'args') || [],
      maxDeep: option.deep || getMaxDeep({ name }),
      resource: miniAuthResource,
      parentFieldTypeIsList: 'LIST' === _.get(queryTypeField, 'type.kind'),
      maxComplexity: option.complexity,
    });
  }
  else {
    scheme = buildScheme({
      types: graphqlState.typesObject,
      name,
      typeName,
      deep: 1,
      args: _.get(queryTypeField, 'args') || [],
      maxDeep: getMaxDeep({ name }),
      branch: name,
      keyBranch: name,
      resource: miniAuthResource,
      parentFieldTypeIsList: 'LIST' === _.get(queryTypeField, 'type.kind'),
    });
  }

  return {
    scheme,
    resource: miniAuthResource,
  };
}
// window.buildMinifyAuthScheme = buildMinifyAuthScheme;

export default 'util_graphql';
