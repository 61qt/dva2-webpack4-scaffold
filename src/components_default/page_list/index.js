import UUID from 'uuid';
import React, { useState } from 'react';
import _ from 'lodash';
import Qs from 'qs';
import { message, Modal, Spin, Input, Menu, Tabs, Alert, Icon, Pagination, Dropdown, Button, Popconfirm } from 'antd';
import { NavLink } from '@/components_atom/router';

import Filters from '@/filters';
import { DownloadLink, DownloadGraphql } from '@/components_atom/download';
import { buildImportUploadComponent } from '@/components_atom/import';
import SummaryView from '@/components_atom/summary_view';
import DetailView from '@/npm/@edu_components_atom/detail_view';
import Well from '@/components_atom/well';
import Upload from '@/components_atom/upload';
import Access, { checkIsHasAuth } from '@/npm/@edu_components_atom/access';
import Table from '@/components_atom/table';
import formErrorMessageShow from '@/utils/form_error_message_show';
import { undershoot as sentryUndershoot } from '@/utils/dva-sentry';
// import translator from '@/utils/translate';
import SearchForm, {
  localFilterData,
  getFilter,
} from '@/components_atom/search_form';
import ComponentsForm from '@/components_form';
import FilterTree from '@/npm/@edu_components_atom/filter_tree';
import PageLayout from '@/components_atom/page_layout';
import {
  nextModelNeedReset,
  nextModelIsReseted,
} from '@/components_atom/layout/menu';
import { getApiConfig } from '@/utils/get_api_config';
import { getState } from '@/utils/get_app';
import CONSTANTS from '@/constants';
import buildBatchOperation, { buildConfirmOperation } from '@/utils/build_batch_operation';

import styles from './index.less';
import { computedColumnWidth, CODE_LENGTH, getDetailViewTableNoDataTip, defineUnenumerableProperty } from './_util';

export {
  PADDING_LEFT,
  PADDING_RIGHT,
  CN_LENGTH,
  CODE_LENGTH,
  DEFAULT_ADD_LENGTH,
  DEFAULT_TEXT_TYPE,
  TYPE_LENGTH_RELATION_MAP,
  computedColumnWidth,
  getDetailViewTableNoDataTip,
  defineUnenumerableProperty,
} from './_util';

const SelectAll = ({ currentCount, total, onChange }) => {
  const [selectAll, setSelectAll] = useState(false);

  if (selectAll) {
    return (<span style={{ fontSize: 14 }}>已选择<span style={{ color: '#1890FF' }}>{total}</span>项<a
      onClick={() => {
        setSelectAll(false);
        onChange && onChange(false);
      }}
      style={{ marginLeft: 24 }}>取消勾选</a></span>);
  }

  return (<span style={{ fontSize: 14 }}>已选择本页<span style={{ color: '#1890FF' }}>{currentCount}</span>项<a
    onClick={() => {
      setSelectAll(true);
      onChange && onChange(true);
    }}
    style={{ marginLeft: 24 }}>勾选列表中全部{total}项</a></span>);
};

export default class Component extends React.PureComponent {
  constructor(props) {
    super(props);
    debugAdd('page_list', this);
    this.state = {
      formKey: UUID().replace(/-/g, '_'),
      // 搜索框的那个每一列的 col 长度，参考 grid
      searchCol: 12,
      // filter tree 的展开深度
      filterTreeDeep: 99999999,
      // 当前页面的展示的表(service 或者是 schema)的名称。
      model: 'admin_city',
      // 当前页面的展示的表(service 或者是 schema)的中文可读名称。
      modeLabel: '管理员',
      // 当前初始化就要使用到的查询条件。
      defaultSearchValue: {},
      // 当前初始化就要设置到的查询条件。优先于 defaultSearchValue ，搜索框编辑后不会带入搜索条件。
      defaultSearchValueMount: {},
      modelAddComponent: false,
      hideBreadcrumb: false,
      // 点击左侧树的菜单，是否进行下一步数据的获取。
      shouldSiderTreeHandleLoadData: false,
      // mode 目前只能是 [Table, DetailView, Custom]
      // Custom 就不输出了,
      mode: 'Table',

      // 过滤毕业班级学校
      filterGraduate: true,

      // 更多菜单信息的样式类名
      tabsClassName: '',

      // DetailView 相关的配置
      detailViewCol: undefined,
      detailViewLabelWidth: '10em',
      detailViewExpand: 9999,

      PageLayoutClassName: '',

      extraListSchemeParams: {},

      // 页面是否重置中。
      resetPageStateIng: false,

      // 是否自动触发搜索
      autoTriggerHandleSearch: true,

      // 是否展示没数据时候的提醒。如果有值，就显示。
      noDataSourceListTip: '',
      // 查询结果的长度，如果为 undefined ，证明还没触发查询操作
      dataSourceListLength: undefined,

      // tab 模式下的，当前活动状态的 tab
      currentActiveTap: 0,

      // 是否使用 maxList 的请求
      isMaxList: false,

      // tab 那边的 search value
      tabSearchValue: '',

      // 能否选择批量操作
      canRowSelection: false,
      // 是否正在批量操作中
      inRowSelection: false,
      // 批量操作时候的数组
      selectedRowKeys: [],
      // 操作成功之后 重新查询数据 是否需要重置多选状态
      resetSelectedRowKeys: true,

      // graphql schema
      graphqlListSchema: '',

      // 是否不使用 layout 来包裹，默认 否。
      wrapWithoutLayout: false,

      // 能否进行分页大小选择
      showSizeChanger: true,

      // 指定每页可以显示多少条
      pageSizeOptions: CONSTANTS.PAGE_SIZE_OPTION,

      // 下载模板是否增加不适用token
      skipAuthorization: false,
      // 导出文案
      downloadText: '',
      // 是否只导出默认表头
      isDefaultAllField: false,

      // 导入文案
      importText: '',

      // 本地搜索
      // 有很多种途径触发数据修改，这里只做点击搜索时候的数据修改，不考虑点击下一页等更新数据的。
      isLocalSearch: false, // 如果为 true 我也不管。一定要知道，为什么设置成 true。
      // 是否已经触发过搜索。
      isHandleSubmited: false,
      // 本地搜索的时候，存储满足条件的那些 key。
      searchResultKey: {
        // 这个是前端搜索存储命中的记录 id,
      },
      // 本地搜索 end

      // 导出按钮是否为按钮，默认为 false
      exportIsButton: false,

      // 导入按钮是否为按钮，默认为 true
      importIsButton: true,

      // 搜索栏是否默认展开，天水和陇南目前为打开。
      expand: DEFINE_SEARCH_FORM_DEFAULT_EXPAND,

      // 异步导入的
      asyncUpload: false,

      // 默认不检查 minWidth 的配置、
      forceNoMinWidth: false,

      // 操作按钮key
      operateKey: '',
      operationInfo: '',
      // 批量操作模式，horizontal：横向平铺
      patchOperate: '',
      // 显示批量操作按钮的个数，多余的放到更多里面
      patchOperateCount: 4,
      // 列表是否勾选全部, （用于显示全选提示语）
      patchSelectAll: false,
      // 确认勾选全部
      confirmPatchSelectAll: false,
      // 没数据的时候是否显示表头
      showHeader: false,
      // 是否显示全量选中
      showPatchAll: true,
      // 是否可以自定义化defaultSiderKey, fn(treeData)
      editDefaultExpanded: false,
      // tag的位置 top bottom
      tagPosition: 'top',
    };


    this.tab_save_key = `tab_save_ket_${location.pathname}`;

    const query = Qs.parse(window.location.search.replace(/^\?/, ''));
    const hash = Qs.parse(window.location.hash.replace(/^#/, ''));
    this.query = query;
    this.hash = hash;

    if (hash.tab) {
      this.state.currentActiveTap = hash.tab;
    }
    else if (localStorage.getItem(this.tab_save_key)) {
      this.state.currentActiveTap = localStorage.getItem(this.tab_save_key);
    }

    if (!_.get(this.state, 'currentActiveTap')) {
      this.state.currentActiveTap = 0;
    }

    // 从 menu 那边捕抓是不是应该进组件之前就重置整个 model
    this.currentNextModelNeedReset = nextModelNeedReset();
  }

  componentWillMount = () => {
    // url 的搜索或者path一旦变更，清空搜索条件，清空页面数据。
    if (this.checkNeedResetListState()) {
      // this.resetPageListState();
      this.setState({
        resetPageStateIng: true,
      });
      this.resetPageState();
      nextModelIsReseted();
    }
  }

  componentDidMount = () => {
    if (__DEV__ && __PROD__) {
      window.console.log('[componentDidMount] 如果需要配置导航条，需要在子类重新定义该方法');
    }
  }

  componentWillReceiveProps = (nextProps) => {
    if (__DEV__ && __PROD__) {
      window.console.log('nextProps', nextProps);
    }
    this.componentWillReceivePropsExtend(nextProps);
  }

  onUploaded = (info) => {
    if (__DEV__ && __PROD__) {
      window.console.log('info', info);
    }
    this.resetPageAndJumpLoadingBack();
  }

  getTableColumns = () => {
    if (__DEV__ && __PROD__) {
      window.console.log('[getTableColumns] 如果需要配置页面 table，需要在子类重新定义该方法');
    }
    return null;
  }

  getSummaryViewState = () => {
    return _.get(this.props, 'summaryViewState') || {};
  }

  getPageState = () => {
    return _.get(this.props, 'pageState') || {};
  }

  getSummaryViewColumns = () => {
    if (__DEV__ && __PROD__) {
      window.console.log('[getSummaryViewColumns] 如果需要配置页面 table，需要在子类重新定义该方法');
    }
    return null;
  }

  getSummaryView = () => {
    const summaryViewColumns = this.getSummaryViewColumns();
    if (_.isArray(summaryViewColumns) && summaryViewColumns.length) {
      return (<SummaryView
        dataSource={this.getSummaryViewDataSource()}
        columns={summaryViewColumns}
        title="统计汇总（合计）"
        loading={this.props.loading}
        className="" />);
    }
    return null;
  }

  getSummaryViewDataSource = () => {
    return _.get(this.getSummaryViewState(), 'summary') || {};
  }

  getTableDataSourceExtend = ({
    dataSource,
  }) => {
    if (this.state.isLocalSearch) {
      if (!this.state.isHandleSubmited) {
        return dataSource;
      }

      const searchResultKey = _.get(this.state, 'searchResultKey', {});

      return _.filter(dataSource, (elem) => {
        return _.get(searchResultKey, elem.id, false);
      });
    }

    return dataSource;
  }

  getTableDataSourceOriginData = () => {
    const dataSource = _.get(this.getPageState(), this.state.isMaxList ? 'maxList' : 'list') || [];
    return dataSource;
  }

  getTableDataSource = () => {
    const dataSource = this.getTableDataSourceOriginData();
    return this.getTableDataSourceExtend({
      dataSource,
    });
  }

  getCanShowTable = () => {
    return true;
  }

  getTable = () => {
    const columns = computedColumnWidth(this.getTableColumns());

    if (this.getCanShowTable() && columns && columns.length) {
      const scroll = {};
      const tableProps = this.getTableProps();
      const formattedColumns = _.map(columns, (elem) => {
        const newElem = { ...elem };
        if (!elem.render && elem.numberAlignLength) {
          newElem.render = function render(text, record, index) {
            const formattedText = _.isFunction(elem.formatFunc) ? elem.formatFunc(text, record, index) : text;
            const elemWidth = CODE_LENGTH * elem.numberAlignLength;
            return <div style={{ float: 'right', textAlign: 'right', width: elemWidth }}>{formattedText}</div>;
          };
          return {
            className: elem.className || 'number-column-right',
            ...newElem,
          };
        }

        return {
          className: elem.className || '',
          ...newElem,
        };
      });
      scroll.x = columns.reduce((a, b) => (a.width || a.minWidth || a || 0) + (b.width || b.minWidth || 0), 0);
      if (tableProps.rowSelection) {
        scroll.x += 70;
      }
      if (_.get(tableProps, 'scroll.y')) {
        scroll.y = _.get(tableProps, 'scroll.y');
      }
      else {
        scroll.y = 300 > window.innerHeight - 310 ? 300 : window.innerHeight - 310;
      }
      const dataSource = this.getTableDataSource();
      return (<div>
        <Table
          onChange={this.handleTableChange}
          data-bak-size={768 > window.innerWidth ? 'small' : 'default'}
          size="small"
          bordered
          forceNoMinWidth={this.state.forceNoMinWidth}
          columns={formattedColumns}
          dataSource={dataSource}
          showHeader={this.state.showHeader || !_.isEmpty(dataSource)}
          loading={this.props.loading}
          scroll={scroll}
          rowKey={record => record.id}
          pagination={false}
          title={this.tableTitle}
          footer={this.tableFooter}
          {...tableProps} />
      </div>);
    }

    return __DEV__ ? (<span>调试信息：不显示 getTable 值 。 this.getCanShowTable() : {JSON.stringify(this.getCanShowTable())} , columns.length: {_.get(columns, 'length')}</span>) : null;
  }

  getTargetDetailViewColumns = () => {
    return [];
  }

  getTargetDetailView = () => {
    const tableDataSource = this.getTableDataSource() || [];
    const dataSource = _.get(tableDataSource, '[0]') || false;

    if (!dataSource || 1 !== this.state.dataSourceListLength) {
      return null;
    }

    const targetDetailViewColumns = this.getTargetDetailViewColumns();

    const targetDetailViewList = [];
    _.each(targetDetailViewColumns, (columns, index) => {
      const view = (<DetailView
        key={`target_detail_view_${index}`}
        col={this.state.detailViewCol || (500 > window.innerWidth ? 1 : 2)}
        labelWidth={this.state.detailViewLabelWidth || '10em'}
        expand={this.state.detailViewExpand || 99999}
        loading={this.props.loading || false}
        dataSource={dataSource}
        columns={_.get(columns, 'children') || []}
        title={columns.title} />);
      targetDetailViewList.push(view);
    });

    return targetDetailViewList;
  }

  getTableRecordDetailViewTitleAction = ({
    dataSource,
    key,
    index,
  }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('dataSource', dataSource, 'key', key, 'index', index);
    }

    const list = [];
    if (this.shouleRenderDetailViewTitleUpdateAction({
      dataSource,
      key,
      index,
    })) {
      const updatePath = Filters.path(`${this.state.model}_edit`, { id: _.get(dataSource, 'id') });

      const update = (<Access auth={`${getApiConfig({ model: this.state.model, key: 'mutation.update.name' })}`}>
        <NavLink to={updatePath} activeClassName="link-active">编辑</NavLink>
      </Access>);
      list.push(update);
    }

    return list;
  }

  getTableRecordDetailViewTitle = ({
    dataSource,
    key,
    index,
  }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('dataSource', dataSource, 'key', key, 'index', index);
    }
    return (<div className="clearfix">
      <h3 className="table-title">
        {this.state.modeLabel} 详情 {index + 1}
      </h3>
      <div className={`table-title-action ${this.state.tableTitleCls || ''}`}>
        {
          this.getTableRecordDetailViewTitleAction({
            dataSource,
            key,
            index,
          })
        }
      </div>
    </div>);
  }

  getTableRecordDetailView = ({
    dataSource,
    key,
    index,
  }) => {
    return (<DetailView
      key={key}
      col={this.state.detailViewCol || (500 > window.innerWidth ? 1 : 2)}
      labelWidth={this.state.detailViewLabelWidth || '10em'}
      expand={this.state.detailViewExpand || 99999}
      loading={this.props.loading || false}
      dataSource={dataSource}
      columns={this.getTableColumns()}
      title={this.getTableRecordDetailViewTitle({
        dataSource,
        key,
        index,
      })} />);
  }

  getDetailViewTableNoDataTip = () => {
    return getDetailViewTableNoDataTip();
  }

  getDetailViewTable = () => {
    const columns = this.getTableColumns();
    const tableDataSource = this.getTableDataSource();
    return (<div>
      <Well
        title={this.tableTitle()}
        footer={this.tableFooter()}>
        {
          columns && columns.length ? (<div>
            {
              _.map(tableDataSource, (record, index) => {
                return this.getTableRecordDetailView({
                  dataSource: record,
                  key: `detail_view_${index}`,
                  index,
                });
              })
            }
          </div>) : this.getDetailViewTableNoDataTip()
        }
      </Well>
    </div>);
  }

  getTableRowSelectProps = () => {
    if (this.state.canRowSelection && this.state.inRowSelection) {
      const rowSelectProps = {
        rowSelection: {
          selectedRowKeys: this.state.selectedRowKeys,
          onChange: (selectedRowKeys, selectedRows) => {
            this.setState({
              selectedRowKeys,
              patchSelectAll: false,
              confirmPatchSelectAll: false,
            }, () => {
              this.handleTableRowSelect(selectedRowKeys, selectedRows);
            });
          },
          getCheckboxProps: this.getCheckboxProps.bind(this),
          onSelectAll: this.handleSelectAll.bind(this),
        },
      };

      if (_.isFunction(this.getRowSelectionCheckboxProps)) {
        rowSelectProps.rowSelection.getCheckboxProps = this.getRowSelectionCheckboxProps;
      }
      return rowSelectProps;
    }
  }

  getCheckboxProps = (record) => {
    const { operationInfo } = this.state;

    if (operationInfo) {
      const getCheckboxProps = _.get(operationInfo, 'getCheckboxProps');
      if (_.isFunction(getCheckboxProps)) {
        return getCheckboxProps(record);
      }
    }

    return {
      disabled: false,
    };
  }

  getTableProps = () => {
    const locale = {
      filterTitle: '筛选',
      filterConfirm: '确定',
      filterReset: '重置',
      emptyText: this.getDetailViewTableNoDataTip(),
    };

    const props = {
      ...this.getTableRowSelectProps(),
      ...this.getTableExtraProps(),
      locale,
    };

    return props;
  }

  getTableExtraProps = () => {
    return {};
  }

  getSearchColumn = ({
    form,
  }) => {
    if (__DEV__ && __PROD__) {
      window.console.warn('[getSearchColumn] 如果需要配置搜索框，需要在子类重新定义该方法');
    }
    if (__DEV__ && __PROD__) {
      window.console.log('form', form);
    }
    return [];
  }

  getSearchHeaderTag = ({ form }) => {
    if (__DEV__ && __PROD__) {
      window.console.warn('[getSearchHeaderTag] 如果需要配置搜索框顶部 tag，需要在子类重新定义该方法');
    }

    // // 示例 search_form head column 代码
    // return [
    //   {
    //     dataIndex: 'category',
    //     label: '询价状态',
    //     method: 'equal',
    //     tags: [
    //       { label: '等待报价', value: _.get(DICT, 'PRICE_ASK.STATUS.NORMAL'), count: __DEV__ ? 2 : 0 },
    //       { label: '最新报价', value: _.get(DICT, 'PRICE_ASK.STATUS.ANSWER'), count: 0 },
    //       { label: '$业务已发起', value: _.get(DICT, 'PRICE_ASK.STATUS.ORDER'), count: __DEV__ ? 3 : 0 },
    //     ],
    //   },
    // ];

    if (__DEV__ && __PROD__) {
      window.console.log('form', form);
    }
    return [];
  }

  getSearchHeaderColumn = ({ onHeaderSearchFormChange, form }) => {
    this.searchHeaderColumnKey = {};
    if (__DEV__ && __PROD__) {
      window.console.log('form', form);
    }
    const tagColumns = this.getSearchHeaderTag({ form });
    if (0 >= tagColumns.length) {
      return [];
    }

    const columns = _.map(tagColumns, (tagObj) => {
      const column = { ...tagObj };
      if (!_.isFunction(column.render)) {
        column.render = () => {
          // 存储是否存在这个headerColumn
          this.searchHeaderColumnKey[column.dataIndex] = true;

          const onChange = (value) => {
            if (_.isFunction(onHeaderSearchFormChange)) {
              onHeaderSearchFormChange();
            }
            const propsOnChange = _.get(column, 'props.onChange');
            if ('function' === typeof propsOnChange) {
              propsOnChange(value);
            }
          };

          const props = {
            ...(column.props || {}),
            onChange,
            tags: column.tags,
          };
          if (undefined !== column.allowClear) {
            props.allowClear = column.allowClear;
          }
          // multiple 模式未完善
          if (undefined !== column.multiple) {
            props.multiple = column.multiple;
          }

          return (<ComponentsForm.Tag {...props} />);
        };
      }

      return column;
    });

    return columns;
  }

  getContentHeader = () => {
    return null;
  }

  getSearchFormExtraDefaultSearchValue = () => {
    return {};
  }

  getSearchFormDefaultSearchValue = () => {
    // 已经变更了 url ，需要进行 state 的重置。
    if (this.checkNeedResetListState()) {
      return {};
    }

    return {
      ..._.get(this.getPageState(), 'listState.searchValues') || {},
      ...this.getSearchFormExtraDefaultSearchValue(),
    };
  }

  getCustomSearchFormProps = () => {
    return {};
  }

  getSearchFormProps = () => {
    let showCount = 3;
    if (12 < this.state.searchCol * 1) {
      showCount = 1;
    }
    else if (12 === this.state.searchCol * 1) {
      showCount = 2;
    }
    else if (8 === this.state.searchCol * 1) {
      showCount = 3;
    }

    const searchFormProps = {
      handleSubmit: this.handleSubmit,
      showOperBtn: this.showOperBtn,
      defaultExpand: this.checkNeedResetListState() ? false : (_.get(this.getPageState(), 'listState.expand') || false),
      defaultSearchValue: this.getSearchFormDefaultSearchValue(),
      defaultSearchValueMount: this.state.defaultSearchValueMount,
      getSearchColumn: this.getSearchColumn,
      showCount,
      searchCol: this.state.searchCol,
      key: this.state.formKey,
      autoTriggerHandleSearch: this.state.autoTriggerHandleSearch,
      ...this.getCustomSearchFormProps(),
      resetFieldsCallBack: this.handleSearchFormResetFieldsCallBack,
      outSearchFormRef: (form) => {
        this.searchForm = form;
      },
      tagPosition: this.state.tagPosition,
    };

    searchFormProps.defaultExpand = this.state.expand || searchFormProps.defaultExpand;

    if (_.isFunction(this.getSearchHeaderColumn)) {
      searchFormProps.getSearchHeaderColumn = this.getSearchHeaderColumn;
    }

    return searchFormProps;
  }

  getSearchForm = () => {
    if (this.getSearchColumn) {
      return (<SearchForm {...this.getSearchFormProps()} />);
    }
    return null;
  }

  getSiderTree = () => {
    if (__DEV__ && __PROD__) {
      window.console.warn('[getSiderTree] 如果需要配置左侧搜索树，需要在子类重新定义该方法');
    }
    return null;
  }

  getSiderTreeKey = () => {
    return _.get(this.props, 'departmentState.currentTree', {});
  }

  getSiderTreeFilterKey = (key, domNode) => {
    if (__DEV__ && __PROD__) {
      window.console.log('key', key, 'domNode', domNode);
    }
    return key;
  }

  getPageTabsColumn = () => {
    return [];
  }

  getPageTabsTitleText = () => {
    return '更多详细信息';
  }

  getPageTabsTitle = () => {
    return (<div>
      <span>{this.getPageTabsTitleText()}</span>
      <span className="float-right">
        <Input.Search placeholder="请输入应用名称" size="small" onSearch={this.handleSearch} enterButton="搜索" />
      </span>
    </div>);
  }

  getPageTabsDefaultActiveKey = ({
    column,
  }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('column', column);
    }
    return this.state.currentActiveTap;
  }

  getPagePureTabsContentParentExtraProps = () => {
    return {};
  }

  // tab 模式下，将上级的 props 传输给下级
  getPagePureTabsContentParentProps = ({
    tab,
  }) => {
    let tabsParentPropsKey = ['history', 'location', 'match'];
    const extraProps = this.getPagePureTabsContentParentExtraProps();
    const childProps = {
      ...extraProps,
    };

    _.map(tabsParentPropsKey, (key) => {
      childProps[key] = this.props[key];
    });

    // 存储当前所有的传输到下级的 props ，方便下级知道下而已，用处，随意。
    tabsParentPropsKey = [].concat(tabsParentPropsKey).concat(Object.keys(extraProps));

    childProps.tabsParentPropsKey = tabsParentPropsKey;

    if (tabsParentPropsKey.key && tab.value) {
      tabsParentPropsKey.key = `${tabsParentPropsKey.key}_${tab.value}`;
    }

    return childProps;
  }

  getPagePureTabsContent = ({ tab }) => {
    if (tab && tab.render && 'function' === typeof tab.render) {
      return tab.render({
        props: this.getPagePureTabsContentParentProps({
          tab,
        }),
      });
    }
    return null;
  }

  getPagePureTabPanelTab = (detailItemTab, filteredColumn) => {
    if (__DEV__ && __PROD__) {
      window.console.log(filteredColumn);
    }
    return <a href={`#tab=${detailItemTab.value}`}>{detailItemTab.label}</a>;
  }

  getPagePureTabs = ({
    column,
  }) => {
    const filteredColumn = _.filter(column, (elem) => {
      if (!this.state.tabSearchValue) {
        return true;
      }

      const source = _.get(elem, 'label') || _.get(elem, 'name') || '';
      return _.includes(source, this.state.tabSearchValue);
    });

    const onClick = (key) => {
      const current = _.find(filteredColumn, {
        value: key * 1 || key,
      });
      try {
        localStorage.setItem(this.tab_save_key, key);
      }
      catch (error) {
        // do nothing
      }

      this.setState({
        currentActiveTap: key,
      });
      this.handlePageTabsClick({
        key,
        current,
      });
    };

    return (<Tabs
      type="card"
      defaultActiveKey={`${this.getPageTabsDefaultActiveKey({
        column: filteredColumn,
      })}`}
      onTabClick={onClick}
      className="page-list-tabs">
      {
        _.map(filteredColumn, (detailItemTab) => {
          return (<Tabs.TabPane
            tab={this.getPagePureTabPanelTab(detailItemTab, filteredColumn)}
            key={detailItemTab.value}
            className="page-list-tabs-pane">
            { this.getPagePureTabsContent({ tab: detailItemTab }) }
          </Tabs.TabPane>);
        })
      }
    </Tabs>);
  }

  getWellSelectTabs = () => {
    return false;
  }

  getPageTabs = ({
    column = this.getPageTabsColumn(),
  }) => {
    if (column && column.length) {
      if (this.getWellSelectTabs()) {
        return (<Well free className={`page-list-tabs-container ${this.state.tabsClassName || ''}`} title={this.getPageTabsTitle()} >
          {
            this.getPagePureTabs({
              column,
            })
          }
        </Well>);
      }
      else {
        return (<div>
          {
            this.getPagePureTabs({
              column,
            })
          }
        </div>);
      }
    }
    return null;
  }

  getPageHeader = () => {
    return null;
  }

  getPageFooter = () => {
    return null;
  }

  getSider = () => {
    const siderTreeData = _.filter(this.getSiderTree(), (elem) => {
      return (elem.id || elem.pid) && (elem.label || elem.name);
    });
    const treeKey = this.getSiderTreeKey();

    const props = {
      valueFormat: this.siderTreeValueFormat,
      tree: siderTreeData,
      treeKey,
      deep: this.state.filterTreeDeep,
      onSelect: this.handleSiderSelect,
      onCheck: this.handleSiderCheck,
      getTreeFilterKey: this.getSiderTreeFilterKey,
      checkable: false,
      multiple: false,
      defaultExpanded: _.get(this.getPageState(), 'listState.siderExpanded') || [],
      defaultValue: _.get(this.getPageState(), 'listState.siderOrigin') || [],
      editDefaultExpanded: this.state.editDefaultExpanded,
    };
    if ('function' === typeof this.formatExpandedKeys) {
      props.formatExpandedKeys = this.formatExpandedKeys;
    }

    if (this.state.shouldSiderTreeHandleLoadData) {
      // 目前只有学生列表存在远程异步加载树的功能。
      props.loadData = this.handleLoadData;
    }

    if (siderTreeData && siderTreeData.length) {
      return (<FilterTree {...props} />);
    }
    return null;
  }

  getUploadFormColumn = () => {
    return [];
  }

  getUploadConfirmTip = () => {
    return undefined;
  }

  getUploadAuth =() => {
    return getApiConfig({ model: this.state.model, key: 'importAuth' });
  }

  getPatchRemoveConfirmText = () => {
    return '确认要删除吗？';
  }

  getNoDataSourceListTip = () => {
    return (<div>
      {
        this.state.noDataSourceListTip && 0 === this.state.dataSourceListLength ? (<Alert
          message="查询结果"
          description={this.state.noDataSourceListTip}
          type="error" />) : null
      }
    </div>);
  }

  getTranslateDict = () => {
    const translateDict = {};
    if ('function' === typeof this.getSearchColumn) {
      try {
        _.map(this.getSearchColumn({
          form: {},
        }), (elem) => {
          translateDict[elem.dataIndex] = elem.title;
        });
      }
      catch (err1) {
        sentryUndershoot.capture(err1, {
          ...err1,
        });
      }
    }
    if ('function' === typeof this.getTableColumns) {
      try {
        _.map(this.getTableColumns(), (elem) => {
          translateDict[elem.dataIndex] = elem.title;
        });
      }
      catch (err2) {
        sentryUndershoot.capture(err2, {
          ...err2,
        });
      }
    }
    return translateDict;
  }

  // 目前这个只有在学生列表使用到了。可能需要进行优化。
  getExpandNodeInfo = (elem) => {
    // 这个方法，需要自定义，详情查看 src/components_app/student/index.js
    if (elem) {
      return {};
    }
    return {};
  }

  /**
   * 获取当前批量操作的filter
   * @param {*} operateKey 当前批量操作按钮key
   */
  getPatchFilter = (operationInfo = this.state.operationInfo) => {
    const filter = _.concat(operationInfo.patchFilter, _.get(this.props.pageState, 'listState.filter')) || [];
    return filter;
  }

  getImportUploadColumns=() => {
    /**
     * 例子：使用新的上传组件替换原来的组件
     * uploadProps: 上传组件属性，
     * templateProps:下载模版组件属性，
     * auth：上传组件权限
     * 详情搜索：buildImportUploadComponent 组件
     */

    // return [
    //   {
    //     auth: this.getUploadAuth(),
    //     uploadProps: {
    //       name: '图书批量导入',
    //       path: this.renderTitleActionListBtnOfImportPath(),
    //       onUploaded: this.onUploaded,
    //       extraFormValue: this.renderUploadBtnExtraFormValue(),
    //     },
    //     templateProps: {
    //       skipAuthorization: this.state.skipAuthorization,
    //       path: this.renderTitleActionListBtnOfDownloadTempPath(),
    //       ...this.renderTitleActionListBtnOfDownloadTempProps(),
    //     },
    //   },
    // ];

    return [];
  }

  getDefaultPatchRemoveConfig=(newProps = {}) => {
    return {
      key: 'patchRemove',
      auth: this.renderTitleActionPatchRemoveAuth(),
      text: '批量删除',
      patchFilter: [],
      patchHandle: this.handlePatchRemove.bind(this, { confirm: false }),
      popconfirm: {
        placement: 'top',
        title: '确认要删除？',
      },
      ...newProps,
    };
  }

  canShowImportDescriptionPath = () => {
    return true;
  }

  componentWillReceivePropsExtend = (nextProps) => {
    if (__DEV__ && __PROD__) {
      window.console.log('nextProps', nextProps);
    }
  }

  shouleRenderDetailViewTitleUpdateAction = ({
    dataSource,
    key,
    index,
  }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('dataSource', dataSource, 'key', key, 'index', index);
    }
    const updatePath = Filters.path(`${this.state.model}_edit`, { id: _.get(dataSource, 'id') });
    return !!updatePath;
  }

  checkNeedResetListState = () => {
    const pageState = this.getPageState();
    const listStatePath = _.get(pageState, 'listState.path');
    const currentPath = location.href.replace(/#.*$/, '');
    return this.currentNextModelNeedReset || currentPath !== listStatePath;
  }

  gradeTreeFilter = () => {
    return [];
  }

  // 这个需要改成是使用 filter tree 里面的 node 属性的。需要特殊处理。方便后期的拓展往下。
  // 目前这个只有在学生列表使用到了。可能需要进行优化。
  // 目前在任课信息管理列表也有使用到
  handleLoadData = (treeNode) => {
    const node = _.get(treeNode, 'props.node') || treeNode;
    const departmentType = _.get(node, 'type');
    const isSchool = [_.get(CONST_DICT, 'departments.type.TYPE_CENTER_SCHOOL'), _.get(CONST_DICT, 'departments.type.TYPE_SCHOOL')].includes(departmentType);
    const isGrade = 'grade' === _.get(node, 'readType');
    const schoolId = _.get(node, 'id');
    const pid = _.get(node, 'pid');
    const resource = _.get(this.props, 'resource') || _.get(this.props, 'visitorState.resource', {});
    const canGetClassesAuth = checkIsHasAuth({
      auth: 'classes.*',
      resource,
    }) || (checkIsHasAuth({
      auth: 'classes.id',
      resource,
    }) && checkIsHasAuth({
      auth: 'classes.full_name',
      resource,
    }));

    const canGetGradesAuth = checkIsHasAuth({
      auth: 'grades.*',
      resource,
    }) || (checkIsHasAuth({
      auth: 'grades.id',
      resource,
    }));

    // 如果是置灰，则不查询下级菜单
    if (node.disabled) {
      return Promise.resolve([]);
    }

    if (!canGetGradesAuth) {
      message.error('没有权限查看年级的树');
      return Promise.resolve([]);
    }
    if (!canGetClassesAuth) {
      // 没有查看
      message.error('没有权限查看班级的树');
      return Promise.resolve([]);
    }
    if (!_.isEmpty(_.get(node, 'children')) && !isSchool) {
      // 不是学校
      return Promise.resolve([]);
    }
    if (!schoolId) {
      // 没有学校 id
      return Promise.resolve([]);
    }

    if (!isSchool && !isGrade) {
      return Promise.resolve([]);
    }

    let dispatchType = 'edu_architecture/treeNodeSchoolClasses';
    if (isSchool) {
      dispatchType = 'edu_architecture/treeNodeSchoolGrade';
    }

    // 这里要判断父级是不是学校或者中心学校。如果是，就获取他的班级，获取之前需要判断是不是已经获取过了。
    if (pid) {
      const pidNodeInfo = this.getExpandNodeInfo(`${departmentType}_${pid}`);
      const pidNodeType = _.get(pidNodeInfo, 'type');
      const children = _.get(pidNodeInfo, 'children', []);
      const classChildren = _.filter(children, {
        readType: 'class',
      });
      const pidNodeIsSchool = [_.get(CONST_DICT, 'departments.type.TYPE_CENTER_SCHOOL'), _.get(CONST_DICT, 'departments.type.TYPE_SCHOOL')].includes(pidNodeType);
      if (pidNodeIsSchool && !classChildren.length) {
        this.props.dispatch({
          type: dispatchType,
          payload: {
            treeNodeId: pid,
            treeNodeData: node,
            filterGraduate: this.state.filterGraduate,
            gradeFilter: this.gradeTreeFilter,
          },
        });
      }
    }

    // 后面判断是什么类型才进行对应的节点获取。
    return this.props.dispatch({
      type: dispatchType,
      payload: {
        treeNodeId: schoolId,
        treeNodeData: node,
        filterGraduate: this.state.filterGraduate,
        gradeFilter: this.gradeTreeFilter,
      },
    }).catch((rej) => {
      formErrorMessageShow(rej, {
        translateDict: this.getTranslateDict(),
      });
      // 输出错误信息，给 sentry 铺抓。
      window.console.log('edu_architecture/treeNodeSchoolClasses rej', rej);
      return Promise.resolve([]);
    });
  }

  // 获取批量删除的传输的 key
  handlePatchRemovePromisePaloadKey = () => {
    return {
      key: 'ids',
    };
  }

  // 获取批量删除的 promise
  handlePatchRemovePromise = ({ ids = this.state.selectedRowKeys, extraData = {} }) => {
    const payload = {};
    payload[this.handlePatchRemovePromisePaloadKey().key] = ids;
    payload.extraData = extraData;
    return this.props.dispatch({
      type: `${this.state.model}/patchRemove`,
      payload,
    });
  }

  handlePatchRemoveCallBack = () => {

  }

  handlePatchRemove = ({
    ids = this.state.selectedRowKeys,
    confirm = true,
    extraData = {},
    successMsg = '批量删除成功',
  }) => {
    if (!ids || !ids.length) {
      return message.error('请先勾选需要删除的项目');
    }

    const runPromise = ({
      msg = successMsg,
    }) => {
      this.handlePatchRemovePromise({ ids, extraData }).then((res) => {
        if (__DEV__ && __PROD__) {
          window.console.log('page list handlePatchRemove res', res);
        }

        this.handlePatchRemoveCallBack();
        message.success(msg);

        this.pageChangeHandler();
      }).catch((rej) => {
        formErrorMessageShow(rej, {
          translateDict: this.getTranslateDict(),
        });
        if (window.console && window.console.log) {
          window.console.log('confirm rej', rej);
        }
      });
    };

    if (confirm) {
      return Modal.confirm({
        title: '批量删除',
        content: this.getPatchRemoveConfirmText(),
        onOk: () => {
          return runPromise({
            msg: '批量删除成功',
          });
        },
        onCancel: () => {
          this.resetRowSelection();
        },
      });
    }
    else {
      return runPromise({
        msg: '删除成功',
      });
    }
  }

  handlePatchRemoveByRecord = ({ record }) => {
    return this.handlePatchRemove({
      ids: [record.id],
      confirm: false,
    });
  }

  handleToggleRowSelection = (key) => {
    let operateKey = '';
    let operationInfo = '';
    if (_.isString(key)) {
      operateKey = key;
      const operations = this.renderTitleBatchOperation();
      operationInfo = operations.find((item) => {
        return item.key === operateKey;
      }) || '';
    }

    this.setState({
      inRowSelection: !this.state.inRowSelection,
      selectedRowKeys: [],
      operateKey: this.state.inRowSelection ? '' : operateKey,
      patchSelectAll: this.state.inRowSelection ? false : this.state.patchSelectAll,
      operationInfo: this.state.inRowSelection ? '' : operationInfo,
      confirmPatchSelectAll: false,
    });
    this.handleFilterTotal(this.state.inRowSelection, operationInfo);
  }

  /**
   * 查询所有条数
   * @param {*} inRowSelection 是否批量操作状态
   * @param {*} operateKey 当前选中的操作按钮key
   */
  handleFilterTotal = (inRowSelection, operationInfo) => {
    const operations = this.renderTitleBatchOperation();
    if (_.isEmpty(operations) || inRowSelection) {
      return;
    }

    const filter = this.getPatchFilter(operationInfo);

    this.props.dispatch({
      type: `${this.state.model}/filterTotal`,
      payload: {
        filter,
      },
    });
  }

  /**
   * 批量操作 接口调用
   */
  handlePatchOperation = () => {
    const { operationInfo, confirmPatchSelectAll } = this.state;

    if (confirmPatchSelectAll) {
      // 所有分页全选
      operationInfo.patchAllHandle();
    }
    else {
      // 当前页全选
      operationInfo.patchHandle();
    }
  }

  handleSearch = (value) => {
    this.setState({
      tabSearchValue: value,
    });
  }

  handleSiderSelect = ({
    siderOrigin = [],
    siderExpanded = [],
    siderValues = {},
  }) => {
    // todo add every node filter type
    this.handleSubmit({
      siderOrigin,
      siderValues,
      siderExpanded,
    });
  }

  handleSiderCheck = (selected) => {
    if (__DEV__ && __PROD__) {
      window.console.log('onCheck', selected);
    }
  }

  handleTableRowSelect = (selectedRowKeys, selectedRows) => {
    if (__DEV__ && __PROD__) {
      window.console.log('selectedRowKeys', selectedRowKeys, 'selectedRows', selectedRows);
    }

    return true;
  }

  handleSelectAll = (selected) => {
    this.setState({
      patchSelectAll: selected,
    });
  }

  // resetPageListState = () => {
  //   return this.props.dispatch({
  //     type: `${this.state.model}/resetListState`,
  //   });
  // }

  resetPageState = (options = {}) => {
    if (!this.state.model) {
      return;
    }

    this.setState({
      resetPageStateIng: true,
    });
    const needSaveOriginPageValuesFlag = _.get(options, 'needSaveOriginPageValuesFlag', false);

    // 这里不进行特殊的深层次 clone ，因为毕竟渲染出来都是不同的值。
    const searchValues = {
      ..._.get(this.getPageState(), 'listState.searchValues') || {},
    };
    const listStatePath = _.get(this.getPageState(), 'listState.path') || '';

    const promise = new Promise((resolve, reject) => {
      if (!needSaveOriginPageValuesFlag) {
        const reset = this.props.dispatch({
          type: `${this.state.model}/reset`,
        });
        if (reset && reset.then && reset.cache) {
          reset.then((resReset) => {
            this.setState({
              resetPageStateIng: false,
            });
            resolve(resReset);
          }).catch((rejReset) => {
            this.setState({
              resetPageStateIng: false,
            });
            reject(rejReset);
          });
        }
        else {
          this.setState({
            resetPageStateIng: false,
          });
          resolve({});
        }
      }
      else {
        // 获取是否需要进行存储的表头搜索key。
        const headerColumnSaveSearchValues = {};
        _.forEach(_.entries(searchValues), ([key, value]) => {
          // window.console.log('searchValues', key, value);
          if (_.get(this.searchHeaderColumnKey, key, '')) {
            // window.console.log('headerColumnSaveSearchValues save', key, value);
            headerColumnSaveSearchValues[key] = value;
          }
        });

        // 因为 tag 搜索条件特殊，所以需要进行特殊保存。不能重置掉。
        this.props.dispatch({
          type: `${this.state.model}/listState`,
          payload: {
            siderExpanded: [],
            siderOrigin: [],
            siderValues: {},
            searchValues: headerColumnSaveSearchValues,
            headerColumnSaveSearchValues,
            path: listStatePath,
          },
        }).then((resListState) => {
          this.setState({
            resetPageStateIng: false,
          });
          resolve(resListState);
        }).catch((rejListState) => {
          this.setState({
            resetPageStateIng: false,
          });
          reject(rejListState);
        });
      }
    });
    return promise;
  }

  resetPageAndJumpLoadingBack = () => {
    return this.resetPageState({ needSaveOriginPageValuesFlag: true }).then(() => {
      const state = getState() || {};
      const currentUrls = _.get(state, 'breadcrumb.current') || [];
      if (Filters.path('loading', {}) && this.props.history) {
        this.props.history.replace(Filters.path('loading', {}, {
          dt: _.get(_.last(currentUrls), 'url') || '',
        }));
      }
      else {
        // 如果没有配置，那就直接刷新页面
        window.location.reload();
      }
    });
  }

  resetRowSelection = () => {
    this.setState({
      inRowSelection: false,
      selectedRowKeys: [],
      operateKey: '',
      operationInfo: '',
      patchSelectAll: false,
    });
  }

  pageChangeHandler = (page = _.get(this.getPageState(), 'page') || 1) => {
    const payload = {
      page,
      filter: _.get(this.getPageState(), 'listState.filter') || [],
      orderBy: _.get(this.getPageState(), 'listState.orderBy') || '',
      sort: _.get(this.getPageState(), 'listState.sort') || '',
      pageSize: this.pageSize(),
    };

    if (this.state.graphqlListSchema) {
      payload.select = this.state.graphqlListSchema;
    }

    setTimeout(() => {
      if (this.state.resetSelectedRowKeys) {
        this.resetRowSelection();
      }

      // // 这个地方应该是错误的。因为使用这个东西的时候，必须现请求 dataSource，所以这里不做对应改动。需要手动重载 handleSubmitDispatch，不做自动化
      // if (this.state.isLocalSearch) {
      //   // 如果是本地搜索，那就用这个。
      //   return this.handleSubmitDispatchLocal({ payload });
      // }
      // else {
      //   return this.handleSubmitDispatch({ payload });
      // }

      this.handleSubmitDispatch({ payload });
    }, 0);
  }

  handleRemoveSuccess = () => {
    return true;
  }

  handleRemoveDispatchType = () => {
    return `${this.state.model}/remove`;
  }

  handleRemove = ({ record }) => {
    this.props.dispatch({
      type: this.handleRemoveDispatchType(),
      payload: {
        id: record.id,
      },
    }).then(() => {
      message.success('删除成功');
      this.pageChangeHandler();
      this.handleRemoveSuccess();
    }).catch((rej) => {
      message.error('删除失败');
      formErrorMessageShow(rej, {
        translateDict: this.getTranslateDict(),
      });
    });
  }

  handleStatusChangeSuccess = () => {
    return true;
  }

  handleStatusChange = ({ record, values }) => {
    const promise = this.props.dispatch({
      type: `${this.state.model}/patchUpdate`,
      payload: {
        mutationType: 'changeStatus',
        id: record.id,
        values,
      },
    });
    promise.then(() => {
      message.success('设置成功');
      this.pageChangeHandler();
      this.handleStatusChangeSuccess();
    }).catch((rej) => {
      message.error('设置失败');
      formErrorMessageShow(rej, {
        translateDict: this.getTranslateDict(),
      });
    });
  }

  handleSubmitDispatchLocal = ({ payload }) => {
    const filter = _.get(payload, 'filter', []);
    const dataSource = this.getTableDataSourceOriginData();
    const result = this.handleLocalFilterData(filter, dataSource);
    this.setState({
      searchResultKey: result.dataSourceKey,
      isHandleSubmited: true,
    });
    return Promise.resolve({});
  }

  handleSubmitDispatch = ({ payload }) => {
    const promise = this.props.dispatch({
      type: `${this.state.model}/${this.state.isMaxList ? 'maxList' : 'list'}`,
      payload,
    });
    if (promise && promise.then && promise.catch) {
      promise.then((res) => {
        const dataSourceListLength = _.get(res, 'data.data.length') || 0;
        this.setState({
          dataSourceListLength,
        });
        this.handleSubmitSuccess(res);
      }).catch((rej) => {
        this.handleSubmitFail(rej);
      });
      return promise;
    }
    else {
      return Promise.reject({
        msg: '还没配置该 dispatch',
        data: {
          type: `${this.state.model}/${this.state.isMaxList ? 'maxList' : 'list'}`,
          payload,
        },
      });
    }
  }

  handleSummaryDispatch = ({ payload }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('payload', payload);
    }
    return Promise.resolve({
      msg: 'success',
      code: 0,
      data: {
        data: [],
      },
    });
  }

  handleSubmit = (options = {}) => {
    let expand = options.expand || _.get(this.getPageState(), 'listState.expand') || false;

    const {
      searchValues = _.get(this.getPageState(), 'listState.searchValues') || {},
      siderExpanded = _.get(this.getPageState(), 'listState.siderExpanded') || [],
      siderOrigin = _.get(this.getPageState(), 'listState.siderOrigin') || [],
      siderValues = _.get(this.getPageState(), 'listState.siderValues') || {},
      query = _.get(this.getPageState(), 'listState.query') || false,
      orderBy = _.get(this.getPageState(), 'listState.orderBy') || '',
      sort = _.get(this.getPageState(), 'listState.sort') || '',
      pageSize = this.pageSize(),
      loadOldPage = false,
    } = options;

    // 如果state有设置，则以state为准
    expand = this.state.expand || expand;

    if (!this.couldHandleSubmit({
      searchValues,
      siderExpanded,
      siderOrigin,
      siderValues,
      expand,
      query,
      orderBy,
      sort,
      pageSize,
      loadOldPage,
    })) {
      if (window.console && window.console.log) {
        window.console.log('couldHandleSubmit false');
      }
      return false;
    }

    const filterValue = { ...this.state.defaultSearchValue };
    _.each(Object.keys(searchValues), (key) => {
      if ('number' === typeof searchValues[key] || searchValues[key]) {
        filterValue[key] = searchValues[key];
      }
    });
    _.each(Object.keys(siderValues), (key) => {
      if (siderValues[key]) {
        filterValue[key] = siderValues[key];
      }
    });

    const filter = getFilter(filterValue, { searchColumns: this.getSearchColumn({ form: {} }) });

    this.props.dispatch({
      type: `${this.state.model}/listState`,
      payload: {
        path: window.location.href.replace(/#.*$/, ''),
        filter,
        siderExpanded,
        siderOrigin,
        siderValues,
        searchValues,
        expand,
        query,
        orderBy,
        sort,
        pageSize,
      },
    });

    const payload = {
      page: loadOldPage ? _.get(this.getPageState(), 'page') || 1 : 1,
      pageSize,
      filter,
      query,
      orderBy,
      sort,
      extraListSchemeParams: this.state.extraListSchemeParams,
    };

    if (this.state.graphqlListSchema) {
      payload.select = this.state.graphqlListSchema;
    }

    this.handleSummaryDispatch({ payload }).then((res) => {
      this.handleSummarySuccess(res);
    }).catch((rej) => {
      this.handleSummaryFail(rej);
    });

    // // 这个地方应该是错误的。因为使用这个东西的时候，必须现请求 dataSource，所以这里不做对应改动。需要手动重载 handleSubmitDispatch，不做自动化
    // if (this.state.isLocalSearch) {
    //   // 如果是本地搜索，那就用这个。
    //   return this.handleSubmitDispatchLocal({ payload });
    // }
    // else {
    //   return this.handleSubmitDispatch({ payload });
    // }

    return this.handleSubmitDispatch({ payload });
  }

  // 这个，本地处理搜索条件。目前在高招v3录取那边有。后面有的话，可以参考
  handleLocalFilterData = (filter, dataSource) => {
    return localFilterData(filter, dataSource);
  }

  showOperBtn = () => {
    return true;
  }

  couldHandleSubmit = () => {
    return true;
  }

  handleSubmitSuccess = (res) => {
    if (__DEV__ && __PROD__) {
      window.console.log('res', res);
    }

    if (this.state.resetSelectedRowKeys) {
      this.resetRowSelection();
    }

    return true;
  }

  handleSummarySuccess = (res) => {
    if (__DEV__ && __PROD__) {
      window.console.log('res', res);
    }
    return true;
  }

  handleSubmitFail = (rej) => {
    if (__DEV__ && __PROD__) {
      window.console.log('rej', rej);
    }
    formErrorMessageShow(rej, {
      translateDict: this.getTranslateDict(),
    });
    return true;
  }

  handleSummaryFail = (rej) => {
    if (__DEV__ && __PROD__) {
      window.console.log('rej', rej);
    }
    formErrorMessageShow(rej, {
      translateDict: this.getTranslateDict(),
    });
    return true;
  }

  handlePageTabsClick = ({
    key,
    current,
  }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('key', key, 'current', current);
    }
    return {
      key,
      current,
    };
  }

  handleTableChange = (pagination, filters, sorter) => {
    if (__DEV__ && __PROD__) {
      window.console.log('pagination', pagination, 'filters', filters, 'sorter', sorter);
    }

    let orderBy = '';
    let sort = '';

    if (sorter && sorter.order) {
      orderBy = _.get(sorter, 'column.sortKey') || sorter.columnKey;
      sort = 'descend' === sorter.order ? 'desc' : 'asc';
    }

    this.resetRowSelection();

    this.handleSubmit({ orderBy, sort });
  }

  siderTreeValueFormat = (value) => {
    return value * 1 || undefined;
  }

  triggerSearchFormChange = () => {
    this.setState({
      formKey: UUID().replace(/-/g, '_'),
    });
  }

  pageSize = () => {
    if (this.state.isMaxList) {
      return _.get(this.props, 'pageState.pageMaxSize') || CONSTANTS.PAGE_SIZE_MAX;
    }

    return _.get(this.props, 'pageState.pageSize') || CONSTANTS.PAGE_SIZE;
  }

  handleShowSizeChange = (current, size) => {
    const promise = this.handleSubmit({
      loadOldPage: false,
      pageSize: size,
    });
    if (promise && _.isFunction(promise.then)) {
      promise.then(() => {
        this.resetRowSelection();
      });
    }
  }

  paginationShowTotal = (total) => {
    // return `总共 ${total} 条记录`;
    if (__DEV__ && __PROD__) {
      window.console.log('total', total);
    }
    return null;
  }

  pagination = (className = 'ant-table-pagination ant-table-pagination-hide-last') => {
    const tableDataSourceNum = this.tableDataSourceNum();
    return (<Pagination
      className={className}
      total={tableDataSourceNum.total || 0}
      current={tableDataSourceNum.page || 0}
      pageSize={tableDataSourceNum.pageSize}
      showQuickJumper={false}
      pageSizeOptions={this.state.pageSizeOptions}
      onShowSizeChange={this.handleShowSizeChange}
      showSizeChanger={this.state.showSizeChanger}
      size="small"
      showTotal={this.paginationShowTotal}
      onChange={this.pageChangeHandler} />);
  }

  tableFooter = () => {
    const tableDataSourceNum = this.tableDataSourceNum();
    return (
      <div className="clearfix page-pagination">
        <div className="ant-table-pagination-info">当前显示{tableDataSourceNum.total ? tableDataSourceNum.start || 0 : 0} - {tableDataSourceNum.end || 0}条记录，共 {tableDataSourceNum.total || 0} 条数据</div>
        { this.pagination() }
      </div>
    );
  }

  tableTitleLabel = () => {
    return this.state.modeLabel;
  }

  tableDataSourceNum = () => {
    const { pageState = {} } = this.props;
    return {
      total: _.get(pageState, 'total', 0),
      start: _.get(pageState, 'start', 0),
      end: _.get(pageState, 'end', 0),
      page: _.get(pageState, 'page', 0),
      pageSize: this.pageSize(),
    };
  }

  tableTitleSubfix = () => {
    return '列表';
  }

  tableTitleExtra = () => {
    // const tableDataSourceNum = this.tableDataSourceNum();
    // return tableDataSourceNum.total ? <small>（共{tableDataSourceNum.total || 0}条）</small> : null;
    return null;
  }

  tableTitleActionRenderImportRebuildDefaultMenu = () => {
    return (<Menu>
      <Menu.Item key="dowmloadTemp">{this.renderTitleActionListBtnOfDownloadTemp()}</Menu.Item>
      <Menu.Item key="import">{this.renderTitleActionListBtnOfImport(false)}</Menu.Item>
    </Menu>);
  }

  tableTitleActionRender = () => {
    let tableTitleAction = this.tableTitleAction();

    // 左边的批量操作按钮， 一般就是  Patch 开头或者 togglePatchOperation
    const leftPatch = [];
    // 左边的取消按钮，一般是那个取消批量操作的按钮 rowSelectionCancel。目前只有这个
    const leftCancel = [];

    // 右边的批量操作按钮，一般是导入文件，导出文件，下载模板
    const rightPatch = [];
    // 其他的操作，默认都在中间，如果都匹配不上，那就放在这里。
    const rightOther = [];
    // 右边的增加按钮。一般是新增的。
    const rightAdd = [];
    // 下面为部分key的存储位置，其value就是对应的数组，需要是指针形式，默认都不在就放进 rightOther
    const keyActionPosition = {
      togglePatchOperation: leftPatch,
      patchRemove: leftPatch,
      patchLeave: leftPatch,
      patchReCheckIn: leftPatch,
      patchDelete: leftPatch,
      patchPause: leftPatch,
      patchStart: leftPatch,
      patchOperate: leftPatch,
      patchOperate1: leftPatch,
      batchbind: leftPatch,
      patchUnbind: leftPatch,
      patchSetMessage: leftPatch,
      patchOptions: leftPatch,
      patchPass: leftPatch,
      patchFail: leftPatch,
      patchConfirm: leftPatch,
      patchExportPdf: leftPatch,
      patchSubject: leftPatch,
      batchEnrollPass: leftPatch,
      patchPreExportPdf: leftPatch,
      tempBookShelf: leftPatch,
      patchSetNotOutBooks: leftPatch,
      patchRemoveBookShelf: leftPatch,
      patchTransferBooks: leftPatch,
      patchUpdatename: leftPatch,
      patchVerifySuccess: leftPatch,
      patchVerifyFail: leftPatch,
      // left1 开头

      rowSelectionCancel: leftCancel,
      // left2 开头

      export: rightPatch,
      export1: rightPatch,
      exportExcel: rightPatch,
      export_audit: rightPatch,
      exportAttendance: rightPatch,
      exportNoAttendance: rightPatch,
      download: rightPatch,
      downloadTemp: rightPatch,
      downloadAddTemp: rightPatch,
      downloadStockTemp: rightPatch,
      download_exam_no: rightPatch,
      import: rightPatch,
      importDesc: rightPatch,
      importTemp: rightPatch,
      importAdd: rightPatch,
      importCheckIn: rightPatch,
      importStock: rightPatch,
      importPic: rightPatch,
      import_audit: rightPatch,
      import_seat_modal: rightPatch,
      import_exam_modal: rightPatch,
      import_middle_three: rightPatch,
      import_cover: rightPatch,
      import_middle_two: rightPatch,
      allStudentPreAdmission: rightPatch,
      allStudentSchoolAudit: rightPatch,
      allCheckIn: rightPatch,
      allClassAssign: rightPatch,
      // right1 开头

      add: rightAdd,
      add1: rightAdd,
      addNotice: rightAdd,
      addStudent: rightAdd,
      create: rightAdd,
      addCode: rightAdd,
      // right3 开头

      // 右边的其他
      // right2 开头
    };

    if (_.isArray(tableTitleAction)) {
      // 这里集合之前的那个导入和下载模板的按钮
      const rebuildImportBtnKeyArrList = ['downloadTemp', 'import'];
      const oldImportBtnArr = _.filter(tableTitleAction, (elem) => {
        return elem && elem.key && elem.props && _.includes(rebuildImportBtnKeyArrList, elem.key);
      });
      // 判断是否需要重新创建一个导入+下载模板的flag
      const rebuildImportBtnFlag = (oldImportBtnArr.length === rebuildImportBtnKeyArrList.length) && _.every(oldImportBtnArr, (elem) => {
        return true === _.get(elem.props, 'data-page-list');
      });
      let rebuildImportBtn = null;
      if (rebuildImportBtnFlag) {
        const menu = this.tableTitleActionRenderImportRebuildDefaultMenu();

        rebuildImportBtn = (<Access key="importRebuildDefault" auth={this.getUploadAuth()}>
          <Dropdown size="small" overlay={menu}>
            <Button size="small">{this.state.importTextRebuild || '批量导入'}<Icon type="down" /></Button>
          </Dropdown>
        </Access>);
        tableTitleAction = _.filter(_.map(tableTitleAction, (elem) => {
          if (elem && rebuildImportBtnKeyArrList[0] === elem.key && true === _.get(elem.props, 'data-page-list')) {
            return rebuildImportBtn;
          }
          return elem;
        }), (elem) => {
          if (!elem) {
            return;
          }

          const flag = _.includes(rebuildImportBtnKeyArrList, elem.key) && true === _.get(elem.props, 'data-page-list');
          return !flag;
        });
      }
      // 这里集合之前的那个导入和下载模板的按钮 end
      _.map(tableTitleAction, (elem) => {
        if (!elem) {
          return;
        }
        const key = _.get(elem, 'key', '');
        // 配置上的
        if (key && keyActionPosition[key] && _.isArray(keyActionPosition[key])) {
          keyActionPosition[key].push(elem);
        }
        // 批量操作的
        else if (_.startsWith(key, 'left1') || _.startsWith(key, 'patch')) {
          leftPatch.push(elem);
        }
        else if (_.startsWith(key, 'left2')) {
          leftCancel.push(elem);
        }
        // 不勾选就批量操作的
        else if (_.startsWith(key, 'right1') || _.startsWith(key, 'export') || _.startsWith(key, 'import') || _.startsWith(key, 'all') || _.startsWith(key, 'download')) {
          rightPatch.push(elem);
        }
        // 右边中间其他
        else if (_.startsWith(key, 'right2')) {
          rightOther.push(elem);
        }
        // 增加的
        else if (_.startsWith(key, 'right3') || _.startsWith(key, 'add') || _.startsWith(key, 'create')) {
          rightAdd.push(elem);
        }
        // 其他都不知道的，就放在其他的
        else {
          rightOther.push(elem);
          if (__DEV__ && __PROD__) {
            window.console.log('page list tableTitleActionRender format elem', elem);
          }
        }
      });
    }
    else {
      // 如果不是数组，那就不管他了，直接渲染出来
      rightOther.push(tableTitleAction);
    }

    if (__DEV__ && __PROD__) {
      const actionFormat = [
        [leftPatch, leftCancel],
        [rightPatch, rightOther, rightAdd],
      ];
      window.console.log('page list tableTitleActionRender format actionFormat', actionFormat);
    }

    return (<div className={`table-title-action-table-container table-title-action-container table-title-action ${this.state.tableTitleCls || ''}`}>
      <div className="table-title-action-table-cell table-title-action-left">
        <span className="table-title-action-group" data-btn-group="leftPatch">{leftPatch}</span>
        <span className="table-title-action-group" data-btn-group="leftCancel">{leftCancel}</span>
      </div>
      <div className="table-title-action-table-cell table-title-action-right">
        <span className="table-title-action-group" data-btn-group="rightPatch">{rightPatch}</span>
        <span className="table-title-action-group" data-btn-group="rightOther">{rightOther}</span>
        <span className="table-title-action-group" data-btn-group="rightAdd">{rightAdd}</span>
      </div>
    </div>);
  }

  tableTitle = () => {
    return (
      <div className="table-title-container clearfix">
        <h3 className="table-title page-list-table-title">
          {this.tableTitleLabel()}{this.tableTitleSubfix()}
          {this.tableTitleExtra()}
        </h3>

        {this.tableTitleActionRender()}
        {this.renderSelectAllTips()}
      </div>
    );
  }

  tableTitleAction = () => {
    const { operateKey } = this.state;
    const operations = this.renderTitleBatchOperation();
    if (this.state.inRowSelection) {
      // 有数据则走新模式
      if (!_.isEmpty(operations)) {
        const operationInfo = operations.find((item) => {
          return item.key === operateKey;
        });
        return this.renderTitleActionListInRowSelectionNew(operationInfo);
      }

      return this.renderTitleActionListInRowSelection();
    }

    if (operations) {
      // 左侧批量操作按钮
      const leftList = buildBatchOperation(operations, this.handleToggleRowSelection, this.state.patchOperateCount);
      // 右侧导入导出按钮
      const rightList = this.renderTitleActionList();

      return [...leftList, ...rightList];
    }

    return this.renderTitleActionList();
  }

  tableTitleActionHorizontal() {
    // 左侧批量操作按钮
    let list = this.renderTitleActionListInRowSelectionCustomList();
    // 右侧导入导出按钮
    let actionList = this.renderTitleActionList();
    // 挂载全局，方便点击之后获取原始element
    let newList = [];

    // 去除confirm
    list = list.map((item) => {
      return this.cullingConfirmElement(item, { key: item.key });
    });

    const patchOperateCount = this.state.patchOperateCount;

    // 是否超过个数，是则将多余的放到更多里面
    if (patchOperateCount < list.length) {
      const filterList = [];
      const menus = [];

      list.map((item, index) => {
        if (patchOperateCount - 1 > index) {
          filterList.push(item);
        }
        else {
          menus.push(<Menu.Item key={item.key}>{item}</Menu.Item>);
        }

        return item;
      });

      const dropdown = (<Dropdown key="left1More" size="small" overlay={<Menu>{menus}</Menu>}>
        <Button size="small">更多<Icon type="down" /></Button>
      </Dropdown>);
      filterList.push(dropdown);

      list = filterList;
    }

    actionList = actionList.filter((item) => {
      // 过滤批量操作按钮
      return 'togglePatchOperation' !== _.get(item, 'key');
    });

    // 合并左右两边数组
    newList = [...list, ...actionList];
    return newList;
  }

  cullingConfirmElement(element, args = {}) {
    const newArgs = { ...args };
    const { children, onClick, onSuccessCallback } = _.get(element, 'props', {});
    // 判断是否popConfirm组件
    const isPopConfirm = _.get(element, 'type', '').toString() === Popconfirm.toString();

    if (_.isString(children)) {
      if (newArgs.addClick || onClick) {
        if (!newArgs.key) {
          window.console.error(`${children} 菜单必须要有key值`);
        }
        return React.cloneElement(element, { onClick: this.handleToggleRowSelection.bind(this, newArgs.key) });
      }
      return React.cloneElement(element, {});
    }

    if (isPopConfirm || onSuccessCallback) {
      // 过滤confirm 下一层级添加click函数
      return this.cullingConfirmElement(children, { ...newArgs, addClick: true });
    }

    if (_.isObject(children)) {
      if (newArgs.addClick || onClick) {
        if (!newArgs.key) {
          window.console.error(`${children} 菜单必须要有key值`);
        }
        newArgs.addClick = false;
        return React.cloneElement(element, { onClick: this.handleToggleRowSelection.bind(this, newArgs.key) }, this.cullingConfirmElement(children, newArgs));
      }
      return React.cloneElement(element, { }, this.cullingConfirmElement(children, newArgs));
    }

    return '';
  }

  //  拓展增加重置后的回调操作
  handleSearchFormResetFieldsCallBack = (form) => {
    if (__DEV__ && __PROD__) {
      window.console.log('form', form);
    }
  }

  // 批量导出的回调
  batchExportPropsCallBack = () => {
    // 外部继续操作吧
  }

  renderSelectAllTips = () => {
    const { patchAllHandle } = this.state.operationInfo;
    const total = _.get(this.props.pageState, 'total');
    const filterTotal = _.get(this.props.pageState, 'filterTotal');
    const currentSelectCount = this.state.selectedRowKeys.length;
    // 1、有patchAllHandle函数
    // 2、点击了勾选全部
    // 3、总条数大于当前条数
    // 4、符合条件的条数大于总的符合条件条数
    // 符合以上4个条件才会显示全表勾选提示语
    if (patchAllHandle
      && this.state.patchSelectAll
      && total > CONSTANTS.PAGE_SIZE
      && filterTotal > currentSelectCount) {
      return (<Alert
        message={<SelectAll
          currentCount={currentSelectCount}
          total={filterTotal}
          onChange={(select) => {
          this.setState({
            confirmPatchSelectAll: select,
          });
        }} />}
        type="info"
        showIcon
        style={{ marginLeft: '30px', marginRight: '20px' }} />);
    }
    return null;
  }

  renderTitleCustomActionList = () => {
    return [];
  }

  // 获取新增的接口 url
  renderAddActionHref = () => {
    return Filters.path(`${this.state.model}_add`, {});
  }

  // 获取新增的权限的。
  renderAddActionAuth = () => {
    // // TODO: 需要移除 function 形式的 auth
    // // 直接判断有没有新增的权限。两种，一种为 create 的，一种是 save 的。
    // return (resource) => {
    //   return resource[getApiConfig({ model: this.state.model, key: 'mutation.create.name' })];
    // };

    return getApiConfig({ model: this.state.model, key: 'mutation.create.name' });
  }

  renderAddActionText = () => {
    return '新增';
  }

  // 渲染新增的按钮。
  renderAddAction = () => {
    if (this.state.modelAddComponent) {
      return (<Access key="create" auth={this.renderAddActionAuth()}>
        { this.state.modelAddComponent }
      </Access>);
    }

    const addPath = this.renderAddActionHref();
    if (addPath) {
      return (<Access key="create" auth={this.renderAddActionAuth()}>
        <NavLink to={addPath}>
          <Button size="small" type="primary">{this.renderAddActionText()}</Button>
        </NavLink>
      </Access>);
    }
    return null;
  }

  // 上传时候的按钮的额外参数
  renderUploadBtnExtraFormValue = () => {
    const params = {};
    // 暴力写法，反正后端不用判断是不是存在的。全部都上传上去。
    const nodeDepartmentId = _.get(this.getPageState(), 'listState.siderValues.node_department_id') || _.get(this.getPageState(), 'listState.siderValues.and-equal-node_department_id');
    if (nodeDepartmentId) {
      params.sub_school_id = nodeDepartmentId;
    }

    return params;
  }

  renderTitleActionPatchRemoveAuth = () => {
    return `${getApiConfig({ model: this.state.model, key: 'mutation.patchRemove.name' })}`;
  }

  // 自定义的
  renderTitleActionListInRowSelectionList = () => {
    const list = [];

    const patchRemove = (<Access key="patchRemove" auth={this.renderTitleActionPatchRemoveAuth()}>
      <a onClick={this.handlePatchRemove.bind(this, {})}>
        <Button size="small">批量删除</Button>
      </a>
    </Access>);

    list.push(patchRemove);
    defineUnenumerableProperty(list, 'patchRemove', patchRemove);

    return list;
  }

  renderTitleActionListInRowSelectionCustomList = () => {
    return this.renderTitleActionListInRowSelectionList();
  }

  renderTitleActionListInRowSelection = () => {
    const list = this.renderTitleActionListInRowSelectionCustomList();

    const rowSelectionCancel = (<Access key="rowSelectionCancel">
      <a onClick={this.handleToggleRowSelection} key="rowSelectionCancel">
        <Button size="small">取消</Button>
      </a>
    </Access>);

    list.push(rowSelectionCancel);
    defineUnenumerableProperty(list, 'rowSelectionCancel', rowSelectionCancel);

    return list;
  }

  renderTitleActionListInRowSelectionNew = (item) => {
    const list = [];

    const newEle = buildConfirmOperation(item, this.handlePatchOperation.bind(this));
    list.push(newEle);
    defineUnenumerableProperty(list, 'rowSelectionConfirm', newEle);

    const rowSelectionCancel = (<Access key="rowSelectionCancel">
      <a onClick={this.handleToggleRowSelection} key="rowSelectionCancel">
        <Button size="small">取消</Button>
      </a>
    </Access>);

    list.push(rowSelectionCancel);
    defineUnenumerableProperty(list, 'rowSelectionCancel', rowSelectionCancel);

    return list;
  }

  renderChangeElementText(element) {
    const { children } = _.get(element, 'props', {});
    if (_.isString(children)) {
      const text = children.replace('批量', '确认');
      return React.cloneElement(element, { type: 'primary' }, text);
    }

    if (_.isObject(children)) {
      return React.cloneElement(element, { }, this.renderChangeElementText(children));
    }

    return '';
  }

  renderExportableListBlackName = () => {
    return [];
  }

  renderTitleActionListBtnOfImportPath = () => {
    return `${getApiConfig({ model: this.state.model, key: 'importPath' })}?upload`;
  }

  renderTitleActionListBtnOfImport = (isButton = this.state.importIsButton) => {
    return (<Upload
      getTranslateDict={this.getTranslateDict}
      extraFormValue={this.renderUploadBtnExtraFormValue()}
      uploadConfirmTip={this.getUploadConfirmTip()}
      getUploadFormColumn={this.getUploadFormColumn}
      onUploaded={this.onUploaded}
      path={this.renderTitleActionListBtnOfImportPath()}
      link={!isButton}
      asyncUpload={this.state.asyncUpload}
      size="small">{this.state.importText || '批量导入'}</Upload>);
  }

  renderTitleActionListBtnOfDownloadTempPath = () => {
    return `${getApiConfig({ model: this.state.model, key: 'downloadTempPath' })}`;
  }

  renderTitleActionListBtnOfDownloadTempProps = () => {
    return {};
  }

  renderTitleActionListBtnOfDownloadTemp = () => {
    return (<DownloadLink
      link="true"
      method="GET"
      {...this.renderTitleActionListBtnOfDownloadTempProps()}
      skipAuthorization={this.state.skipAuthorization}
      path={this.renderTitleActionListBtnOfDownloadTempPath()}
      size="small">下载模板</DownloadLink>);
  }

  renderTitleBatchOperation = () => {
    return '';
  }

  renderTitleActionListBtn = () => {
    const list = [];

    // ''空字符串则渲染旧批量操作按钮，[]空对象则不渲染
    const operationList = this.renderTitleBatchOperation();

    // if ('' !== operationList) {
    //   if (!_.isEmpty(operationList)) {
    //     list = buildBatchOperation(operationList, this.handleToggleRowSelection, this.state.patchOperateCount);
    //   }
    // }
    if ('' === operationList) {
      const patchOperate = (<a key="togglePatchOperation" onClick={this.handleToggleRowSelection}>
        <Button size="small">批量操作</Button>
      </a>);
      defineUnenumerableProperty(list, 'patchOperate', patchOperate);
      // 只有存在的时候，才引入进去
      if (this.state.canRowSelection) {
        list.push(patchOperate);
      }
    }

    if (_.get(this.getImportUploadColumns(), 'length')) {
      const importUpload = this.renderImportUpload();
      defineUnenumerableProperty(list, 'import', importUpload);
      list.push(importUpload);
    }
    else {
      const upload = (<Access data-page-list key="import" auth={this.getUploadAuth()}>
        {this.renderTitleActionListBtnOfImport()}
      </Access>);
      list.push(upload);
      defineUnenumerableProperty(list, 'import', upload);
    }


    const batchExportProps = {
      blackBame: this.renderExportableListBlackName(),
      exportableList: getApiConfig({ model: this.state.model, key: 'exportableList' }),
      model: this.state.model,
      exportAction: getApiConfig({ model: this.state.model, key: 'exportAction' }),
      path: getApiConfig({ model: this.state.model, key: 'exportPath' }),
      query: { filter: [].concat(getApiConfig({ model: this.state.model, key: 'modelDefaultFilter' })).concat(_.get(this.getPageState(), 'listState.filter')) || [] },
      confirm: true,
      size: 'small',
      isButton: this.state.exportIsButton,
      downloadCallBack: this.batchExportPropsCallBack,
      isDefaultAllField: this.state.isDefaultAllField,
    };

    const batchExport = (<Access key="export" auth={getApiConfig({ model: this.state.model, key: 'exportAction' })}>
      <DownloadGraphql {...batchExportProps}>{this.state.downloadText || '批量导出'}</DownloadGraphql>
    </Access>);
    list.push(batchExport);

    defineUnenumerableProperty(list, 'export', batchExport);

    const add = this.renderAddAction();
    list.push(add);
    defineUnenumerableProperty(list, 'add', add);

    if (!_.get(this.getImportUploadColumns(), 'length')) {
      const download = (<Access data-page-list key="downloadTemp" auth={getApiConfig({ model: this.state.model, key: 'importAuth' })}>
        {this.renderTitleActionListBtnOfDownloadTemp()}
      </Access>);
      list.push(download);
      defineUnenumerableProperty(list, 'download', download);
    }


    const importDescriptionPath = getApiConfig({ model: this.state.model, key: 'importDescriptionPath' });
    if (importDescriptionPath && this.canShowImportDescriptionPath()) {
      const importDesc = (<Access key="importDesc" auth={getApiConfig({ model: this.state.model, key: 'importAuth' })}>
        <a href={importDescriptionPath} target="_blank">导入说明</a>
      </Access>);
      list.push(importDesc);
      defineUnenumerableProperty(list, 'importDesc', importDesc);
    }
    return list;
  }

  renderImportUpload=() => {
    return buildImportUploadComponent(this.getImportUploadColumns());
    // return false;
  }

  // 这个内部没调用，但是万一外部调用了。写上吧。
  renderTitleActionListCustom = () => {

  }

  renderTitleActionList = () => {
    return this.renderTitleActionListBtn();
  }

  renderPureView = () => {
    return (<div className={`page-content ${styles.pageListContent}`}>
      { this.getPageHeader() }
      {
        this.getPageTabs({
          column: this.getPageTabsColumn(),
        })
      }
      { this.getSearchForm() }
      { this.getNoDataSourceListTip() }
      { this.getContentHeader() }
      { this.getSummaryView() }
      {
        'Table' === this.state.mode ? this.getTable() : null
      }
      {
        'DetailView' === this.state.mode ? this.getDetailViewTable() : null
      }
      {
        'TargetDetailView' === this.state.mode ? this.getTargetDetailView() : null
      }
      { this.getPageFooter() }
    </div>);
  }

  renderView = () => {
    if (this.state.wrapWithoutLayout) {
      return this.renderPureView();
    }

    if (this.state.resetPageStateIng) {
      return (<Spin spinning><div><Icon type="loading" /></div></Spin>);
    }

    return (<PageLayout
      hideBreadcrumb={this.state.hideBreadcrumb}
      Sider={this.getSider()}
      className={`page-list-default ${this.state.PageLayoutClassName} ${styles.pageList}`}>
      { this.renderPureView() }
    </PageLayout>);
  }

  render() {
    return this.renderView();
  }
}
