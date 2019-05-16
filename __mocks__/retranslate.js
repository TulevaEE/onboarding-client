/* eslint-disable */

import React, { Fragment } from 'react';

module.exports = {
  Message: ({ children, dangerouslyTranslateInnerHTML, params = {} }) => (
    <Fragment>
      {children || dangerouslyTranslateInnerHTML}
      {Object.keys(params).map(key => (
        <Fragment key={key}>{params[key]}</Fragment>
      ))}
    </Fragment>
  ),
  WithTranslations: ({ children }) => children({ translate: key => key }),
  withTranslations: component => () => <component />,
  Provider: ({ children }) => children,
};
