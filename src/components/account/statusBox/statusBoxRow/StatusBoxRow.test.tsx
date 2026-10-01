import { shallow } from 'enzyme';
import { render, screen } from '@testing-library/react';
import { StatusBoxRow } from './StatusBoxRow';
import { StatusBoxEmphasisProvider } from '../statusBoxEmphasis';

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

describe('Status Box Row emphasis', () => {
  const renderRow = (emphasis?: 'primary' | 'secondary') =>
    render(
      <StatusBoxEmphasisProvider value={emphasis}>
        <StatusBoxRow name="II pillar" lines={['first line', 'second line']} showAction>
          <a href="/somewhere" className="btn btn-primary">
            act
          </a>
        </StatusBoxRow>
      </StatusBoxEmphasisProvider>,
    );

  it('renders both lines and a filled action without emphasis', () => {
    renderRow();

    expect(screen.getByText('second line')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'act' })).toHaveClass('btn-primary');
    expect(screen.getByTestId('status-box-row')).not.toHaveClass('secondary');
  });

  it('highlights the row when emphasized as primary', () => {
    renderRow('primary');

    expect(screen.getByTestId('status-box-row')).toHaveClass('primary');
    expect(screen.getByText('second line')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'act' })).toHaveClass('btn-primary');
  });

  it('dims the row, drops the second line and outlines the action when emphasized as secondary', () => {
    renderRow('secondary');

    expect(screen.getByTestId('status-box-row')).toHaveClass('secondary');
    expect(screen.getByText('first line')).toBeInTheDocument();
    expect(screen.queryByText('second line')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'act' })).toHaveClass('btn-outline-primary');
    expect(screen.getByRole('link', { name: 'act' })).not.toHaveClass('btn-primary');
  });
});
