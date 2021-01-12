import Qs from 'qs';
import { http, OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL, API_DOMAIN_WITH_PREFIX_AND_PROTOCOL } from '@/services/_factory';

// const model = 'common';

const Service = {};

Service.graphqlNormal = ({ schema, variables, model }, options = {}, config = {}) => {
  let path = options.path || DEFINE_GRAPHQL_PATH;
  if (model) {
    path = _.includes(path, '?') ? `${path}&f=${model}` : `${path}?f=${model}`;
  }

  return http.post(path, {
    query: schema.replace(/\n/ig, ' '),
    variables: {
      ...variables,
    },
  }, {
    ...config,
  });
};

Service.loginToken = (config = {}) => {
  return http.get(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/login_token`, config);
};

/*
value example
{
  username: 'username',
  password: 'password',
}
*/
Service.loginUserType = (value, config = {}) => {
  return http.post(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/auth/user_types`, Qs.stringify(value), {
    skipAuthorization: true,
    skipExpireCheck: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    ...config,
  });
};

// // 没用。
// Service.qiniuToken = (config = {}) => {
//   return http.get(`/${model}/qiniu_token`, config);
// };

Service.aliyunStsToken = (config = {}) => {
  return http.get('/aliyun/sts_token', config);
};

// Service.qiniuUpload = (values, config = {}) => {
//   return http.post('https://up.qbox.me', values, {
//     skipAuthorization: true,
//     skipExpireCheck: true,
//     ...config,
//   });
// };

Service.login = (values, config = {}) => {
  // 登录，不需要带 token
  return http.post(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/login`, values, {
    skipAuthorization: true,
    skipExpireCheck: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    ...config,
  });
};

Service.register = (values, config = {}) => {
  return http.post(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/register`, values, {
    skipAuthorization: true,
    skipExpireCheck: true,
    ...config,
  });
};

Service.parentAssociate = (values, config = {}) => {
  return http.post(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/parent_associate`, values, {
    skipAuthorization: true,
    skipExpireCheck: true,
    ...config,
  });
};

Service.resetPassword = (values, config = {}) => {
  return http.post(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/reset_password`, values, {
    skipAuthorization: true,
    skipExpireCheck: true,
    ...config,
  });
};

Service.changePassword = (values, config = {}) => {
  return http.put('/user/password', values, {
    ...config,
  });
};

Service.refreshToken = (values = {}, config = {}) => {
  // 进行 token 的更新。不需要验证 token 是不是失效。
  return http.post('/token/refresh', values, {
    skipExpireCheck: true,
    ...config,
  });
};

Service.refreshOperationsToken = (values = {}, config = {}) => {
  // 进行 token 的更新。不需要验证 token 是不是失效。
  return http.post('operations/token/refresh', values, {
    skipExpireCheck: true,
    ...config,
  });
};

Service.ticketToken = (ticket, config = {}) => {
  // ticket 登录，不需要带 token
  return http.get(`/token/${ticket}`, {
    skipAuthorization: true,
    skipExpireCheck: true,
    ...config,
  });
};

Service.downloadProcess = (jobid, config = {}) => {
  return http.get(`/enrollment/job/progress/${jobid}/`, {
    ...config,
  });
};

Service.getAuthCode = () => {
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/dog/getAuthCode`, {
    skipAuthorization: true,
    skipExpireCheck: true,
  });
};

Service.getChallenge = () => {
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/dog/getChallenge`, {
    skipAuthorization: true,
    skipExpireCheck: true,
  });
};

// values { dogId, iv, cipher }
Service.verify = (values) => {
  return http.post(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/dog/verify`, values, {
    skipAuthorization: true,
    skipExpireCheck: true,
  });
};

Service.sms = (values, config = {}) => {
  return http.post(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/sms`, values, {
    skipAuthorization: true,
    skipExpireCheck: true,
    ...config,
  });
};

Service.healthScoreStandard = (fileName) => {
  // 这个是本地保存好的健康数据，存放在 public 中
  // eslint-disable-next-line prefer-template
  const base = `//${location.hostname}${location.port ? ':' + location.port : ''}`;
  return http.get(`${base}/${DEFINE_WEB_PREFIX}/${fileName}`, {
    skipAuthorization: true,
    skipExpireCheck: true,
  });
};

// h5统一应用中心接口begin
Service.banner_config = () => {
  // 首页banner图
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/mobile/banner_config`);
};

Service.me = () => {
  // 我的信息判断用户类型
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/mobile/me`);
};

Service.userinfo = () => {
  // 用户信息
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/mobile/user_info`);
};

Service.parents = () => {
  // 学生获取我的家长(只有学生才允许访问)
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/mobile/parents`);
};

Service.children = () => {
  // 学生获取我的家长(只有学生才允许访问)
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/mobile/children`);
};

Service.systemCategory = () => {
  // 所有系统的接口
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/system_category`);
};

// h5统一应用中心接口end

Service.notify = (values) => {
  return http.post(`${DEFINE_MODULE}/notify`, values);
};

// 查询用户申请记录
Service.getAccountsLog = (value) => {
  return http.get(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/accounts?user_type=${value.user_type}&id_number=${value.id_number}`, {
    skipAuthorization: true,
    skipExpireCheck: true,
  });
};

// 普通账户申请
Service.postAccount = (values, config = {}) => {
  return http.post(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/accounts`, values, {
    skipAuthorization: true,
    skipExpireCheck: true,
    ...config,
  });
};

// 已有账户激活
Service.postAccountActivate = (values, config = {}) => {
  return http.post(`${OPENAPI_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/accounts/activate`, values, {
    skipAuthorization: true,
    skipExpireCheck: true,
    ...config,
  });
};

Service.getDepartment = () => {
  return http.get(`${API_DOMAIN_WITH_PREFIX_AND_PROTOCOL}/json/school.json`, {
    skipAuthorization: true,
    skipExpireCheck: true,
  });
};


export default Service;
