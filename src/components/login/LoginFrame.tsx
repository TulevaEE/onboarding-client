import React, { FC } from 'react';

import { logo } from '../common';
import styles from './LoginPage.module.scss';

export const LoginFrame: FC = ({ children }) => (
  <div className={styles.loginPage}>
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-7">
          <img width="146" height="66" src={logo} alt="Tuleva" className="d-block mx-auto mb-5" />
          {children}
        </div>
      </div>
    </div>
  </div>
);
