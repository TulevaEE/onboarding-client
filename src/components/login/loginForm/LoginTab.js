import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

export const LOGIN_TAB_PANEL_ID = 'login-tab-panel';

export const loginTabId = (label) => `${label.replace(/\./g, '-')}-tab`;

class LoginTab extends Component {
  static propTypes = {
    activeTab: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    hideOnMobile: PropTypes.bool,
    buttonRef: PropTypes.func,
  };

  static defaultProps = {
    hideOnMobile: false,
    buttonRef: undefined,
  };

  onClick = () => {
    const { label, onClick } = this.props;
    onClick(label);
  };

  render() {
    const {
      onClick,
      props: { activeTab, label, hideOnMobile, buttonRef },
    } = this;
    const selected = activeTab === label;

    return (
      <li role="presentation" className={`nav-item ${hideOnMobile ? 'd-none d-md-block' : ''}`}>
        <button
          type="button"
          role="tab"
          id={loginTabId(label)}
          aria-selected={selected}
          aria-controls={LOGIN_TAB_PANEL_ID}
          tabIndex={selected ? 0 : -1}
          ref={buttonRef}
          className={`nav-link ${selected ? 'active' : ''}`}
          onClick={onClick}
        >
          <FormattedMessage id={label} />
        </button>
      </li>
    );
  }
}

export default LoginTab;
