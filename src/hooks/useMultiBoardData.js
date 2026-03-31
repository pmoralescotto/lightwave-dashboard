import { useState, useEffect, useRef } from 'react';
import { getAccessToken } from '../utils/tokenManager';
import {
  getStatusBucket,
  findColumnByTitle,
  getColumnValueById,
  extractTextValue,
  extractDateValue,
} from '../utils/boardConfigs';

const normalize = (value) => (value || '').trim().toLowerCase();

const fetchMondayAPI = async (query, variables = {}) => {
  const token = getAccessToken();
  if (!token) throw new Error('No access token');
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
};

export const useMultiBoardData = (boardConfigs = []) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const hasInitialized = useRef(false);
  const fetchInProgress = useRef(false);

  const fetchAllBoards = async (isRefetch = false) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      isRefetch ? setIsRefreshing(true) : setLoading(true);
      setError(null);
      setLoadedCount(0);

      if (!boardConfigs || boardConfigs.length === 0) {
        setItems([]);
        return;
      }

      const allItems = [];
      const batchSize = 8;

      for (let i = 0; i < boardConfigs.length; i += batchSize) {
        const batch = boardConfigs.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (config) => {
            try {
              const query = `
                query ($boardId: ID!) {
                  boards(ids: [$boardId]) {
                    id name
                    columns { id title type }
                    items_page(limit: 500) {
                      cursor
                      items {
                        id name created_at
                        group { id title }
                        column_values { id text value type }
                      }
                    }
                  }
                }
              `;

              const result = await fetchMondayAPI(query, { boardId: config.id });
              const boards = result?.data?.boards || [];
              if (!boards.length) return [];

              const board = boards[0];
              let boardItems = board.items_page?.items || [];
              let cursor = board.items_page?.cursor;
              const boardColumns = board.columns || [];

              while (cursor) {
                const nextQuery = `
                  query ($cursor: String!) {
                    next_items_page(limit: 500, cursor: $cursor) {
                      cursor
                      items {
                        id name created_at
                        group { id title }
                        column_values { id text value type }
                      }
                    }
                  }
                `;
                const nextResult = await fetchMondayAPI(nextQuery, { cursor });
                const nextPage = nextResult?.data?.next_items_page;
                if (nextPage?.items?.length) {
                  boardItems = [...boardItems, ...nextPage.items];
                  cursor = nextPage.cursor;
                } else {
                  cursor = null;
                }
              }

              const statusColumn = findColumnByTitle(boardColumns, ['status', 'status1', 'statuscolumn']);
              const signUpDateColumn = findColumnByTitle(boardColumns, ['sign-up date', 'signup date', 'signupdate', 'date']);
              const tenantNameColumn = findColumnByTitle(boardColumns, ['tenant name', 'tenantname']);

              const activeItems = boardItems.filter((item) => normalize(item.group?.title) === 'active');

              return activeItems.map((item) => {
                const statusValue = getColumnValueById(item.column_values, statusColumn?.id);
                const signUpDateValue = getColumnValueById(item.column_values, signUpDateColumn?.id);
                const tenantNameValue = getColumnValueById(item.column_values, tenantNameColumn?.id);

                const rawStatus = extractTextValue(statusValue, 'Non-Active');
                const statusBucket = getStatusBucket(rawStatus);
                const signUpDate =
                  extractDateValue(signUpDateValue, null) ||
                  (item.created_at ? new Date(item.created_at) : null);
                const tenantName = extractTextValue(tenantNameValue, null);

                return {
                  id: item.id,
                  name: item.name,
                  property: config.name,
                  propertyId: config.id,
                  group: item.group?.title || 'No Group',
                  createdAt: item.created_at,
                  signUpDate,
                  tenantName,
                  status: rawStatus,
                  statusBucket,
                  columnValues: item.column_values,
                };
              });
            } catch (err) {
              console.error(`Failed to fetch board ${config.name}:`, err);
              return [];
            }
          })
        );

        allItems.push(...batchResults.flat());
        setLoadedCount(i + batch.length);

        if (i + batchSize < boardConfigs.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      setItems(allItems);
    } catch (err) {
      console.error('Failed to fetch boards:', err);
      setError('Failed to load ownership data. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      fetchInProgress.current = false;
    }
  };

  useEffect(() => {
    if (hasInitialized.current || !boardConfigs?.length) return;
    hasInitialized.current = true;
    fetchAllBoards(false);
  }, [boardConfigs]);

  const refetch = () => {
    if (!fetchInProgress.current) {
      hasInitialized.current = false;
      fetchAllBoards(true);
    }
  };

  return { items, loading, isRefreshing, error, loadedCount, totalCount: boardConfigs.length, refetch };
};
