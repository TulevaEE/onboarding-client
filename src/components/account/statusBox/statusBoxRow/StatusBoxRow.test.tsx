import { shallow } from 'enzyme';
import { StatusBoxRow } from './StatusBoxRow';

describe('Status Box Row', () => {
  let component: any;

  beforeEach(() => {
    component = shallow(<StatusBoxRow />);
  });

  it('renders the name', () => {
    const displayName = <span>i am a name</span>;
    component.setProps({ name: displayName });
    expect(component.contains(displayName)).toBe(true);
  });

  it('renders action button if row status not ok', () => {
    const action = <span>do next</span>;
    component.setProps({ showAction: true, children: action });
    expect(component.contains(action)).toBe(true);
  });

  it('renders given lines of text', () => {
    component.setProps({ lines: ['aa', 'bb'] });
    expect(component.contains('aa')).toBe(true);
    expect(component.contains('bb')).toBe(true);
  });
});
