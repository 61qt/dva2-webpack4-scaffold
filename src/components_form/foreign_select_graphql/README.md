# ForeignSelectGraphql
---

ForeignSelectGraphql

## Usage

```js
import ForeignSelectGraphql from './foreign_select_graphql';

class Component extends React.PureComponent {
  render() {
    const select = `
      id
      name
    `;
    return <ForeignSelectGraphql size="small" placeholder="选择" table="student" select={select} allowClear numberFormat />
  }
}
```

## API

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
      <td>table</td>
      <td>string</td>
      <td>''</td>
      <td>要显示的表的名称</td>
    </tr>
    <tr>
      <td>select</td>
      <td>string</td>
      <td>null</td>
      <td>要查询的字段，默认为空，查询所有字段</td>
    </tr>
    <tr>
      <td>triggerSearchWhenValueChange</td>
      <td>boolean</td>
      <td>true</td>
      <td>值更改的时候，是否触发重新获取数据，新增属性，默认触发（兼容旧版本）</td>
    </tr>
    <tr>
      <td>options</td>
      <td>{valueName: string, textName: string, searchName: string, searchMethod: string}</td>
      <td>null</td>
      <td>创建默认的搜索名称</td>
    </tr>
    <tr>
      <td>filterOption</td>
      <td>array</td>
      <td>[name, method, value]</td>
      <td>筛选条件，method可选'like', 'in'</td>
    </tr>
    <tr>
      <td>mode</td>
      <td>string</td>
      <td>''</td>
      <td>设置Select的模式，可选'multiple'，'tags'，~'combobox'（3.7.0版本开始废弃 combobox）~</td>
    </tr>
    <tr>
      <td>force</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否禁止从缓存读取数据</td>
    </tr>
    <tr>
      <td>filter</td>
      <td>array</td>
      <td>[]</td>
      <td>查询时的筛选条件</td>
    </tr>
    <tr>
      <td>append</td>
      <td>boolean</td>
      <td>true</td>
      <td>缓存是否连接并去重</td>
    </tr>
    <tr>
      <td>value</td>
      <td>string</td>
      <td>''</td>
      <td>输入框的值</td>
    </tr>
    <tr>
      <td>numberFormat</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否格式化为整数</td>
    </tr>
    <tr>
      <td>onSelect</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>onDeselect</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>search</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>filterFunc</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td>renderLabel</td>
      <td>function</td>
      <td>null</td>
      <td></td>
    </tr>
    <tr>
      <td>renderValue</td>
      <td>function</td>
      <td>null</td>
      <td></td>
    </tr>
    <tr>
      <td>size</td>
      <td>string</td>
      <td>'default'</td>
      <td>搜索框大小，可选'large'或'small'</td>
    </tr>
    <tr>
      <td>showSearch</td>
      <td>boolean</td>
      <td>true</td>
      <td>单选模式是否可以搜索</td>
    </tr>
    <tr>
      <td>disabled</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否禁用</td>
    </tr>
    <tr>
      <td>placeholder</td>
      <td>string</td>
      <td>''</td>
      <td>选择框默认文字</td>
    </tr>
    <tr>
      <td>notFoundContent</td>
      <td>string</td>
      <td>'Not Found'</td>
      <td>当下拉列表为空时显示的内容</td>
    </tr>
    <tr>
      <td>style</td>
      <td>string</td>
      <td>''</td>
      <td>自定义样式</td>
    </tr>
    <tr>
      <td>showArrow</td>
      <td>boolean</td>
      <td>true</td>
      <td>是否显示下拉小箭头</td>
    </tr>
    <tr>
      <td>allowClear</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否支持清除</td>
    </tr>
    <tr>
      <td>className</td>
      <td>string</td>
      <td>''</td>
      <td>自定义CSS样式</td>
    </tr>
    <tr>
      <td>onChange</td>
      <td>function</td>
      <td>null</td>
      <td></td>
    </tr>
  </tbody>
</table>

