import { FC, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { Loader } from '../../../common';
import { usePageTitle } from '../../../common/usePageTitle';
import { useSavingsFundPersonOnboardingStatus } from '../../../common/apiHooks';
import {
  OnboardingFlowOption,
  getOnboardingFlowOptions,
  getRememberedOnboardingFlowSelection,
  rememberOnboardingFlowSelection,
} from './onboardingFlows';
import { TranslationKey } from '../../../translations';
import checkImage from '../../common/SuccessNotice/success.svg';
import { AccountIcon } from '../../../common/AccountIcon';
import '../../secondPillar/selectSources/targetFundSelector/TargetFundSelector.scss';

const OptionCardContent: FC<{ option: OnboardingFlowOption; badgeId?: TranslationKey }> = ({
  option,
  badgeId,
}) => (
  <div className="d-flex align-items-center gap-3">
    <span
      className={`d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 bg-secondary-subtle ${
        option.enabled ? 'text-body' : 'text-body-secondary'
      }`}
      style={{ width: '2.5rem', height: '2.5rem' }}
    >
      <AccountIcon kind={option.key} size={20} />
    </span>
    <span className="d-flex flex-column">
      <span className={`fs-5 fw-bold ${option.enabled ? 'text-body' : 'text-body-secondary'}`}>
        <FormattedMessage id={`flows.savingsFundOnboarding.chooser.${option.key}`} />
      </span>
      <span className="text-body-secondary">
        <FormattedMessage id={`flows.savingsFundOnboarding.chooser.${option.key}.subtitle`} />
      </span>
    </span>
    {badgeId && (
      <span
        className={`ms-auto badge rounded-pill fw-medium ${
          badgeId === 'flows.savingsFundOnboarding.chooser.opened'
            ? 'text-bg-success'
            : 'text-bg-secondary'
        }`}
      >
        <FormattedMessage id={badgeId} />
      </span>
    )}
  </div>
);

export const SavingsFundOnboardingChooser: FC = () => {
  usePageTitle('pageTitle.savingsFundOnboarding');

  const history = useHistory();
  const { data: onboardingStatus } = useSavingsFundPersonOnboardingStatus();
  const personOnboardingCompleted = onboardingStatus?.status === 'COMPLETED';
  const options = getOnboardingFlowOptions();

  // Resolved once when the status arrives, then frozen — the preselection must
  // not jump after the cards have rendered. A selection remembered from an
  // earlier visit wins, unless it points at the already-completed personal flow,
  // where Continue would be a dead end.
  const [selectedKey, setSelectedKey] = useState<OnboardingFlowOption['key'] | null>(null);
  useEffect(() => {
    if (onboardingStatus && selectedKey === null) {
      const remembered = getRememberedOnboardingFlowSelection();
      if (remembered && !(remembered === 'person' && personOnboardingCompleted)) {
        setSelectedKey(remembered);
      } else {
        setSelectedKey(personOnboardingCompleted ? 'company' : 'person');
      }
    }
  }, [onboardingStatus, personOnboardingCompleted, selectedKey]);

  const selectFlow = (key: OnboardingFlowOption['key']): void => {
    setSelectedKey(key);
    rememberOnboardingFlowSelection(key);
  };

  const selectedOption = options.find((option) => option.key === selectedKey && option.enabled);
  // Mirrors the 2nd-pillar payment-rate UX: the already-opened option stays
  // selectable (the pill explains why), but Continue offers nothing for it.
  const continueDisabled =
    !selectedOption || (selectedOption.key === 'person' && personOnboardingCompleted);

  if (!onboardingStatus) {
    return (
      <div className="col-12 col-md-10 col-lg-7 mx-auto">
        <Loader className="align-middle" />
      </div>
    );
  }

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-4">
      <div className="d-flex flex-column gap-2">
        <h1 className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.chooser.title" />
        </h1>
        <p className="m-0">
          <FormattedMessage id="flows.savingsFundOnboarding.chooser.lede" />
        </p>
      </div>
      <div className="d-flex flex-column gap-3">
        {options.map((option) =>
          option.enabled ? (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.key === selectedKey}
              onClick={() => selectFlow(option.key)}
              className={`tv-target-fund d-block w-100 p-4 text-start ${
                option.key === selectedKey ? 'tv-target-fund--active' : ''
              }`}
            >
              {option.key === selectedKey && (
                <div className="tv-target-fund__corner-check">
                  <span>
                    <img src={checkImage} alt="" />
                  </span>
                </div>
              )}
              <div className="tv-target-fund__inner-container">
                <OptionCardContent
                  option={option}
                  badgeId={
                    option.key === 'person' && personOnboardingCompleted
                      ? 'flows.savingsFundOnboarding.chooser.opened'
                      : undefined
                  }
                />
              </div>
            </button>
          ) : (
            <div key={option.key} className="card bg-body-tertiary p-4">
              <OptionCardContent
                option={option}
                badgeId="flows.savingsFundOnboarding.chooser.comingSoon"
              />
            </div>
          ),
        )}
      </div>
      <p className="m-0 text-body-secondary">
        <FormattedMessage id="flows.savingsFundOnboarding.chooser.disclaimer" />
      </p>
      <div className="d-flex flex-row-reverse">
        <button
          type="button"
          className="btn btn-lg btn-primary"
          disabled={continueDisabled}
          onClick={() => selectedOption && history.push(selectedOption.route)}
        >
          <FormattedMessage id="savingsFundOnboarding.continue" />
        </button>
      </div>
    </div>
  );
};
