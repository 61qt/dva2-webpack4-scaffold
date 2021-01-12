import _ from 'lodash';
import jQuery from 'jquery';

// export const metaFlex = (rootFontSize = 16, designClientWidth = 750) => {
export const metaFlex = (rootFontSize = 16, designClientWidth = 375) => {
  const debugInfo = {};
  window.debugInfo = debugInfo;
  let meta = document.querySelector('meta[name="viewport"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.appendChild(meta);
  }

  let originScale = 1;
  const viewPortContent = meta.getAttribute('content');
  if (viewPortContent) {
    const viewPortQuery = _.map(viewPortContent.split(','), values => values.split('='));
    const viewPortParams = _.fromPairs(viewPortQuery);
    originScale = viewPortParams['initial-scale'] * 1 || 1;
  }

  const docElement = document.documentElement;
  const body = document.body;
  // const originClientWidth = docElement.clientWidth * originScale;
  const originClientWidth = body.clientWidth * originScale;
  debugInfo.originClientWidth = originClientWidth;
  const flexRatio = designClientWidth / originClientWidth;
  debugInfo.flexRatio = flexRatio;
  // const screenPixelRatio = unusual() ? 1 : 1 / window.devicePixelRatio;
  // meta.setAttribute('content', `width=device-width,user-scalable=no,initial-scale=${screenPixelRatio},maximum-scale=${screenPixelRatio},minimum-scale=${screenPixelRatio}`);

  // Detect support for meta viewport scaling
  const fontSize = originClientWidth === docElement.clientWidth
    ? rootFontSize * docElement.clientWidth / designClientWidth
    : rootFontSize / flexRatio * window.devicePixelRatio;

  debugInfo.fontSize = fontSize;
  debugInfo.devicePixelRatio = window.devicePixelRatio;

  docElement.style.fontSize = `${fontSize}px`;
  docElement.style.fontSize = `${fontSize}px!important`;
  jQuery('head').append(`<style>
    html {
      responsive: true;
      font-size: ${fontSize}px;
      font-size: ${fontSize}px!important;
    }
  </style>`);
  docElement.style.display = 'none';
  docElement.setAttribute('dpr', fontSize / 16);

  // Force rerender - important to new Android devices
  // eslint-disable-next-line no-unused-expressions
  docElement.clientWidth;
  docElement.style.display = '';
};

// export default function responsive(rootFontSize = 16, designWidth = 750) {
export default function responsive(rootFontSize = 16, designWidth = 375) {
  metaFlex(rootFontSize, designWidth);
}

export function unusual() {
  if (navigator.appVersion.match(/(iphone|ipad|ipod)/ig)) {
    return false;
  }

  const userAgent = navigator.userAgent;
  const webKitVersionMatch = userAgent.match(/Android[\S\s]+AppleWebkit\/(\d{3})/i);
  if (webKitVersionMatch && 534 < webKitVersionMatch[1]) {
    return false;
  }

  const UCVersionMatch = navigator.userAgent.match(/U3\/((\d+|\.){5,})/i);

  if (UCVersionMatch) {
    const UCVersion = parseInt(UCVersionMatch[1].split('.').join(''), 10);
    if (80 > UCVersion) {
      return true;
    }
  }

  return false;
}
