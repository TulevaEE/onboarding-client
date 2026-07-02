import { FC, ReactNode, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { Loader } from '../../../common';
import { usePageTitle } from '../../../common/usePageTitle';
import { useSavingsFundPersonOnboardingStatus } from '../../../common/apiHooks';
import { OnboardingFlowOption, getOnboardingFlowOptions } from './onboardingFlows';
import { TranslationKey } from '../../../translations';
import checkImage from '../../common/SuccessNotice/success.svg';
import '../../secondPillar/selectSources/targetFundSelector/TargetFundSelector.scss';

// Phosphor Icons, bold weight (MIT): user, briefcase, balloon
const optionIcons: Record<OnboardingFlowOption['key'], ReactNode> = {
  person: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
    </svg>
  ),
  company: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M100,100a12,12,0,0,1,12-12h32a12,12,0,0,1,0,24H112A12,12,0,0,1,100,100ZM236,68V196a20,20,0,0,1-20,20H40a20,20,0,0,1-20-20V68A20,20,0,0,1,40,48H76V40a28,28,0,0,1,28-28h48a28,28,0,0,1,28,28v8h36A20,20,0,0,1,236,68ZM100,48h56V40a4,4,0,0,0-4-4H104a4,4,0,0,0-4,4ZM44,72v35.23A180.06,180.06,0,0,0,128,128a180,180,0,0,0,84-20.78V72ZM212,192V133.94A204.27,204.27,0,0,1,128,152a204.21,204.21,0,0,1-84-18.06V192Z" />
    </svg>
  ),
  child: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M128,12a92.1,92.1,0,0,0-92,92c0,24.53,9.55,50.13,26.19,70.22,10,12,21.56,21.07,34.05,26.76L85,227.27A12,12,0,0,0,96,244h64a12,12,0,0,0,11-16.73L159.76,201c12.49-5.69,24.08-14.73,34.05-26.76C210.45,154.13,220,128.53,220,104A92.1,92.1,0,0,0,128,12Zm13.8,208H114.2l5.35-12.49a73.1,73.1,0,0,0,16.9,0Zm33.53-61.09C161.93,175.09,145.12,184,128,184s-33.93-8.91-47.33-25.09C67.73,143.29,60,122.76,60,104a68,68,0,0,1,136,0C196,122.76,188.27,143.29,175.33,158.91Zm-6.34-47q-.6.06-1.2.06a12,12,0,0,1-11.93-10.81,28,28,0,0,0-19.47-23.91,12,12,0,1,1,7.22-22.89,51.94,51.94,0,0,1,36.13,44.42A12,12,0,0,1,169,111.94Z" />
    </svg>
  ),
};

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
      {optionIcons[option.key]}
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
  // not jump after the cards have rendered.
  const [selectedKey, setSelectedKey] = useState<OnboardingFlowOption['key'] | null>(null);
  useEffect(() => {
    if (onboardingStatus && selectedKey === null) {
      setSelectedKey(personOnboardingCompleted ? 'company' : 'person');
    }
  }, [onboardingStatus, personOnboardingCompleted, selectedKey]);

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
              onClick={() => setSelectedKey(option.key)}
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
