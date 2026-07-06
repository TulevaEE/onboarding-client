import { screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { ChildConfirmStep } from './ChildConfirmStep';
import translations from '../../../../translations';

const renderStep = () =>
  renderWrapped(
    <IntlProvider locale="en" messages={translations.en}>
      <ChildConfirmStep
        child={{ firstName: 'Mammu', lastName: 'Maasikas', dateOfBirth: '2015-09-07' }}
      />
    </IntlProvider>,
  );

describe('ChildConfirmStep', () => {
  test('presents the child details heading', () => {
    renderStep();

    expect(
      screen.getByRole('heading', { level: 2, name: /child.?s details/i }),
    ).toBeInTheDocument();
  });

  test('shows the population-register name and formatted date of birth', () => {
    renderStep();

    expect(screen.getByText(/Mammu Maasikas/)).toBeInTheDocument();
    expect(screen.getByText(/07\.09\.2015/)).toBeInTheDocument();
  });
});
