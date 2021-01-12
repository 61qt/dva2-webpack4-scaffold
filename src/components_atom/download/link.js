import { connect } from 'dva';
import Base, { baseProps } from './_base';

@connect((state) => {
  return {
    loading: !!state.loading.models.$export,
    exportState: state.$export,
    breadcrumbState: state.breadcrumb,
  };
})
export default class DownloadLink extends Base {
  static defaultProps = {
    ...baseProps,
    textColor: '',
  };

  renderView = () => {
    debugAdd('DownloadLink', this);
    return (<a className={`${this.props.textColor || 'text-black'} ${this.props.className}`} onClick={this.downloadBirdge}>
      {this.props.children}
    </a>);
  }
}
