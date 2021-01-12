// 七牛上传组件，不进行压缩。要想压缩，需要在在传入之前进行压缩，所以可以另外增加组件。
import { message } from 'antd';
import _ from 'lodash';
import UUID from 'uuid';
import { DEFAULT_CROPPER_OPTIONS, getUrl } from '@/npm/@edu_components_form/file_uploader';
import User from '../utils/user';
import { http } from '../services/_factory';
import ServicesCommon from '../services/common';


/* eslint-disable */
export function getfilesize(size) {
  if (!size) {
    return "";
  }
  var num = 1024.00;
  if (size < num) {
    return size + "B";
  }
  if (size < Math.pow(num, 2)) {
    return (size / num).toFixed(2) + "KB";
  }
  if (size < Math.pow(num, 3)) {
    return (size / Math.pow(num, 2)).toFixed(2) + "MB";
  }
  if (size < Math.pow(num, 4)) {
    return (size / Math.pow(num, 3)).toFixed(2) + "G";
  }

  return (size / Math.pow(num, 4)).toFixed(2) + "T";
}

const DEFAULTS = {
  maxSize: 1024 * 1024 * 20,
  uploadUrl: DEFINE_UPLOAD_PATH,
  autoGetToken: () => {
    return Promise.resolve({
      token: User.token,
    });
  },
};

let ServiceOptions = _.defaultsDeep({}, DEFAULTS);

function getFileSize(file, callback) {
  const reader = new FileReader();
  reader.onload = function onload(event) {
    callback(event.total);
  };

  reader.readAsDataURL(file);
}

export function aliyunOssUpload(file, options) {
  const data = _.get(options, 'data', {});
  const Credentials = _.get(data, 'Credentials', {});

  const client = new OSS({
    region: DEFINE_ALIYUN_OSS_REGION,
    bucket: DEFINE_ALIYUN_OSS_BUCKET,
    stsToken: _.get(Credentials, 'SecurityToken'),
    accessKeyId: _.get(Credentials, 'AccessKeyId'),
    accessKeySecret: _.get(Credentials, 'AccessKeySecret'),
    ...Credentials,
  });

  const name = `${_.get(options, 'lastModified', '') || _.get(file, 'lastModified', '')}-${_.get(options, 'name', '') || _.get(file, 'name', '')}`;
  const progress = _.get(options, 'onProgress') || _.get(options, 'progress') || _.get(options, 'onUploadProgress');
  const cancelToken = _.get(options, 'cancelToken');
  // 返回一个阿里云实例，用来取消请求
  if (typeof cancelToken === 'function') {
    cancelToken(client);
  }

  return client.multipartUpload(name, file, {
    progress,
  }).then((res) => {
    return res;
  }).catch((rej) => {
    return Promise.reject(rej);
  });
}

function normalPost(file, options) {
  const formData = new FormData();
  if (options.key && _.isString(options.key)) {
    formData.append('key', options.key);
  }

  let fileArr = [];
  if (_.isArray(file)) {
    fileArr = file;
  }
  else {
    fileArr.push(file);
  }

  _.each(fileArr, (fileElem) => {
    formData.append('file[]', fileElem);
  });
  return http.post(ServiceOptions.uploadUrl, formData, {
    onUploadProgress: options.onProgress,
  }).catch((rej) => {
    return Promise.reject(rej);
  }).then((res) => {
    return res;
  });
}

export function upload(file, options) {
  // 开始发送。

  if (DEFINE_USE_ALIYUN_OSS) {
    return aliyunOssUpload(file, options);
  }

  return normalPost(file, options);
}

// uploadMake ，创建上传方法。
function uploadMake(argsOptions) {
  const options = _.defaultsDeep(argsOptions || {}, ServiceOptions);

  const promise = new Promise((resolve, reject) => {
    if (DEFINE_USE_ALIYUN_OSS) {
      if (!_.get(options, 'data.Credentials.AccessKeyId', '')) {
        reject({
          code: -101,
          msg: '缺失阿里云 oss sts token',
        });
      }
    }
    else if (!(options.token && _.isString(options.token))) {
      reject({
        code: -101,
        msg: '缺失七牛Token',
      });
    }

    if (!options.file) {
      reject({
        code: -110,
        msg: '请选择上传文件',
      });
    }

    getFileSize(options.file, (fileSize) => {
      const K = 1024;
      const M = K * K;
      const maxSize = options.maxSize || 0;
      const showSize = M < maxSize
        ? `${(maxSize / M).toFixed(2)}Mb`
        : `${(maxSize / K).toFixed(2)}Kb`;

      /**
       * 判断文件大小
       */
      if (fileSize > maxSize) {
        reject({
          code: -120,
          msg: `上传文件大小不能超过${showSize}`,
        });

        return;
      }

      upload(options.file, options).then((response) => {
        resolve(response);
      }).catch((rejection) => {
        reject(rejection);
      });
    });
  });

  return promise;
}

export function configure(optionsArgs) {
  ServiceOptions = _.defaultsDeep({}, optionsArgs, ServiceOptions);
}

// 默认 export ，用来上传数据的方法，调用时候必须穿 {file: FileObject}
export default function fileUploader(options) {
  const autoGetToken = (ServiceOptions || {}).autoGetToken;
  return new Promise((resolve, reject) => {
    autoGetToken().then((optionsArgs) => {
      const newOptions = {
        ...optionsArgs,
      };
      if (optionsArgs.token) {
        newOptions.token = optionsArgs.token;
      }
      uploadMake(_.defaultsDeep(newOptions, _.defaultsDeep(options, ServiceOptions))).then((response) => {
        resolve(response);
      }).catch((rejection) => {
        reject(rejection);
      });
    }).catch((rejection) => {
      reject({
        code: -100,
        msg: '无法获取token',
        origin: rejection,
      });
    });
  });
}

// 初始化，设置一次获取 token 的。应该脱离这个文件填写。
configure({
  autoGetToken: () => {
    if (DEFINE_USE_ALIYUN_OSS) {
      return ServicesCommon.aliyunStsToken().then((aliyunStsTokenRes) => {
        return aliyunStsTokenRes;
      }).catch((rej) => {
        message.error('获取阿里云 oss sts token 失败!');
        return Promise.reject(rej);
      });
    }

    return Promise.resolve({
      token: User.token,
    });
    // return ServicesCommon.qiniuToken().then((qiniuTokenRes) => {
    //   const token = qiniuTokenRes.data;
    //   return token;
    // }).catch(() => {
    //   message.error('获取七牛 token 失败!');
    // });
  },
});

// export default fileUploader;

// export {
//   configure,
//   upload,
//   fileUploader,
// };
// base64转blob
function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = window.atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  // eslint-disable-next-line
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// fileType后缀字典
export const FILE_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

// 下载外部链接转传本地服务器
export const uploadExternalImg = (src, options) => {
  return new Promise((resolve, reject) => {
    if (src.startsWith('http') && !DEFINE_UPLOAD_TEST_URL.some(item => src.includes(item))) {
      const img = document.createElement('img');
      img.onload = () => {
        const copyOptions = options || {};
        const defaultSize = {
          width: 240,
          height: 350,
        };
        const compress = copyOptions.compress || 1;// 默认不压缩
        const uploadOption = {
          ...DEFAULT_CROPPER_OPTIONS,
          width: copyOptions.width || defaultSize.width,
          height: copyOptions.height || defaultSize.height,
          minContainerWidth: copyOptions.width || defaultSize.width,
          minContainerHeight: copyOptions.height || defaultSize.height,
          outputWidth: copyOptions.width || defaultSize.width,
          outputHeight: copyOptions.height || defaultSize.height,
          maxOutputWidth: copyOptions.maxOutputWidth || 960,
          maxOutputHeight: copyOptions.maxOutputHeight || (copyOptions.height / copyOptions.width) * 960,
        };
        const index = src.lastIndexOf('.');
        const fileType = src.substr(index + 1);
        const naturalWidth = _.get(img, 'naturalWidth');
        const naturalHeight = _.get(img, 'naturalHeight');
        let imgBlob = null;
        try {
          const cvs = document.createElement('canvas');
          cvs.width = naturalWidth;
          cvs.height = naturalHeight;
          cvs.getContext('2d').drawImage(img, 0, 0, naturalWidth, naturalHeight, 0, 0, naturalWidth, naturalHeight);
          const newImageData = cvs.toDataURL(FILE_TYPE[fileType], compress);
          imgBlob = dataURLtoBlob(newImageData);// 转为blob对象
        }
        catch (err) {
          resolve('');
          return;
        }
        fileUploader({
          ...uploadOption,
          name: _.get(imgBlob, 'name', '') || `${UUID()}.${FILE_TYPE[fileType] ? fileType : 'png'}`,
          lastModified: _.get(imgBlob, 'lastModified', '') || new Date() * 1,
          file: imgBlob })
          .then((res) => {
            const imgUrl = getUrl(res);
            resolve(imgUrl);
          })
          .catch((err) => {
            reject(err);
          });
      };
      img.onerror = () => {
        resolve('');
      };
      img.setAttribute('crossOrigin', 'Anonymous');
      if ('string' !== typeof img.referrerPolicy) { // 图片不支持referrerPolicy属性走代理
        img.src = src.replace(/^(http)[s]*(:\/\/)/, 'https://images.weserv.nl/?url=');
      }
      else {
        img.referrerPolicy = 'no-referrer';// chrome 51,edge不支持
        img.src = src;
      }
    }
    else { // 非外部图片
      resolve(src);
    }
  });
};

