/**
 * Export utilities for CSV and PDF
 * WellNexus Analytics Dashboard
 */

/**
 * Export data to CSV file
 * @param data - Array of objects to export
 * @param _filename - Name of the CSV file (unused, for compatibility)
 */
export function exportToCSV(data: Record<string, unknown>[], _filename: string): void {
  if (!data || data.length === 0) {
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Handle strings with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${_filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export HTML element to PDF using browser print
 * @param elementId - ID of the element to export
 * @param _filename - Name of the PDF file (unused, for compatibility)
 */
export function exportToPDF(elementId: string, _filename: string): void {
  const element = document.getElementById(elementId)
  if (!element) {
    return
  }

  // Add print-specific classes
  element.classList.add('print-view')

  // Open print dialog
  window.print()

  // Remove print-specific classes after print
  setTimeout(() => {
    element.classList.remove('print-view')
  }, 1000)
}

/**
 * Generate timestamp for filenames
 * @returns Formatted timestamp string
 */
export function generateTimestamp(): string {
  const now = new Date()
  return now.toISOString().slice(0, 10).replace(/-/g, '') + '_' +
         now.toTimeString().slice(0, 8).replace(/:/g, '')
}

/**
 * Format currency for export
 * @param value - Value in cents
 * @returns Formatted currency string
 */
export function formatCurrencyForExport(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(value / 100)
}
