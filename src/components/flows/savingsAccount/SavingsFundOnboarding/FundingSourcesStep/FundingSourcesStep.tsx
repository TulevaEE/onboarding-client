import { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { FundingSourceOption } from '../types.api';
import { TranslationKey } from '../../../../translations';
import { MultiSelectOptionsStep } from '../MultiSelectOptionsStep';

type FundingSourcesStepProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
};

const OPTIONS: { id: string; value: FundingSourceOption; labelId: TranslationKey }[] = [
  {
    id: 'funding-parent-income',
    value: 'PARENT_INCOME_AND_SAVINGS',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.parentIncome',
  },
  {
    id: 'funding-child-benefit',
    value: 'CHILD_BENEFIT',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.childBenefit',
  },
  {
    id: 'funding-gifts',
    value: 'GIFTS',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.gifts',
  },
  {
    id: 'funding-inheritance',
    value: 'INHERITANCE',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.inheritance',
  },
  {
    id: 'funding-child-own',
    value: 'CHILD_OWN',
    labelId: 'flows.savingsFundChildOnboarding.fundingSourcesStep.childOwn',
  },
];

export const FundingSourcesStep = <T extends FieldValues>({
  control,
  name,
}: FundingSourcesStepProps<T>) => (
  <MultiSelectOptionsStep
    control={control}
    name={name}
    options={OPTIONS}
    titleId="flows.savingsFundChildOnboarding.fundingSourcesStep.title"
    descriptionId="flows.savingsFundChildOnboarding.fundingSourcesStep.description"
    otherId="funding-other"
    messages={{
      other: 'flows.savingsFundChildOnboarding.fundingSourcesStep.other',
      otherPlaceholder: 'flows.savingsFundChildOnboarding.fundingSourcesStep.otherPlaceholder',
      required: 'flows.savingsFundChildOnboarding.fundingSourcesStep.required',
      otherRequired: 'flows.savingsFundChildOnboarding.fundingSourcesStep.other.required',
    }}
  />
);
