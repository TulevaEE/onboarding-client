import React from 'react';

import { logo } from '../../common';

const Header = () => (
  <div>
    <img src={logo} alt="Tuleva" className="img-responsive brand-logo" />
    <hr />
  </div>
);

export default Header;
