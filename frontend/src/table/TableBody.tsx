import React from "react";
import { FunctionComponent } from "react";
import { v4 as uuidv4 } from 'uuid';

type TableBodyProps = {
  tableData: any[]
  columns: Column[]
}

export type SortOrder = 'asc' | 'desc' | 'none'
export type Column = {
  label: string
  accessor: string
  sortable: boolean
  sortByOrder: SortOrder
  rowSpan: number | undefined
  colSpan: number | undefined
  group: string | undefined
  
}

export const TableBody: FunctionComponent<TableBodyProps> = ({ tableData, columns }) => {
  return (
    <tbody>
      {tableData.map((data) => {
        return (
          <tr key={uuidv4()}>
            {columns.map(({ accessor }) => {
              if (React.isValidElement(data[accessor])) {
                return <td key={uuidv4()}>{data[accessor]}</td>
              }
              const tData = data[accessor] ? data[accessor].toString().replaceAll('"', '') : '---';
              return <td key={uuidv4()}>{tData}</td>;
            })}
          </tr>
        );
      })}
    </tbody>
  );
};
