# HtmlBraftEditor
---

HtmlBraftEditor，基于Draft.js的富文本编辑器

## Usage

```js
import HtmlBraftEditor from './html_braft_editor';

class Component extends React.PureComponent {
  render() {
    return <HtmlBraftEditor />
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
      <td>value</td>
      <td>string</td>
      <td>''</td>
      <td>编辑器内容</td>
    </tr>
    <tr>
      <td>onChange</td>
      <td>function</td>
      <td>null</td>
      <td>编辑器内容发生变化时的回调函数</td>
    </tr>
  </tbody>
</table>

