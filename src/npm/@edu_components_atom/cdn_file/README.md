# CDN FILE
---

用于显示 upload cdn 上面的信息。

## Usage

```js
import CdnFile from './cdn_file';

class Component extends React.PureComponent {
  render() {
    return (<CdnFile href="group1/0/0/121234" />);
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
      <td>className</td>
      <td>string</td>
      <td>''</td>
      <td>加载图片上面的 className</td>
    </tr>
    <tr>
      <td>href</td>
      <td>string</td>
      <td>''</td>
      <td>那个 cdn file 的连接，一般没有域名前缀的</td>
    </tr>
    <tr>
      <td>type</td>
      <td>string</td>
      <td>image</td>
      <td>如果是图片的话，就直接显示图片模式，如果不是，就显示是一个连接。</td>
    </tr>
    <tr>
      <td>alt</td>
      <td>string</td>
      <td>''</td>
      <td>图片的 alt</td>
    </tr>
    <tr>
      <td>style</td>
      <td>object</td>
      <td>{}</td>
      <td>图片的 style</td>
    </tr>
  </tbody>
</table>

# changelog

## 1.0.0
init version
