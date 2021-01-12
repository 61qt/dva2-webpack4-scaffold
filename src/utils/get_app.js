import _ from 'lodash';
import { createStore } from 'redux';

function getApp() {
  return window.app;
}

function getStore() {
  return _.get(getApp(), '_store') || createStore((state) => {
    return state;
  });
}

function getState() {
  const store = getStore();
  if (store.getState) {
    return store.getState();
  }
  else {
    return {};
  }
}

export default getApp;

export {
  getStore,
  getState,
};
