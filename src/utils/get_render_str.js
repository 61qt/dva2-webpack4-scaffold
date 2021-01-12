import _ from 'lodash';
import jQuery from 'jquery';

const attrKey = 'data-back-render-content';
function getRenderStr({
  container,
}) {
  const clonedDom = jQuery(container).clone();

  jQuery(`[${attrKey}]`, clonedDom).each((index, elem) => {
    jQuery(elem).text(jQuery(elem).attr('data-back-render-content'));
  });

  return _.get(clonedDom, '[0].outerHTML') || '';
}

// // example
// const str = `<div className="ant-hide">
//   <div id="renderStrExample">
//     <span ${attrKey}="\${name}">名称渲染</span>
//     <span data-back-render-content="\${name}">名称渲染</span>
//     use example: getRenderStr({ container: jQuery('#renderStrExample') });
//   </div>
// </div>
// `;
// jQuery('body').append(jQuery(str));
// getRenderStr({ container: jQuery('#renderStrExample') });

export default getRenderStr;
