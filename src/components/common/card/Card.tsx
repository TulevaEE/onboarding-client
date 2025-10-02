import { FC, ReactNode } from 'react';

import classNames from 'classnames';
import styles from './Card.module.scss';

type CardProps = {
  title: ReactNode;
  description?: ReactNode;
  timestamp?: ReactNode;
  actions?: ReactNode;
};

export const Card: FC<CardProps> = ({ title, description, timestamp, actions, children }) => (
  <div className={styles.card}>
    <div className={classNames(styles.header, 'd-flex', { [styles.headerBorder]: children })}>
      <div className="d-flex">
        <div className="me-3">
          <strong>{title}</strong>
          {description ? (
            <>
              <br />
              <span className="text-muted">{description}</span>
            </>
          ) : null}
        </div>

        {timestamp ?? null}
      </div>

      {actions ? <div className="d-none d-md-block ms-2">{actions}</div> : null}
    </div>

    {children ? <div className={styles.content}>{children}</div> : null}
    {actions ? <div className={`${styles.footer} d-md-none`}>{actions}</div> : null}
  </div>
);
