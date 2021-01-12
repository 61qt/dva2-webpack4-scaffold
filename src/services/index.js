import { http } from './_factory';
import {
  requestInterceptor,
  responseFailInterceptor,
  responseSuccessInterceptor,
} from './_intercept';


// Add a request interceptor
http.interceptors.request.use(requestInterceptor, (error) => {
  return Promise.reject(error);
});

http.interceptors.response.use((response) => {
  // IE 8-9
  if (null === response.data && 'json' === response.config.responseType && null !== response.request.responseText) {
    try {
      // eslint-disable-next-line no-param-reassign
      response.data = JSON.parse(response.request.responseText);
    }
    catch (e) {
      // ignored
    }
  }
  return response;
});

// Add a response interceptor
http.interceptors.response.use(responseSuccessInterceptor, responseFailInterceptor);

export default 'services';
