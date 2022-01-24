import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import styles from './DefinitionList.module.scss';

export interface Definition {
  key: string;
  value: React.ReactNode;
  alignRight?: boolean;
}

export const DefinitionList: React.FunctionComponent<{
  definitions: (Definition | Definition[] | Definition[][])[];
}> = ({ definitions }) => (
  <dl className={styles.definitions}>
    {definitions.map((definition, index) => (
      <div key={index} className={styles.group}>
        {Array.isArray(definition)
          ? renderDefinitions(definition)
          : renderSingleDefinition(definition)}
      </div>
    ))}
  </dl>
);

const renderDefinitions = (definition: Definition[] | Definition[][]) =>
  definition.map((innerDefinition, index) => (
    <div className={styles.innerGroup} key={index}>
      {Array.isArray(innerDefinition)
        ? renderSecondLevelDefinitions(innerDefinition)
        : renderSingleDefinition(innerDefinition)}
    </div>
  ));

const renderSecondLevelDefinitions = (definition: Definition[]) =>
  definition.map((innerDefinition: Definition, index) => (
    <div key={index} className={classNames(innerDefinition.alignRight && styles.rightGroup)}>
      {renderSingleDefinition(innerDefinition)}
    </div>
  ));

const renderSingleDefinition = (definition: Definition) => (
  <>
    <dt>
      <FormattedMessage id={definition.key} />
    </dt>
    <dd>{definition.value}</dd>
  </>
);
