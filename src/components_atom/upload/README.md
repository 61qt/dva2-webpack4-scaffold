# Upload
---
Upload

## Usage

```js
import Upload from './upload';

class Component extends React.PureComponent {
  render() {
    <Upload path="//jsonplaceholder.typicode.com/posts/">{children}</Upload>
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
      <td>path</td>
      <td>路径</td>
      <td>''</td>
      <td>上传路径</td>
    </tr>
    <tr>
      <td>query</td>
      <td>查询条件</td>
      <td>null</td>
      <td>查询条件</td>
    </tr>
    <tr>
      <td>method</td>
      <td>string</td>
      <td>'POST'</td>
      <td>请求方法</td>
    </tr>
    <tr>
      <td>children</td>
      <td>string或React component</td>
      <td>null</td>
      <td>子组件</td>
    </tr>
    <tr>
      <td>link</td>
      <td>boolean</td>
      <td>null</td>
      <td>判断显示样式为链接或按钮</td>
    </tr>
    <tr>
      <td>onUploaded</td>
      <td>function</td>
      <td>(info) => {}</td>
      <td>上传成功之后的操作</td>
    </tr>
    <tr>
      <td>formatFormValue</td>
      <td>function</td>
      <td>(values) => {return values; }</td>
      <td>获取表单的值</td>
    </tr>
    <tr>
      <td>uploadConfirmTip</td>
      <td>string</td>
      <td>undefined</td>
      <td>上传之前的信息提示</td>
    </tr>
    <tr>
      <td>getUploadFormColumn</td>
      <td>function</td>
      <td>
        `
        ({ form }) => {
          return [];
        }
        `
      </td>
      <td>获取额外的表单</td>
    </tr>
  </tbody>
</table>

#### onUploaded

文件上传成功时调用该回调函数

#### 使用离子
统一管理平台， 班级列表有使用离子，开发模式看看
