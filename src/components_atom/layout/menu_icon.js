import React from 'react';
import Svg from '../../components_atom/svg';
import styles from './menu.less';

const systemMenuIconDirMap = {
  preschool: 'snom',
};
function getMenuIconDirPrefix() {
  return _.get(systemMenuIconDirMap, DEFINE_MODULE, DEFINE_MODULE);
}

const MenuIcon = ({ iconName, type }) => {
  const iconType = type || 'svg';
  let imgs = '';
  try {
    if (['help_center', 'code_url_bi_icon'].includes(iconName)) {
      imgs = require(`../../assets/menu_icon/common/${iconName}.${iconType}`); // eslint-disable-line import/no-dynamic-require
    }
    else {
      const dir = getMenuIconDirPrefix();
      imgs = require(`../../assets/menu_icon/${dir}/${iconName}.${iconType}`); // eslint-disable-line import/no-dynamic-require
    }

    return (<span style={{ marginRight: 12 }}>
      {'svg' === iconType
        ? <Svg link={imgs} className={`${styles.menuIconImg} menuIconImg`} />
        : <img alt="" className={`${styles.menuIconImg} menuIconImg`} src={imgs} />
      }
    </span>);
  }
  catch (error) {
    return null;
  }
};

export default MenuIcon;
