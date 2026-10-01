import { Application } from '../../common/apiModels';

export function hasPendingThirdPillarTransfer(applications: Application[]): boolean {
  return applications.some(
    (application) =>
      application.type === 'TRANSFER' &&
      application.status === 'PENDING' &&
      application.details.sourceFund.pillar === 3,
  );
}
