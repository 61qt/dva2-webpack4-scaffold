import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import { Button, Form, Col, Row, Icon } from 'antd';
import { composeClass } from '@/utils/dom/class_name';
import buildListSearchFilter from '../../utils/build_list_search_filter';

import buildFilterByColumnOrSearchKey, { getSearchColumnComponent } from '../../utils/build_filter_by_column_or_search_key';
import { isSearchRuleString } from '../../utils/build_filter_by_column_or_search_key/build_filter_helpers';

import styles from './index.less';

const searchFormItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};

const formFilterNameMap = {
  and_node_department_id: 'node_department_id',
  not_pid: 'pid',
  parentStudentIds: 'student_id',
  book_category_ids: 'book_category_id',
  bookshelf_ids: 'bookshelf_id',
  // book_author: 'book_id',
  // book_publisher: 'book_id',
  pid_level_1: 'pid',
  pid_level_2: 'pid',
  books$name: 'books.name',
  books$bar_code: 'books.bar_code',
  book_details$bar_code: 'book_details.bar_code',
  students$class_id: 'students.class_id',
  students$entrance_year: 'students.entrance_year',
  student_created_at_end: 'created_at',
  student_created_at_start: 'created_at',
  user_audit_log_created_at_end: 'created_at',
  user_audit_log_created_at_start: 'created_at',
  teachers$name: 'teachers.name',
  teachers$id_number: 'teachers.id_number',
  audit_at_end: 'audit_at',
  audit_at_start: 'audit_at',
  users$status: 'users.status',
  users$username: 'users.username',
  users$id_number: 'users.id_number',
  books$isbn: 'books.isbn',
  users$district_id: 'users.district_id',
  users$name: 'users.name',
  users$email: 'users.email',
  students$name: 'students.name',
  students$id_number: 'students.id_number',
  students$phone: 'students.phone',
  students$health_status: 'students.health_status',
  students$account_location_code: 'students.account_location_code',
  students$student_no: 'students.student_no',
  students$native_place: 'students.native_place',
  students$nationality: 'students.nationality',
  students$gender: 'students.gender',
  asset_details$asset_category_id: 'asset_details.asset_category_id',
  classes$id: 'classes.id',
  additions$id: 'addition.id',
  class$recordable_id: 'recordable_id',
  room$recordable_id: 'recordable_id',
  student$recordable_id: 'recordable_id',
  hse_wish_schools$department_id: 'hse_wish_schools.department_id',
  issue_handlers$step: 'issue_handlers.step',
  evaluation_created_at_start: 'created_at',
  evaluation_created_at_end: 'created_at',
  record_day_start: 'record_day',
  record_day_end: 'record_day',
  transfer_out_at_start: 'transfer_out_at',
  transfer_out_at_end: 'transfer_out_at',
  transferred_at_start: 'transferred_at',
  transferred_at_end: 'transferred_at',
  site_special_created_at_start: 'created_at',
  site_special_created_at_end: 'created_at',
  site_article_created_at_start: 'created_at',
  site_article_created_at_end: 'created_at',
  record_date_start: 'record_date',
  record_date_end: 'record_date',
  cultural_score_start: 'cultural_score',
  cultural_score_end: 'cultural_score',
  order_start: 'created_at',
  order_end: 'created_at',
  evaluation$type: 'evaluation.type',
  classes$entrance_year: 'classes.entrance_year',
  elective_plans$year: 'elective_plans.year',
  elective_plans$term_type: 'elective_plans.term_type',
  elective_courses$weekly: 'elective_courses.weekly',
  elective_courses$name: 'elective_courses.name',
  elective_courses$teacher_id: 'elective_courses.teacher_id',
  data_audit_list_ignore_status_normal: 'status',
  user_operation_log_created_at_start: 'created_at',
  user_operation_log_created_at_end: 'created_at',
  asset_purchase_created_at_start: 'created_at',
  asset_purchase_created_at_end: 'created_at',
  departments$name: 'departments.name',
};

export function localFilterData(filters, dataSource) {
  let newDataSource = [...dataSource];

  // 搜索值，其中第一个为搜索顺序，越大越提前
  let searchFunctionArr = [];

  _.map(filters, ([key, method, value]) => {
    if (_.includes(['rightLike', 'leftLike', 'like'], method)) {
      searchFunctionArr.push({
        sort: 1,
        func: (elem) => {
          const keyValue = _.get(elem, key);
          if (undefined === keyValue) {
            return false;
          }

          return _.includes(keyValue, value);
        },
      });
    }
    else if ('in' === method) {
      searchFunctionArr.push({
        sort: 2,
        func: (elem) => {
          const keyValue = _.get(elem, key);
          if (undefined === keyValue) {
            return false;
          }

          return _.includes(value, keyValue);
        },
      });
    }
    else if ('notIn' === method) {
      searchFunctionArr.push({
        sort: 3,
        func: (elem) => {
          const keyValue = _.get(elem, key);
          if (undefined === keyValue) {
            return false;
          }

          return !_.includes(value, keyValue);
        },
      });
    }
    else {
      // 这里面全部都能够使用数值运算的那种。如果是非大于等于小于等等操作，需要前置处理。
      searchFunctionArr.push({
        sort: 4,
        func: (elem) => {
          const keyValue = _.get(elem, key);
          if (undefined === keyValue) {
            return false;
          }
          const numberStr = `return ${keyValue} ${'=' === method ? '===' : method} ${value}`;
          // eslint-disable-next-line no-new-func
          return new Function(numberStr)();
        },
      });
    }
  });

  searchFunctionArr = _.reverse(_.sortBy(searchFunctionArr, 'sort'));

  _.map(searchFunctionArr, ({
    func,
  }) => {
    newDataSource = _.filter(newDataSource, func);
  });

  // 存储什么 admission student id 为当前搜索 ok 的
  const dataSourceKey = {};

  _.map(newDataSource, (elem) => {
    dataSourceKey[elem.id] = true;
  });

  return {
    dataSource: newDataSource,
    dataSourceKey,
  };
}

export function getFilter(values, options = {}) {
  const searchColumns = _.get(options, 'searchColumns', []);
  const columnHasConfigType = _.some(searchColumns, (column) => {
    return !!column.type;
  });
  const searchKeyHasSearchRuleString = _.some(values, (value, key) => {
    return isSearchRuleString(key);
  });
  // 如果配置项中有 type 类型或者 values 中的 key 有 searchRuleString 的就走新的处理方法，
  if (columnHasConfigType || searchKeyHasSearchRuleString) {
    return buildFilterByColumnOrSearchKey({
      searchFormValues: values,
      searchFormColumn: searchColumns,
      formFilterNameMap,
    });
  }

  return buildListSearchFilter({
    values,
    formFilterMethod: {
      not_pid: '!=',
      pid_level_1: '=',
      pid_level_2: '!=',
      book_category_ids: '=',
      editor_id: '=',
      bookshelf_ids: 'in',
      books$name: 'like',
      name: 'like',
      table: 'like',
      value: 'like',
      code: 'like',
      field: 'like',
      author: 'like',
      publisher: 'like',
      isbn: 'like',
      username: 'like',
      operator: 'like',
      class_name: 'like',
      full_name: 'like',
      title: 'like',
      alias_name: 'like',
      id_number: 'like',
      students$name: 'like',
      users$name: 'like',
      student_created_at_end: '<=',
      student_created_at_start: '>=',
      evaluation_created_at_start: '>=',
      evaluation_created_at_end: '<=',
      record_day_end: '<=',
      record_day_start: '>=',
      transfer_out_at_end: '<=',
      transfer_out_at_start: '>=',
      transferred_at_end: '<=',
      transferred_at_start: '>=',
      order_end: '<=',
      order_start: '>=',
      site_special_created_at_end: '<=',
      site_special_created_at_start: '>=',
      site_article_created_at_end: '<=',
      site_article_created_at_start: '>=',
      record_date_start: '>=',
      record_date_end: '<=',
      cultural_score_start: '>=',
      cultural_score_end: '<=',
      audit_at_start: '>=',
      audit_at_end: '<=',
      user_audit_log_created_at_start: '>=',
      user_audit_log_created_at_end: '<=',
      asset_purchase_created_at_start: '>=',
      asset_purchase_created_at_end: '<=',
      weekly: 'like',
      elective_courses$weekly: 'like',
      elective_courses$name: 'like',
      parentStudentIds: 'in',
      data_audit_list_ignore_status_normal: '!=',
      students$id_number: 'like',
    },
    rebuildFormFilterName: [
      'start_end_time',
      'audit_at_start_end_time',
      'user_audit_log_created_at_start_end_time',
      'order_start_end_time',
      'transfer_out_at_start_end_time',
      'transferred_at_start_end_time',
      'student_created_at_start_end_time',
      'evaluation_created_at_start_end_time',
      'record_day_start_end_time',
      'site_special_created_at_start_end_time',
      'site_article_created_at_start_end_time',
      'record_date_start_end_time',
      'cultural_score_start_end_range',
      'user_operation_log_created_at_start_end_time',
      'asset_purchase_created_at_start_end_time',
    ],
    rebuildFormValueFunc: {
      start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      student_created_at_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      student_created_at_end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      evaluation_created_at_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      evaluation_created_at_end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      pid_level: ({ value }) => {
        if (__DEV__ && __PROD__) {
          window.console.log('pid_level value', value);
        }
        return '';
      },
      record_date_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      record_date_end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      audit_at_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      audit_at_end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      user_audit_log_created_at_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).format(format);
      },
      // 这个是文字格式。
      // user_audit_log_created_at_end: (value) => {
      //   if (!value) {
      //     return undefined;
      //   }

      //   const format = 'YYYY-MM-DD';
      //   const unix = moment(moment(value).format(format), format).unix() + (24 * 60 * 60);
      //   return moment.unix(unix).format(format);
      // },
      user_audit_log_created_at_end: (value) => {
        // 这个是数字格式。
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      user_operation_log_created_at_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      user_operation_log_created_at_end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      asset_purchase_created_at_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      asset_purchase_created_at_end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      transfer_out_at_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      transfer_out_at_end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
      ttransferred_at_start: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix();
      },
      transferred_at_end: (value) => {
        if (!value) {
          return undefined;
        }
        const format = 'YYYY-MM-DD';
        return moment(moment(value).format(format), format).unix() + ((24 * 60 * 60) - 1);
      },
    },
    formFilterName: formFilterNameMap,
    ...options,
  });
}

function buildSearchFormCol({
  form,
  searchCol,
  elem,
}) {
  if (__DEV__ && __PROD__) {
    window.console.log('form', form, 'searchCol', searchCol, 'elem', elem);
  }

  let isRemove = false;
  if ('boolean' === typeof elem.removeRule) {
    isRemove = elem.removeRule;
  }
  else if ('function' === typeof elem.removeRule) {
    isRemove = elem.removeRule({ form, elem });
  }

  if (isRemove) {
    return null;
  }

  let isHide = false;
  if ('boolean' === typeof elem.hiddenRule) {
    isHide = elem.hiddenRule;
  }
  else if ('function' === typeof elem.hiddenRule) {
    isHide = elem.hiddenRule({ form, elem });
  }

  const options = {
    rules: [],
  };
  if (elem && elem.initialValue) {
    if ('function' === typeof elem.initialValue) {
      options.initialValue = elem.initialValue({
        form,
        elem,
      });
    }
    else {
      options.initialValue = elem.initialValue;
    }
  }

  if (elem && elem.rules) {
    options.rules = [].concat(elem.rules || []);
  }

  let returnElem;
  const formItemLayout = _.get(elem, 'formItemLayout') || searchFormItemLayout;

  const elemRendered = (elem && 'function' === typeof elem.render) ? elem.render({
    form,
    searchCol,
    elem,
  }) : getSearchColumnComponent(elem);

  const formItem = (<Form.Item {...formItemLayout} extra={_.get(elem, 'extra', '')} label={elem.label || elem.title}>
    {form.getFieldDecorator(elem.dataIndex, options)(elemRendered)}
  </Form.Item>);
  if (React.isValidElement(elem)) {
    returnElem = elem;
  }
  else if (elem && elem.notWarpColumn) {
    returnElem = (<div> {formItem} </div>);
  }
  else {
    returnElem = (<Col span={searchCol} key={elem.dataIndex}> {formItem} </Col>);
  }

  return {
    elem: returnElem,
    isHide,
  };
}

@Form.create()
export default class Component extends React.PureComponent {
  static defaultProps = {
    // 是否自动触发搜索的 submit
    autoTriggerHandleSearch: true,
    showCount: 2,
    searchCol: 12,
    defaultSearchValue: {},
    defaultSearchValueMount: {},
    handleSubmit: () => {
      return false;
    },
    getSearchColumn: () => {
      return [];
    },
    defaultExpand: false,
    tagPosition: 'top',
  };

  constructor(props) {
    super(props);
    this.state = {
      expand: DEFINE_SEARCH_FORM_DEFAULT_EXPAND,
    };
    debugAdd('search_form', this);
    this.triggerHandleSubmit = _.debounce(this.triggerHandleSubmit, 300);
    // 默认搜索条件为空数组，每次渲染都会覆盖。
    this.searchColumn = [];
  }

  componentDidMount = () => {
    // 初始化设置是不是展开
    const defaultForm = {};
    const defaultSearchValue = {
      ..._.get(this.props, 'defaultSearchValue', {}),
      ..._.get(this.props, 'defaultSearchValueMount', {}),
    };
    _.map(_.entries(defaultSearchValue), ([key, value]) => {
      if (![null, undefined, 'null', 'undefined', ''].includes(value)) {
        if (!_.isObject(value)) {
          defaultForm[key] = value;
        }
        else {
          defaultForm[key] = value;
        }
      }
    });
    // 进行值初始化。
    try {
      this.props.form.setFieldsValue(defaultForm);
    }
    catch (error) {
      // do nothing
    }

    this.setState({
      expand: this.props.defaultExpand || false,
    }, () => {
      if (this.props.autoTriggerHandleSearch) {
        const options = {
          loadOldPage: true,
        };
        this.triggerHandleSubmit(options);
      }
    });

    if ('function' === typeof this.props.outSearchFormRef) {
      this.props.outSearchFormRef(this.props.form);
    }
  }

  componentWillReceiveProps = (nextProps) => {
    if (!_.isEqual(this.props.defaultExpand, nextProps.defaultExpand)
      && !_.isEqual(this.state.expand, nextProps.defaultExpand)) {
      this.setState({
        expand: nextProps.defaultExpand,
      });
    }
  }

  getDefaultSearchValue = () => {
    const defaultSearchValue = {
      ..._.get(this.props, 'defaultSearchValue', {}),
      ..._.get(this.props, 'defaultSearchValueMount', {}),
    };

    return defaultSearchValue;
  }

  triggerHandleSubmit = (options = {}) => {
    this.handleSubmit({
      ...options,
      loadOldPage: options.loadOldPage || false,
    });
  }

  handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    this.props.form.validateFields((err, values) => {
      const searchValues = {
        ...values,
      };

      _.each(_.entries(searchValues), ([k, v]) => {
        const searchColumnElem = _.find(this.searchColumnOrigin, {
          dataIndex: k,
        });
        if (searchColumnElem && searchColumnElem.searchKey) {
          searchValues[searchColumnElem.searchKey] = v;
          // 不能删除 k ，用来存储搜索条件的。
          // delete searchValues[k];
        }
      });

      if (!err) {
        if ('function' === typeof this.props.handleSubmit) {
          const submitOptions = {
            ...e,
            searchValues,
            expand: this.state.expand,
            loadOldPage: _.get(e, 'loadOldPage') || false,
          };
          this.props.handleSubmit(submitOptions);
        }
      }
    });
  }

  handleReset = () => {
    this.props.form.resetFields();
    // 拓展增加重置后的回调操作
    if (_.get(this.props, 'resetFieldsCallBack')) {
      this.props.resetFieldsCallBack(this.props.form);
    }
    this.triggerHandleSubmit({
      loadOldPage: false,
    });
  }

  toggle = () => {
    const { expand } = this.state;
    this.setState({ expand: !expand });
  }

  renderBtn = () => {
    if ('function' === typeof this.props.showOperBtn && !this.props.showOperBtn()) {
      return null;
    }

    return (<span>
      <Button size="small" type="primary" ghost htmlType="submit">搜索</Button>
      <Button size="small" style={{ marginLeft: 8 }} onClick={this.handleReset}>重置</Button>
    </span>);
  }

  renderAllAction = ({
    searchCol,
    searchColumn,
  }) => {
    if ('function' === typeof this.props.showOperBtn && !this.props.showOperBtn()) {
      return null;
    }

    const expand = this.state.expand;
    return (<Col span={searchCol} style={{ textAlign: 'right', float: 'right' }} className="opearBtn">
      { this.renderBtn() }
      { DEFINE_SEARCH_FORM_SHOW_EXPAND ? <a className={`${this.props.showCount >= searchColumn.length ? 'ant-hide' : ''}`} style={{ marginLeft: 8, fontSize: 12 }} onClick={this.toggle}>
        { expand ? '收起' : '展开' } <Icon type={expand ? 'up' : 'down'} />
      </a> : null }
    </Col>);
  }

  renderSearchFormHeader = () => {
    if (!_.isFunction(this.props.getSearchHeaderColumn)) {
      return [];
    }

    const columns = this.props.getSearchHeaderColumn({
      // 顶层的搜索条件变更之后触发的函数。this 指针必须指向当前 search form。
      onHeaderSearchFormChange: () => {
        this.triggerHandleSubmit({
          loadOldPage: false,
        });
      },
      form: this.props.form,
    });

    const formItem = _.reduce(columns, (res, elem) => {
      const buildSearchFormColObj = buildSearchFormCol({
        form: this.props.form,
        elem: {
          ...elem,
          formItemLayout: _.get(elem, 'formItemLayout', {}),
          notWarpColumn: undefined !== elem.notWarpColumn ? elem.notWarpColumn : true,
        },
        searchCol: _.get(elem, 'searchCol', 0) || this.props.searchCol,
        defaultSearchValue: this.getDefaultSearchValue(),
      });

      if (buildSearchFormColObj && buildSearchFormColObj.elem) {
        const {
          elem: returnElem,
          isHide,
        } = buildSearchFormColObj;

        if (!isHide) {
          res.push(returnElem);
        }
      }

      return res;
    }, []);

    return formItem;
  }

  render() {
    const expand = this.state.expand;

    const searchColumn = [];
    const showedSearchColumn = [];
    const hiddenSearchColumn = [];
    let searchColumnOrigin = [];

    if ('function' === typeof this.props.getSearchColumn) {
      searchColumnOrigin = this.props.getSearchColumn({
        form: this.props.form,
      });

      _.map(searchColumnOrigin, (elem) => {
        const buildSearchFormColObj = buildSearchFormCol({
          elem,
          searchCol: this.props.searchCol,
          form: this.props.form,
        });

        if (buildSearchFormColObj && buildSearchFormColObj.elem) {
          const {
            elem: returnElem,
            isHide,
          } = buildSearchFormColObj;

          searchColumn.push(returnElem);
          if (isHide) {
            hiddenSearchColumn.push(returnElem);
          }
          else {
            showedSearchColumn.push(returnElem);
          }
        }
      });
    }


    this.searchColumn = searchColumn;
    this.showedSearchColumn = showedSearchColumn;
    this.hiddenSearchColumn = hiddenSearchColumn;
    this.searchColumnOrigin = searchColumnOrigin;

    if (searchColumn.length && !showedSearchColumn.length) {
      window.console.warn('至少有一个 show 的 searchColumn');
    }

    if (searchColumn && 1 > searchColumn.length) {
      return null;
    }

    // 默认是直接最后一行
    let showMode = 'total';
    // 如果没有达到一行的长度，直接追加到后面
    if (showedSearchColumn.length < (24 / this.props.searchCol)) {
      showMode = 'one-append';
    }
    // 如果长度大于等于一行，判断下是不是追加到尾巴的位置。
    else if (expand && 0 !== showedSearchColumn.length % (24 / this.props.searchCol)) {
      showMode = 'tail-append';
    }

    const formHeaderColumns = this.renderSearchFormHeader();

    const formHeaderColumnsClassName = composeClass('search-form-tag-wrap', [0 < formHeaderColumns.length, styles.formHeaderColumns, 'ant-hide']);

    return (
      <Form
        className={`ant-advanced-search-form ant-advanced-search-form-small ${expand ? '' : 'is-close'}`}
        onSubmit={this.handleSubmit}>
        {
          'top' === this.props.tagPosition && <div className={formHeaderColumnsClassName}>{this.renderSearchFormHeader()}</div>
        }
        <div className="ant-hide">{hiddenSearchColumn}</div>
        <Row gutter={40}>
          {showedSearchColumn.slice(0, 1 * this.props.showCount)}
          {
            'one-append' === showMode ? (<Col span={this.props.searchCol} style={{ textAlign: 'right', float: 'right' }} className="opearBtn">
              {this.renderBtn()}
            </Col>) : null
          }
        </Row>
        <Row className={!expand ? 'ant-hide' : ''} gutter={40}>
          {showedSearchColumn.slice(1 * this.props.showCount)}

          {
            'tail-append' === showMode ? this.renderAllAction({ searchCol: this.state.searchCol, searchColumn: showedSearchColumn }) : null
          }
        </Row>
        {
          'total' === showMode ? (<Row>
            { this.renderAllAction({ searchCol: 24, searchColumn: showedSearchColumn })}
          </Row>) : null
        }
        {
          'bottom' === this.props.tagPosition && <div className={formHeaderColumnsClassName}>{this.renderSearchFormHeader()}</div>
        }
      </Form>
    );
  }
}
