import { FC } from 'react';
import { FormattedMessage } from 'react-intl';

export const RequirementsCheckStep: FC = () => (
  <section className="d-flex flex-column gap-5 bg-light border border-gray-2 rounded rounded-4 p-4">
    <div className="d-flex flex-column gap-1">
      <h2 className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.title" />
      </h2>
      <p className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.businessValidationStep.description" />
      </p>
    </div>
    <div className="d-flex flex-column gap-3">
      <div className="d-sm-flex gap-3 align-items-center">
        <div className="col-6 fw-bold">Label</div>
        <div className="col-6">Long value that probably overflows to multiple lines</div>
      </div>
      <div className="d-sm-flex gap-3 align-items-center">
        <div className="col-6 fw-bold">Long label might overflow to multiple lines</div>
        <div className="col-6">Medium value</div>
      </div>
      <div className="d-sm-flex gap-3 align-items-center">
        <div className="col-6 fw-bold">Label</div>
        <div className="col-6">Value</div>
      </div>
      <div className="d-sm-flex gap-3 align-items-center">
        <div className="col-6 fw-bold">Label</div>
        <div className="col-6">Value</div>
      </div>
      <div className="d-sm-flex gap-3 align-items-center">
        <div className="col-6 fw-bold">Label</div>
        <div className="col-6">Value</div>
      </div>
      <div className="border-top border-gray-2" />
      <div className="d-flex">Element</div>
    </div>
  </section>
);
