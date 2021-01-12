# QRCode
---
QRCode，二维码组件。

## Usage

```js
import QRCode from './qrcode';

class Component extends React.PureComponent {
  render() {
    <QRCode value="http://facebook.github.io/react/" size={250} />
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
      <td>size</td>
      <td>number</td>
      <td>128</td>
      <td>二维码尺寸大小</td>
    </tr>
    <tr>
      <td>value</td>
      <td>string</td>
      <td>'二维码'</td>
      <td>链接</td>
    </tr>
    <tr>
      <td>fgColor</td>
      <td>string (CSS color)</td>
      <td>'#000000'</td>
      <td>前景色</td>
    </tr>
    <tr>
      <td>bgColor</td>
      <td>string (CSS color)</td>
      <td>'#ffffff'</td>
      <td>背景色</td>
    </tr>
    <tr>
      <td>logo</td>
      <td>string</td>
      <td>''</td>
      <td>二维码logo</td>
    </tr>
    <tr>
      <td>logoWidth</td>
      <td>string</td>
      <td>size * 0.2</td>
      <td>logo宽度</td>
    </tr>
    <tr>
      <td>logoHeight</td>
      <td>string</td>
      <td>按logoWidth成比例缩放</td>
      <td>logo高度</td>
    </tr>
  </tbody>
</table>
