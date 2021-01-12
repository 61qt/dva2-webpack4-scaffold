# Access
---

router ， 用于全局的 dva/router 功能拦截。

## Usage

```js
import { NavLink } from './router';

class Component extends React.PureComponent {
  render() {
    const student = {
      id: 1,
      detailUrl: '/student/1',
      name: '王小二',
    };
    return (<div>
      <NavLink to="/student">学生列表</NavLink>
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
      <td>NavLink/Link</td>
      <td>react component</td>
      <td>在 dva/router 的基础上改了 to</td>
      <td>react component</td>
      <td>查看dva/router</td>
      <td>查看dva/router</td>
    </tr>
    <tr>
      <td>Router, Redirect, Prompt, Route, Switch</td>
      <td>react component</td>
      <td>导入导出 dva/router 的而已</td>
      <td>react component</td>
      <td>查看dva/router</td>
      <td>查看dva/router</td>
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
      <td>to</td>
      <td>string 或者 react router 的 to </td>
      <td>null</td>
      <td>跳转的地址</td>
    </tr>
    <tr>
      <td>其他</td>
      <td>其他</td>
      <td>其他</td>
      <td>查看 dva/router 官方文档</td>
    </tr>
  </tbody>
</table>

