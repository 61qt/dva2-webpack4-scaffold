import React from 'react';
import { connect } from 'dva';
import _ from 'lodash';

import { Button, Dropdown, Menu, Modal, Icon, Checkbox } from 'antd';
import formErrorMessageShow from '@/utils/form_error_message_show';
import User from '@/utils/user';
import { formatDefaultFilter } from '@/services/_util';

import Base, { baseProps } from './_base';
import styles from './index.less';

// 获取随机数
function random() {
  return `${Math.random()}`.replace(/0./, '');
}

@connect((state) => {
  return {
    loading: !!state.loading.models.$export,
    exportState: state.$export,
    breadcrumbState: state.breadcrumb,
  };
})
export default class DownloadGraphql extends Base {
  static defaultProps = {
    ...baseProps,
    // 由于统一调整成异步，覆盖baseProps,默认改为true
    downloadAsync: true,
    // 下载时候的 scheme
    exportAction: '',
    // 从哪个接口里面读取需要下载的表头字段
    exportableList: '',
    // 控件大小
    size: 'small',
    // 黑名单，例如在高招部分，不同级别的学生报名统计，显示不同的字段的。
    blackBame: [],

    // 是否为按钮模式
    isButton: true,
  };

  constructor(props) {
    super(props);
    _.assign(this.state, {
      customTableTitleCheckModelVisible: false,
      random: random(),
      selectOptions: [],
      defaultValue: [],
      checkedValues: [],
    });
  }

  componentDidMount = () => {
    this.componentUnmountFlag = false;
    this.initData({
      exportableList: this.props.exportableList,
      exportState: this.props.exportState,
    });
  }

  // 监控需要下载的数据信息以及需要导出的列表信息是不是变更，如果变更了，就需要重新创建下载信息来方便勾选下载。
  componentWillReceiveProps = (nextProps) => {
    if (!_.isEqual(nextProps.exportableList, this.props.exportableList)
      || !_.isEqual(nextProps.exportState, this.props.exportState)
    ) {
      this.initData({
        exportableList: nextProps.exportableList,
        exportState: nextProps.exportState,
      });
    }
  }

  // 数据初始化，进行下载的表头选择。
  initData = ({
    exportableList,
    exportState,
  }) => {
    // 将对象数据换成一维
    function eachRow({
      arr,
      branch,
      blackBame,
    }) {
      let fields = [];

      _.map(arr, (field) => {
        if (_.isArray(field.value)) {
          const { selectOptions: subFields } = eachRow({
            arr: field.value,
            branch: [].concat(branch).concat(field.name),
            blackBame,
          });

          fields = [].concat(fields).concat(subFields);
        }
        else if ('string' === typeof field.value) {
          fields.push({
            value: [].concat(branch).concat(field.name || field.value).join('.'),
            label: field.value || field.name,
          });
        }
      });

      const selectOptions = [];
      _.map(fields, (elem) => {
        if (_.includes(blackBame, elem.value)) {
          // 拉黑，不显示
        }
        else {
          selectOptions.push(elem);
        }
      });

      return {
        selectOptions,
      };
    }

    if (exportableList) {
      const selectRowConfig = _.find(exportState.exportableList || [], {
        name: exportableList,
      }) || {};

      const {
        selectOptions,
      } = eachRow({
        arr: selectRowConfig.columns,
        branch: [],
        blackBame: this.props.blackBame,
      });
      const defaultValue = _.map(selectOptions, (row) => {
        return row.value || row.label;
      });

      this.setState({
        selectOptions,
        defaultValue,
        checkedValues: defaultValue,
      });
    }
  }

  formatFormData = ({ formData, options }) => {
    // 组装 graphql 语法
    function formatObjGraphql({ fileds }) {
      const obj = {};
      _.map(fileds, (field) => {
        _.set(obj, field, true);
      });

      const jsonStr = JSON.stringify(obj);

      // const scheme = jsonStr
      //   .replace(/:[^{}]+?,/ig, ' ')
      //   .replace(/:[^{}]+?}/ig, '}')
      //   .replace(/[":]/ig, ' ')
      //   .replace(/^{/, '')
      //   .replace(/}$/, '');

      const exportFields = jsonStr
        .replace(/[""]/ig, '');

      return exportFields;
    }

    const newFormData = {
      ...formData,
    };
    const newOptions = {
      ...options,
    };
    if (this.props.exportAction) {
      delete newFormData.filter;
      delete newFormData.token;
      delete newFormData.format;
      if (!this.props.skipAuthorization) {
        newFormData.api_token = User.token;
        newFormData.token = User.token;
        newFormData.format = 'xlsx';
      }

      // 重构过滤器
      const filter = _.get(this.props.query, 'filter', []);

      const newFilter = formatDefaultFilter({
        filter,
        props: {
          ...this.props,
          table: this.props.model || this.props.table,
        },
      });

      newFormData.variables = JSON.stringify({
        filter: { filter: newFilter },
      });
      // 由于统一异步下载调整，此处仅取DownloadTask的id
      // formatObjGraphql返回值也调整成exportFields
      // 影响较大，如若需要翻看/恢复旧代码，请自行翻查老旧的提交记录
      newFormData.query = `query($filter: filterInput) {
          ${this.props.exportAction} (filterInput: $filter, exportFields: ${formatObjGraphql({ fileds: this.state.checkedValues })}) {
            id
          }
        }`;
      newOptions.enctype = 'application/json; charset=UTF-8';
    }

    // // 目前 extendAction 好像没用过
    // if (this.props.extendAction) {
    //   newFormData.variables = JSON.stringify({
    //     filter: { filter: _.get(this.props.query, 'filter') || [] },
    //     exp_type: _.get(this.props.query, 'type'),
    //   });

    //   newFormData.query = `query($filter: filterInput, $exp_type: Int!) {
    //       ${this.props.extendAction} (filterInput: $filter, exp_type: $exp_type) {
    //         ${formatObjGraphql({ fileds: ['type'].concat(this.state.checkedValues) })}
    //       }
    //     }`;

    //   if (__DEV__ && !this.props.path) {
    //     window.console.error('Download 有传入 extendAction props 时， props 必须传入 path');
    //   }
    // }

    return {
      formData: newFormData,
      options: newOptions,
    };
  }

  // 处理两种不同的下载方式的按钮的事件。
  handleDownloadMenuClick = (e) => {
    if ('custom' === e.key) {
      this.setState({
        customTableTitleCheckModelVisible: true,
        checkedValues: this.state.defaultValue,
        random: random(),
      });
      debugAdd('download', this);
    }
    else {
      this.downloadBirdge();
      // this.download();
    }
  }

  // 取消下载的按钮。
  handleCancelDownload = () => {
    this.setState({
      customTableTitleCheckModelVisible: false,
      checkedValues: this.state.defaultValue,
    });
  }

  // 自定义表头，确定按钮。
  handleOkDownload = () => {
    if (!_.get(this.state.checkedValues, 'length', 0)) {
      formErrorMessageShow({
        msg: '最少选择一项表头才能下载',
      });
      return;
    }

    this.setState({
      customTableTitleCheckModelVisible: false,
    });
    // 只有选择了表头之后才能下载
    this.download();
  }

  // 全选所有的自定义表头
  handleAllCheck = () => {
    this.setState({
      checkedValues: this.state.defaultValue,
    });
  }

  // 不选所有的自定义表头
  handleAllCancel = () => {
    this.setState({
      checkedValues: [],
    });
  }

  // 选中的处理，而且进行顺序的排序，方便进行 debug。
  handleRowSelectChange = (checkedValues) => {
    const defaultValue = this.state.defaultValue;
    checkedValues.sort((a, b) => {
      const aIndex = defaultValue.indexOf(a);
      const bIndex = defaultValue.indexOf(b);
      return aIndex - bIndex;
    });

    this.setState({
      checkedValues,
    });
  }

  downloadCallBack = () => {
    if ('function' === typeof this.props.downloadCallBack) {
      this.props.downloadCallBack();
    }
    this.setState({
      checkedValues: this.state.defaultValue,
    });
  }

  // 渲染表头，用户自定义下载不同的表头。
  renderMenu = () => {
    const {
      children,
    } = this.props;

    const menu = (
      <Menu>
        <Menu.Item key="default" onClick={this.handleDownloadMenuClick}>默认表头导出</Menu.Item>
        <Menu.Item key="custom" onClick={this.handleDownloadMenuClick}>自定义表头导出</Menu.Item>
      </Menu>
    );

    const title = (<div>
      <span>自定义下载文件表头</span>
      <div className="float-right">
        <Button size="small" onClick={this.handleAllCheck}>全选</Button>
        &nbsp;
        &nbsp;
        <Button size="small" onClick={this.handleAllCancel}>全不选</Button>
        &nbsp;
        &nbsp;
        <Button size="small" onClick={this.handleCancelDownload}>关闭</Button>
        &nbsp;
        &nbsp;
      </div>
    </div>);

    const dropdownProps = {
      className: this.props.className,
      size: this.props.size,
      overlay: menu,
    };

    if (this.props.isButton) {
      dropdownProps.onClick = this.downloadBirdge;
      dropdownProps.trigger = 'click';
    }

    return (<span>
      <Modal
        key={this.state.random}
        className={`${styles.normal}`}
        visible={this.state.customTableTitleCheckModelVisible}
        onOk={this.handleOkDownload}
        okText="下载"
        onCancel={this.handleCancelDownload}
        title={title}>
        <Checkbox.Group
          key={this.state.random}
          defaultValue={this.state.defaultValue}
          value={this.state.checkedValues}
          style={{ width: '100%' }}
          onChange={this.handleRowSelectChange}
          options={this.state.selectOptions} />
        <div className={__DEV__ ? '' : 'ant-hide'}>
          {this.state.checkedValues.join(',')}
        </div>
      </Modal>
      {this.props.isDefaultAllField ? // 是否点击就导出默认表单头
       _.isString(children) ? <Button size="small" type="primary" ghost onClick={this.downloadBirdge}>{children} </Button>// 默认样式primary ghost Button
       : React.cloneElement(children, { onClick: this.downloadBirdge }) // 自定义样式
       : this.props.isButton ? (<Dropdown.Button {...dropdownProps}>{children}</Dropdown.Button>)// 走点点可以下拉或点击 可选导出
       : (<Dropdown {...dropdownProps}>
         {_.isString(children) ? (<Button size="small">{children} <Icon type="down" /></Button>) : children }
       </Dropdown>) // 下拉按钮 可选导出
      }
    </span>);
  }

  // 这个是带有表头自定义下载的 graphql 下载模式，
  renderView = () => {
    // 每个继承之后，自定义
    const selectOptions = this.state.selectOptions;

    if (this.props.exportAction && selectOptions && selectOptions.length) {
      debugAdd('DownloadGraphql', this);

      return this.renderMenu();
    }
    else {
      return (<Button disabled size={this.props.size}>没有下载项</Button>);
    }
  }
}
