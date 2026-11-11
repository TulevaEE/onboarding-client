import React, { cloneElement, ReactElement, ReactNode, useState } from 'react';
import { uniqueId } from 'lodash';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import styles from './SecondPillarFunds.module.scss';

export const TipTrigger = ({ tip, children }: { tip: ReactNode; children: ReactElement }) => {
  const [id] = useState(() => uniqueId('fund-tip-'));
  return (
    <OverlayTrigger
      placement="top"
      trigger={['hover', 'focus']}
      overlay={
        <Tooltip id={id} className={styles.tooltip}>
          {tip}
        </Tooltip>
      }
    >
      {cloneElement(children, { 'aria-describedby': id })}
    </OverlayTrigger>
  );
};

export const WithTip = ({
  tip,
  className,
  children,
}: {
  tip: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <TipTrigger tip={tip}>
    <button type="button" className={`${styles.hasTip} ${className ?? ''}`}>
      {children}
    </button>
  </TipTrigger>
);
