/**
 * CSV Export Utilities
 * Generate and download CSV files from data
 */

export interface CSVColumn {
  key: string;
  header: string;
  formatter?: (value: string | number | boolean | null | undefined) => string;
}

/**
 * Convert data to CSV format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertToCSV(data: Record<string, any>[], columns: CSVColumn[]): string {
  // Create header row
  const headers = columns.map(col => col.header).join(',');

  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];

      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value);
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }

      // Convert to string and escape quotes
      const stringValue = String(value).replace(/"/g, '""');

      // Wrap in quotes if contains comma, newline, or quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue}"`;
      }

      return stringValue;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    // Create a link to the file
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export data to CSV and download
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV(data: Record<string, any>[], columns: CSVColumn[], filename: string): void {
  const csv = convertToCSV(data, columns);
  downloadCSV(csv, filename);
}
