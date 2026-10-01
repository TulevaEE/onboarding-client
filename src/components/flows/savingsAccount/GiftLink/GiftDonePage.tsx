import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { logo } from '../../../common';
import { usePageTitle } from '../../../common/usePageTitle';
import { usePublicGiftLink } from './api/giftLink.api';
import { GiftDisclaimer } from './GiftDisclaimer';

export const GiftDonePage: FC = () => {
  usePageTitle('giftLink.done.pageTitle');
  const { token = '' } = useParams<{ token: string }>();
  const { data: giftLink } = usePublicGiftLink(token);

  return (
    <div>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <img width="146" height="66" src={logo} alt="Tuleva" className="d-block mx-auto mb-5" />
            <div className="d-flex flex-column gap-4 text-center">
              <h1 className="m-0">
                <FormattedMessage id="giftLink.done.title" />
              </h1>
              <p className="m-0 fs-3 fw-medium">
                <FormattedMessage id="giftLink.done.onItsWay" />
              </p>
              <div className="pt-4 border-top">
                <p className="m-0 mt-4 fs-3">
                  {giftLink ? (
                    <FormattedMessage
                      id="giftLink.done.youHelped"
                      values={{ name: giftLink.recipientName }}
                    />
                  ) : (
                    <FormattedMessage id="giftLink.done.youHelped.noName" />
                  )}
                </p>
                <div className="pt-4">
                  <a className="btn btn-lg btn-primary" href="https://tuleva.ee">
                    <FormattedMessage id="giftLink.done.learnMore" />
                  </a>
                </div>
              </div>
              <GiftDisclaimer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
