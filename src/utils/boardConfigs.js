export const BOARD_CONFIGS = [
  { id: '18381708169', name: '52 at Park' },
  { id: '10062266317', name: 'Bishop Woods' },
  { id: '9043871935', name: 'Canyons' },
  { id: '8611750964', name: 'Chippenham Internet' },
  { id: '9453669960', name: 'Residences at Chestnut' },
  { id: '9985052982', name: 'Cottonwood Ranch' },
  { id: '18403168884', name: 'Cypress Oaks' },
  { id: '6029993160', name: 'Douglas Pointe' },
  { id: '18281914075', name: 'Gunsmoke' },
  { id: '18393354102', name: 'Huntington Reserve' },
  { id: '10023416454', name: 'Ironwood Ranch' },
  { id: '9442087468', name: 'Leon Creek' },
  { id: '18396208671', name: 'Northside' },
  { id: '18381733431', name: 'Oakwood Trails Apts' },
  { id: '7743016362', name: 'Pershing Pointe' },
  { id: '18382737940', name: 'Salix on the Vine' },
  { id: '18393737973', name: 'Sea Breeze' },
  { id: '8953984507', name: 'Sunrise Commons' },
  { id: '18401423601', name: 'The Victoria at Huxley' },
  { id: '18401423458', name: 'The View at Huxley' },
  { id: '18403282432', name: 'Tuscany Lakes Internet' },
];

export const BUCKET_COLORS = {
  Active: '#06b6d4',
  'Non-Active': '#787878',
};

const normalize = (value) => (value || '').trim().toLowerCase();
const normalizeKey = (value) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const findColumnByTitle = (columns, expectedTitles) => {
  const expected = expectedTitles.map(normalizeKey);
  return columns.find((col) => expected.includes(normalizeKey(col.title)));
};

export const getColumnValueById = (columnValues, columnId) => {
  if (!columnId || !Array.isArray(columnValues)) return null;
  return columnValues.find((col) => col.id === columnId) || null;
};

export const extractTextValue = (columnValue, fallback = null) => {
  if (!columnValue) return fallback;
  if (columnValue.text) return columnValue.text;
  if (columnValue.value) {
    try {
      const parsed = JSON.parse(columnValue.value);
      if (parsed?.label) return parsed.label;
      if (parsed?.text) return parsed.text;
      if (parsed?.date) return parsed.date;
    } catch {
      return columnValue.value || fallback;
    }
  }
  return fallback;
};

export const extractDateValue = (columnValue, fallbackDate = null) => {
  if (!columnValue) return fallbackDate;
  if (columnValue.value) {
    try {
      const parsed = JSON.parse(columnValue.value);
      if (parsed?.date) return new Date(parsed.date);
    } catch {}
  }
  if (columnValue.text) {
    const parsedDate = new Date(columnValue.text);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
    return columnValue.text;
  }
  return fallbackDate;
};

export const getStatusBucket = (status) =>
  normalize(status) === 'active' ? 'Active' : 'Non-Active';
