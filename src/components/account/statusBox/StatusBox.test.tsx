import { shallow, ShallowWrapper } from 'enzyme';
import { StatusBoxComponent } from '.';
import { completeConversion } from './fixtures';

jest.mock('../../common/apiHooks', () => ({
  useSavingsFundOnboardingStatus: () => ({ status: null }),
}));

describe('Status Box', () => {
  let component: ShallowWrapper;
  const props = { conversion: completeConversion, secondPillarFunds: [], thirdPillarFunds: [] };

  beforeEach(() => {
    component = shallow(<StatusBoxComponent {...props} />);
  });

  it('renders all subcomponents when present', () => {
    expect(component).toMatchSnapshot();
  });

  it('shows only a loader when some props missing', () => {
    component.setProps({ conversion: undefined });
    expect(component).toMatchSnapshot();
  });
});
