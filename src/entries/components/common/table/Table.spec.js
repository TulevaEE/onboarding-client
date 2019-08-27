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
        columns={[{ title: 'Flower', dataIndex: 'flower' }, { title: 'Color', dataIndex: 'color' }]}
        dataSource={[]}
      />,
    );

    expect(foot().exists()).toBe(false);
  });

  it('hides columns with hideOnMobile flag on mobile', () => {
    component = shallow(
      <Table
        columns={[
          { title: 'Flower', dataIndex: 'flower', footer: 'power', hideOnMobile: true },
          { title: 'Color', dataIndex: 'color', footer: 'rainbow' },
        ]}
        dataSource={[
          { flower: 'rose', color: 'red', key: 'rose' },
          { flower: 'violet', color: 'blue', key: 'violet' },
        ]}
      />,
    );

    expect(headCellIsHidden(0)).toBe(true);
    expect(headCellIsHidden(1)).toBe(false);

    expect(bodyCellIsHidden(0, 0)).toBe(true);
    expect(bodyCellIsHidden(0, 1)).toBe(false);
    expect(bodyCellIsHidden(1, 0)).toBe(true);
    expect(bodyCellIsHidden(1, 1)).toBe(false);

    expect(footCellIsHidden(0)).toBe(true);
    expect(footCellIsHidden(1)).toBe(false);
  });

  const isHiddenOnMobile = node => node.hasClass('d-none d-sm-table-cell');

  const headCells = () => component.find('thead tr th');
  const titles = () => headCells().map(node => node.text());
  const rows = () => component.find('tbody tr');
  const headCellIsHidden = index => isHiddenOnMobile(headCells().at(index));

  const bodyCell = (rowIndex, cellIndex) =>
    rows()
      .at(rowIndex)
      .find('td')
      .at(cellIndex);
  const bodyCellIsHidden = (rowIndex, cellIndex) => isHiddenOnMobile(bodyCell(rowIndex, cellIndex));
  const textInBodyCell = (rowIndex, cellIndex) => bodyCell(rowIndex, cellIndex).text();

  const foot = () => component.find('tfoot');
  const footCells = () => foot().find('tr td');
  const footers = () => footCells().map(node => node.text());
  const footCellIsHidden = index => isHiddenOnMobile(footCells().at(index));
});
