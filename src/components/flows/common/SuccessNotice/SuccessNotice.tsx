import React from 'react';
import styles from './SuccessNotice.module.scss';
import successImage from './success.svg';

// deprecated
export const SuccessNotice: React.FunctionComponent<{ children?: React.ReactNode }> = ({
  children = '',
}) => (
  <div className="alert alert-success text-center py-4">
    <div className={styles.container}>
      <img src={successImage} alt="Success" className={styles.check} />
    </div>
    {children}
  </div>
);
