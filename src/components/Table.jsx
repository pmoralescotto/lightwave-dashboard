import { useState } from 'react';
import { Box, HStack, Input, Text, Button } from '@chakra-ui/react';

const StatusBadge = ({ value }) => {
  const isActive = value === 'Active';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      background: isActive ? '#dcfce7' : '#f1f5f9',
      color: isActive ? '#15803d' : '#475569',
      border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
    }}>
      {value}
    </span>
  );
};

const RateBadge = ({ value }) => {
  const pct = parseFloat(value) || 0;
  const color = pct >= 70 ? '#15803d' : pct >= 40 ? '#b45309' : '#dc2626';
  const bg   = pct >= 70 ? '#dcfce7' : pct >= 40 ? '#fef3c7' : '#fee2e2';
  const border = pct >= 70 ? '#bbf7d0' : pct >= 40 ? '#fde68a' : '#fecaca';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '700',
      background: bg,
      color,
      border: `1px solid ${border}`,
    }}>
      {value}
    </span>
  );
};

const TableComponent = ({ structure, items }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const pageSize = 50;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const filtered = items.filter((item) =>
    structure.some((col) => {
      if (col.render) return false;
      return String(item[col.key] ?? '').toLowerCase().includes(search.toLowerCase());
    })
  );

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = parseFloat(String(a[sortKey]).replace('%', '')) || String(a[sortKey] ?? '');
        const bv = parseFloat(String(b[sortKey]).replace('%', '')) || String(b[sortKey] ?? '');
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const renderCell = (col, item) => {
    if (col.render) return col.render(item);
    const val = item[col.key];
    if (col.key === 'statusBucket') return <StatusBadge value={val ?? '—'} />;
    if (col.key === 'activationRate') return <RateBadge value={val ?? '0.0%'} />;
    return val ?? '—';
  };

  return (
    <Box>
      <HStack mb="4" justify="space-between" flexWrap="wrap" gap="2">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          maxW="300px"
          size="sm"
        />
        <Text fontSize="sm" color="gray.500">{filtered.length} records</Text>
      </HStack>

      <Box overflowX="auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              {structure.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    minWidth: col.minWidth,
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={structure.length} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  No records found
                </td>
              </tr>
            ) : (
              paged.map((item, rowIndex) => (
                <tr
                  key={item.id || rowIndex}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: rowIndex % 2 === 0 ? 'white' : '#fafafa',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? 'white' : '#fafafa'}
                >
                  {structure.map((col) => (
                    <td key={col.key} style={{ padding: '10px 14px', fontSize: '13px', color: '#334155', minWidth: col.minWidth }}>
                      {renderCell(col, item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Box>

      {totalPages > 1 && (
        <HStack mt="4" justify="center" gap="2">
          <Button size="xs" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <Text fontSize="sm" color="gray.600">{page} / {totalPages}</Text>
          <Button size="xs" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </HStack>
      )}
    </Box>
  );
};

export default TableComponent;
