import React from 'react';
import styles from './Notice.module.scss';

export const Notice: React.FunctionComponent<{ children?: React.ReactNode }> = ({
  children = '',
}) => (
  <div className={`alert  alert-success text-center pt-5 pb-5 ${styles.container}`}>{children}</div>
);
