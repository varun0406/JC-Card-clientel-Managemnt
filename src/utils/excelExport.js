import * as XLSX from 'xlsx';

const FIXED_HEADERS = ['Firm Name', 'Person Name', 'Phone', 'Email', 'Address'];

/**
 * Export cards to Excel with fixed columns + dynamic metadata columns.
 * @param {Array<{firmName, personName, phone, email, address, metadata}>} cards
 * @param {string[]} metadataKeys - Ordered list of metadata field names for columns
 * @param {string} filename
 */
export function exportToExcel(cards, metadataKeys = [], filename = 'business_cards.xlsx') {
  const metaHeaders = (metadataKeys || []).map((k) => k || '');
  const headers = [...FIXED_HEADERS, ...metaHeaders];

  const metaMap = (m) => {
    const map = {};
    (m || []).forEach((item) => {
      if (item && item.name != null) map[item.name] = item.value;
    });
    return map;
  };

  const data = cards.map((card) => {
    const fixed = [
      card.firmName || '',
      card.personName || '',
      card.phone || '',
      card.email || '',
      card.address || '',
    ];
    const meta = metaMap(card.metadata);
    const metaValues = (metadataKeys || []).map((k) => meta[k] || '');
    return [...fixed, ...metaValues];
  });

  const wsData = [headers, ...data];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Business Cards');

  XLSX.writeFile(wb, filename);
}
