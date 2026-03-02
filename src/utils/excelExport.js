import * as XLSX from 'xlsx';

/**
 * Export rows to an Excel file and trigger download.
 * @param {Array<{firmName: string, personName: string, phone: string, email: string, address: string}>} rows
 * @param {string} filename - Output filename (default: business_cards.xlsx)
 */
export function exportToExcel(rows, filename = 'business_cards.xlsx') {
  const headers = ['Firm Name', 'Person Name', 'Phone', 'Email', 'Address'];
  const data = rows.map((r) => [
    r.firmName || '',
    r.personName || '',
    r.phone || '',
    r.email || '',
    r.address || '',
  ]);

  const wsData = [headers, ...data];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Business Cards');

  XLSX.writeFile(wb, filename);
}
