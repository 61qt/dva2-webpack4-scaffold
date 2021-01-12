# Access
---

Access auth control，用于设置该元素是否有权限的时候的显示或者隐藏。

## Usage

```js
import Access from './access';

class Component extends React.PureComponent {
  render() {
    const student = {
      id: 1,
      detailUrl: '/student/1',
      name: '王小二',
    };
    return (<div>
      <Access auth="!student.detail">
        <a href={student.detailUrl}>{student.name}</a>
      </Access>
      <Access auth="student.detail">
        {student.name}
      </Access>
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
    <tr>
      <td>checkIsHasAuth</td>
      <td>function</td>
      <td>检测是否有某个权限</td>
      <td>boolean</td>
      <td>
        {
          auth: '',
          resource: '',
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
      <td>children</td>
      <td>string 或者 react component</td>
      <td>null</td>
      <td>需要渲染的内容</td>
    </tr>
    <tr>
      <td>inlineElem</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否行内的元素，如果是行内的，就会使用 span 包裹，如果不是而且，就返回原值。当 children 为 string 时候，自动为 true</td>
    </tr>
    <tr>
      <td>auth</td>
      <td>string ~或者 function, function 模式已经丢弃~</td>
      <td>''</td>
      <td>需要检测的权限或者非权限(!开头)</td>
    </tr>
  </tbody>
</table>



# changelog

## 1.0.0
init version
