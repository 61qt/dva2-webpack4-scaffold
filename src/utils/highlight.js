/**
 * 标记指定关键字高亮（目前不能区分大小写）
 * @param {string} text 需要处理的原字符串
 * @param {string} key  需要标记的字符串
 * @param {string} color  需要标记的字符串的颜色
 */
export default function keySingleRender(text, key, color) {
  if (key && text && 'string' === typeof text && 'string' === typeof key) {
    const newText = -1 < text.indexOf(key) ? text.replace(key, `<Fragment style="color: ${color}">${key}</Fragment>`) : text;
    // eslint-disable-next-line react/no-danger
    return (<span dangerouslySetInnerHTML={{ __html: newText }} />);
  }
  else {
    return text;
  }
}
