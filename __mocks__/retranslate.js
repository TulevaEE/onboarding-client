/* eslint-disable */

import React from 'react';

module.exports = {
  Message: ({ children, dangerouslyTranslateInnerHTML, params = {} }) => (
    <>
      {children || dangerouslyTranslateInnerHTML}
      {Object.keys(params).map((key) => params[key])}
    </>
  ),
  WithTranslations: ({ children }) => children({ translate: (key) => key }),
  withTranslations: (Component) => () => <Component />,
  useTranslations: () => ({ translate: (key) => key }),
  Provider: ({ children }) => children,
};
