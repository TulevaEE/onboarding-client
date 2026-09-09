import React from 'react';
import styles from './Notice.module.scss';

export const Notice: React.FunctionComponent<{ children?: React.ReactNode }> = ({
  children = '',
}) => <div className={`alert text-center py-4 ${styles.container}`}>{children}</div>;
