export function loadScript({ src, async = true }) {
  const script = document.createElement('script');
  script.src = src;
  script.async = async;

  return new Promise((resolve, reject) => {
    script.onload = () => {
      resolve();
    };
    script.onerror = (e) => {
      reject(e);
    };

    document.body.appendChild(script);
  }).finally(() => {
    document.body.removeChild(script);
  });
}

export function formatDefaultFilter({
  filter,
  props,
}) {
  let newFilter = filter;

  return newFilter;
}

export default '_util';
