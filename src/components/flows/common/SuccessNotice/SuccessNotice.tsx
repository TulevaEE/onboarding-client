import React from 'react';
import styles from './SuccessNotice.module.scss';
import successImage from './success.svg';

// deprecated
export const SuccessNotice: React.FunctionComponent<{ children?: React.ReactNode }> = ({
  children = '',
}) => (
  <div className="alert alert-success alert-success-notice text-center py-5" role="alert">
    <div className={styles.container}>
      <img src={successImage} alt="" className={styles.check} />
    </div>
    {children}
  </div>
);
