import React from 'react';
import jQuery from 'jquery';
import { Input, Icon, Tree, Button, message } from 'antd';
import _ from 'lodash';
import Cookies from 'js-cookie';
import DICT from '@/constants/dict';
import Svg from '@/components_atom/svg';
import CONSTANTS from '@/constants';
import './index.less';


// tree node key value connect split， 树节点的 key 和 value 连接标识
export const keySplit = '.-.-.';
const defaultFilterType = 'node_department_id';


export const DEPARTMENT_KEY_PREFIX = 'and-equal-node_department_id';
// 目前为内部方法
// 遍历树，传输 filterFunc 和 due tree
export function treeTraverse(tree, options = {}, parent) {
  const {
    // 过滤方法
    filterFunc = () => {
      return true;
    },
    // 处理方法
    dueFunc = (elem) => {
      return elem;
    },
  } = options;

  const newTree = [];

  _.each(tree || [], (treeNode) => {
    // 添加默认过滤
    if (('grade' === treeNode.readType || 'class' === treeNode.readType) && treeNode.isGraduate !== options.isGraduate) {
      return;
    }

    if (filterFunc(treeNode, parent)) {
      const children = treeTraverse(treeNode.children || treeNode.child || [], options, treeNode);
      const newTreeNode = {
        ...dueFunc(treeNode),
        children,
      };

      newTree.push(newTreeNode);
    }
  });

  return newTree;
}

export const convertKey = (key) => {
  if (!key) {
    return '';
  }
  const keys = _.split(key, keySplit) || [];
  let type = keys[0];
  if (type === DEPARTMENT_KEY_PREFIX) {
    type = 'department';
  }
  return `${type}_${keys[1]}`;
};

/*
// 目前为内部方法，旧的代码中其他地方会用到，暂时不管。
// options 不做深层嵌套，避免遍历数组再进行树的深度遍历。
function treeAddFilterType(tree, options = {}) {
  if (__DEV__ && __PROD__) {
    window.console.log('options', options);
  }

  const {
    filterType,
    currentDeep = 1,
    beginDeep,
    addMaxDeep,
  } = options;
  const formatedTree = [];
  _.each(tree || [], (treeNode) => {
    if (!treeNode) {
      return null;
    }

    let children = _.get(treeNode, 'children') || [];
    if (currentDeep < addMaxDeep) {
      children = treeAddFilterType(treeNode.children, {
        filterType,
        currentDeep: 1 + currentDeep,
        beginDeep,
        addMaxDeep,
      });
    }

    const newTreeNode = {
      ...treeNode,
      children,
    };
    if (currentDeep >= beginDeep && currentDeep <= addMaxDeep) {
      newTreeNode.filterType = filterType;
    }

    formatedTree.push(newTreeNode);
    return newTreeNode;
  });

  return formatedTree;
}
*/

// export function treeBranchArea({
//   tree, // 这棵树必须传输一颗完整的树。
//   areaId,
// }) {
//   return _.filter(tree, {
//     pid: areaId,
//   });
// }

export function treeBranchDepartment({
  tree,
  // filterType = 'department_id',
  // filterType = 'node_department_id',
  isGraduate = _.get(DICT, 'CLASSES.IS_GRADUATE.UNGRADUATED'),
  filterFunc = (elem) => {
    return elem || true;
  },
  dueFunc = (elem) => {
    return {
      ...elem,
      filterType: defaultFilterType,
    };
  },
}) {
  const buildSiderTree = treeTraverse(tree, {
    filterFunc,
    dueFunc,
    isGraduate,
  });

  return buildSiderTree;

  /*
  // 增加 pid 筛选
  const addTypeSiderTree = treeAddFilterType(buildSiderTree, {
    filterType,
    beginDeep: 1,
    currentDeep: 1,
    addMaxDeep: 9999,
  });

  return addTypeSiderTree;
  */
}

const PAGE_SIDERBAR_WIDTH_KEY = `PAGE_SIDERBAR_WIDTH_KEY_${DEFINE_MODULE}`;
const SIDERBAR_MAX_WIDTH = 400;
const SIDERBAR_MIN_WIDTH = 170;
const SIDERBAR_INIT_WIDTH = 170;
// ['bi'].includes(DEFINE_MODULE) ? 300 : SIDERBAR_MIN_WIDTH;

const sessionCookieOption = {
  path: '/',
};

export default class Component extends React.PureComponent {
  static defaultProps = {
    // 数据源
    tree: [],
    deep: 9999999,
    defaultExpanded: undefined,
    // function
    // onCheck: undefined,
    // function
    onSelect: undefined,
    editDefaultExpanded: false,
    // function
    valueFormat: undefined,
    checkable: false,
    className: '',
    placeholder: '搜索',
    // 多选
    multiple: false,
    defaultValue: [],
    loadedKeys: [],
    expandedKeys: [],
    unExpandedKeys: [],
    getTreeFilterKey: (key, domNode) => {
      if (__DEV__ && __PROD__) {
        window.console.log('key', key, 'domNode', domNode);
      }
      return key;
    },
    formatExpandedKeys: (expandedKeys, oldExpandedKeys) => {
      if (__DEV__ && __PROD__) {
        window.console.log('expandedKeys', expandedKeys, 'oldExpandedKeys', oldExpandedKeys);
      }

      return expandedKeys;
    },
  }

  constructor(props) {
    super(props);

    debugAdd('filter_tree', this);

    this.state = {
      inputSearchKey: `${Math.random()}`,
      searchValue: '',
      checkedKeys: props.defaultValue || [],
      autoExpandParent: true,
      expandedKeys: [],
      unExpandedKeys: [],
      loadedKeys: [],
    };

    this.search = _.debounce(this.search, 300);
  }

  componentDidMount = () => {
    const { editDefaultExpanded } = this.props;
    const defaultTreeNode = _.get(this.props, 'tree[0]');
    const keyList = _.get(this.props, 'treeKey', {});
    const defaultTreeKey = `${_.get(defaultTreeNode, 'filterType', defaultFilterType)}${keySplit}${_.get(defaultTreeNode, 'id') || 1}`;

    // 存储旧的展开的树，或者直接展开第一棵树。
    let allExpandedKeys = (this.props.defaultExpanded && this.props.defaultExpanded.length) ? this.props.defaultExpanded : [defaultTreeKey];
    if ('function' === typeof editDefaultExpanded) {
      allExpandedKeys = editDefaultExpanded(this.props.tree);
    }

    // 解决 组件默认展开第一级 不触发loadData问题 ---start----
    const isSchool = [_.get(CONST_DICT, 'departments.type.TYPE_CENTER_SCHOOL'), _.get(CONST_DICT, 'departments.type.TYPE_SCHOOL')].includes(defaultTreeNode.type);
    const gradeInfo = _.find(defaultTreeNode.children, (item) => {
      return 'grade' === item.readType;
    });

    if (isSchool && !_.isEmpty(defaultTreeNode.children) && !gradeInfo && this.props.loadData) {
      this.props.loadData(defaultTreeNode).then(() => {
        const { loadedKeys } = this.state;
        const newLoadedKeys = [...loadedKeys];
        newLoadedKeys.push(defaultTreeKey);
        this.onLoad(newLoadedKeys);
      });
    }
    // ---end---

    const expandedKeys = [];
    const unExpandedKeys = [];
    allExpandedKeys.map((item) => {
      const info = keyList[convertKey(item)] || {};
      if (!editDefaultExpanded) {
        if (DEPARTMENT_KEY_PREFIX === _.split(item, keySplit)[0] || info.children) {
          expandedKeys.push(item);
        }
        else {
          unExpandedKeys.push(1 || item);
        }
      }
      else {
        expandedKeys.push(item);
      }


      return item;
    });

    this.setState({
      expandedKeys,
      unExpandedKeys,
    });

    const last = _.last(this.state.checkedKeys);
    if (last) {
      try {
        const selecter = `[data-tree-key="${last}"]`;
        jQuery(selecter).eq(0).click();
      }
      catch (e) {
        if (__DEV__) {
          window.console.log(e);
        }
      }
    }

    this.initResizeEventListener();
  }

  componentWillReceiveProps = (nextProps) => {
    if (!_.isEqual(this.props.defaultValue, nextProps.defaultValue)) {
      // 更新选中数据，作用于page_list reset数据更新
      this.setState({
        checkedKeys: nextProps.defaultValue,
      });
    }
  }

  onExpand = (expandedKeys) => {
    const formatedExpandedKeys = this.props.formatExpandedKeys(expandedKeys, this.state.expandedKeys);
    this.setState({
      expandedKeys: formatedExpandedKeys,
      autoExpandParent: false,
    });
  }

  onTreeNodeRemoveClick = (e) => {
    const {
      key = '',
      disabled = false,
    } = this.getTreeNodeInfo(e);

    if (!disabled) {
      const checkedKeys = _.filter(this.state.checkedKeys, (elem) => {
        return elem !== key;
      });

      this.onSelect(checkedKeys, e);
    }
  }

  onTreeNodeClick = (e) => {
    const {
      key = '',
      disabled = false,
      node = {},
    } = this.getTreeNodeInfo(e);

    if (!disabled) {
      this.onSelect([key], e, node);
    }
  }

  onCheck = (checkedKeys) => {
    this.setState({
      checkedKeys,
    });

    if ('function' === typeof this.props.onCheck) {
      this.props.onCheck(checkedKeys);
    }
  }

  onSearch = (value) => {
    this.search(value);
  }

  onSelect = (selectedId, e, node = {}) => {
    if (__DEV__) {
      window.console.log('onSelect selectedId', selectedId, 'e', e, 'node', node);
    }

    this.setState({
      checkedKeys: selectedId,
    });

    if ('function' === typeof this.props.onSelect) {
      const selectData = {};
      _.each(selectedId || [], (elem) => {
        // eslint-disable-next-line prefer-const
        let [key, value] = elem.split(keySplit);

        if ('grade' === node.readType && key) {
          value = value.split('_')[0];
        }

        let formatedValue = value;
        if ('function' === typeof this.props.valueFormat) {
          formatedValue = this.props.valueFormat(value);
        }

        const filterKey = this.props.getTreeFilterKey(key, e.traget);
        if (filterKey && formatedValue) {
          if (selectData[filterKey]) {
            // 已经设置过，肯定是多选的问题。
            if (_.isArray(selectData[filterKey])) {
              selectData[filterKey].push(formatedValue);
            }
            else {
              selectData[filterKey] = [selectData[filterKey], formatedValue];
            }
          }
          else {
            selectData[filterKey] = formatedValue;
          }
        }
      });

      // TODO 这里应该是bug
      // 年级需要加上department条件和毕业年级
      if ('grade' === node.readType) {
        selectData.department_id = node.pid;
        if (node.graduationYear) {
          selectData.graduation_year = node.graduationYear;
        }
      }

      this.props.onSelect({
        siderOrigin: selectedId,
        siderValues: selectData,
        siderExpanded: this.state.expandedKeys,
      });
    }
  }

  onLoad = (newLoadedKeys) => {
    const { expandedKeys, unExpandedKeys, loadedKeys } = this.state;

    const treeKey = this.props.treeKey || {};
    this.setState({
      loadedKeys: newLoadedKeys,
    });

    if (_.isEmpty(unExpandedKeys)) {
      return;
    }

    let currentLoadedKey = '';
    // 获取当前loaded完成的key
    newLoadedKeys.map((key) => {
      if (!loadedKeys.includes(key)) {
        currentLoadedKey = key;
      }
      return key;
    });

    // console.log('currentLoadedKey', currentLoadedKey);

    // // 获取当前key的children列表
    currentLoadedKey = currentLoadedKey.replace(DEPARTMENT_KEY_PREFIX, 'department');
    currentLoadedKey = currentLoadedKey.replace(keySplit, '_');

    // 获取对应节点的children列表
    const chilendList = _.get(treeKey[currentLoadedKey], 'children') || [];

    const loadKeys = [];

    chilendList.map((item) => {
      const childrenKey = `${item.readType}${keySplit}${item.key}`;
      const childrenItem = treeKey[`${item.readType}_${item.key}`];
      // 遍历children列表判断是否在expandedKeys中，是则请求子集
      const index = unExpandedKeys.indexOf(childrenKey);

      if (0 <= index && !_.get(childrenItem, 'children')) {
        const unkey = unExpandedKeys.slice(index, index + 1)[0];
        if (unkey) {
          loadKeys.push(unkey);
        }
      }

      return item;
    });
    if (!_.isEmpty(loadKeys)) {
      this.setState({
        expandedKeys: [...expandedKeys, ...loadKeys],
        unExpandedKeys: [...unExpandedKeys],
      });
    }
  }

  getTreeNodeInfo = (e) => {
    const key = this.getDataByTarget(e, 'treeKey');
    const disabled = this.getDataByTarget(e, 'treeDisabled') || false;
    const readType = this.getDataByTarget(e, 'treeReadType');
    const pid = this.getDataByTarget(e, 'treePid') || 0;
    const year = this.getDataByTarget(e, 'treeYear');
    const graduationYear = this.getDataByTarget(e, 'treeGraduationYear');

    const nodeInfo = {
      readType,
      pid,
      year,
      graduationYear,
    };

    return {
      key,
      disabled,
      node: nodeInfo,
    };
  }

  getDataByTarget = (e, name) => {
    let data = '';
    if (e && e.target) {
      data = jQuery(e.target).data(name);
    }

    if (!data && e && e.currentTarget) {
      data = jQuery(e.currentTarget).data(name);
    }

    return data;
  }

  getNodeKey = (node) => {
    return `${undefined === node.filterType ? defaultFilterType : node.filterType}${keySplit}${node.value}`;
  }

  initResizeEventListener = () => {
    // 拖动菜单大小。
    jQuery(document).on('mouseup', () => {
      jQuery('body').removeClass('dropingMenuSelectNone');
      jQuery(document).unbind('mousemove');
    });

    this.handleInitResizeSiderBar();
  }

  handleMouseDown = (e) => {
    const left = e.pageX;
    const oldWidth = jQuery('.page-layout-sider').width();

    const SPEED = 14;
    jQuery(document).on('mousemove', (event) => {
      const offset = event.pageX - left;
      let width = oldWidth + offset + SPEED;
      if (SIDERBAR_MAX_WIDTH < width) {
        width = SIDERBAR_MAX_WIDTH;
      }
      if (SIDERBAR_MIN_WIDTH > width) {
        width = SIDERBAR_MIN_WIDTH;
      }

      Cookies.set(PAGE_SIDERBAR_WIDTH_KEY, width, sessionCookieOption);
      jQuery('body').addClass('dropingMenuSelectNone');
      jQuery('.page-layout-sider').css({
        flex: `0 0 ${width}px`,
        maxWidth: `${width}px`,
        minWidth: `${width}px`,
        width: `${width}px`,
      });
    });
  }

  handleInitResizeSiderBar = () => {
    const width = (Cookies.get(PAGE_SIDERBAR_WIDTH_KEY, sessionCookieOption) * 1) || SIDERBAR_INIT_WIDTH;
    console.log('width', width);
    jQuery('.page-layout-sider').css({
      flex: `0 0 ${width}px`,
      maxWidth: `${width}px`,
      minWidth: `${width}px`,
      width: `${width}px`,
    });
  }

  searchResultTip = (result) => {
    if (_.isArray(result) && 0 >= result.length) {
      message.warning('搜索不到相关数据，请更换搜索关键词');
    }
  }

  handleReset = (e) => {
    this.setState({
      searchValue: '',
      inputSearchKey: `${Math.random()}`,
    }, () => {
      this.onSelect([], e);
    });
  }

  deepFirstSearch = (tree, name, nodeParent = []) => {
    return tree.map((node) => {
      // 兼容处理， 取label值或者name值 作为筛选条件
      const filterValue = node.label || node.name || '';
      if (_.includes(filterValue, name)) {
        const nodeArr = [this.getNodeKey(node)];
        const parentNode = [];
        if (_.isArray(nodeParent) && !_.isEmpty(nodeParent)) {
          _.each(nodeParent, (parent) => {
            parentNode.unshift(this.getNodeKey(parent));
          });
        }
        // const isSchool = [
        //   _.get(CONST_DICT, 'departments.type.TYPE_CENTER_SCHOOL'),
        //   _.get(CONST_DICT, 'departments.type.TYPE_SCHOOL'),
        // ].includes(node.type);
        // if (isSchool) { // 学校类型就不展开了
        //   return parentNode;
        // }

        // 只搜索现有数据
        if (_.isEmpty(node.children)) {
          if (_.isEmpty(nodeParent)) {
            // 解决只有一个学校，点搜索，返回空数组导致错误提示 搜索不到结果 问题
            // push 一个不存在的key
            parentNode.push('have-result');
          }
          return parentNode;
        }

        return parentNode.concat(nodeArr);
      }
      else if (node.children) {
        const parent = nodeParent.slice();
        parent.unshift(node);
        return this.deepFirstSearch(node.children, name, parent);
      }
      else {
        return null;
      }
    });
  }

  search = (inputValue) => {
    if (!inputValue) {
      return message.warning('请输入搜索关键词');
    }

    const tree = _.get(this.props, 'tree') || [];

    // 把数组，拍平，删除空值，去重
    const expandedKeys = _.flow([_.flatMapDeep, _.compact, _.uniq])(this.deepFirstSearch(tree, inputValue));

    this.searchResultTip(expandedKeys);

    this.setState({
      expandedKeys,
      searchValue: inputValue,
      autoExpandParent: false,
    });
  }

  filterTreeNode = (node) => {
    if (-1 < this.state.checkedKeys.indexOf(_.get(node, 'props.eventKey'))) {
      return true;
    }
    return false;
  }

  handleRightClick = ({
    node,
    event,
  }) => {
    if (__DEV__ && __PROD__) {
      window.console.log('event', event, 'node', node);
    }
    // const key = _.get(node, 'props.eventKey');
    // if (key) {
    //   const checkedKeys = _.filter(this.state.checkedKeys, (elem) => {
    //     return elem !== key;
    //   });
    //   this.setState({
    //     checkedKeys,
    //   });
    // }
  };

  recursiveRender = (data, deep) => {
    const searchValue = this.state.searchValue;

    const treeBranch = [];
    const expandedKeys = this.state.expandedKeys;
    _.each(data, (node) => {
      const key = this.getNodeKey(node);
      const selectable = node.selectable;
      const label = _.get(node, 'label') || '';
      const index = label.indexOf(searchValue);
      let beforeStr = label.substr(0, index);
      let afterStr = label.substr(index + searchValue.length);
      if (0 > index) {
        beforeStr = '';
        afterStr = node.label;
      }

      const dataSet = {
        'data-tree-deep': deep,
        'data-tree-node': node,
        'data-tree-key': key,
        'data-tree-read-type': node.readType,
        'data-tree-pid': node.pid,
      };

      if ('grade' === node.readType) {
        dataSet['data-tree-graduation-year'] = node.graduationYear;
        dataSet['data-tree-year'] = node.year;
      }

      if (node.disabled) {
        dataSet['data-tree-disabled'] = true;
      }

      const isFolder = node.children && node.children.length;
      const isOpen = -1 < expandedKeys.indexOf(key);
      let treeNodeIcon;
      if (!isFolder) {
        treeNodeIcon = (<Svg key="file" link={CONSTANTS.SPRITES.SVG.FILE} />);
      }
      else if (isFolder && !isOpen) {
        treeNodeIcon = (<Svg key="folder" link={CONSTANTS.SPRITES.SVG.FOLDER} />);
      }
      else if (isFolder && isOpen) {
        treeNodeIcon = (<Svg key="folder_opened" link={CONSTANTS.SPRITES.SVG.FOLDER_OPENED} />);
      }
      if ('number' === typeof node.type) {
        if (node.type === _.get(CONST_DICT, 'departments.type.TYPE_OFFICE')) {
          treeNodeIcon = (<Svg key="file" link={CONSTANTS.SPRITES.SVG.OFFICE} />);
        }
        else if (node.type === _.get(CONST_DICT, 'departments.type.TYPE_CENTER_SCHOOL')) {
          treeNodeIcon = (<Svg key="file" link={CONSTANTS.SPRITES.SVG.CENTER_SCHOOL} />);
        }
        else if (node.type === _.get(CONST_DICT, 'departments.type.TYPE_SCHOOL')) {
          treeNodeIcon = (<Svg key="file" link={CONSTANTS.SPRITES.SVG.SCHOOL} />);
        }
        else if (node.type === _.get(CONST_DICT, 'departments.type.TYPE_DEPARTMENT')) {
          treeNodeIcon = (<Svg key="file" link={CONSTANTS.SPRITES.SVG.DEPARTMENT} />);
        }
      }

      const title = (<span
        className="filter-node-title">
        <span {... dataSet} onClick={this.onTreeNodeClick}>
          {beforeStr}
          {
            -1 < index ? <span style={{ color: '#f50' }} className="filter-tree-current-search">{searchValue}</span> : null
          }
          {afterStr}
        </span>
        <span title="取消选择" {... dataSet} onClick={this.onTreeNodeRemoveClick}>
          <Icon type="close-circle-o" />
        </span>
      </span>);

      const props = {
        title,
        node,
        icon: treeNodeIcon,
        key,
        disabled: node.disabled,
        selectable,
        dataRef: node,
      };

      if (undefined !== node.isLeaf) {
        props.isLeaf = node.isLeaf;
      }
      const treeNode = (<Tree.TreeNode {...props}>
        {
          deep < 1 * this.props.deep && _.isArray(node.children) ? this.recursiveRender(node.children, 1 + deep) : null
        }
      </Tree.TreeNode>);
      treeBranch.push(treeNode);
    });
    return treeBranch;
  }

  renderTreeNode = () => {
    // [ { "id", "label", value", "children"? } ]
    const tree = _.get(this.props, 'tree');
    if (_.isArray(tree)) {
      return this.recursiveRender(tree, 1);
    }
    else {
      window.console.error('side_tree component only accept an array\n the struct of array is [ { "id", "label", value", "children"? } ]');
      return null;
    }
  }

  render() {
    const treeProps = {
      showIcon: true,
      className: 'side-tree-select',
      onExpand: this.onExpand,
      dataBakOnCheck: this.onCheck,
      dataBakOnSelect: this.onSelect,
      dataBakOnRightClick: this.handleRightClick,
      autoExpandParent: this.state.autoExpandParent,
      expandedKeys: this.state.expandedKeys,
      checkedKeys: this.state.checkedKeys,
      multiple: this.props.multiple,
      filterTreeNode: this.filterTreeNode,
      checkable: this.props.checkable,
      showLine: true,
      onLoad: this.onLoad,
      loadedKeys: this.state.loadedKeys,
    };

    if ('function' === typeof this.props.loadData) {
      treeProps.loadData = this.props.loadData;
    }
    return (
      <div className={`side-tree ${this.props.className || ''}`}>
        <div className="side-tree-input-container">
          <Button size="small" className="side-tree-reset" onClick={this.handleReset}>重置</Button>
          <Input.Search
            key={this.state.inputSearchKey}
            onSearch={this.onSearch}
            size="small"
            placeholder={this.props.placeholder}
            enterButton
            className="side-tree-input" />
        </div>
        <Tree {...treeProps}>{this.renderTreeNode()}</Tree>

        <div
          className="mainLayoutMenuContainerResizeDrop"
          onMouseDown={this.handleMouseDown} />
      </div>
    );
  }
}
