import { shallow, ShallowWrapper } from 'enzyme';
import { StatusBox } from '.';
import { completeConversion } from './fixtures';

describe('Status Box', () => {
  let component: ShallowWrapper;
  const props = { conversion: completeConversion, secondPillarFunds: [], thirdPillarFunds: [] };

  beforeEach(() => {
    component = shallow(<StatusBox {...props} />);
  });

  it('renders all subcomponents when present', () => {
    expect(component).toMatchSnapshot();
  });

  it('shows only a loader when some props missing', () => {
    component.setProps({ conversion: undefined });
    expect(component).toMatchSnapshot();
  });
});
