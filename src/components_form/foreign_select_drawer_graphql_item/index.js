// import { connect } from 'dva';
import React from 'react';
import _ from 'lodash';
import { message, Avatar, Spin, Button, Icon } from 'antd';
import { Radio, ListView, SearchBar, PullToRefresh } from 'antd-mobile';

import Filters from '../../filters';
import styles from './index.less';
import Ellipsis from '../../components_atom/ellipsis';

import ForeignSelectGraphqlComponent, { ForeignSelectGraphqlComponentDefaultProps } from '../foreign_select_graphql';

export default class ForeignSelectDrawerGraphql extends ForeignSelectGraphqlComponent {
  static defaultProps = {
    ...ForeignSelectGraphqlComponentDefaultProps,
    mode: undefined,
    renderSelectElemLabel: (options) => {
      return _.get(options, 'selectedElem.label', '');
    },
    // 最多能选择多少个元素
    maxTagCount: undefined,
    // 能显示的最多的已经选中的个数，多出的话，显示最后一个，其他就直接显示查看全部。
    showMaxCount: 2,
  }
  constructor(props) {
    super(props);
    debugAdd('foreign_select_drawer_graphql_item', this);
    debugAdd(`foreign_select_drawer_graphql_item_all_${props.table || ''}_${this.uuid}`, this);

    const dataSource = new ListView.DataSource({
      rowHasChanged: (row1, row2) => {
        return row1 !== row2;
      },
    });

    _.assign(this.state, {
      searchText: undefined,
      dataSource,
      // 这个是 filter 之前，用于生成 filteredSearchTextData 的数据
      originListData: [],
      // 这个是加了filter 处理之后的数据
      filteredSearchTextData: [],
      open: false,
      selectedElem: {},
      mulSelectedElem: [],
      // 是否展示查看全部
      showAllOpen: false,
      loading: false,
    });

    // 这个有点性能的问题。。。但是目前就是不知道为啥点击了多次。
    this.handleClickLabel = _.debounce(this.handleClickLabel, 50);
    this.toggleOpen = _.debounce(this.toggleOpen, 300);
    this.handleClose = _.debounce(this.handleClose, 300);

    if (__DEV__) {
      window.console.log('todo: 处理后面 form 表单设置 value 之后，需要更新 mulSelectedElem 或者 selectedElem 的处理。');
    }
  }

  getList = (page = 1 + _.get(this.getSavedInfo(), 'originData.currentPage', 1), options) => {
    const forceXhr = _.get(options, 'forceXhr', true);
    if (__DEV__ && __PROD__) {
      window.console.log('getList', page);
    }

    const hasMorePages = !!_.get(this.getSavedInfo(), 'originData.hasMorePages', false);

    if (__DEV__) {
      window.console.log('forceXhr', forceXhr, 'hasMorePages', hasMorePages, 'page', page);
    }
    if (!forceXhr && !hasMorePages && 1 < page) {
      return false;
    }

    this.handleSearch(this.state.searchText, page, {
      forceXhr,
    });
  }

  searchBarRef = (searchBar) => {
    this.searchBar = searchBar;
  }

  listViewRef = (listView) => {
    this.listView = listView;
  }

  toggleOpen = (...args) => {
    if (__DEV__) {
      window.console.log('toggleOpen', args);
    }
    this.handleOnFocus();
    this.setState({
      showAllOpen: false,
      open: !this.state.open,
      // searchText: undefined,
    });
  }

  handleClose = () => {
    if (__DEV__) {
      window.console.log('item handleClose', this.props.multiple);
    }

    this.setState({
      // searchText: undefined,
      open: false,
      showAllOpen: false,
    });

    this.handleActionSure();
  }

  handleFetchCallBackAfter = (data) => {
    return this.handleFetchCallBackAfterDrawer(data);
  }

  handleFetchCallBackAfterDrawer = (data) => {
    const listViewDataSource = new ListView.DataSource({
      rowHasChanged: (row1, row2) => {
        return row1 !== row2;
      },
    });

    const filteredData = this.getFilteredInfo(data);

    const filteredSearchTextData = _.filter(filteredData, (elem) => {
      const filter = this.getFilter(elem);
      return this.checkIfMatch(this.state.searchText, filter);
    });


    const listViewDataSourceWithData = listViewDataSource.cloneWithRows(filteredSearchTextData);

    this.setState({
      dataSource: listViewDataSourceWithData,
      filteredSearchTextData,
      originListData: data,
    });
  }

  componentDidMountExtend = () => {
  }

  handleFetchCallBackAfter = (data) => {
    this.handleFetchCallBackAfterDrawer(data);
    this.handleFetchCallBackAfterItem(data);
    return data;
  }

  handleFetchCallBackAfterItem = (data) => {
    const value = this.state.value;

    const newState = {};
    if ('multiple' !== this.props.mode) {
      const selectedElemFind = _.find(data || [], {
        [this.state.options.valueName]: value,
      });
      if (selectedElemFind) {
        newState.selectedElem = selectedElemFind;
      }
    }
    else if ('multiple' === this.props.mode && _.isArray(this.state.value) && _.get(this.state.value, 'length')) {
      const mulSelectedElem = [];
      _.map(data, (elem) => {
        if (_.includes(this.state.value, elem.value)) {
          mulSelectedElem.push(elem);
        }
      });
      if (mulSelectedElem && mulSelectedElem.length) {
        newState.mulSelectedElem = mulSelectedElem;
      }
    }

    this.setState(newState);
  }

  handleClearSearchBarInfo = () => {
    try {
      this.searchBar.inputRef.value = '';
      this.searchBar.setState({ value: undefined });
    }
    catch (err) {
      window.console.log('handleClearSearchBarInfo err', err);
    }
  }

  handleClear = () => {
    this.handleClearSearchBarInfo();
    this.setState({
      searchText: undefined,
    }, () => {
      this.getList(1, {
        forceXhr: true,
      });
    });
  }

  handleSubmit = (value) => {
    this.setState({
      searchText: value,
    }, () => {
      this.getList(1, {
        forceXhr: true,
      });
    });
  }

  handleRefresh = () => {
    if (__DEV__) {
      window.console.log('handleRefresh');
    }
    this.getList(1, {
      forceXhr: true,
    });
  }

  handleEndReached = () => {
    if (__DEV__) {
      window.console.log('handleEndReached');
    }

    const page = _.get(this.getSavedInfo(), 'originData.currentPage', 1);
    this.getList(1 + page, {});
  }

  searchTextChange = (value) => {
    if (this.searchTextChangeTimeout) {
      window.clearTimeout(this.searchTextChangeTimeout);
    }

    this.setState({
      searchText: value,
    }, () => {
      this.searchTextChangeTimeout = setTimeout(() => {
        this.getList(1, {
          forceXhr: true,
        });
      }, 200);
    });
  }

  handleActionSure = () => {
    if (__DEV__) {
      window.console.log('this.state.value', this.state.value);
    }
    this.handleClear();
    this.handleChange(this.state.value);
  }

  handleChangeComponentItem = (value, callback) => {
    if (__DEV__) {
      window.console.log('item handleChange', 'value', value, 'this.props.mode', this.props.mode);
    }

    this.setState({
      open: false,
      value,
    }, () => {
      if ('function' === typeof callback) {
        callback();
      }
    });

    if ('function' === typeof this.props.onChange) {
      this.props.onChange(value);
    }
  }

  handleChange = (value, callback) => {
    this.handleChangeComponentItem(value, callback);
  }

  handleClickLabel = (rowData) => {
    debugAdd('foreign_select_drawer_graphql_item_current', this);
    if (__DEV__) {
      window.console.log('handleClickLabel multiple', 'multiple' === this.props.mode);
    }

    const value = rowData.value;

    // 单选状态，取消选择的
    if ('multiple' !== this.props.mode && this.state.value === value) {
      this.state.value = undefined;
      this.handleChange(undefined);
      setTimeout(() => {
        this.handleDeselect(value, rowData);
      });
    }
    // 单选状态，进行了选择的
    else if ('multiple' !== this.props.mode && this.state.value !== value) {
      // 选中的
      this.state.value = value;
      this.handleChange(value);
      setTimeout(() => {
        this.handleSelect(value, rowData);
      });
    }
    // 多选，取消选中。
    else if ('multiple' === this.props.mode && _.includes(this.state.value, value)) {
      let newValue = [];
      if (_.isArray(this.state.value)) {
        newValue = [...this.state.value];
      }

      _.remove(newValue, (elem) => {
        return elem === value;
      });

      this.setState({
        value: newValue,
      });
      setTimeout(() => {
        this.handleDeselect(value, rowData);
      });
      // this.handleChange(newValue);
    }
    // 多选，增加选中。
    else if ('multiple' === this.props.mode && !_.includes(this.state.value, value)) {
      let newValue = [];
      if (_.isArray(this.state.value)) {
        newValue = [...this.state.value];
      }

      newValue.push(value);
      if (1 * this.props.maxTagCount && 1 * this.props.maxTagCount < newValue.length) {
        message.error(`最多能选择${this.props.maxTagCount}个`);
        return false;
      }
      this.setState({
        value: newValue,
      });
      setTimeout(() => {
        this.handleSelect(value, rowData);
      });
      // this.handleChange(newValue);
    }
  }

  handleDeselect = (value, elem) => {
    if (__DEV__) {
      window.console.log('handleDeselect', 'elem', elem, 'value', value);
    }

    const newState = {};

    if ('multiple' === this.props.mode) {
      const mulSelectedElem = _.concat([], this.state.mulSelectedElem, elem);
      newState.mulSelectedElem = mulSelectedElem;
    }
    else if ('multiple' !== this.props.mode) {
      newState.selectedElem = elem;
    }
    this.setState(newState);

    if ('function' === typeof this.props.onDeselect) {
      this.props.onDeselect(value, elem);
    }
  }

  handleSelect = (value, elem) => {
    if (__DEV__) {
      window.console.log('handleSelect', 'elem', elem, 'value', value);
    }

    const newState = {};

    if ('multiple' === this.props.mode) {
      const mulSelectedElem = _.concat([], this.state.mulSelectedElem, elem);
      newState.mulSelectedElem = mulSelectedElem;
    }
    else if ('multiple' !== this.props.mode) {
      newState.selectedElem = elem;
    }
    this.setState(newState);

    if ('function' === typeof this.props.onSelect) {
      this.props.onSelect(value, elem);
    }
  }

  handleRemove = (value) => {
    if (__DEV__) {
      window.console.log('handleRemove', value, this.state.value);
    }
    let newValue = [];
    if (_.isArray(this.state.value)) {
      newValue = [...this.state.value];
    }

    _.remove(newValue, (elem) => {
      return elem === value;
    });

    let mulSelectedElem = [];
    if (_.isArray(this.state.mulSelectedElem)) {
      mulSelectedElem = [...this.state.mulSelectedElem];
    }
    _.remove(mulSelectedElem, (elem) => {
      return value === elem.value;
    });

    this.setState({
      mulSelectedElem,
      value: newValue,
    });

    this.handleChange(newValue);
  }

  handleShowAll = (event) => {
    if (__DEV__) {
      window.console.log('handleShowAll');
    }

    this.handleStopEvent(event);

    if (__DEV__) {
      window.console.log('显示全部');
    }

    this.setState({
      open: false,
      showAllOpen: true,
    });
  }

  handleStopEvent = (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
  }

  renderItemElem = (rowData, sectionID, rowID, highlightRow) => {
    if (__DEV__ && __PROD__) {
      window.console.log('rowData, sectionID, rowID, highlightRow', rowData, sectionID, rowID, highlightRow);
    }

    let checked = false;
    if ('multiple' === this.props.mode && _.includes(this.state.value, rowData.value)) {
      checked = true;
    }
    else if ('multiple' !== this.props.mode && this.state.value === rowData.value) {
      checked = true;
    }

    return (<div
      className={styles.listViewItem}
      onClick={this.handleClickLabel.bind(this, rowData)}>
      <Radio.RadioItem
        className={styles.radioItem}
        key={rowData.value}
        value={rowData.value}
        name={this.getSaveKey()}
        checked={checked}>
        { rowData.label }
      </Radio.RadioItem>
    </div>);
  }

  renderList = () => {
    const hasMorePages = !!_.get(this.getSavedInfo(), 'originData.hasMorePages', false);

    // 会出现长屏幕没显示完整的 bug 。
    return (<ListView
      ref={this.listViewRef}
      className={styles.ListView}
      dataSource={this.state.dataSource}
      renderFooter={() => {
        let tips = '正在刷新';

        if (!this.state.loading) {
          if (1 > _.get(this.state.filteredSearchTextData, 'length', 0)) {
            if (this.state.searchText) {
              tips = `找不到关于“${this.state.searchText}”的信息`;
            }
            else {
              tips = '找不到待选择的信息';
            }
          }
          else if (hasMorePages) {
            tips = '下拉刷新';
          }
          else {
            tips = '加载完成';
          }
        }
        return (<div style={{ padding: '1em', textAlign: 'center' }} onClick={this.handleEndReached}>
          <span>{tips}</span>
        </div>);
      }}
      renderRow={this.renderItemElem}
      useBodyScroll={false}
      pullToRefresh={<PullToRefresh
        direction="down"
        refreshing={this.state.loading}
        onRefresh={this.handleRefresh} />}
      style={{
        height: document.documentElement.clientHeight - 60,
        overflow: 'auto',
      }}
      onEndReached={this.handleEndReached}
      onEndReachedThreshold={100}
      initialListSize={40}
      pageSize={500}
      data-bak-pageSize={_.get(this.getSavedInfo(), 'originData.perPage')} />);
  }

  renderSearchBar = () => {
    return (<div className={styles.searchBar}>
      <SearchBar
        ref={this.searchBarRef}
        onCancel={this.handleClear}
        onClear={this.handleClear}
        onSubmit={this.handleSubmit}
        placeholder="搜索"
        defaultValue={undefined}
        value={this.state.searchText}
        onChange={this.searchTextChange} />
    </div>);
  }

  renderSearchResult = () => {
    return (
      <div className={styles.normal}>
        { this.renderList() }
      </div>
    );
  }

  renderMulChooseLength = () => {
    let length = 0;
    if ('multiple' === this.props.mode) {
      length = _.get(this.state, 'value.length', 0);
    }
    else if (this.state.value) {
      length = 1;
    }

    // 目前单选状态，暂时不显示选中多少个。
    if ('multiple' !== this.props.mode) {
      return null;
    }

    return (<div className={styles.actionContentTip} onClick={this.handleShowAll}>
      <span>目前选择</span><span className="text-primary">{ length }</span><span>个</span>
    </div>);
  }
  renderDrawerAction = () => {
    return (<div className={styles.actionWarper}>
      { this.renderMulChooseLength() }
      <div className={styles.action}>
        <Button
          onClick={this.handleActionSure}
          className={styles.actionSure}
          type="primary"
          data-bak-size="small"
          inline="true">确定</Button>
      </div>
    </div>);
  }

  renderTitle = () => {
    return (<div className={styles.titleWarper}>
      <div className={styles.title}>{this.props.title || '请选择'}</div>
    </div>);
  }

  renderDrawer = () => {
    return (<div>
      <div className={`${styles.drawer} foreign_select_drawer_graphql`}>
        <div onClick={this.handleClose} className={styles.closeMark} />
        { this.renderTitle() }
        <div className={styles.selectContent}>
          { this.renderSearchBar() }
          { this.renderList() }
        </div>
        { this.renderDrawerAction() }
      </div>
    </div>);
  }

  renderSelectTipArrow = () => {
    return (<div className="am-list-arrow am-list-arrow-horizontal" aria-hidden="true" />);
  }

  renderSignlePlaceholder = () => {
    return (<React.Fragment>
      <div className="am-list-extra">
        { this.props.placeholder || '请选择'}
      </div>
      { this.renderSelectTipArrow() }
    </React.Fragment>);
  }

  renderSignleSelected = () => {
    return (<React.Fragment>
      <div className="am-list-extra">
        {
          this.props.renderSelectElemLabel({
            selectedElem: this.state.selectedElem,
          }) || this.state.value
        }
      </div>
      { this.renderSelectTipArrow() }
    </React.Fragment>);
  }

  renderMulPlaceholderElem = () => {
    return (
      <span className={styles.mulChoose}>
        <span className={styles.mulChooseContent}>+</span>
      </span>
    );
  }
  renderMulPlaceholder = () => {
    return (<React.Fragment>
      <div className="am-list-extra">
        { this.renderMulPlaceholderElem() }
      </div>
    </React.Fragment>);
  }

  renderAvatarDesc = (elem) => {
    const label = _.get(elem, 'label') || _.get(elem, 'name') || _.get(elem, 'display_name');

    return (<Ellipsis onClick={this.handleStopEvent} className={styles.selectedElemAvatarName} style={{ width: '4em' }}>
      { _.isString(label) ? label.substring(label.length - (/[a-z]{5,}$/.test(label) ? 5 : 2)) : label }
    </Ellipsis>);
  }

  renderAvatar = (elem) => {
    const props = {};
    const avatar = _.get(elem, 'avatar') || _.get(elem, 'user.avatar');
    const label = _.get(elem, 'label') || _.get(elem, 'name') || _.get(elem, 'display_name');

    if (avatar) {
      props.src = Filters.cdnFile(avatar);
    }

    return (<Avatar className={styles.selectedElemAvatar} onClick={this.handleStopEvent} {...props}>
      {_.get(label, '[0]') }
    </Avatar>);
  }

  renderMulSelectedElem = (elem, index) => {
    const handleRemove = (event) => {
      this.handleStopEvent(event);
      if (__DEV__ && __PROD__) {
        window.console.log('elem handleRemove', elem, elem.value);
      }
      this.handleRemove(elem.value);
    };

    return (<span
      className={`${styles.selectedElem}
      ${styles.selectedElemWithAvatar}`}
      key={`selected_elem_${index}`}
      onClick={this.handleStopEvent}>
      <Icon
        title="删除"
        type="close-circle"
        theme="filled"
        className={styles.selectedElemCloseIcon}
        onClick={handleRemove} />
      { this.renderAvatar(elem) }
      { this.renderAvatarDesc(elem) }
    </span>);
  }

  renderSperate = (key) => {
    return (<span
      onClick={this.handleStopEvent}
      className={`${styles.selectedElem} ${styles.selectedElemPlusPlaceholder}`}
      key={key}>
      <span className={styles.mulChooseContentSperate}>+</span>
    </span>);
  }

  renderMulSelected = () => {
    const selectedLength = _.get(this.state.value, 'length', 0);

    const content = [];
    let contentAll = '';
    if (selectedLength < this.props.showMaxCount) {
      _.map(this.state.mulSelectedElem, (elem, index) => {
        content.push(this.renderMulSelectedElem(elem, index));
        content.push(this.renderSperate(`plus_${index}`));
      });
    }
    else {
      // 组装查看全部的
      contentAll = (<React.Fragment>
        <span
          className={`${styles.selectedElem} ${styles.selectedElemWithAvatar}`}
          onClick={this.handleShowAll}>
          <Avatar icon="team" className={styles.selectedElemAvatar}>查看全部</Avatar>
          <Ellipsis className={styles.selectedElemAvatarName} style={{ width: '4em' }}>查看全部</Ellipsis>
        </span>
        { this.renderSperate('content_all') }
      </React.Fragment>);

      // 组装查看最后几个的
      _.map(_.slice(this.state.mulSelectedElem, _.get(this.state.mulSelectedElem, 'length', 0) - this.props.showMaxCount + 1), (elem, index) => {
        content.push(this.renderMulSelectedElem(elem, index));
        content.push(this.renderSperate(`plus_${index}`));
      });
    }

    return (<div>
      { contentAll }
      { content }
      { this.renderMulPlaceholderElem() }
    </div>);
  }

  renderExtra = () => {
    // 单选，未选中
    const isHasValue = ('multiple' === this.props.mode) ? !_.isEmpty(this.state.value) : !!this.state.value;
    if (__DEV__ && __PROD__) {
      window.console.log('isHasValue', isHasValue);
    }
    // 如果带有 renderSelected 方法，而且存在选中的值，就直接渲染
    if (isHasValue && 'function' === typeof this.props.renderSelected) {
      return this.props.renderSelected({
        state: this.state,
        props: this.props,
        renderMulPlaceholder: this.renderMulPlaceholder,
        renderSignlePlaceholder: this.renderSignlePlaceholder,
        renderSelectTipArrow: this.renderSelectTipArrow,
      });
    }
    // 如果带有 renderSelect 方法，而且没有选中的值，就直接渲染
    else if (!isHasValue && 'function' === typeof this.props.renderSelect) {
      return this.props.renderSelect({
        state: this.state,
        props: this.props,
        renderMulPlaceholder: this.renderMulPlaceholder,
        renderSignlePlaceholder: this.renderSignlePlaceholder,
        renderSelectTipArrow: this.renderSelectTipArrow,
      });
    }
    else if ('multiple' !== this.props.mode && undefined === this.state.value) {
      return this.renderSignlePlaceholder();
    }
    else if ('multiple' !== this.props.mode && this.state.value) {
      return this.renderSignleSelected();
    }
    else if ('multiple' === this.props.mode && _.isEmpty(this.state.value)) {
      return this.renderMulPlaceholder();
    }
    else if ('multiple' === this.props.mode && !_.isEmpty(this.state.value)) {
      return this.renderMulSelected();
    }

    return null;
  }

  renderItemAction = () => {
    return (<div className={styles.actionWarper}>
      <div className={styles.action}>
        <Button
          onClick={this.handleClose}
          className={styles.actionSure}
          type="primary"
          size="small"
          inline="true">关闭</Button>
      </div>
    </div>);
  }

  renderItemContent = () => {
    return (<div onClick={this.toggleOpen}>
      <div className="am-list-item am-list-item-middle">
        <div className="am-list-line">
          <div className="am-list-content">
            { this.props.children }
          </div>
          { this.renderExtra() }
        </div>
        <div className="am-list-ripple" style={{ display: 'none' }} />
      </div>
    </div>);
  }

  renderShowAllContent = () => {
    const contentArr = [];
    const length = _.get(this.state.mulSelectedElem, 'length', 0);
    _.map(this.state.mulSelectedElem, (elem, index) => {
      contentArr.push(this.renderMulSelectedElem(elem, index));
      contentArr.push(this.renderSperate(`show_all_sperate_${index}`));
    });

    // 最后一个增加重新编辑
    if (length < this.props.maxTagCount) {
      contentArr.push(<span key="toggleOpen" onClick={this.toggleOpen}>
        { this.renderMulPlaceholderElem() }
      </span>);
    }
    else {
      contentArr.pop();
    }

    return (<div className={`${styles.content} ${this.state.showAllOpen ? styles.contentOpen : ''}`}>
      <div onClick={this.handleClose} className={styles.closeMark} />
      <div className={styles.showAllContent}>
        { this.renderTitle() }
        { contentArr }
        { this.renderItemAction() }
      </div>
    </div>);
  }

  renderItem = () => {
    return (<div>
      <div className="am-list-body" data-open-status={this.state.open ? 'true' : 'false'}>
        <Spin size="small" spinning={this.state.loading}>
          { this.renderItemContent() }
        </Spin>
        { this.renderShowAllContent() }
        <div className={`${styles.content} ${this.state.open ? styles.contentOpen : ''}`}>
          { this.renderDrawer() }
        </div>
      </div>
    </div>);
  }

  render() {
    return this.renderItem();
  }
}
