import { connect } from 'dva';
import Base, { baseProps } from './_base';

@connect((state) => {
  return {
    loading: !!state.loading.models.$export,
    exportState: state.$export,
    breadcrumbState: state.breadcrumb,
  };
})
export default class Download extends Base {
  static defaultProps = {
    ...baseProps,
  };
  // 这个是功能强大的 download 组件。比较夸张，目前这个已经废弃，不完善了。
}
