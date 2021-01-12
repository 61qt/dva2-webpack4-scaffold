import _ from 'lodash';

class CustomMsgError extends Error {
  constructor(msg) {
    // { name: '这个是标题来的' }
    super(msg);
    this.message = _.get(msg, 'name') || _.get(msg, 'data.name') || msg;
    const subfix = `_${_.get(msg, 'name', '')}`;
    this.name = `DetectError${subfix}`;
  }
}

class DetectError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const subfix = '';
    this.name = `DetectError${subfix}`;
  }
}

class LogoutError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const user = _.get(msg, 'user') || '';
    const subfix = user ? `_${user}` : '';
    this.name = `LogoutError${subfix}`;
  }
}

class PageNotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const path = _.get(msg, 'path') || _.get(msg, 'config.url') || '';
    const subfix = path ? `_${path}` : '';
    this.name = `PageNotFoundError${subfix}`;
  }
}

class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const path = _.get(msg, 'path') || _.get(msg, 'config.url') || '';
    const subfix = path ? `_${path}` : '';
    this.name = `NotFoundError${subfix}`;
  }
}

class RequestUncatchError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const path = _.get(msg, 'path') || _.get(msg, 'config.url') || '';
    const subfix = path ? `_${path}` : '';
    this.name = `RequestUncatchError${subfix}`;
  }
}

class NetworkRequestFailedError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const path = _.get(msg, 'path') || _.get(msg, 'config.url') || '';
    const status = _.get(msg, 'status_code') || _.get(msg, 'code') || _.get(msg, 'data.code') || '';
    let subfix = status ? `_${status}` : '';
    subfix = path ? `${subfix}_${path}` : subfix;
    this.name = `NetworkRequestFailedError${subfix}`;
  }
}

class NetworkRequestOfflineError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const path = _.get(msg, 'path') || _.get(msg, 'config.url') || '';
    const status = _.get(msg, 'status_code') || _.get(msg, 'code') || _.get(msg, 'data.code') || '';
    let subfix = status ? `_${status}` : '';
    subfix = path ? `${subfix}_${path}` : subfix;
    this.name = `NetworkRequestOfflineError${subfix}`;
  }
}

class SystemSyntaxError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const path = _.get(msg, 'path') || _.get(msg, 'config.url') || '';
    const subfix = path ? `_${path}` : '';
    this.name = `SystemSyntaxError${subfix}`;
  }
}

class ServerRequestError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const path = _.get(msg, 'path') || _.get(msg, 'config.url') || '';
    const status = _.get(msg, 'status_code') || _.get(msg, 'code') || _.get(msg, 'data.code') || '';
    let subfix = status ? `_${status}` : '';
    subfix = path ? `${subfix}_${path}` : subfix;
    this.name = `ServerRequestError${subfix}`;
  }
}

class UserRequestError extends Error {
  constructor(msg) {
    super(msg);
    this.message = _.get(msg, 'data.msg') || _.get(msg, 'data.data.msg') || msg;
    const path = _.get(msg, 'path') || _.get(msg, 'config.url') || '';
    const status = _.get(msg, 'status_code') || _.get(msg, 'code') || _.get(msg, 'data.code') || '';
    let subfix = status ? `_${status}` : '';
    subfix = path ? `${subfix}_${path}` : subfix;
    this.name = `UserRequestError${subfix}`;
  }
}

export {
  CustomMsgError,
  DetectError,
  LogoutError,
  PageNotFoundError,
  NotFoundError,
  RequestUncatchError,
  NetworkRequestFailedError,
  ServerRequestError,
  SystemSyntaxError,
  UserRequestError,
  NetworkRequestOfflineError,
};
