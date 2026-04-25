import React from "react";
import {
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";

const TableSkeleton = ({ rows = 5, columns = 1 }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableBody>
          {Array.from(new Array(rows)).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from(new Array(columns)).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton variant="text" width="100%" height={20} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableSkeleton;
