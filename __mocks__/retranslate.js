/* eslint-disable */

import React, { Fragment } from 'react';

const retranslate = jest.genMockFromModule('retranslate');

retranslate.Message = ({ children }) => <Fragment>{children}</Fragment>;
retranslate.WithTranslations = ({ children }) => children({ translate: key => key });
retranslate.withTranslations = component => () => <component />;

module.exports = retranslate;
