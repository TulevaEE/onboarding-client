import { FC } from 'react';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useRoles, useSwitchRole } from '../../../../common/apiHooks';
import { SwitchRoleCommand } from '../../../../common/apiModels';

type AccountChoiceStepProps = {
  companyCode: string;
  companyName: string;
};

export const AccountChoiceStep: FC<AccountChoiceStepProps> = ({ companyCode, companyName }) => {
  const history = useHistory();
  const { data: roles } = useRoles();
  const switchRole = useSwitchRole();

  const personalRole = roles?.find((role) => role.type === 'PERSON');

  const chooseRole = async (command: SwitchRoleCommand) => {
    await switchRole.mutateAsync(command);
    history.push('/account');
  };

  return (
    <section className="col-12 col-md-9 mx-auto text-center d-flex flex-column gap-3 align-items-center py-4">
      <h1 className="m-0">
        <FormattedMessage id="flows.savingsFundOnboarding.accountChoiceStep.title" />
      </h1>
      <p className="m-0 text-secondary">
        <FormattedMessage
          id="flows.savingsFundOnboarding.accountChoiceStep.description"
          values={{ company: companyName }}
        />
      </p>
      <div className="d-flex flex-column flex-sm-row gap-2 mt-2">
        <button
          type="button"
          className="btn btn-lg btn-primary"
          disabled={!personalRole || switchRole.isPending}
          onClick={() => personalRole && chooseRole({ type: 'PERSON', code: personalRole.code })}
        >
          <FormattedMessage id="flows.savingsFundOnboarding.accountChoiceStep.personalAccount" />
        </button>
        <button
          type="button"
          className="btn btn-lg btn-outline-primary"
          disabled={switchRole.isPending}
          onClick={() => chooseRole({ type: 'LEGAL_ENTITY', code: companyCode })}
        >
          <FormattedMessage
            id="flows.savingsFundOnboarding.accountChoiceStep.companyAccount"
            values={{ company: companyName }}
          />
        </button>
      </div>
    </section>
  );
};
