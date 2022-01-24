import React from 'react';
import classNames from 'classnames';
import styles from './DefinitionList.module.scss';

export const DefinitionList: React.FunctionComponent<{
  definitions: (Definition | Definition[] | Definition[][])[];
}> = ({ definitions }) => (
  <dl className={styles.definitions}>
    {definitions.map((definition, index) => (
      <div key={index} className={styles.group}>
        {Array.isArray(definition) ? (
          (definition as (Definition | Definition[])[]).map((innerDefinition, innerIndex) => (
            <div className={styles.innerGroup} key={innerIndex}>
              {Array.isArray(innerDefinition) ? (
                innerDefinition.map(({ key, value, alignRight }, thirdLevelIndex) => (
                  <div
                    key={thirdLevelIndex}
                    className={classNames(alignRight && styles.rightGroup)}
                  >
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))
              ) : (
                <>
                  <dt>{innerDefinition.key}</dt>
                  <dd>{innerDefinition.value}</dd>
                </>
              )}
            </div>
          ))
        ) : (
          <>
            <dt>{definition.key}</dt>
            <dd>{definition.value}</dd>
          </>
        )}
      </div>
    ))}
  </dl>
);

/* eslint-enable react/no-array-index-key */

export interface Definition {
  key: React.ReactNode;
  value: React.ReactNode;
  alignRight?: boolean;
}
