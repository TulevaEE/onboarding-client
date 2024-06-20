import React from 'react';
import styles from './Shimmer.module.scss';

export const Shimmer: React.FunctionComponent<{ height?: number; className?: string }> = ({
  height = 16,
  className,
}) => <div className={className || styles.shimmerDefault} style={{ height: `${height}px` }} />;
