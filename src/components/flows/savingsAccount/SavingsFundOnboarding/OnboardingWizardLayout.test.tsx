import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapped } from '../../../../test/utils';
import { OnboardingWizardLayout } from './OnboardingWizardLayout';

const defaultProps = {
  currentStep: 3,
  totalSteps: 8,
  onBack: jest.fn(),
  onNext: jest.fn(),
};

const renderLayout = (props = {}) =>
  renderWrapped(
    <OnboardingWizardLayout {...defaultProps} {...props}>
      <div>Step content</div>
    </OnboardingWizardLayout>,
  );

describe('OnboardingWizardLayout', () => {
  it('renders progress bar with correct width percentage', () => {
    renderLayout();

    const progressBar = screen.getByRole('progressbar', { hidden: true });
    // eslint-disable-next-line testing-library/no-node-access
    const bar = progressBar.querySelector('.progress-bar');
    expect(bar).toHaveStyle({ width: '37.5%' });
  });

  it('renders step counter text', () => {
    renderLayout();

    expect(screen.getByText('3/8')).toBeInTheDocument();
  });

  it('renders flow title', () => {
    renderLayout();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Opening an additional savings fund')).toBeInTheDocument();
  });

  it('calls onBack when Back button is clicked', () => {
    const onBack = jest.fn();
    renderLayout({ onBack });

    userEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when Continue button is clicked', () => {
    const onNext = jest.fn();
    renderLayout({ onNext });

    userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('renders loader instead of children when loading', () => {
    renderLayout({ loading: true });

    expect(screen.getByRole('progressbar', { name: /loading/i })).toBeInTheDocument();
    expect(screen.queryByText('Step content')).not.toBeInTheDocument();
  });

  it('does not render navigation buttons when loading', () => {
    renderLayout({ loading: true });

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  it('disables continue button when submitting', () => {
    renderLayout({ submitting: true });

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('renders spinner in continue button when submitting', () => {
    renderLayout({ submitting: true });

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });
});
