# SearchForm
---
SearchForm，搜索框表单

## Usage

```js
import SearchForm from './search_form';

class Component extends React.PureComponent {
  render() {
    <SearchForm
      showCount={2}
      searchCol={12}
    />
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
    <tr>
      <td>(没导出)buildSearchFormCol</td>
      <td>function</td>
      <td>生成搜索表单列</td>
      <td>搜索表单列</td>
      <td>form</td>
      <td>表单</td>
    </tr>
    <tr>
      <td colSpan="4"></td>
      <td>searchCol</td>
      <td>搜索列栅格占格数</td>
    </tr>
    <tr>
      <td colSpan="4"></td>
      <td>elem</td>
      <td>表单元素项</td>
    </tr>
    <tr>
      <td>getFilter</td>
      <td>function</td>
      <td>生成搜索的查询条件</td>
      <td>新的查询条件</td>
      <td>values</td>
      <td>搜索条件</td>
    </tr>
    <tr>
      <td colSpan="4"></td>
      <td>options</td>
      <td>其他选项</td>
    </tr>
  </tbody>
</table>

<table>
  <thead>
    <tr>
      <th style="width: 100px;">name</th>
      <th style="width: 50px;">type</th>
      <th style="width: 50px;">description</th>
      <th style="width: 50px;">item</th>
      <th style="width: 130px;">item description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>(没导出)searchFormItemLayout</td>
      <td>object</td>
      <td>搜索表单项布局</td>
      <td>labelCol</td>
      <td>搜索名称栅格占格数</td>
    </tr>
    <tr>
      <td colSpan="3"></td>
      <td>wrapperCol</td>
      <td>搜索框栅格占格数</td>
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
      <td>autoTriggerHandleSearch</td>
      <td>boolean</td>
      <td>true</td>
      <td>是否自动触发搜索的表单 submit</td>
    </tr>
    <tr>
      <td>showCount</td>
      <td>number</td>
      <td>2</td>
      <td>显示的选项个数</td>
    </tr>
    <tr>
      <td>searchCol</td>
      <td>number</td>
      <td>12</td>
      <td>每列栅格宽度（基于antd栅格系统）</td>
    </tr>
    <tr>
      <td>defaultSearchValues</td>
      <td>object</td>
      <td>{}</td>
      <td></td>
    </tr>
    <tr>
      <td>handleSubmit</td>
      <td>function</td>
      <td>() => {return false;}</td>
      <td>提交搜索调用的函数</td>
    </tr>
    <tr>
      <td>getSearchColumn</td>
      <td>function</td>
      <td>() => {return [];}</td>
      <td>获取搜索项数据调用的函数</td>
    </tr>
    <tr>
      <td>defaultExpand</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否展开全部搜索项</td>
    </tr>
    <tr>
      <td>form</td>
      <td>object</td>
      <td>{}</td>
      <td>antd Form组件包装的自带属性</td>
    </tr>
  </tbody>
</table>
