import UUID from 'uuid';
// import jQuery from 'jquery';
import { Select, Spin } from 'antd';
import _ from 'lodash';
// import { connect } from 'dva';
import Filters from '@/filters';
import { getDebugMode } from '@/utils/debug_add';
import { getDefaultPopupContainer } from '@/utils/dom/get_popup_container';
import Factory from '@/services/_factory';
import { formatDefaultFilter } from '@/services/_util';

window.UUID = UUID;

const timeout = {};
const optionsCache = {};
// let dispatchSave = false;

// eslint-disable-next-line no-underscore-dangle
// window.____foreignSelectGraphqlOptionsCache = optionsCache;

// 监控全局的 request 事件。如果数据更新了，就把缓存的外键选择进行清除操作。
// 这个需要在 url 那边同时增加触发 httpFinish 的事件。
// todo
// jQuery(window).on('httpFinish', (e, options) => {
//   if (!options.url || !options.method) {
//     return;
//   }

//   const tagA = document.createElement('a');
//   tagA.href = options.url;
//   const url = _.get(tagA, 'pathname') || '';

//   if (url && -1 === ['get'].indexOf(options.method.toLocaleLowerCase())) {
//     const key1 = url;
//     delete optionsCache[key1];
//     const key2 = url.replace(/^\/+/, '');
//     delete optionsCache[key2];
//     const key3 = url.replace(/\/+$/, '');
//     delete optionsCache[key3];
//     const key4 = url.replace(/^\/*(.*?)\/*$/, '$1');
//     delete optionsCache[key4];
//   }
// });

// 特定的表，显示的名字是不同的字段的。
export function getModalOptions({ props }) {
  if (__DEV__ && __PROD__) {
    window.console.log('props', props);
  }

  return {
    valueName: props.valueName || 'id',
    textName: props.textName || 'name',
  };
}

// 创建怎么搜索的方法。
function buildFilter({ name, method, value, props }) {
  const options = props.options || getModalOptions({ props });
  let filterArr = [];
  if (_.isArray(props.filterOption)) {
    filterArr = filterArr.concat(props.filterOption);
  }
  if ('' !== value) {
    let operate = 'like';
    if (undefined !== _.get(props, 'options.searchMethod')) {
      operate = _.get(props, 'options.searchMethod');
    }
    else if (_.isArray(value)) {
      operate = 'in';
    }
    else if ('multiple' === props.mode) {
      operate = 'in';
    }

    const filterName = name || options.searchName || options.textName;
    // 这里是bug，但是为了兼容，还是得这样处理
    let filterMethod = method || operate;
    if (undefined !== _.get(props, 'options.searchMethod')) {
      filterMethod = operate;
    }

    filterArr.push([filterName, filterMethod, value]);
  }

  return filterArr;
}

// 进行数据获取更新连接。
// uuid 是用来强行更新缓存的
export function fetch({
  renderLabel,
  page = 1,
  formatValue,
  filterFunc,
  saveKey,
  value,
  query,
  that,
  callback,
  forceXhr = false,
  options = {},
}) {
  const { props } = that;
  // const timeoutSaveKey = `${uuid}_${props.table}`;
  const timeoutSaveKey = `timeout_${saveKey}_${query}`;
  if (timeout[timeoutSaveKey]) {
    clearTimeout(timeout[timeoutSaveKey]);
    timeout[timeoutSaveKey] = null;
  }

  optionsCache[saveKey] = optionsCache[saveKey] || [];

  const ifForceXhr = props.force || forceXhr;
  // // 从缓存读取。而且缓存大于 5 条记录的时候才读取。
  // if (!props.force && optionsCache[saveKey] && 5 < optionsCache[saveKey].length && !value) {
  // 从缓存读取。
  if (!ifForceXhr
    && optionsCache[saveKey]
    && 1 < filterFunc(optionsCache[saveKey]).length
    && !value
    && 1 === page) {
    return callback(optionsCache[saveKey]);
  }

  function debunceFakeFetch() {
    let filter = [];
    if (_.isArray(props.filter)) {
      filter = props.filter;
    }
    if (_.isArray(query)) {
      filter = filter.concat(query);
    }

    // 目前检查了下， graphqlMaxList  全部都是使用 Factory 生成。serviceName 在 book_category 查询的时候使用到，但是其指向的 graphqlAll 也是工厂方式生成。（其他的 graphqlAll ，暂时没用到。 ）
    const xhr = _.get(Factory({ model: props.table }), _.get(options, 'serviceName') || 'graphqlMaxList');

    if (!xhr) {
      return Promise.reject('需要配置这个服务');
    }

    const promise = xhr({
      ...props,
      pageSize: props.pageSize || 500,
      // pageSize: 13,
      page,
      filter: formatDefaultFilter({
        filter,
        props,
      }),
    });

    if (!promise.then || !promise.catch) {
      return Promise.reject('需要配置这个服务');
    }

    const getResponseDataFunc = (_.isFunction(options.getResponseDataFunc) ?
      options.getResponseDataFunc :
      (response) => {
        return _.get(response, 'data.data');
      });
    return promise.then((response) => {
      const data = getResponseDataFunc(response);
      const searchList = [];
      const orderByKey = props.orderBy || 'value';
      const sortKey = props.sort || 'desc';
      _.each(data || [], (elem) => {
        // 获取 elem 的 value 和 text 的 存储 index 。
        searchList.push({
          ...elem,
          value: formatValue(_.get(elem, `${options.valueName}`)),
          text: _.get(elem, `${options.textName}`),
          label: renderLabel(elem, options),
        });
      });

      // 是否连接并去重。
      if (false === props.append) {
        optionsCache[saveKey] = [];
      }
      else {
        optionsCache[saveKey] = optionsCache[saveKey] || [];
      }
      if (!props.notConcat) {
        optionsCache[saveKey] = _.uniqBy(_.orderBy([].concat(searchList).concat(optionsCache[saveKey]), orderByKey, sortKey), 'value');
      }
      else {
        optionsCache[saveKey] = _.uniqBy(_.orderBy([].concat(searchList), orderByKey, sortKey), 'value');
      }

      _.each(_.entries(response, 'data'), ([k, v]) => {
        Object.defineProperty(optionsCache[saveKey], 'data' === k ? 'originData' : k, {
          value: v,
          enumerable: false,
          configurable: false,
          writable: false,
        });
      });

      that.setState({
        data: optionsCache,
      }, () => {
        callback(optionsCache[saveKey]);
      });

      // props.dispatch({
      //   type: 'foreign_select_graphql/info',
      //   payload: optionsCache,
      // });
      // window.console.log('3 optionsCache', optionsCache);
      return optionsCache[saveKey];
    }).catch((rej) => {
      if (__DEV__) {
        window.console.log('rej', rej);
      }
    });
  }

  timeout[timeoutSaveKey] = setTimeout(debunceFakeFetch, 300);
}

export const ForeignSelectGraphqlComponentDefaultProps = {
  append: true,
  force: false,
  allowClear: false,
  table: '',
  select: null,
  filter: [],
  mode: undefined,
  filterOption: [],
  // 新数据是否拼接。目前还没地方用到 notConcat， 全部都是 false
  notConcat: false,
  renderLabel: (elem, options) => {
    return elem[options.textName];
  },
  renderValue: (elem) => {
    return `${elem.value}`;
  },
  getOptionDisabled: (elem) => {
    return !elem.id && false;
  },
  getPopupContainer: getDefaultPopupContainer,

  triggerSearchWhenValueChange: true,
  placeholder: '请选择',
  // 分组显示
  groupByKey: '', // pid
  optGroupLabelKey: '', // parentBookshelf.name
};

export default class ForeignSelectGraphqlComponent extends React.Component {
  static defaultProps = { ...ForeignSelectGraphqlComponentDefaultProps }

  constructor(props) {
    super(props);
    if (!props.table) {
      window.console.error('ForeignSelectGraphql 必须传输 table 参数');
    }
    const value = props.value || undefined;
    const options = props.options || getModalOptions({ props });
    this.state = {
      loading: true,
      value,
      data: undefined,
      options: {
        valueName: 'id',
        textName: 'name',
        ...options,
      },
      isFirstFocus: false,
    };
    this.uuid = UUID().replace(/-/g, '_');
    this.handleSearch = _.debounce(this.handleSearch, 300);
    debugAdd('foreign_select_graphql', this);
    debugAdd(`foreign_select_graphql_all_${props.table || ''}_${this.uuid}`, this);
  }

  componentDidMount = () => {
    // dispatchSave = this.props.dispatch;
    // this.handleSearch('');
    if (this.props.value) {
      this.initValueElem(this.props.value);
    }
  }

  // 更新传输的 value
  componentWillReceiveProps = (nextProps) => {
    if ('value' in nextProps && !_.isEqual(this.props.value, nextProps.value)) {
      this.setState({
        value: nextProps.value,
      }, () => {
        if (!nextProps.value) {
          this.handleSearch('');
        }
        if (this.props.triggerSearchWhenValueChange) {
          this.initValueElem(nextProps.value);
        }
      });
    }
    if ('table' in nextProps && this.props.table !== nextProps.table) {
      this.handleSearch('');
    }

    if ('filterOption' in nextProps && !_.isEqual(this.props.filterOption, nextProps.filterOption)) {
      const saveKey = this.getSaveKey(this.props);
      delete optionsCache[saveKey];
      // eslint-disable-next-line no-underscore-dangle
      // delete window.____foreignSelectGraphqlOptionsCache[saveKey];
      // optionsCache[saveKey] = [];
      // window.console.log('filterOption', nextProps.filterOption, 'saveKey', saveKey, 'optionsCache[saveKey]', optionsCache[saveKey]);
      this.setState({
        data: optionsCache,
      }, () => {
        this.handleSearch('');
      });
      // nextProps.dispatch({
      //   type: 'foreign_select_graphql/info',
      //   payload: optionsCache,
      // }).then(() => {
      //   this.handleSearch('');
      //   this.initValueElem('');
      // });
    }
  }

  componentWillUnmount = () => {
    this.componentUnmountFlag = true;
    // eslint-disable-next-line no-underscore-dangle
    // delete window.____foreignSelectGraphqlOptionsCache[this.getSaveKey()];
    delete optionsCache[this.getSaveKey()];

    // this.props.dispatch({
    //   type: 'foreign_select_graphql/info',
    //   payload: optionsCache,
    // });
  }

  getSavedInfo = (saveKey = this.getSaveKey()) => {
    return _.get(this.state.data, saveKey, []);
    // return _.get(this.props.foreignSelectGraphqlInfoState, saveKey, []);
  }

  getFilteredInfo = (data = this.getSavedInfo()) => {
    return this.filterFunc(data);
  }

  getSaveKey = (props = this.props) => {
    let filterKey = '';
    if (_.get(props, 'filterOption.length')) {
      try {
        filterKey = JSON.stringify(_.get(props, 'filterOption'));
      }
      catch (e) {
        // do nothing
      }
    }

    return `${props.table}_${filterKey}_${this.uuid}`;
  }

  getFilter = (elem) => {
    let filter = elem.label;
    if ('string' !== typeof filter) {
      filter = JSON.stringify(elem);
    }

    return filter;
  }

  initValueElem = (value) => {
    if (!value) {
      return false;
    }

    if (_.isArray(value) && 0 === value.length) {
      return false;
    }

    if (value) {
      const valueElem = _.find(this.getSavedInfo(), {
        value,
      }) || _.find(this.getSavedInfo(), {
        value: value * 1,
      });

      let operate = '=';
      if ('function' === typeof this.props.getInitSearchMethod) {
        operate = this.props.getInitSearchMethod();
      }
      // todo 这个应该是错误的
      else if (undefined !== _.get(this.props, 'options.searchMethod')) {
        operate = _.get(this.props, 'options.searchMethod');
      }
      else if (_.isArray(value)) {
        operate = 'in';
      }
      else if ('multiple' === this.props.mode) {
        operate = 'in';
      }

      const query = [];
      query.push([this.state.options.valueName, operate, value]);

      // const filterOption = _.get(this.props, 'filterOption', []);
      // if (!value && _.isArray(filterOption)) {
      //   query = [].concat(query).concat(filterOption);
      // }

      // 如果缓存中没有。
      if (!valueElem) {
        this.state.loading = true;
        this.setState({
          loading: true,
        });

        fetch({
          forceXhr: false,
          renderLabel: this.props.renderLabel,
          formatValue: this.formatValue,
          filterFunc: this.filterFunc,
          value,
          query,
          page: 1,
          saveKey: this.getSaveKey(),
          that: this,
          callback: (data) => {
            if (this.componentUnmountFlag) {
              return;
            }
            this.setState({
              loading: false,
            });
            this.handleFetchCallBackAfter(data);
            this.handleSelectCallback(value, this.state.options);
            return data;
          },
          options: this.state.options,
        });
      }
    }
  }

  formatValue = (value) => {
    let formatedValue = value;

    if ('multiple' === this.props.mode) {
      if (this.props.numberFormat) {
        if (_.isArray(value)) {
          formatedValue = _.map(value, Number);
        }
        else if (_.isString(value)) {
          formatedValue = Number(value);
        }
      }
      // nothing to do
    }
    else if (-1 < [undefined, null].indexOf(value)) {
      formatedValue = undefined;
    }
    else if (this.props.numberFormat) {
      formatedValue = parseInt(value, 10) || undefined;
    }

    return formatedValue;
  }

  checkIfMatch = (input, filterStr) => {
    let formatInput = input;
    if ('string' === typeof input) {
      formatInput = input.trim().replace(/^\t/ig, '').replace(/\t&/ig, '');
    }
    if ('' === formatInput || undefined === formatInput) {
      return true;
    }

    return 0 <= `${filterStr || ''}`.toLowerCase().indexOf(formatInput.toLowerCase());
  }

  selectFilterOption = (input, option) => {
    const elem = _.get(option, 'props.elem', {});
    const filter = _.get(option, 'props.filter', '') || this.getFilter(elem);

    return this.checkIfMatch(input, filter);
  }


  handleOnFocus = () => {
    const { isFirstFocus } = this.state;
    // 第一次加载时必须请求列表
    if (!isFirstFocus) {
      this.setState({ isFirstFocus: true });
      this.handleSearch('', 1, { forceXhr: true });
    }
  }

  handleFetchCallBackAfter = (data) => {
    if (__DEV__ && __PROD__) {
      window.console.log('handleFetchCallBackAfter data', data);
    }
  }

  handleChangeComponentSelect = (value, callback) => {
    const formatedValue = this.formatValue(value);

    this.setState({
      value: formatedValue,
    }, () => {
      if ('function' === typeof callback) {
        callback();
      }
    });

    if ('function' === typeof this.props.onChange) {
      this.props.onChange(formatedValue);
    }
  }

  handleChange = (value, callback) => {
    return this.handleChangeComponentSelect(value, callback);
  }

  handleSelect = (value, option) => {
    // option 挂载了很多信息，供回调时候使用。
    if (this.componentUnmountFlag) {
      return;
    }
    this.handleSelectCallback(value, option);
  }

  handleSelectCallback=(value, option) => {
    if ('function' === typeof this.props.onSelect) {
      const formatedValue = value;
      // this.handleChange(formatedValue);

      const valueName = this.state.options.valueName;
      const selected = _.find(this.getSavedInfo() || [], (elem) => {
        const elemValue = elem[valueName];
        if (elemValue === value || elemValue === 1 * value) {
          return true;
        }
        return false;
      }) || null;

      this.props.onSelect(formatedValue, {
        ...option,
        selected,
      });
    }
  }

  handleDeselect = (value) => {
    // option 挂载了很多信息，供回调时候使用。
    if (this.componentUnmountFlag) {
      return;
    }

    const formatedValue = this.formatValue(value);
    // this.handleChange(formatedValue);

    const $selected = _.find(this.getSavedInfo() || [], {
      [this.state.options.valueName]: value * 1,
    }) || _.find(this.getSavedInfo() || [], {
      [this.state.options.valueName]: value,
    }) || null;

    if ('function' === typeof this.props.onDeselect) {
      this.props.onDeselect(formatedValue, {
        $selected,
      });
    }

    // window.console.log('handleDeselect value', value, 'formatedValue', formatedValue, '$selected', $selected);
  }

  handleSearch = (value = '', page = 1, options) => {
    const forceXhr = _.get(options, 'forceXhr', false);
    let formatedValue = value;
    if ('string' === typeof value) {
      formatedValue = value.trim().replace(/^\t/ig, '').replace(/\t&/ig, '');
    }
    if (this.componentUnmountFlag) {
      return;
    }
    if (formatedValue && 'combobox' === this.props.mode) {
      this.handleChange(formatedValue);
    }
    this.state.loading = true;
    this.setState({
      loading: true,
    });

    const query = buildFilter({
      ...this.props.search,
      value: formatedValue,
      props: this.props,
      method: 'like',
    });

    fetch({
      renderLabel: this.props.renderLabel,
      formatValue: this.formatValue,
      filterFunc: this.filterFunc,
      value: formatedValue,
      query,
      page,
      forceXhr,
      saveKey: this.getSaveKey(),
      that: this,
      callback: (data) => {
        if (this.componentUnmountFlag) {
          return;
        }
        this.setState({
          loading: false,
        });
        this.handleFetchCallBackAfter(data);
        return data;
      },
      options: this.state.options,
    });
  }

  filterFunc = (arr) => {
    if ('function' === typeof this.props.filterFunc) {
      return this.props.filterFunc(arr);
    }
    else {
      return arr;
    }
  }

  renderSelectOptgroup = () => {
    const options = _.groupBy(this.getFilteredInfo(), this.props.groupByKey);
    const saveKey = this.getSaveKey();
    return _.map(options, (children, parentId) => {
      return (<Select.OptGroup key={`group_${parentId}`} label={_.get(children, `[0].${this.props.optGroupLabelKey}`)}>
        {
          _.map(children, (elem) => {
            const filter = this.getFilter(elem);

            return (
              <Select.Option
                elem={elem}
                key={`${saveKey}_${elem.value}`}
                disabled={this.props.getOptionDisabled(elem)}
                value={this.props.renderValue(elem)}
                title={elem.text}
                filter={filter}>
                {elem.label}
              </Select.Option>
            );
          })
        }
      </Select.OptGroup>);
    });
  }

  renderSelectOption = () => {
    const saveKey = this.getSaveKey();
    return this.getFilteredInfo().map((elem) => {
      const filter = this.getFilter(elem);

      return (
        <Select.Option
          elem={elem}
          key={`${saveKey}_${elem.value}`}
          value={this.props.renderValue(elem)}
          disabled={this.props.getOptionDisabled(elem)}
          title={elem.text}
          filter={filter}>
          {elem.label}
        </Select.Option>
      );
    });
  }

  renderSelect = () => {
    const value = this.state.value;
    let formatValue;
    if ('multiple' === this.props.mode) {
      formatValue = _.map(value, String);
    }
    else {
      formatValue = -1 < [undefined, null].indexOf(value) ? value : `${value}`;
    }

    if ('text' === this.props.renderType) {
      if ('multiple' === this.props.mode) {
        const label = [];
        _.each(_.get(this.state.data, this.getSaveKey()), (item) => {
          if (_.includes(value, item.value)) {
            label.push(item.label);
          }
        });
        return <span>{label.join('、')}</span>;
      }
      else {
        const label = _.get(_.find(_.get(this.state.data, this.getSaveKey()), { value }), 'label');
        return <span>{label}</span>;
      }
    }

    const size = this.props.size || 'default';
    return (
      <Select
        getPopupContainer={this.props.getPopupContainer}
        onFocus={this.handleOnFocus}
        size={size}
        showSearch={this.props.showSearch || true}
        value={formatValue}
        mode={this.props.mode || ''}
        disabled={this.props.disabled || false}
        placeholder={this.props.placeholder}
        notFoundContent={this.state.loading ? <Spin size="small" /> : (this.props.notFoundContent || 'combobox' === this.props.mode ? '' : '找不到相关信息' || null)}
        style={this.props.style}
        defaultActiveFirstOption={false}
        showArrow={undefined === this.props.showArrow ? true : this.props.showArrow}
        onChange={this.handleChange}
        onSearch={this.handleSearch}
        allowClear={this.props.allowClear || false}
        onSelect={this.handleSelect}
        onDeselect={this.handleDeselect}
        filterOption={this.selectFilterOption}
        className={this.props.className || ''} >
        {
          this.props.optGroupLabelKey && this.props.groupByKey ? this.renderSelectOptgroup() : this.renderSelectOption()
        }
      </Select>
    );
  }

  render() {
    return this.renderSelect();
  }
}

// @connect((state) => {
//   return {
//   };
// })
// export default class ForeignSelectGraphqlRedux extends ForeignSelectGraphqlComponent {}
