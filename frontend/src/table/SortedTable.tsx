import { Table } from "react-bootstrap";
import { TableBody, Column, SortOrder } from "./TableBody";
import TableHead from "./TableHead";

import { FunctionComponent, useEffect, useState } from "react";
type SortedTableProps = {
    data: any[]
    columns: Column[]
}

export const SortedTable: FunctionComponent<SortedTableProps> = ({ data, columns }) => {
    const useSortableTable = (data: any[], columns: Column[]) => {
    const handleSorting = (sortField: any, sortOrder: SortOrder) => {
      if (sortField) {
        const sorted = [...tableData].sort((a, b) => {
          if (a[sortField] === null) return 1;
          if (b[sortField] === null) return -1;
          if (a[sortField] === null && b[sortField] === null) return 0;
          return (
            a[sortField].toString().localeCompare(b[sortField].toString(), "en", {
              numeric: true,
            }) * (sortOrder === "asc" ? 1 : -1)
          );
        });
        setTableData(sorted);
      }
    };
  
    return [tableData, handleSorting];
  };

  const [tableData, setTableData] = useState<any[]>([]);
  const [tData, handleSorting] = useSortableTable(data, columns);
  useEffect(() => {
    setTableData(getDefaultSorting(data, columns))
  },[data, columns])

  return (
    <>
      <Table striped bordered hover size="sm">
        <TableHead columns={columns} handleSorting={handleSorting as (sortField: any, sortOrder: SortOrder) => void} />
        <TableBody columns={columns} tableData={tData as any[]} />
      </Table>
    </>
  );
};

function getDefaultSorting(defaultTableData: any[], columns: Column[]): any[] {
  const sorted = [...defaultTableData].sort((a, b) => {
    const filterColumn = columns.filter((column) => column.sortByOrder);

    let { accessor = "id", sortbyOrder = "asc" } = Object.assign(
      {},
      ...filterColumn
    );

    if (a[accessor] === null) return 1;
    if (b[accessor] === null) return -1;
    if ((a[accessor] === null) && (b[accessor] === null)) return 0;

    const ascending = a[accessor]
      .toString()
      .localeCompare(b[accessor].toString(), "en", {
        numeric: true,
      });

    return sortbyOrder === "asc" ? ascending : -ascending;
  });
  return sorted;
}

