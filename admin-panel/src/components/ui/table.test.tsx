import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

describe('Table Primitives', () => {
  it('renders table structure correctly', () => {
    render(
      <Table>
        <TableCaption>Caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Caption')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Cell')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('forwards refs for Table', () => {
    const ref = { current: null };
    render(<Table ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });

  it('forwards refs for TableRow', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableBody>
            <TableRow ref={ref} />
        </TableBody>
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
  });
});
