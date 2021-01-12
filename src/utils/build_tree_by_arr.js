import _ from 'lodash';

const buildTreeByArr = ({
  eachCallback = (elem) => {
    return elem;
  },
  addAttrFunc = (elem) => {
    if (__DEV__ && __PROD__) {
      window.console.log(elem);
    }

    return {};
  },
  arr,
  getLabel = (elem) => {
    return elem.name;
  },
  addIdKey = true,
  addTypeIdKey = false,
  isBuildDownIds = false,
}) => {
  const key = {};
  const tree = [];
  const allList = [].concat(arr);
  const returnObj = {
    key,
    tree,
    allList,
  };

  if (!allList || !_.isArray(allList) || !allList.length) {
    return returnObj;
  }

  const parentKey = 'pid';

  // 如果 id 和 parentKey 的值不是数值，就进行格式转换
  if ('number' !== typeof _.get(allList, '[0].id') || 'number' !== typeof _.get(allList, `[0].${parentKey}`)) {
    _.each(allList, (elem) => {
      const options = {
        id: elem.id * 1,
        [parentKey]: elem[parentKey] * 1,
      };
      _.assign(elem, options);
    });
  }

  const leafArr = [];
  const groupChildren = _.groupBy(allList, 'pid');
  _.each(allList, (elem) => {
    // 构造 hash 索引存储

    let elemKey = elem.id;
    if (elem.readType) {
      elemKey = `${elem.readType}_${elem.id}`;
    }
    if (addTypeIdKey) {
      // 这个是 department 和 class 表使用的
      key[elemKey] = elem;
    }

    if (addIdKey) {
      // 这个是兼容旧版本的
      key[elem.id] = elem;
    }

    // const children = _.filter(allList, {
    //   [parentKey]: elem.id,
    // }) || [];
    const children = _.get(groupChildren, `${elem.id}`) || [];

    const options = {
      // 兼容新版 antd ， label 和 title 指向同一个值。
      label: getLabel(elem),
      title: getLabel(elem),
      value: elem.id,
    };
    if ('function' === typeof addAttrFunc) {
      _.assign(options, addAttrFunc(elem));
    }

    // 这个目前只有图书以及书架用到。其他应该删除。
    if (isBuildDownIds) {
      options.downIds = [elem.id];
    }

    if (children.length) {
      options.children = children;
    }
    else {
      leafArr.push(elem);
    }

    _.assign(elem, options);
    eachCallback(elem);
  });

  if (isBuildDownIds) {
    // 叶子节点的递归
    let parentArr = [];
    _.map(leafArr, (elem) => {
      const parentElem = key[elem.pid];
      if (parentElem) {
        parentArr.push(parentElem);
        parentElem.downIds.push(elem.id);
      }
    });

    // 非叶子节点的递归
    parentArr = _.uniq(parentArr);
    let ecchParent = parentArr.shift();
    while (ecchParent && ecchParent.id) {
      const currentParent = key[ecchParent.pid];
      if (currentParent) {
        parentArr.push(currentParent);
        currentParent.downIds = [].concat(currentParent.downIds).concat(ecchParent.downIds);
      }
      ecchParent = parentArr.shift();
    }
  }

  // 查找根节点，如果找不到 parent node ，即使 parentKey 为非 0 ， 也是根节点，因为树被砍掉部分了。
  _.each(allList, (elem) => {
    const parent = _.find(allList, {
      id: elem[parentKey],
    });

    if (!parent) {
      tree.push(elem);
    }
  });

  return returnObj;
};
export default buildTreeByArr;
