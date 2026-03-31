import { useState } from 'react';
import { Box, HStack, Input, Text, Button } from '@chakra-ui/react';

const TableComponent = ({ structure, items }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const filtered = items.filter((item) =>
    structure.some((col) => {
      if (col.render) return false;
      return String(item[col.key] ?? '').toLowerCase().includes(search.toLowerCase());
    })
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

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
        <Text fontSize="sm" color="gray.500">
          {filtered.length} records
        </Text>
      </HStack>

      <Box overflowX="auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              {structure.map((col) => (
                <th
                  key={col.key}
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
                  }}
                >
                  {col.label}
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
                  }}
                >
                  {structure.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '10px 14px',
                        fontSize: '13px',
                        color: '#334155',
                        minWidth: col.minWidth,
                      }}
                    >
                      {col.render ? col.render(item) : (item[col.key] ?? '—')}
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
          <Button size="xs" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <Text fontSize="sm" color="gray.600">{page} / {totalPages}</Text>
          <Button size="xs" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default TableComponent;
