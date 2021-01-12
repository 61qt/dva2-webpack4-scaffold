import React from 'react';
import _ from 'lodash';
// import moment from 'moment';
import { Modal, Pagination } from 'antd';

import CONSTANTS from '@/constants';
import Table from '@/components_atom/table';
import { getFilter } from '@/components_atom/search_form';
import { computedColumnWidth } from '@/components_default/page_list/_util';

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    debugAdd('page_table_modal', this);
    this.state = {
      visible: false,
      model: 'book_borrow_log',
      talbeModalClassName: 'noSureBtnModal',
      defaultSearchValue: {
        book_id: this.props.id,
      },
    };
  }

  getPageState = () => {
    return _.get(this.props, 'pageState') || {};
  }

  getTableDataSource = () => {
    return _.get(this.props, 'pageState.list') || [];
  }

  getTableColumns = () => {
    if (__DEV__) {
      window.console.log('[getTableColumns] 如果需要配置页面 table，需要在子类重新定义该方法');
    }
    return null;
  }

  getTableExtrapProps = () => {
    return {};
  }

  getTableProps = () => {
    return {
      onChange: this.handleTableChange,
      size: 'small',
      bordered: true,
      columns: computedColumnWidth(this.getTableColumns()),
      dataSource: this.getTableDataSource(),
      loading: this.props.loading,
      rowKey: record => record.id,
      pagination: false,
      footer: this.tableFooter,
      scroll: {},
      ...this.getTableExtrapProps(),
    };
  }

  getPageTableModalHeader = () => {
    return null;
  }

  getPageTableModalFooter = () => {
    return null;
  }

  canToggleVisible = () => {
    return true;
  }

  couldLoadDataWhenVisible = () => {
    return true;
  }

  handleToggleVisible = () => {
    if (!this.canToggleVisible()) {
      return;
    }
    const visible = !this.state.visible;
    // 如果当前是可见的，需要重置整个 model，否则部分信息会失败
    if (visible) {
      this.props.dispatch({
        type: `${this.state.model}/reset`,
        payload: [],
      });
    }
    this.setState({
      visible,
    }, () => {
      if (this.state.visible) {
        if (this.couldLoadDataWhenVisible()) {
          this.handleTableChange();
        }
        this.handleToggleVisibleTureCallback();
      }
      else {
        this.handleToggleVisibleFalseCallback();
      }
    });
    debugAdd('page_table_model_current', this);
  }

  handleToggleVisibleTureCallback = () => {
    if (__DEV__ && __PROD__) {
      window.console.log('显示弹窗之后的操作');
    }
  }

  handleToggleVisibleFalseCallback = () => {
    if (__DEV__ && __PROD__) {
      window.console.log('隐藏弹窗之后的操作');
    }
  }

  pageChangeHandler = (page = _.get(this.getPageState(), 'page') || 1) => {
    const searchValues = _.get(this.getPageState(), 'listState.searchValues', {});
    const filterValue = { ...this.state.defaultSearchValue };
    _.each(Object.keys(searchValues), (key) => {
      if ('number' === typeof searchValues[key] || searchValues[key]) {
        filterValue[key] = searchValues[key];
      }
    });
    const payload = {
      page,
      filter: getFilter(filterValue), // _.get(this.getPageState(), 'listState.filter') || [],
      pageSize: _.get(this.getPageState(), 'pageSize') || CONSTANTS.PAGE_SIZE,
    };

    return this.props.dispatch({
      type: `${this.state.model}/list`,
      payload,
    });
  }

  tableFooter = () => {
    const { pageState = {} } = this.props;
    return (
      <div className="clearfix">
        <div className="ant-table-pagination-info">当前显示{pageState.total ? pageState.start || 0 : 0} - {pageState.end || 0}条记录，共 {pageState.total || 0} 条数据</div>
        <Pagination
          className="ant-table-pagination ant-table-pagination-hide-last"
          total={pageState.total || 0}
          current={pageState.page || 0}
          pageSize={pageState.pageSize || CONSTANTS.PAGE_SIZE}
          showQuickJumper={false}
          size="small"
          onChange={this.pageChangeHandler} />
      </div>
    );
  }

  handleTableChange = (pagination, filters, sorter) => {
    if (__DEV__ && __PROD__) {
      window.console.log('pagination', pagination, 'filters', filters, 'sorter', sorter);
    }

    return this.props.dispatch({
      type: `${this.state.model}/list`,
      payload: {
        page: _.get(this.props, 'pageState.page') || 1,
        filter: getFilter(this.state.defaultSearchValue),
      },
    });
  }

  render() {
    return (<React.Fragment>
      <span onClick={this.handleToggleVisible}>
        {this.props.children || ''}
      </span>
      <Modal
        destroyOnClose
        className={`${this.state.talbeModalClassName || ''} noBtnBorderModal`}
        width={this.state.tableModalWidth}
        visible={this.state.visible}
        title={this.props.title || ''}
        onCancel={this.handleToggleVisible}
        okText={null}
        cancelText="取消">
        { this.getPageTableModalHeader() }
        <Table {...this.getTableProps()} />
        { this.getPageTableModalFooter() }
      </Modal>
    </React.Fragment>);
  }
}
