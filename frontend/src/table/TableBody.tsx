import React, { FunctionComponent } from 'react';

export type SortOrder = 'asc' | 'desc' | 'none';
export type Column = {
  label: string;
  accessor: string;
  isDate?: boolean;
  sortable: boolean;
  sortByOrder: SortOrder;
  rowSpan?: number;
  colSpan?: number;
  group?: string;
};

type TableBodyProps = {
  tableData: any[];
  columns: Column[];
};

export const TableBody: FunctionComponent<TableBodyProps> = ({ tableData, columns }) => {
  const getCellValue = (data: any, column: Column) =>
    React.isValidElement(data)
      ? data
      : column.isDate === true
      ? new Date(data).toLocaleString('ro-RO')
      : (data ?? '---').toString().replaceAll('"', '');

  return (
    <tbody>
      {tableData.map((data, index) => (
        <tr key={index}>
          {columns.map((column) => (
            <td key={column.accessor}>{getCellValue(data[column.accessor], column)}</td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};
