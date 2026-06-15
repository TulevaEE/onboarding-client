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

// Phosphor Icons, bold weight (MIT): globe-hemisphere-west, chart-line-up, percent, money
const featureIcons: Record<string, ReactNode> = {
  globe: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm84,108a83.64,83.64,0,0,1-4.47,27L167,130a19.65,19.65,0,0,0-7.8-2.78l-22.82-3.08A20.14,20.14,0,0,0,117.72,132h-4.07l-2.71-5.6a19.88,19.88,0,0,0-13.8-10.84L94.46,115l4-7h14.39a20,20,0,0,0,9.66-2.49l12.25-6.76a20.57,20.57,0,0,0,3.74-2.68l26.92-24.33A20,20,0,0,0,172,56.49,84,84,0,0,1,212,128ZM140.76,45l6.2,11.1L122.75,78l-10.93,6H96.14A20.05,20.05,0,0,0,78.78,94.06l-4.49,7.85L67.68,84.28l9.91-23.42A83.91,83.91,0,0,1,140.76,45ZM44,128a83.52,83.52,0,0,1,4.4-26.77l7.74,20.65a19.89,19.89,0,0,0,14.52,12.53l19.53,4.2,3,6.1a20.11,20.11,0,0,0,13.55,10.77l-5,11.12a20,20,0,0,0,3.58,21.71l.21.22,18.16,18.7-.89,4.59A84.09,84.09,0,0,1,44,128Zm103.65,81.66a20.11,20.11,0,0,0-5-17.3l-.21-.22-17.72-18.25,11.37-25.52,19,2.56,41.43,25.48A84.2,84.2,0,0,1,147.65,209.66Z" />
    </svg>
  ),
  chart: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M236,208a12,12,0,0,1-12,12H32a12,12,0,0,1-12-12V48a12,12,0,0,1,24,0v99l43.51-43.52a12,12,0,0,1,17,0L128,127l43-43H160a12,12,0,0,1,0-24h40a12,12,0,0,1,12,12v40a12,12,0,0,1-24,0V101l-51.51,51.52a12,12,0,0,1-17,0L96,129,44,181v15H224A12,12,0,0,1,236,208Z" />
    </svg>
  ),
  percent: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M208.49,64.47l-144,144a12,12,0,1,1-17-17l144-144a12,12,0,0,1,17,17ZM47.72,104.27A40,40,0,1,1,76,116,39.72,39.72,0,0,1,47.72,104.27ZM60,76a16,16,0,1,0,4.69-11.31A15.87,15.87,0,0,0,60,76ZM220,180a40,40,0,1,1-11.72-28.29A39.71,39.71,0,0,1,220,180Zm-24,0a15.87,15.87,0,0,0-4.69-11.32h0A16,16,0,1,0,196,180Z" />
    </svg>
  ),
  money: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path d="M240,52H16A12,12,0,0,0,4,64V192a12,12,0,0,0,12,12H240a12,12,0,0,0,12-12V64A12,12,0,0,0,240,52ZM181.21,180H74.79A60.18,60.18,0,0,0,28,133.21V122.79A60.18,60.18,0,0,0,74.79,76H181.21A60.18,60.18,0,0,0,228,122.79v10.42A60.18,60.18,0,0,0,181.21,180ZM228,97.94A36.23,36.23,0,0,1,206.06,76H228ZM49.94,76A36.23,36.23,0,0,1,28,97.94V76ZM28,158.06A36.23,36.23,0,0,1,49.94,180H28ZM206.06,180A36.23,36.23,0,0,1,228,158.06V180ZM128,88a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,56a16,16,0,1,1,16-16A16,16,0,0,1,128,144Z" />
    </svg>
  ),
};

const usersIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 256 256"
    aria-hidden="true"
  >
    <path d="M125.18,156.94a64,64,0,1,0-82.36,0,100.23,100.23,0,0,0-39.49,32,12,12,0,0,0,19.35,14.2,76,76,0,0,1,122.64,0,12,12,0,0,0,19.36-14.2A100.33,100.33,0,0,0,125.18,156.94ZM44,108a40,40,0,1,1,40,40A40,40,0,0,1,44,108Zm206.1,97.67a12,12,0,0,1-16.78-2.57A76.31,76.31,0,0,0,172,172a12,12,0,0,1,0-24,40,40,0,1,0-10.3-78.67,12,12,0,1,1-6.16-23.19,64,64,0,0,1,57.64,110.8,100.23,100.23,0,0,1,39.49,32A12,12,0,0,1,250.1,205.67Z" />
  </svg>
);

// Condensed from the terms step's "Fund in brief" summary — short enough for
// one line on desktop, two on mobile.
featureIcons.users = usersIcon;

const optionFeatures = {
  person: [
    { icon: 'globe', messageId: 'flows.savingsFundOnboarding.chooser.person.feature1' },
    { icon: 'percent', messageId: 'flows.savingsFundOnboarding.chooser.person.feature2' },
    { icon: 'money', messageId: 'flows.savingsFundOnboarding.chooser.person.feature3' },
  ],
  company: [
    { icon: 'chart', messageId: 'flows.savingsFundOnboarding.chooser.company.feature1' },
    { icon: 'percent', messageId: 'flows.savingsFundOnboarding.chooser.company.feature2' },
    { icon: 'users', messageId: 'flows.savingsFundOnboarding.chooser.company.feature3' },
  ],
  child: [],
} as const;

const OptionCardContent: FC<{ option: OnboardingFlowOption; badgeId?: TranslationKey }> = ({
  option,
  badgeId,
}) => {
  const features = optionFeatures[option.key];

  return (
    <>
      <div className="d-flex align-items-center gap-3">
        <span
          className={`d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${
            option.enabled
              ? 'bg-primary-subtle text-navy'
              : 'bg-secondary-subtle text-body-secondary'
          }`}
          style={{ width: '2.5rem', height: '2.5rem' }}
        >
          {optionIcons[option.key]}
        </span>
        <span className="d-flex flex-column">
          <span className={`fs-5 fw-bold ${option.enabled ? 'text-navy' : 'text-body-secondary'}`}>
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
      {features.length > 0 && (
        <>
          <hr className="my-3" />
          <ul className="list-unstyled m-0 d-flex flex-column gap-3">
            {features.map((feature) => (
              <li key={feature.messageId} className="d-flex align-items-center gap-3 text-body">
                <span
                  className="text-navy d-inline-flex justify-content-center flex-shrink-0"
                  style={{ width: '2.5rem' }}
                >
                  {featureIcons[feature.icon]}
                </span>
                <FormattedMessage id={feature.messageId} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
};

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
