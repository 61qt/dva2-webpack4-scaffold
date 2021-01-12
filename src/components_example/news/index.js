import React from 'react';
// import _ from 'lodash';
import { connect } from 'dva';
import { Modal } from 'antd';
import { NavLink } from '@/components_atom/router';
import styles from './index.less';
import QRCode from '../../components_atom/qrcode';
import Filters from '../../filters';
import PageList from '../../components_default/page_list';

@connect((state) => {
  return {
    loading: !!state.loading.models.post,
    pageState: state.post,
  };
})
export default class Component extends PageList {
  constructor(props) {
    super(props);
    debugAdd('news', this);

    _.assign(this.state, {
      searchCol: 8,
      model: 'post',
      modeLabel: '文章列表',
      defaultSearchValue: {
      },
      modalVisible: false,
      modelText: '',
    });
  }

  componentDidMount = () => {
    this.props.dispatch({
      type: 'breadcrumb/current',
      payload: [
        {
          name: '文章管理',
          url: Filters.path('news', {}),
        },
      ],
    });
  }

  getSearchColumn = () => {
    const children = [];

    children.push({
      dataIndex: 'title',
      label: '文章标题',
    });
    children.push({
      dataIndex: 'source',
      label: '文章来源',
    });
    children.push({
      dataIndex: 'author',
      label: '作者',
    });

    return children;
  }

  getTableColumns = () => {
    const columns = [
      {
        title: '编号',
        dataIndex: 'id',
        key: 'id',
        fixed: 'left',
        width: 100,
      },
      {
        title: '文章标题',
        dataIndex: 'title',
        key: 'title',
        fixed: 'left',
        width: 140,
      },
      {
        title: '创建日期',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 140,
      },
      {
        title: '修改日期',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 140,
      },
      {
        title: '阅读数量',
        dataIndex: 'view_count',
        key: 'view_count',
        width: 90,
      },
      {
        title: '链接',
        dataIndex: 'link',
        key: 'link',
        render: (text, record) => {
          return (<a href={`#id=${record.id}`} rel="noopener noreferrer" target="_blank">打开</a>);
        },
        width: 60,
      },
      {
        title: '二维码',
        dataIndex: 'qrcode',
        key: 'qrcode',
        render: (text, record) => {
          return (<a onClick={this.handleModelOpen.bind(this, { record })}>二维码</a>);
        },
        width: 70,
      },
      {
        title: '作者',
        key: 'author',
        dataIndex: 'author',
        minWidth: 100,
      },
      {
        title: '操作',
        key: 'operation',
        fixed: 'right',
        width: 80,
        render: (text, record) => (
          <span className={styles.operation}>
            <NavLink to={Filters.path('news_edit', { id: record.id })} activeClassName="link-active">编辑</NavLink>
          </span>
        ),
      },
    ];

    return columns;
  }

  handleModelClose = () => {
    this.setState({
      modalVisible: false,
    });
  }

  handleModelOpen = ({ record }) => {
    this.setState({
      modalVisible: true,
      modelText: `/news/${record.id}`,
    });
  }

  getPageFooter = () => {
    return (
      <Modal visible={this.state.modalVisible} onCancel={this.handleModelClose} footer={null}>
        <div style={{ textAlign: 'center' }}>
          <p>链接： <a href={this.state.modelText} rel="noopener noreferrer" target="_blank">{this.state.modelText}</a></p>
          <br />
          <QRCode value={this.state.modelText} size={250} />
        </div>
      </Modal>
    );
  }
}
