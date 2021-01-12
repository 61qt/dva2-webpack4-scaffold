import { Button } from 'antd';
import { connect } from 'dva';
import Base, { baseProps } from './_base';

@connect((state) => {
  return {
    loading: !!state.loading.models.$export,
    exportState: state.$export,
    breadcrumbState: state.breadcrumb,
  };
})
export default class DownloadButton extends Base {
  static defaultProps = {
    ...baseProps,
    size: 'small',
  };

  renderView = () => {
    debugAdd('DownloadButton', this);
    return (<Button
      ghost={this.props.ghost}
      loading={this.state.asyncBuilding}
      type={this.props.type}
      size={this.props.size}
      disabled={this.props.disabled}
      className={this.props.className}
      onClick={this.downloadBirdge}>
      {this.props.children}
    </Button>);
  }
}
