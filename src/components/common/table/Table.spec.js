import { shallow } from 'enzyme';
import Table from '.';

describe('Table', () => {
  let component;

  // all potential breakpoint classes for hideOnBreakpoint
  const allBreakpointClasses = [
    'd-none',
    'd-table-cell',
    'd-sm-none',
    'd-sm-table-cell',
    'd-md-none',
    'd-md-table-cell',
    'd-lg-none',
    'd-lg-table-cell',
    'd-xl-none',
    'd-xl-table-cell',
    'd-xxl-none',
    'd-xxl-table-cell',
  ];

  // helper to assert hideOnBreakpoint classes
  const assertHideOn = (wrapper, expectedClasses) => {
    const headCell = wrapper.find('thead tr th').at(0);
    const bodyCell = wrapper.find('tbody tr td').at(0);
    expectedClasses.forEach((cls) => {
      expect(headCell.hasClass(cls)).toBe(true);
      expect(bodyCell.hasClass(cls)).toBe(true);
    });
  };

  it('renders column titles in header', () => {
    component = shallow(
      <Table
        columns={[
          { title: 'Flower', dataIndex: 'flower' },
          { title: 'Color', dataIndex: 'color' },
        ]}
        dataSource={[]}
      />,
    );

    expect(titles()).toStrictEqual(['Flower', 'Color']);
  });

  it('renders data rows in body', () => {
    component = shallow(
      <Table
        columns={[
          { title: 'Flower', dataIndex: 'flower' },
          { title: 'Color', dataIndex: 'color' },
        ]}
        dataSource={[
          { flower: 'rose', color: 'red', key: 'rose' },
          { flower: 'violet', color: 'blue', key: 'violet' },
        ]}
      />,
    );

    expect(rows()).toHaveLength(2);

    expect(textInBodyCell(0, 0)).toBe('rose');
    expect(textInBodyCell(0, 1)).toBe('red');
    expect(textInBodyCell(1, 0)).toBe('violet');
    expect(textInBodyCell(1, 1)).toBe('blue');
  });

  it('renders existing column footers in footer when any exist', () => {
    component = shallow(
      <Table
        columns={[
          { title: 'Flower', dataIndex: 'flower' },
          { title: 'Color', dataIndex: 'color', footer: 'rainbow' },
        ]}
        dataSource={[]}
      />,
    );

    expect(foot().exists()).toBe(true);
    expect(footers()).toStrictEqual(['', 'rainbow']);
  });

  it('does not render footer when no column footers exist', () => {
    component = shallow(
      <Table
        columns={[
          { title: 'Flower', dataIndex: 'flower' },
          { title: 'Color', dataIndex: 'color' },
        ]}
        dataSource={[]}
      />,
    );

    expect(foot().exists()).toBe(false);
  });

  test.each([
    [
      ['xs'],
      [
        'd-none',
        'd-sm-table-cell',
        'd-md-table-cell',
        'd-lg-table-cell',
        'd-xl-table-cell',
        'd-xxl-table-cell',
      ],
    ],
    [
      ['sm', 'xl'],
      [
        'd-xs-table-cell',
        'd-sm-none',
        'd-md-table-cell',
        'd-lg-table-cell',
        'd-xl-none',
        'd-xxl-table-cell',
      ],
    ],
    [
      ['sm', 'md', 'xl'],
      [
        'd-xs-table-cell',
        'd-sm-none',
        'd-md-none',
        'd-lg-table-cell',
        'd-xl-none',
        'd-xxl-table-cell',
      ],
    ],
  ])('hides columns with hideOnBreakpoint="%s"', (breakpoints, expectedClasses) => {
    component = shallow(
      <Table
        columns={[{ title: 'Flower', dataIndex: 'flower', hideOnBreakpoint: breakpoints }]}
        dataSource={[{ flower: 'rose', key: 'rose' }]}
      />,
    );
    assertHideOn(component, expectedClasses);
    // ensure no unexpected breakpoint classes are present
    const headCell = component.find('thead tr th').at(0);
    const bodyCell = component.find('tbody tr td').at(0);
    const absentClasses = allBreakpointClasses.filter((cls) => !expectedClasses.includes(cls));
    absentClasses.forEach((cls) => {
      expect(headCell.hasClass(cls)).toBe(false);
      expect(bodyCell.hasClass(cls)).toBe(false);
    });
  });

  const headCells = () => component.find('thead tr th');
  const titles = () => headCells().map((node) => node.text());
  const rows = () => component.find('tbody tr');
  const bodyCell = (rowIndex, cellIndex) => rows().at(rowIndex).find('td').at(cellIndex);
  const textInBodyCell = (rowIndex, cellIndex) => bodyCell(rowIndex, cellIndex).text();

  const foot = () => component.find('tfoot');
  const footCells = () => foot().find('tr td');
  const footers = () => footCells().map((node) => node.text());
});
