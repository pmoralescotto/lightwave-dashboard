/**
 * Netlify scheduled function — runs every Monday at 9 AM EST
 * Reads active count + pending sign-ups from all 32 property boards
 * and writes the totals into the ISP Weekly Active Summary board.
 *
 * Summary board ID : 18433081282
 * Columns          : numeric_mm7m9vzx (Active Count)
 *                    numeric_mm7m70qj (Pending Sign-ups)
 *                    date_mm7m2x8a    (Last Updated)
 */

const MONDAY_API     = 'https://api.monday.com/v2';
const SUMMARY_BOARD  = '18433081282';
const COL_ACTIVE     = 'numeric_mm7m9vzx';
const COL_PENDING    = 'numeric_mm7m70qj';
const COL_UPDATED    = 'date_mm7m2x8a';

const GROUP_SIGNUP = [
  'incoming reponses from property',
  'incoming responses from property',
  'new-sign up',
  'new sign up',
];
const GROUP_ACTIVE = ['active'];

// board ID → summary item ID (created 2026-09-28)
const PROPERTY_MAP = [
  { boardId: '18381708169', summaryItemId: '13154487538', name: '52 at Park' },
  { boardId: '18407051928', summaryItemId: '13154479027', name: 'Allapattah Gardens' },
  { boardId: '10062266317', summaryItemId: '13154454675', name: 'Bishop Woods' },
  { boardId: '18416374771', summaryItemId: '13154493306', name: 'Brookside Crossing' },
  { boardId: '9043871935',  summaryItemId: '13154494063', name: 'Canyons' },
  { boardId: '8611750964',  summaryItemId: '13154477548', name: 'Chippenham Internet' },
  { boardId: '9985052982',  summaryItemId: '13154454751', name: 'Cottonwood Ranch' },
  { boardId: '18414517915', summaryItemId: '13154468812', name: 'Cresta Ranch' },
  { boardId: '18403168884', summaryItemId: '13154478911', name: 'Cypress Oaks' },
  { boardId: '6029993160',  summaryItemId: '13154488710', name: 'Douglas Pointe' },
  { boardId: '18281914075', summaryItemId: '13154478388', name: 'Gunsmoke' },
  { boardId: '18420317504', summaryItemId: '13154468324', name: 'Herrington Mills' },
  { boardId: '18393354102', summaryItemId: '13154468853', name: 'Huntington Reserve' },
  { boardId: '10023416454', summaryItemId: '13154478387', name: 'Ironwood Ranch' },
  { boardId: '9442087468',  summaryItemId: '13154488335', name: 'Leon Creek' },
  { boardId: '18415799052', summaryItemId: '13154488336', name: 'Marshall Pointe' },
  { boardId: '18414517422', summaryItemId: '13154494374', name: 'Mesquite Trails' },
  { boardId: '18396208671', summaryItemId: '13154446947', name: 'Northside' },
  { boardId: '18381733431', summaryItemId: '13154478500', name: 'Oakwood Trails Apts' },
  { boardId: '18409472935', summaryItemId: '13154468647', name: 'Pearsall Park' },
  { boardId: '7743016362',  summaryItemId: '13154493361', name: 'Pershing Pointe' },
  { boardId: '9453669960',  summaryItemId: '13154488584', name: 'Residences at Chestnut' },
  { boardId: '18413059714', summaryItemId: '13154468760', name: 'Sageland' },
  { boardId: '18382737940', summaryItemId: '13154488925', name: 'Salix on the Vine' },
  { boardId: '18407053360', summaryItemId: '13154493386', name: 'Santa Clara I' },
  { boardId: '18407053038', summaryItemId: '13154493789', name: 'Santa Clara II' },
  { boardId: '18393737973', summaryItemId: '13154477442', name: 'Sea Breeze' },
  { boardId: '8953984507',  summaryItemId: '13154478804', name: 'Sunrise Commons' },
  { boardId: '18401423601', summaryItemId: '13154478610', name: 'The Victoria at Huxley' },
  { boardId: '18401423458', summaryItemId: '13154493387', name: 'The View at Huxley' },
  { boardId: '18403282432', summaryItemId: '13154478611', name: 'Tuscany Lakes Internet' },
  { boardId: '18409193740', summaryItemId: '13154478468', name: 'Zephyr Pointe' },
];

const normalizeGroup = (t) => (t || '').toLowerCase().trim();
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function mondayRequest(token, query, variables = {}) {
  const res = await fetch(MONDAY_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Monday API ${res.status}`);
  return res.json();
}

async function fetchBoardCounts(token, boardId) {
  const ITEM_QUERY = `
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        columns { id title type }
        items_page(limit: 500) {
          cursor
          items {
            group { title }
            column_values { id text value }
          }
        }
      }
    }
  `;
  const NEXT_QUERY = `
    query ($cursor: String!) {
      next_items_page(limit: 500, cursor: $cursor) {
        cursor
        items {
          group { title }
          column_values { id text value }
        }
      }
    }
  `;

  const result = await mondayRequest(token, ITEM_QUERY, { boardId });
  const board  = result?.data?.boards?.[0];
  if (!board) return { activeCount: 0, pendingCount: 0 };

  const columns = board.columns || [];
  const completionCol = columns.find((c) => {
    const t = c.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return ['completiondate', 'datecompleted', 'completeddate', 'activationdate'].includes(t);
  });
  const completionColId = completionCol?.id || null;

  let items  = board.items_page?.items || [];
  let cursor = board.items_page?.cursor;

  while (cursor) {
    const next = await mondayRequest(token, NEXT_QUERY, { cursor });
    const page = next?.data?.next_items_page;
    if (page?.items?.length) { items = [...items, ...page.items]; cursor = page.cursor; }
    else cursor = null;
  }

  let activeCount  = 0;
  let pendingCount = 0;

  items.forEach((item) => {
    const group = normalizeGroup(item.group?.title);
    if (GROUP_SIGNUP.includes(group)) {
      pendingCount++;
    } else if (GROUP_ACTIVE.includes(group)) {
      if (!completionColId) {
        activeCount++;
      } else {
        const col = item.column_values?.find((c) => c.id === completionColId);
        if (col?.text || col?.value) activeCount++;
      }
    }
  });

  return { activeCount, pendingCount };
}

async function updateSummaryItem(token, summaryItemId, activeCount, pendingCount, today) {
  const mutation = `
    mutation ($itemId: ID!, $boardId: ID!, $values: JSON!) {
      change_multiple_column_values(item_id: $itemId, board_id: $boardId, column_values: $values) {
        id
      }
    }
  `;
  const values = JSON.stringify({
    [COL_ACTIVE]:  String(activeCount),
    [COL_PENDING]: String(pendingCount),
    [COL_UPDATED]: { date: today },
  });
  await mondayRequest(token, mutation, {
    itemId:  summaryItemId,
    boardId: SUMMARY_BOARD,
    values,
  });
}

const handler = async () => {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    console.error('MONDAY_API_TOKEN not set');
    return { statusCode: 500 };
  }

  const today = new Date().toISOString().split('T')[0];
  const results = [];

  for (const prop of PROPERTY_MAP) {
    try {
      console.log(`Fetching ${prop.name}...`);
      const { activeCount, pendingCount } = await fetchBoardCounts(token, prop.boardId);
      await updateSummaryItem(token, prop.summaryItemId, activeCount, pendingCount, today);
      results.push({ name: prop.name, activeCount, pendingCount, status: 'ok' });
      console.log(`  ${prop.name}: ${activeCount} active, ${pendingCount} pending`);
    } catch (err) {
      console.error(`  ${prop.name} failed:`, err.message);
      results.push({ name: prop.name, status: 'error', error: err.message });
    }
    await delay(400); // respect Monday.com rate limits
  }

  console.log('Summary update complete:', JSON.stringify(results, null, 2));
  return { statusCode: 200 };
};

// Schedule is defined in netlify.toml — this handler runs both on schedule
// and when called via HTTP POST for manual/on-demand runs.
exports.handler = async (event) => {
  // Block everything except POST and scheduled invocations
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  return handler(event);
};
