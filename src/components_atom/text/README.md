# Text
---

Text, 在特定容器中展示所有的文字，根据来处理。这里默认只展示一行，而且是 block 类型的展示模式。

## Usage

```js
import Text from './text';

class Component extends React.PureComponent {
  render() {
    const student = {
      id: 1,
      detailUrl: '/student/1',
      name: '王小二',
    };
    return (<div><Text>这里是字体</Text></div>);
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
      <td>children</td>
      <td>string 或者 react component</td>
      <td>null</td>
      <td>需要渲染的内容</td>
    </tr>
  </tbody>
</table>
