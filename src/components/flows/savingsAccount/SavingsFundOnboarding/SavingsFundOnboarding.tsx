import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../../../common/usePageTitle';

export const SavingsFundOnboarding: FC = () => {
  usePageTitle('pageTitle.savingsFundOnboarding');

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex align-items-center gap-2">
        <div
          className="progress flex-fill"
          role="progressbar"
          aria-label="Basic example"
          aria-valuenow={75}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: '8px' }}
        >
          <div className="progress-bar" style={{ width: '12.5%' }} />
        </div>
        <span className="fs-xs lh-1 text-secondary fw-medium">
          <span className="visually-hidden">Praegune samm:</span> 1/8
        </span>
      </div>

      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-center">Täiendava kogumisfondi avamine</h1>
      </div>

      <div>Sisu…</div>

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button type="button" className="btn btn-lg btn-light">
          <FormattedMessage id="savingsFundOnboarding.back" />
        </button>
        <button type="button" className="btn btn-lg btn-primary">
          <FormattedMessage id="savingsFundOnboarding.continue" />
        </button>
      </div>
    </div>
  );
};
