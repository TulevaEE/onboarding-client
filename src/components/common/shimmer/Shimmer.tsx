import React from 'react';
import styles from './Shimmer.module.scss';

export const Shimmer: React.FunctionComponent<{ height: number }> = ({ height }) => {
  return <div className={styles.shimmer} style={{ height: `${height}px` }} />;
};
