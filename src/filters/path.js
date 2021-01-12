import _ from 'lodash';
import Qs from 'qs';
import pathToRegexp from 'path-to-regexp';

const routeObj = {};
// window.routeObj = routeObj;

const buildUrl = (url, options = {}, query = {}) => {
  const pathname = pathToRegexp.compile(url)(options);
  let queryStr = '';
  if (_.isPlainObject(query) && !_.isEmpty(query)) {
    queryStr = Qs.stringify(query);
  }

  return `${pathname}${queryStr && 0 > pathname.indexOf('?') ? '?' : ''}${queryStr}`;
};

const configRouteObj = (newRouteObj) => {
  _.assign(routeObj, newRouteObj);
  return routeObj;
};

export {
  buildUrl,
  configRouteObj,
};

const pathCache = {};
export default function path(name, options, query) {
  const key = `name_${name}_options_${JSON.stringify(options)}_query_${JSON.stringify(query)}`;
  if (key in pathCache) {
    return pathCache[key];
  }
  const module = DEFINE_MODULE;
  const elem = _.get(routeObj, `${name}`);
  if (elem && 'string' === typeof elem.url) {
    let url = '';
    try {
      url = buildUrl(elem.url, options, query);
      pathCache[key] = url;
    }
    catch (e) {
      if (window.console && window.console.error) {
        window.console.error('生成链接出错');
        window.console.info('name', name, 'options', options, 'query', query);
      }
    }
    return url;
  }
  else {
    if (window.console && window.console.error && __DEV__ && __PROD__) {
      if (elem) {
        window.console.log('filter path elem', elem, elem.url);
      }
      window.console.warn(`[warn][filters path] build path error, please check name: ${name}, options: ${options}, module: ${module}`);
    }
    return '';
  }
}

