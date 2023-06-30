import { FunctionComponent, useState } from 'react';
import { Column, SortOrder } from './TableBody';

type TableHeadProps = {
  columns: Column[];
  handleSorting: (sortField: any, sortOrder: SortOrder) => void;
};

export const TableHead: FunctionComponent<TableHeadProps> = ({ columns, handleSorting }) => {
  const [sortField, setSortField] = useState('');
  const [order, setOrder] = useState('asc');

  const handleSortingChange = (accessor: string) => {
    const sortOrder = accessor === sortField && order === 'asc' ? 'desc' : 'asc';
    setSortField(accessor);
    setOrder(sortOrder);
    handleSorting(accessor, sortOrder);
  };

  const createColumn = (label: string, accessor: string, sortable: boolean, colSpan: number = 1, rowSpan: number = 1) => {
    const cl = sortable
      ? sortField === accessor && order === 'asc'
        ? 'up'
        : sortField === accessor && order === 'desc'
        ? 'down'
        : 'default'
      : '';
    return (
      <th
        key={label}
        onClick={() => (sortable ? handleSortingChange(accessor) : null)}
        className={cl}
        rowSpan={rowSpan}
        colSpan={colSpan}
      >
        {label}
      </th>
    );
  };

  const header: JSX.Element[] = [];
  const uniqueGroups: string[] = [];
  const groups: Record<string, Column[]> = {};
  columns.forEach((column) => {
    if (column.group === undefined) {
      header.push(createColumn(column.label, column.accessor, column.sortable, 1, column.rowSpan));
      return;
    }

    groups[column.group] = [...(groups[column.group] ?? []), column];
    if (!uniqueGroups.includes(column.group)) {
      uniqueGroups.push(column.group);
      header.push(
        <th key={column.group} colSpan={column.colSpan}>
          {column.group}
        </th>
      );
    }
  });

  if (header.length > 0) {
    const secondRow = Object.values(groups).map((value, index) => (
      <tr key={index}>
        {value.map((column) => createColumn(column.label, column.accessor, column.sortable, 1, column.rowSpan))}
      </tr>
    ));
    return (
      <thead>
        <tr>{header}</tr>
        {secondRow}
      </thead>
    );
  }
  return (
    <thead>
      <tr>{columns.map(({ label, accessor, sortable }) => createColumn(label, accessor, sortable))}</tr>
    </thead>
  );
};

export default TableHead;
