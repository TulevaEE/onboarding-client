import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

class LoginTab extends Component {
  static propTypes = {
    activeTab: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    hideOnMobile: PropTypes.bool,
  };

  onClick = () => {
    const { label, onClick } = this.props;
    onClick(label);
  };

  render() {
    const {
      onClick,
      props: { activeTab, label, hideOnMobile },
    } = this;

    return (
      <li role="presentation" className={`nav-item ${hideOnMobile ? 'd-none d-md-block' : ''}`}>
        <button
          type="button"
          role="tab"
          className={`nav-link ${activeTab === label ? 'active' : ''}`}
          onClick={onClick}
        >
          <FormattedMessage id={label} />
        </button>
      </li>
    );
  }
}

export default LoginTab;
