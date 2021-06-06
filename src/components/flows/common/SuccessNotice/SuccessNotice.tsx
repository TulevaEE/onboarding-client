import React from 'react';
import styles from './SuccessNotice.module.scss';
import successImage from './success.svg';

export const SuccessNotice: React.FunctionComponent<{ children?: React.ReactNode }> = ({
  children = '',
}) => (
  <div className="alert alert-success text-center pt-5 pb-5">
    <div className={styles.container}>
      <img src={successImage} alt="Success" className={styles.check} />
    </div>
    {children}
  </div>
);
