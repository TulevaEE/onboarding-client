import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TextRow } from './row/TextRow';

export const EmployerPaymentDetails: React.FunctionComponent<{
  pensionAccountNumber: string;
  fullName: string;
}> = ({ pensionAccountNumber, fullName }) => (
  <div className="mt-4 payment-details p-4">
    <h3>
      <FormattedMessage
        id="thirdPillarPayment.EMPLOYER.title"
        defaultMessage="Avaldus tööandjale otse palgast III sambasse maksmiseks"
      />
    </h3>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>1</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage
          id="thirdPillarPayment.EMPLOYER.percent"
          defaultMessage="Otsusta mitu protsenti oma brutopalgast soovid iga kuu III sambasse suunata."
        />
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>2</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <a
          className="btn btn-primary text-nowrap px-3"
          href="https://docs.google.com/document/d/1ZnF9CBxnXWzCjDz-wk1H84pz_yD3EIcD3WPBYt5RuDA/edit"
          target="_blank"
          rel="noreferrer"
        >
          <FormattedMessage
            id="thirdPillarPayment.EMPLOYER.form"
            defaultMessage="Lae alla avalduse blankett"
          />
        </a>
      </span>
    </div>

    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>3</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage
          id="thirdPillarPayment.EMPLOYER.formFields"
          defaultMessage="Täida avalduse väljad:"
        />
        <div className="mt-2 p-4 payment-details-table">
          <table>
            <tbody>
              <TextRow>
                <FormattedMessage
                  id="thirdPillarPayment.EMPLOYER.employerName"
                  defaultMessage="Tööandja nimi"
                />
                <FormattedMessage
                  id="thirdPillarPayment.EMPLOYER.employerName.description"
                  defaultMessage="Sinu tööandja nimi"
                />
              </TextRow>
              <TextRow>
                <FormattedMessage
                  id="thirdPillarPayment.EMPLOYER.percent"
                  defaultMessage="Protsent brutopalgast"
                />
                <FormattedMessage
                  id="thirdPillarPayment.EMPLOYER.percent.description"
                  defaultMessage="Protsent sinu brutopalgast"
                />
              </TextRow>
              <TextRow>
                <FormattedMessage
                  id="thirdPillarPayment.EMPLOYER.pensionAccountNumber"
                  defaultMessage="Sinu pensionikonto number"
                />
                {pensionAccountNumber}
              </TextRow>
              <TextRow>
                <FormattedMessage
                  id="thirdPillarPayment.EMPLOYER.fullName"
                  defaultMessage="Ees- ja perekonnanimi"
                />
                {fullName}
              </TextRow>
            </tbody>
          </table>
        </div>
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>4</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage
          id="thirdPillarPayment.EMPLOYER.digitalSignature"
          defaultMessage="Digiallkirjasta avaldus ja saada e-kirjaga oma tööandja raamatupidajale."
        />
      </span>
    </div>
    <div className="d-sm-flex py-2">
      <span className="flex-shrink-0 tv-step__number mr-3">
        <b>5</b>
      </span>
      <span className="flex-grow-1 align-self-center">
        <FormattedMessage
          id="thirdPillarPayment.EMPLOYER.salaryPayment"
          defaultMessage="Iga palgapäev tehakse automaatne sissemakse Tuleva III Samba Pensionifondi."
        />
      </span>
    </div>
  </div>
);
