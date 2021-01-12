// import CONSTANTS from '../constants';

export default function (url, options = {}) {
  if (DEFINE_USE_ALIYUN_OSS) {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
    }
    else if (url) {
      const aliyunOssBase = `https://${DEFINE_ALIYUN_OSS_BUCKET}.${DEFINE_ALIYUN_OSS_REGION}.aliyuncs.com/`;
      return `${aliyunOssBase}${url}`;
    }
    return '';
  }

  const { width: w, height: h, q = 50, type = 'image' } = options;
  let newUrl = url || '';
  if (!url) {
    return '';
  }

  if (!url.indexOf) {
    return url;
  }

  // if (0 > url.indexOf('/')) {
  if (!url.startsWith('http')) {
    newUrl = DEFINE_UPLOAD_PREFIX + url;
  }
  else {
    // 后期再处理 cdn 问题。
  }

  if ('image' !== type) {
    return newUrl;
  }

  let query = '';
  if (w || h) {
    query = 'imageView2/2';
  }
  if (w) {
    query += `/w/${w}`;
  }
  if (h) {
    query += `/h/${h}`;
  }
  if (w || h) {
    query += `/q/${q}`;
  }

  if (newUrl && query) {
    if (-1 < newUrl.indexOf('?')) {
      return `${newUrl}&${query}`;
    }
    return `${newUrl}?${query}`;
  }
  return newUrl;
}
