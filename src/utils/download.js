import _ from 'lodash';
import Qs from 'qs';

function download(path, formDataOrigin = {}, options = {}) {
  const {
    base = '',
    method = 'POST',
    enctype = '',
    target = '_blank',
  } = options;

  const formData = _.assign({}, formDataOrigin);
  // formData.format = 'csv';
  formData.format = formData.format || 'excel';
  const form = document.createElement('form');
  try {
    if (enctype) {
      form.enctype = enctype;
    }
  }
  catch (e) {
    // nothing to do
  }

  if ('GET' === method.toUpperCase() && path.includes('?')) {
    const query = path.substr(path.indexOf('?') + 1);
    const queryParam = Qs.parse(query);
    for (const [k, v] of _.entries(queryParam)) {
      if (k && v) {
        formData[k] = v;
      }
    }
  }

  form.style.position = 'absolute';
  form.style.width = 0;
  form.style.height = 0;
  form.style.opacity = 0;
  form.style.zIndex = -9999;
  form.style.top = '-9999px';
  form.style.left = '-9999px';
  form.style.overflow = 'hidden';
  form.target = target;
  document.body.appendChild(form);

  let action = `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (path.startsWith('http')) {
    action = `${path.replace(/^\//, '')}`;
  }

  for (const [k, v] of _.entries(formData)) {
    if (0 > [undefined, null].indexOf(v)) {
      const input = document.createElement('input');
      input.name = k;
      // 如果是数组，就进行特殊的处理。
      if (v && v.join && v.push) {
        input.value = JSON.stringify(v).replace(/^"/, '').replace(/"$/, '');
      }
      else {
        input.value = v;
      }

      form.appendChild(input);
    }
  }

  // form.method = 'GET';
  form.method = method;
  form.action = action;
  form.submit();
}

export default download;
