# Ellipsis
---

Ellipsis ，显示多少行的数据。一般组合 Tooltip 使用

## Usage

```js
import { Tooltip } from 'antd';
import moment from 'moment';
import Ellipsis from './ellipsis';

class Component extends React.PureComponent {
  render() {

    const title = `
    rstyeurdhgfrete5y6ruyfjhgfre56ruyjhtr456uyj
    sda
    srets
    re
    sr
    etydh
    gfer
    tydh
    fger
    tgh
    dfgsdcg
    `;
    return (<div>
      <Ellipsis>
        <Tooltip placement="topLeft" title={title}>
          rstyeurdhgfrete5y6ruyfjhgfre56ruyjhtr456uyj
        </Tooltip>
      </Ellipsis>

    </div>);
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
      <td>style</td>
      <td>object</td>
      <td>{}</td>
      <td>组件的额外的style</td>
    </tr>
    <tr>
      <td>width</td>
      <td>css 宽度</td>
      <td>100%</td>
      <td>容器的设置的宽度</td>
    </tr>
    <tr>
      <td>line</td>
      <td>number</td>
      <td>1</td>
      <td>多少行</td>
    </tr>
    <tr>
      <td>height</td>
      <td>css 高度</td>
      <td>1rem</td>
      <td>容器的高度</td>
    </tr>
    <tr>
      <td>className</td>
      <td>string</td>
      <td>''</td>
      <td>容器的 className</td>
    </tr>
    <tr>
      <td>children</td>
      <td>string , react component</td>
      <td>null</td>
      <td>需要渲染的 content</td>
    </tr>
  </tbody>
</table>
