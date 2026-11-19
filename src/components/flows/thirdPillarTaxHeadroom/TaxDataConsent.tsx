import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/browser';
import { AuthenticationLoader, ErrorMessage } from '../../common';
import { createTaxDataConsent, downloadTaxDataConsentDocument } from '../../common/api';
import {
  THIRD_PILLAR_TAX_HEADROOM_QUERY_KEY,
  useThirdPillarTaxHeadroom,
} from '../../common/apiHooks';
import { TaxDataConsent as TaxDataConsentEntity } from '../../common/apiModels/taxHeadroom';
import { isSigningWithIdCard } from '../../common/authenticationManager';
import { Loader } from '../../common/loader/Loader';
import { PhosphorIcon } from '../../common/PhosphorIcon';
import { showPdf } from '../../common/showPdf';
import { useSigning } from '../../common/signing/useSigning';
import { usePageTitle } from '../../common/usePageTitle';
import { TranslationKey } from '../../translations';
import { FetchingTaxData } from './FetchingTaxData';
import { TAX_HEADROOM_RESULT_PATH } from './paths';
import styles from './TaxDataConsent.module.scss';

const CONSENT_FILE_NAME = 'Nousolek.pdf';

const REQUESTED_TAX_DATA: TranslationKey[] = [
  'thirdPillarTaxHeadroom.consent.data.salary',
  'thirdPillarTaxHeadroom.consent.data.benefits',
  'thirdPillarTaxHeadroom.consent.data.taxReturn',
  'thirdPillarTaxHeadroom.consent.data.dividends',
  'thirdPillarTaxHeadroom.consent.data.employment',
  'thirdPillarTaxHeadroom.consent.data.taxDebt',
];

const RequestedTaxData = () => (
  <div className={`rounded-3 p-4 ${styles.dataBox}`}>
    <h2 className="h5 mb-3">
      <FormattedMessage id="thirdPillarTaxHeadroom.consent.data.title" />
    </h2>
    <ul className="row row-cols-1 row-cols-sm-2 gx-4 gy-2 list-unstyled mb-0">
      {REQUESTED_TAX_DATA.map((id) => (
        <li key={id} className="d-flex align-items-baseline gap-2">
          <PhosphorIcon name="check" size={14} className="text-primary" />
          <FormattedMessage id={id} />
        </li>
      ))}
    </ul>
    <p className="text-body-secondary mt-3 mb-0">
      <FormattedMessage id="thirdPillarTaxHeadroom.consent.data.period" />
    </p>
  </div>
);

export const TaxDataConsent = () => {
  usePageTitle('pageTitle.thirdPillarTaxHeadroom');
  const history = useHistory();
  const queryClient = useQueryClient();
  const { data: headroom, isLoading, isError, isFetching } = useThirdPillarTaxHeadroom();
  const { startSigning, cancelSigning, signed, loading, challengeCode, error } =
    useSigning<TaxDataConsentEntity>('TAX_DATA_CONSENT');
  const [preparingConsent, setPreparingConsent] = useState(false);
  const [approvedEarlier, setApprovedEarlier] = useState(false);
  const consent = useRef<TaxDataConsentEntity | null>(null);
  const approved = signed || approvedEarlier;

  const fetchTaxData = () =>
    queryClient.invalidateQueries({ queryKey: THIRD_PILLAR_TAX_HEADROOM_QUERY_KEY });

  useEffect(() => {
    if (approved) {
      fetchTaxData();
    }
  }, [approved]);

  if (isLoading) {
    return <Loader className="align-middle" />;
  }

  if (headroom) {
    return <Redirect to={TAX_HEADROOM_RESULT_PATH} />;
  }

  const consentToSign = async () => {
    if (!consent.current) {
      consent.current = await createTaxDataConsent();
    }
    if (consent.current.status === 'APPROVED') {
      setApprovedEarlier(true);
      return null;
    }
    return consent.current;
  };

  const signConsent = async () => {
    if (approved) {
      fetchTaxData();
      return;
    }
    setPreparingConsent(true);
    try {
      const unsignedConsent = await consentToSign();
      if (unsignedConsent) {
        await startSigning(unsignedConsent);
      }
    } catch (e) {
      captureException(e);
    } finally {
      setPreparingConsent(false);
    }
  };

  const viewConsent = async () => {
    try {
      const unsignedConsent = await consentToSign();
      if (unsignedConsent) {
        showPdf(await downloadTaxDataConsentDocument(unsignedConsent.id), CONSENT_FILE_NAME);
      }
    } catch (e) {
      captureException(e);
    }
  };

  const taxDataUnavailable = approved && isError && !isFetching;

  const isSigning = !approved && (preparingConsent || loading || !!challengeCode);

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      {isSigning && (
        <AuthenticationLoader
          signingWithIdCard={isSigningWithIdCard()}
          controlCode={challengeCode}
          onCancel={cancelSigning}
          overlayed
        />
      )}
      {approved && !taxDataUnavailable && <FetchingTaxData />}
      {error && <ErrorMessage errors={error.body} onCancel={cancelSigning} overlayed />}

      <h1 className="mb-3 text-balance">
        <FormattedMessage id="thirdPillarTaxHeadroom.consent.title" />
      </h1>
      <p className="lead mb-5 text-pretty">
        <FormattedMessage id="thirdPillarTaxHeadroom.consent.lead" />
      </p>

      <RequestedTaxData />

      <p className="text-body-secondary mt-4 mb-0 text-pretty">
        <FormattedMessage id="thirdPillarTaxHeadroom.consent.validity" />{' '}
        <button type="button" className="btn btn-link p-0 align-baseline" onClick={viewConsent}>
          <FormattedMessage id="thirdPillarTaxHeadroom.consent.view" />
        </button>
      </p>

      {taxDataUnavailable && (
        <p className="alert alert-danger mt-4 mb-0" role="alert">
          <FormattedMessage id="thirdPillarTaxHeadroom.consent.fetchFailed" />
        </p>
      )}

      <div className="mt-5 d-flex flex-column-reverse flex-sm-row justify-content-sm-between align-items-sm-center gap-2">
        <button type="button" className="btn btn-light" onClick={history.goBack}>
          <FormattedMessage id="thirdPillarTaxHeadroom.consent.back" />
        </button>
        <button type="button" className="btn btn-primary" onClick={signConsent}>
          <FormattedMessage id="thirdPillarTaxHeadroom.consent.sign" />
        </button>
      </div>
    </div>
  );
};
