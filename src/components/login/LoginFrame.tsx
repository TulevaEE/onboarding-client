import React, { FC } from 'react';
import classNames from 'classnames';

import { TulevaLogo } from '../common/tulevaLogo/TulevaLogo';
import styles from './LoginPage.module.scss';

export const LoginFrame: FC = ({ children }) => (
  <div className={styles.loginPage}>
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-7">
          <TulevaLogo width="146" height="66" className="d-block mx-auto mb-5" />
          {children}
        </div>
      </div>
    </div>
  </div>
);

export const LoginCard: FC<{ className?: string; padding?: string }> = ({
  className,
  padding = 'p-4 p-sm-5',
  children,
}) => (
  <div className={classNames('bg-white shadow-sm rounded-3', padding, className)}>{children}</div>
);
