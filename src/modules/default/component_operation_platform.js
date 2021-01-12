import _ from 'lodash';
import CommonComponent from './component';

export default class Component extends CommonComponent {
  constructor(props) {
    super(props);
    _.assign(this.state, {
      shouldGetSupportDocumentUrl: false,
      checkTicketLogin: false,
    });
  }

  getAdminType = () => {
    return [
      _.get(CONST_DICT, 'operations_admins.user_type.USER_TYPE_SUPER'),
    ];
  }
}
