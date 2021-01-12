# FilterTree
---

FilterTree ，左侧的 筛选树，反正是筛选树，具体怎么用，自己搞吧。给个容器就行。

## Usage

```js
import moment from 'moment';
import FilterTree from './filter_tree';

class Component extends React.PureComponent {
  render() {
    return (<div>
      <FilterTree
        valueFormat={this.siderTreeValueFormat}
        tree={siderTreeData}
        deep={this.state.filterTreeDeep}
        onSelect={this.handleSiderSelect}
        onCheck={this.handleSiderCheck}
        checkable={false}
        multiple={false}
        defaultExpanded={_.get(this.getPageState(), 'listState.siderExpanded') || []}
        defaultValue={_.get(this.getPageState(), 'listState.siderOrigin') || []}
      />
    </div>);
  }
}
```

## API

### export

<table class="table table-bordered table-striped">
  <thead>
    <tr>
      <th style="width: 100px;">name</th>
      <th style="width: 50px;">type</th>
      <th style="width: 130px;">description</th>
      <th style="width: 50px;">return</th>
      <th style="width: 100px;">args</th>
      <th>args description</th>
    </tr>
  </thead>
  <tbody>
    <!-- <tr>
      <td>treeBranchArea</td>
      <td>function</td>
      <td>获取某个区域的地区分支</td>
      <td>[]</td>
      <td>
        {
          tree: '',
          areaId: '',
        }
      </td>
      <td>通过 object 传输多个集合参数</td>
    </tr>
    <tr>
      <td colSpan="4"></td>
      <td>auth</td>
      <td>必填, 需要检测的权限或者非权限(!开头)</td>
    </tr>
    <tr>
      <td colSpan="4"></td>
      <td>resource</td>
      <td>必填, 用于判断该 auth 是否有权限展示与否</td>
    </tr> -->
    <tr>
      <td>treeBranchDepartment</td>
      <td>function</td>
      <td>获取某个部门的分支树</td>
      <td>[]</td>
      <td>
        {
          tree: '',
          <!-- // filterType = 'node_department_id', // (已删除，自行在 dueFunc 里面增加) -->
          filterFunc = (elem) => {
            return elem || true;
          },
          dueFunc = (elem) => {
            return elem;
          },
        }
      </td>
      <td>通过 object 传输多个集合参数</td>
    </tr>
    <tr>
      <td colSpan="4"></td>
      <td>tree</td>
      <td>必填, 树信息</td>
    </tr>
    <!-- <tr style="text-decoration: line-through;">
      <td colSpan="4"></td>
      <td>filterType(已删除，自行在 dueFunc 里面增加)</td>
      <td>默认为 node_department_id ，用于数据的筛选类型的设置(已删除，自行在 dueFunc 里面增加)</td>
    </tr> -->
    <tr>
      <td colSpan="4"></td>
      <td>filterFunc</td>
      <td>对那棵树的每一个数据进行筛选，如果返回 false ，就会被排除，一般用于从数组中筛选出某些数据</td>
    </tr>
    <tr>
      <td colSpan="4"></td>
      <td>dueFunc</td>
      <td>对筛选之后的元素进行处理，返回处理之后的值</td>
    </tr>
  </tbody>
</table>

### Props

<table class="table table-bordered table-striped">
  <thead>
    <tr>
      <th style="width: 100px;">name</th>
      <th style="width: 50px;">type</th>
      <th style="width: 50px;">default</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>tree</td>
      <td>array</td>
      <td>[]</td>
      <td>需要展示出来的那棵树</td>
    </tr>
    <tr>
      <td>deep</td>
      <td>number</td>
      <td>9999999</td>
      <td>需要展示从层级深度</td>
    </tr>
    <tr>
      <td>defaultExpanded</td>
      <td>array</td>
      <td>undefined</td>
      <td>默认展开的数据节点</td>
    </tr>
    <tr>
      <td>onSelect</td>
      <td>function</td>
      <td>undefined</td>
      <td>
        节点进行选中了之后的处理，
        function({
          siderOrigin: selectedId,
          siderValues: selectData,
          siderExpanded: this.state.expandedKeys,
        })
      </td>
    </tr>
    <tr>
      <td>valueFormat</td>
      <td>function</td>
      <td>undefined</td>
      <td>如果节点选中了，怎么处理选中的值，返回的值就是最终的 value ，供外部使用。</td>
    </tr>
    <tr>
      <td>checkable</td>
      <td>function</td>
      <td>false</td>
      <td>节点前添加 Checkbox 复选框。默认不展示</td>
    </tr>
    <tr>
      <td>className</td>
      <td>string</td>
      <td>''</td>
      <td>组件容器的 className</td>
    </tr>
    <tr>
      <td>multiple</td>
      <td>boolean</td>
      <td>''</td>
      <td>组件是否可以多选，目前这个参数还没效果，若要使用，看看场景是否必须的，然后如果是必须的，就再进行功能的拓展</td>
    </tr>
    <tr>
      <td>defaultValue</td>
      <td>array</td>
      <td>[]</td>
      <td>组件的默认选中的值</td>
    </tr>
    <tr>
      <td>placeholder</td>
      <td>string</td>
      <td>搜索</td>
      <td>组件的 placeholder</td>
    </tr>

  </tbody>
</table>
