/**
 * Chart Export Functions
 * Utilities for exporting chart data to CSV and PDF
 */

export async function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => JSON.stringify(row[header])).join(','),
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function exportToPDF(elementId: string, filename: string) {
  // In production, use a library like html2pdf or @react-pdf/renderer
  // Implementation would depend on chosen PDF library
}
