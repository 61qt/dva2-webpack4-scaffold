
let addDebug = false;
if (__DEV__) {
  addDebug = true;
}
if (-1 < `${location.search || ''}`.indexOf('debug')) {
  addDebug = true;
}

// eslint-disable-next-line import/prefer-default-export
export function getDebugMode() {
  return addDebug;
}

window.debugAdd = function debugAdd(key, memory) {
  if (-1 < `${location.search || ''}`.indexOf('debug')) {
    addDebug = true;
    // eslint-disable-next-line no-underscore-dangle
    window.__DEV__ = true;
    // eslint-disable-next-line no-underscore-dangle
    window.__PROD__ = false;
  }

  if (!addDebug) {
    return;
  }

  window.debugAddSave = window.debugAddSave || {};
  window.debugAddSave[key] = memory;

  // 如果是 react 组件
  if ('render' in memory && 'function' === typeof memory.render) {
    // eslint-disable-next-line no-underscore-dangle
    let _originComponentWillUnmount = () => {
      // do nothing
    };
    // 如果有组件移除的生命周期，那就进行劫持，挂载到 _componentWillUnmount 上面。
    if ('componentWillUnmount' in memory && 'function' === typeof memory.componentWillUnmount) {
      // eslint-disable-next-line
      _originComponentWillUnmount = memory.componentWillUnmount;
    }

    // eslint-disable-next-line no-param-reassign
    memory.componentWillUnmount = function componentWillUnmount(...args) {
      // eslint-disable-next-line no-underscore-dangle
      if ('function' === typeof _originComponentWillUnmount) {
        // eslint-disable-next-line no-underscore-dangle
        _originComponentWillUnmount.apply(memory, args);
      }
      delete window.debugAddSave[key];
    };
  }
};
