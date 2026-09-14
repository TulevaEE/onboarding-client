import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  HackathonChallenge,
  HackathonSkill,
  HackathonTshirtColor,
  HackathonTshirtSize,
} from '../common/apiModels/hackathon';
import Checkbox from '../common/checkbox/Checkbox';
import Radio from '../common/radio/Radio';
import { TranslationKey } from '../translations';
import './hackathon.scss';
import tshirtWhite from './tshirts/tshirt-white.png';
import tshirtGray from './tshirts/tshirt-gray.png';
import tshirtNavy from './tshirts/tshirt-navy.png';

export const SKILLS: { value: HackathonSkill; labelId: TranslationKey }[] = [
  { value: 'SOFTWARE_DEVELOPMENT', labelId: 'hackathon.skill.softwareDevelopment' },
  { value: 'DESIGN', labelId: 'hackathon.skill.design' },
  { value: 'DATA_AND_AI', labelId: 'hackathon.skill.dataAndAi' },
  { value: 'LAW_AND_REGULATION', labelId: 'hackathon.skill.lawAndRegulation' },
  { value: 'BUSINESS_AND_PRODUCT', labelId: 'hackathon.skill.businessAndProduct' },
  { value: 'MARKETING_AND_COMMUNICATION', labelId: 'hackathon.skill.marketingAndCommunication' },
  { value: 'FINANCE_AND_INSURANCE', labelId: 'hackathon.skill.financeAndInsurance' },
];

export const CHALLENGES: { value: HackathonChallenge; labelId: TranslationKey }[] = [
  { value: 'FAIR_LENDING', labelId: 'hackathon.challenge.fairLending' },
  { value: 'INSURANCE', labelId: 'hackathon.challenge.insurance' },
  { value: 'COLLECTIVE_BUYING_POWER', labelId: 'hackathon.challenge.collectiveBuyingPower' },
  { value: 'WEALTH_AND_INHERITANCE', labelId: 'hackathon.challenge.wealthAndInheritance' },
];

const TSHIRT_COLORS: {
  value: HackathonTshirtColor;
  labelId: TranslationKey;
  image: string | null;
}[] = [
  { value: 'WHITE', labelId: 'hackathon.tshirt.white', image: tshirtWhite },
  { value: 'GRAY', labelId: 'hackathon.tshirt.gray', image: tshirtGray },
  { value: 'NAVY', labelId: 'hackathon.tshirt.navy', image: tshirtNavy },
  { value: 'NONE', labelId: 'hackathon.tshirt.none', image: null },
];

const TSHIRT_IMAGE_SIZE = 64;

const TSHIRT_SIZES: HackathonTshirtSize[] = ['XS', 'S', 'M', 'L', 'XL'];

export const toggle = <T,>(values: T[], value: T, checked: boolean): T[] =>
  checked ? [...values, value] : values.filter((item) => item !== value);

export const trimmedOrNull = (value: string): string | null => value.trim() || null;

export const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p className="m-0 text-danger fs-base" role="alert" id={id}>
      {message}
    </p>
  ) : null;

export const HackathonHeading = ({ titleId }: { titleId: TranslationKey }) => (
  <>
    <h1 className="m-0">
      <FormattedMessage id={titleId} />
    </h1>
    <p className="mt-2 mb-0 text-body-secondary">
      <FormattedMessage id="hackathon.subtitle" />
    </p>
  </>
);

export const HackathonMembersOnly = ({ titleId }: { titleId: TranslationKey }) => (
  <div className="col-12 col-md-11 col-lg-8 mx-auto py-4">
    <HackathonHeading titleId={titleId} />
    <div className="card p-4 mt-4">
      <h2 className="mt-0 mb-2 fs-3">
        <FormattedMessage id="hackathon.membersOnly.title" />
      </h2>
      <p className="m-0">
        <FormattedMessage id="hackathon.membersOnly.description" />
      </p>
      <div className="mt-4">
        <a className="btn btn-primary" href="https://tuleva.ee/tulundusyhistu/">
          <FormattedMessage id="hackathon.membersOnly.action" />
        </a>
      </div>
    </div>
  </div>
);

export const SkillCheckboxes = ({
  idPrefix,
  labelledBy,
  value,
  onChange,
}: {
  idPrefix: string;
  labelledBy: string;
  value: HackathonSkill[];
  onChange: (skills: HackathonSkill[]) => void;
}) => (
  <div className="d-flex flex-column gap-2" role="group" aria-labelledby={labelledBy}>
    {SKILLS.map(({ value: skill, labelId }) => (
      <Checkbox
        key={skill}
        id={`${idPrefix}-${skill}`}
        checked={value.includes(skill)}
        onToggle={(checked) => onChange(toggle(value, skill, checked))}
      >
        <span className="fs-3 lh-sm">
          <FormattedMessage id={labelId} />
        </span>
      </Checkbox>
    ))}
  </div>
);

export const OtherSkillsField = ({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: string;
  onChange: (otherSkills: string) => void;
}) => {
  const intl = useIntl();
  const [checked, setChecked] = useState(value !== '');

  useEffect(() => {
    if (value !== '') {
      setChecked(true);
    }
  }, [value]);

  return (
    <>
      <Checkbox
        id={`${idPrefix}-OTHER`}
        checked={checked}
        onToggle={(isChecked) => {
          setChecked(isChecked);
          if (!isChecked) {
            onChange('');
          }
        }}
      >
        <span className="fs-3 lh-sm">
          <FormattedMessage id="hackathon.skill.other" />
        </span>
      </Checkbox>
      {checked && (
        <input
          id={`${idPrefix}-other-text`}
          type="text"
          className="form-control form-control-lg"
          maxLength={500}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={intl.formatMessage({ id: 'hackathon.skill.other.label' })}
          placeholder={intl.formatMessage({ id: 'hackathon.skill.other.placeholder' })}
        />
      )}
    </>
  );
};

const NoShirtIcon = () => (
  <svg
    width={TSHIRT_IMAGE_SIZE}
    height={TSHIRT_IMAGE_SIZE}
    viewBox="0 0 100 100"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M36 12 22 18 6 33l10 13 10-6v50h48V40l10 6 10-13-16-15-14-6c-3 7-8 11-14 11s-11-4-14-11Z"
      fill="none"
      stroke="#C8D0D8"
      strokeWidth="3"
      strokeLinejoin="round"
      strokeDasharray="6 5"
    />
    <path d="M18 86 82 14" stroke="#8A8D91" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const TshirtFields = ({
  color,
  size,
  onColorChange,
  onSizeChange,
  colorError,
  sizeError,
  required = false,
}: {
  required?: boolean;
  color: HackathonTshirtColor | null;
  size: HackathonTshirtSize | '';
  onColorChange: (color: HackathonTshirtColor) => void;
  onSizeChange: (size: HackathonTshirtSize | '') => void;
  colorError?: string;
  sizeError?: string;
}) => {
  const intl = useIntl();

  return (
    <section className="d-flex flex-column gap-2">
      <h2
        className={`m-0 fs-3${required ? ' hackathon-required' : ''}`}
        id="hackathon-tshirt-title"
      >
        <FormattedMessage id="hackathon.tshirt.title" />
      </h2>
      <p className="m-0 text-body-secondary">
        <FormattedMessage id="hackathon.tshirt.description" />
      </p>
      <div
        className="d-flex flex-column gap-2"
        role="radiogroup"
        aria-labelledby="hackathon-tshirt-title"
        aria-required={required || undefined}
        aria-describedby={colorError ? 'hackathon-tshirt-error' : undefined}
      >
        {TSHIRT_COLORS.map(({ value, labelId, image }) => (
          <Radio
            key={value}
            name="hackathon-tshirt"
            id={`hackathon-tshirt-${value}`}
            selected={color === value}
            onSelect={() => onColorChange(value)}
            alignRadioCenter
          >
            <span className="d-flex align-items-center gap-3 fs-3 lh-sm">
              {image ? (
                <img
                  src={image}
                  alt=""
                  width={TSHIRT_IMAGE_SIZE}
                  height={TSHIRT_IMAGE_SIZE}
                  className="rounded"
                />
              ) : (
                <NoShirtIcon />
              )}
              <FormattedMessage id={labelId} />
            </span>
          </Radio>
        ))}
        <FieldError id="hackathon-tshirt-error" message={colorError} />
      </div>
      {color && color !== 'NONE' && (
        <div className="mt-2">
          <label className="form-label" htmlFor="hackathon-tshirt-size">
            <FormattedMessage id="hackathon.tshirt.size" />
          </label>
          <select
            id="hackathon-tshirt-size"
            className="form-select form-select-lg"
            value={size}
            onChange={(event) => onSizeChange(event.target.value as HackathonTshirtSize | '')}
            aria-invalid={sizeError ? true : undefined}
            aria-describedby={sizeError ? 'hackathon-tshirt-size-error' : undefined}
          >
            <option value="" disabled>
              {intl.formatMessage({ id: 'hackathon.tshirt.size.placeholder' })}
            </option>
            {TSHIRT_SIZES.map((tshirtSize) => (
              <option key={tshirtSize} value={tshirtSize}>
                {tshirtSize}
              </option>
            ))}
          </select>
          <div className="mt-1">
            <FieldError id="hackathon-tshirt-size-error" message={sizeError} />
          </div>
        </div>
      )}
    </section>
  );
};

export const TermsField = ({
  checked,
  onChange,
  error,
  required = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  required?: boolean;
}) => (
  <section className="d-flex flex-column gap-2">
    <Checkbox id="hackathon-terms" checked={checked} onToggle={onChange}>
      <span className={`lh-sm${required ? ' hackathon-required' : ''}`}>
        <FormattedMessage
          id="hackathon.terms.label"
          values={{
            termsLink: (
              <a
                href="https://tuleva.ee/vaata/hakaton/tingimused/"
                target="_blank"
                rel="noreferrer"
              >
                <FormattedMessage id="hackathon.terms.link" />
              </a>
            ),
          }}
        />
      </span>
    </Checkbox>
    <FieldError id="hackathon-terms-error" message={error} />
  </section>
);
