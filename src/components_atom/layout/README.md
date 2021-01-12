# Layout
---

Layout ，左侧的 筛选树，反正是筛选树，具体怎么用，自己搞吧。给个容器就行。

## Usage

```js
import moment from 'moment';
import Layout from './layout';

class Component extends React.PureComponent {
  render() {
    const Router = ''; // 某处定义的 router， 为 react router v4 版本的。
    const props = this.props;
    const onClick = () => {
      console.log('onClick', onClick);
    };

    return (<div>
      <Layout
        onClick={onClick}
        user={props.user}
        location={props.location}
        history={props.history}
        breadcrumb={breadcrumb}>
        <Router />
      </Layout>
    </div>);
  }
}
```

## API

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
      <td>onClick</td>
      <td>function</td>
      <td></td>
      <td>点击的回调</td>
    </tr>
    <tr>
      <td>user</td>
      <td>number</td>
      <td></td>
      <td>用户信息</td>
    </tr>
    <tr>
      <td>location</td>
      <td>react router location</td>
      <td></td>
      <td>location</td>
    </tr>
    <tr>
      <td>history</td>
      <td>dva history</td>
      <td></td>
      <td>管理组件的历史</td>
    </tr>
    <tr>
      <td>breadcrumb</td>
      <td>redux 中的 breadcrumb state</td>
      <td></td>
      <td>路由器</td>
    </tr>
  </tbody>
</table>
