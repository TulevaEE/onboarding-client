import React from 'react';
import { shallow } from 'enzyme';
import Table from '.';

describe('Table', () => {
  let component;
  it('renders column titles in header', () => {
    component = shallow(
      <Table
        columns={[{ title: 'Flower', dataIndex: 'flower' }, { title: 'Color', dataIndex: 'color' }]}
        dataSource={[]}
      />,
    );

    expect(titles()).toStrictEqual(['Flower', 'Color']);
  });

  it('renders data rows in body', () => {
    component = shallow(
      <Table
        columns={[{ title: 'Flower', dataIndex: 'flower' }, { title: 'Color', dataIndex: 'color' }]}
        dataSource={[
          { flower: 'rose', color: 'red', key: 'rose' },
          { flower: 'violet', color: 'blue', key: 'violet' },
        ]}
      />,
    );

    expect(rows()).toHaveLength(2);

    expect(textInPosition(0, 0)).toBe('rose');
    expect(textInPosition(0, 1)).toBe('red');
    expect(textInPosition(1, 0)).toBe('violet');
    expect(textInPosition(1, 1)).toBe('blue');
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

    expect(footer().exists()).toBe(true);
    expect(footers()).toStrictEqual(['', 'rainbow']);
  });

  it('does not render footer when no column footers exist', () => {
    component = shallow(
      <Table
        columns={[{ title: 'Flower', dataIndex: 'flower' }, { title: 'Color', dataIndex: 'color' }]}
        dataSource={[]}
      />,
    );

    expect(footer().exists()).toBe(false);
  });

  const titles = () => component.find('thead tr th').map(node => node.text());
  const rows = () => component.find('tbody tr');
  const textInPosition = (rowIndex, cellIndex) =>
    rows()
      .at(rowIndex)
      .find('td')
      .at(cellIndex)
      .text();
  const footer = () => component.find('tfoot');
  const footers = () =>
    footer()
      .find('tr td')
      .map(node => node.text());
});
