# Download
---

Download ，下载组件，用于下载后端生成的表格或者文件数据。

## Usage

```js
import moment from 'moment';
import { DownloadLink, DownloadGraphql } from './download';

class Component extends React.PureComponent {
  render() {

    return (<div>
      // 这个是能下载不同表头的
      <DownloadGraphql
        isButton={false}
        exportableList="teacherExport"
        exportAction="teacherExport"
        path="graphql/system"
        query={{ filter: [['name', 'like', '王小二']] }}
        confirm="true"
        paramsData={{}}
        size="small">批量导出</DownloadGraphql>

      <DownloadLink
        link="true"
        method="GET"
        skipAuthorization
        path={`${getApiConfig({ model: this.state.model, key: 'downloadTempPath' })}`}
        size="small">下载模板</DownloadLink>

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
      <td>confirm</td>
      <td>boolean or 'true'</td>
      <td>false</td>
      <td>下载是否需要确认提示只导出这一次的搜索结构， 默认 false, 只有为 true 或者 'true' 时候才会弹出</td>
    </tr>
    <tr>
      <td>exportableList</td>
      <td>string</td>
      <td>''</td>
      <td>自定义表头的获取参数，从 state.$export.exportableList 中读取 name 为该值的数据信息，组装表头下载</td>
    </tr>
    <tr>
      <td>exportAction</td>
      <td>string</td>
      <td>''</td>
      <td>下载的时候的 graphql scheme ，如果有传输，就会使用 graphql 方式传输过去下载</td>
    </tr>
    <tr>
      <td>path</td>
      <td>string</td>
      <td>graphql</td>
      <td>下载路径</td>
    </tr>
    <tr>
      <td>skipAuthorization</td>
      <td>bolean</td>
      <td>false</td>
      <td>是否跳过授权，如果为 true ，下载时候将不带 token 进行</td>
    </tr>
    <tr>
      <td>paramsData(目前考试管理，导出学生成绩和学生座位号的增加了处理)</td>
      <td>object</td>
      <td>{}</td>
      <td>提交下载时候，额外需要传输的参数。</td>
    </tr>
    <tr>
      <td>method</td>
      <td>http method</td>
      <td>POST</td>
      <td>提交时候的 http method</td>
    </tr>
    <tr>
      <td>children</td>
      <td>string , react component</td>
      <td>null</td>
      <td>需要渲染的 content</td>
    </tr>
    <tr>
      <td>link</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否使用链接形式显示该组件</td>
    </tr>
    <tr>
      <td>downloadAsync</td>
      <td>boolean</td>
      <td>false</td>
      <td>是否异步下载，如果是异步下载，就会请求多个指令</td>
    </tr>
    <tr>
      <td>type|size|disabled|className</td>
      <td>参考 anth 的 button 的 props</td>
      <td>undefined</td>
      <td>button 的属性，link 为 false 时候生效</td>
    </tr>
  </tbody>
</table>
