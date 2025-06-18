import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

class LoginTab extends Component {
  static propTypes = {
    activeTab: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    hideOnMobile: PropTypes.string.isRequired,
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

    let className = 'nav-link';

    if (activeTab === label) {
      className += ' active';
    }

    if (hideOnMobile === 'true') {
      className += ' d-none d-md-block';
    }

    return (
      <li className="nav-item" role="presentation">
        <button type="button" role="tab" className={className} onClick={onClick}>
          <FormattedMessage id={label} />
        </button>
      </li>
    );
  }
}

export default LoginTab;
