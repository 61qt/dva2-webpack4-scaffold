import _ from 'lodash';

function eachTree({
  tree,
  level = 1,
  dueFunc = (elem, levelArga) => {
    if (__DEV__ && __PROD__) {
      window.console.log('level', levelArga);
    }
    return elem;
  },
  filterFunc = () => {
    return true;
  },
}) {
  const newTree = [];
  _.each(tree, (treeNode) => {
    const tempTreeNode = {
      ...treeNode,
    };

    if (tempTreeNode && tempTreeNode.children && tempTreeNode.children.length) {
      tempTreeNode.children = eachTree({
        tree: tempTreeNode.children,
        level: level + 1,
        dueFunc,
        filterFunc,
      });
    }

    const newTreeNode = dueFunc(tempTreeNode, level);
    if (filterFunc(newTreeNode, level)) {
      newTree.push(newTreeNode);
    }
  });

  return newTree;
}

export {
  eachTree,
};

export default 'tree';
