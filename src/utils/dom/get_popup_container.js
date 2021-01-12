import $ from 'jquery';

// 按照目前的布局，挂载在 document.body 上的 antd popup element，页面滚动后会导致对齐问题
// 应该挂载在页面的可滚动元素中， todo: 后面改改
export function getDefaultPopupContainer() {
  return document.body;
}

export function getModalPopupContainer() {
  const container = $('.ant-modal-root .ant-modal-wrap').first();
  if (container.length) {
    return container[0];
  }

  return getDefaultPopupContainer();
}
