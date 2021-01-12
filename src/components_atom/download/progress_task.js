import _ from 'lodash';
import React from 'react';
import { connect } from 'dva';
import styles from './index.less';
// import { Progress } from 'antd';

// import Text from '../text';
import PageTableModal from '../../components_default/page_table_modal';
import Filters from '../../filters';
import formErrorMessageShow from '../../utils/form_error_message_show';

const importResult = {
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_NORMAL')]: '导入中',
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_SUCCESS')]: '导入成功',
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_FAIL')]: '导入失败',
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_EXPIRED')]: '已过期',
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_WARNING')]: '部分导入失败',
};

const exportResult = {
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_NORMAL')]: '导出中',
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_SUCCESS')]: '导出成功',
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_FAIL')]: '导出失败',
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_EXPIRED')]: '已过期',
  [_.get(CONST_DICT, 'download_tasks.status.STATUS_WARNING')]: '部分导出失败',
};
@connect((state) => {
  return {
    loading: !!state.loading.models.download_task,
    pageState: state.download_task,
  };
})
export default class DownloadProgressTask extends PageTableModal {
  static defaultProps = {
  };

  constructor(props) {
    super(props);

    debugAdd('my_download', this);

    _.assign(this.state, {
      model: 'download_task',
      tableModalWidth: '1100px',
      talbeModalClassName: 'noCancelBtnModal noSureBtnModal noBtnBorderModal showAntModalClose',
      defaultSearchValue: {
        'not-status': _.get(CONST_DICT, 'download_tasks.status.STATUS_EXPIRED'),
      },
    });

    this.timer = undefined;
    this.timerMs = __DEV__ ? 2 * 1000 : 10 * 1000;
  }

  componentDidUpdate = () => {
    const currentList = _.get(this.props, 'pageState.list') || [];
    // 没有下载任务，取消轮询
    if (!currentList.length) {
      this.clearTaskTimer();
      return;
    }

    // 当前页的下载任务都是完成状态，取消轮询
    // const tasksHasGenerated = _.every(currentList, { status: _.get(CONST_DICT, 'download_tasks.status.STATUS_SUCCESS') });

    // 修改为进度判断
    const tasksHasGenerated = _.isEmpty(_.filter(currentList, { status: _.get(CONST_DICT, 'download_tasks.status.STATUS_NORMAL') }));
    if (tasksHasGenerated) {
      this.clearTaskTimer();
      return;
    }

    this.startTimer();
  }

  componentDidCatch = () => {
    this.clearTaskTimer();
  }

  componentWillUnmount = () => {
    this.clearTaskTimer();
  }

  getTableExtrapProps = () => {
    return {
      forceNoMinWidth: true,
    };
  }

  handleToggleVisibleTureCallback = () => {
    this.startTimer();
  }

  handleToggleVisibleFalseCallback = () => {
    this.clearTaskTimer();
  }

  startTimer = () => {
    if (!this.timer && this.state.visible) {
      this.timer = setTimeout(() => {
        this.pageChangeHandler()
          .then(() => {
            this.timer = undefined;
            this.startTimer();
          })
          .catch((rej) => {
            this.clearTaskTimer();
            formErrorMessageShow(rej);
          });
      }, this.timerMs);
    }
  }

  clearTaskTimer = () => {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  getTableColumns = () => {
    const columns = [
      {
        title: '任务名称',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        fixed: 'left',
        ellipsis: false,
        render: (text) => {
          return (<div className={styles.taskName}>{text}</div>);
        },
      },
      {
        title: '进度',
        dataIndex: '___progress',
        key: '___progress',
        width: 200,
        render: (text, record) => {
          if (record.type === _.get(CONST_DICT, 'download_tasks.type.TYPE_IMPORT')) {
            return `已导入${record.current_count}条`;
          }
          return `已导出${record.current_count}条，共${record.task_count}条`;
        },
      },
      {
        title: '任务类型',
        dataIndex: 'type',
        key: 'type',
        width: 90,
        render: (text) => {
          return Filters.dict(['download_tasks', 'type'], text);
        },
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 120,
      },
      {
        title: '过期时间',
        dataIndex: 'expired_at',
        key: 'expired_at',
        width: 120,
        render: (text) => {
          return Filters.datetime(text, { format: 'YYYY-MM-DD HH:mm' });
        },
      },
      {
        title: '结果',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (text, record) => {
          if (record.type === _.get(CONST_DICT, 'download_tasks.type.TYPE_DOWNLOAD')) {
            return exportResult[text] || '';
          }
          return importResult[text] || '';
        },
      },
      {
        title: '说明',
        dataIndex: 'messages',
        key: 'messages',
        width: 150,
        render: (text) => {
          return text || '-';
        },
      },
      {
        title: '操作',
        dataIndex: 'operation',
        fixed: 'right',
        key: 'operation',
        width: 150,
        render: (text, record) => {
          const subfix = _.get(record.download_url.match(/(\.[^.]+$)/), 1, '');
          const name = `${record.name}${subfix}`;
          return record.download_url ? (
            <a target="_blank" download href={`${record.download_url}?rename=${encodeURIComponent(name)}`}>
              {_.includes([_.get(CONST_DICT, 'download_tasks.status.STATUS_FAIL'), _.get(CONST_DICT, 'download_tasks.status.STATUS_WARNING')], record.status) ? '下载数据错误报告' : '下载' }
            </a>)
            : (<a disabled className="disabled">{record.type === _.get(CONST_DICT, 'download_tasks.type.TYPE_IMPORT') ? '-' : '下载'}</a>);
        },
      },
    ];

    return columns;
  }
}
