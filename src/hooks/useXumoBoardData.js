import { useState, useEffect, useRef } from 'react';
import { GROUP_SIGNUP, GROUP_ACTIVE } from '../utils/boardConfigs';

const normalizeGroup = (title) => (title || '').toLowerCase().trim();

// Reuse the same Netlify proxy as the ISP dashboard
const fetchMondayAPI = async (query, variables = {}) => {
  const response = await fetch('/.netlify/functions/monday-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
};

// Returns the ISO date (YYYY-MM-DD) of the Monday of the week containing `date`
export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

export const getCurrentWeekStart = () => getWeekStart(new Date());

// Build a weekly log map: { 'YYYY-MM-DD': { signUps: [...], activations: [...] } }
const buildWeeklyLog = (signUpItems, activationItems) => {
  const log = {};

  signUpItems.forEach((item) => {
    const week = item.created_at ? getWeekStart(item.created_at) : null;
    if (!week) return;
    if (!log[week]) log[week] = { signUps: [], activations: [] };
    log[week].signUps.push(item);
  });

  activationItems.forEach((item) => {
    // updated_at is the best proxy for when an item moved to the active group
    const week = item.updated_at ? getWeekStart(item.updated_at) : null;
    if (!week) return;
    if (!log[week]) log[week] = { signUps: [], activations: [] };
    log[week].activations.push(item);
  });

  return log;
};

export const useXumoBoardData = (boardConfigs = []) => {
  const [properties, setProperties]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]             = useState(null);
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

      if (!boardConfigs?.length) {
        setProperties([]);
        return;
      }

      const results = [];

      for (let i = 0; i < boardConfigs.length; i++) {
        const config = boardConfigs[i];
        try {
          const query = `
            query ($boardId: ID!) {
              boards(ids: [$boardId]) {
                id name
                items_page(limit: 500) {
                  cursor
                  items {
                    id name created_at updated_at
                    group { id title }
                  }
                }
              }
            }
          `;

          const result = await fetchMondayAPI(query, { boardId: config.id });
          const boards  = result?.data?.boards || [];
          if (!boards.length) {
            results.push(emptyProperty(config));
            setLoadedCount(i + 1);
            continue;
          }

          const board     = boards[0];
          const boardName = config.name || board.name || `Board ${config.id}`;

          let boardItems = board.items_page?.items || [];
          let cursor     = board.items_page?.cursor;

          // Paginate through all items
          while (cursor) {
            const nextQuery = `
              query ($cursor: String!) {
                next_items_page(limit: 500, cursor: $cursor) {
                  cursor
                  items {
                    id name created_at updated_at
                    group { id title }
                  }
                }
              }
            `;
            const nextResult = await fetchMondayAPI(nextQuery, { cursor });
            const nextPage   = nextResult?.data?.next_items_page;
            if (nextPage?.items?.length) {
              boardItems = [...boardItems, ...nextPage.items];
              cursor     = nextPage.cursor;
            } else {
              cursor = null;
            }
          }

          const signUpItems     = boardItems.filter((item) => normalizeGroup(item.group?.title) === GROUP_SIGNUP);
          const activationItems = boardItems.filter((item) => normalizeGroup(item.group?.title) === GROUP_ACTIVE);
          const weeklyLog       = buildWeeklyLog(signUpItems, activationItems);

          results.push({
            boardId:          config.id,
            property:         boardName,
            totalSignUps:     signUpItems.length,
            totalActivations: activationItems.length,
            signUpItems,
            activationItems,
            weeklyLog,
            error:            null,
          });

        } catch (err) {
          console.error(`Board ${config.id} failed:`, err);
          results.push({ ...emptyProperty(config), error: err.message });
        }

        setLoadedCount(i + 1);
        // Small delay between requests to respect Monday.com rate limits
        if (i < boardConfigs.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      setProperties(results);
    } catch (err) {
      console.error('useActivationData error:', err);
      setError('Failed to load activation data. Please try again.');
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

  return {
    properties,
    loading,
    isRefreshing,
    error,
    loadedCount,
    totalCount: boardConfigs.length,
    refetch,
  };
};

const emptyProperty = (config) => ({
  boardId:          config.id,
  property:         config.name || `Board ${config.id}`,
  totalSignUps:     0,
  totalActivations: 0,
  signUpItems:      [],
  activationItems:  [],
  weeklyLog:        {},
  error:            null,
});
