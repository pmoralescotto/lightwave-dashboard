import { useState, useEffect, useRef } from 'react';
import {
  GROUP_SIGNUP_NAMES, GROUP_ACTIVE_NAMES,
  findColumnByTitle, getColumnValueById, extractDateValue,
} from '../utils/boardConfigs';

const normalizeGroup = (title) => (title || '').toLowerCase().trim();

const fetchMondayAPI = async (query, variables = {}) => {
  const response = await fetch('/.netlify/functions/monday-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
};

export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

export const getCurrentWeekStart = () => getWeekStart(new Date());

const toIso = (date) => (date instanceof Date ? date.toISOString() : date);

const buildWeeklyLog = (signUpItems, activationItems, signUpDateColId, completionColId) => {
  const log = {};

  signUpItems.forEach((item) => {
    let dateStr = item.created_at;
    if (signUpDateColId) {
      const colVal = getColumnValueById(item.column_values, signUpDateColId);
      const d = extractDateValue(colVal, null);
      if (d) dateStr = toIso(d);
    }
    const week = dateStr ? getWeekStart(dateStr) : null;
    if (!week) return;
    if (!log[week]) log[week] = { signUps: [], activations: [] };
    log[week].signUps.push(item);
  });

  activationItems.forEach((item) => {
    let dateStr = item.updated_at;
    if (completionColId) {
      const colVal = getColumnValueById(item.column_values, completionColId);
      const d = extractDateValue(colVal, null);
      if (d) dateStr = toIso(d);
    }
    const week = dateStr ? getWeekStart(dateStr) : null;
    if (!week) return;
    if (!log[week]) log[week] = { signUps: [], activations: [] };
    log[week].activations.push(item);
  });

  return log;
};

export const useXumoBoardData = (boardConfigs = []) => {
  const [properties, setProperties]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]               = useState(null);
  const [loadedCount, setLoadedCount]   = useState(0);
  const hasInitialized  = useRef(false);
  const fetchInProgress = useRef(false);

  const fetchAllBoards = async (isRefetch = false) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      isRefetch ? setIsRefreshing(true) : setLoading(true);
      setError(null);
      setLoadedCount(0);

      if (!boardConfigs?.length) { setProperties([]); return; }

      const results = [];

      for (let i = 0; i < boardConfigs.length; i++) {
        const config = boardConfigs[i];
        try {
          const query = `
            query ($boardId: ID!) {
              boards(ids: [$boardId]) {
                id name
                columns { id title type }
                items_page(limit: 500) {
                  cursor
                  items {
                    id name created_at updated_at
                    group { id title }
                    column_values { id text value type }
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

          const board        = boards[0];
          const boardName    = config.name || board.name || `Board ${config.id}`;
          const boardColumns = board.columns || [];

          // Sign-up date column (when the property submitted the sign-up)
          const signUpDateCol = findColumnByTitle(boardColumns, [
            'sign-up date', 'signup date', 'signupdate', 'sign up date', 'date',
          ]);

          // Completion date column (when the unit was switched to Active)
          const completionCol = findColumnByTitle(boardColumns, [
            'completion date', 'completiondate', 'date completed',
            'completed date', 'activation date', 'active date',
          ]);

          let boardItems = board.items_page?.items || [];
          let cursor     = board.items_page?.cursor;

          while (cursor) {
            const nextQuery = `
              query ($cursor: String!) {
                next_items_page(limit: 500, cursor: $cursor) {
                  cursor
                  items {
                    id name created_at updated_at
                    group { id title }
                    column_values { id text value type }
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

          const signUpItems     = boardItems.filter((item) => GROUP_SIGNUP_NAMES.includes(normalizeGroup(item.group?.title)));
          const activationItems = boardItems.filter((item) => GROUP_ACTIVE_NAMES.includes(normalizeGroup(item.group?.title)));

          const weeklyLog = buildWeeklyLog(
            signUpItems,
            activationItems,
            signUpDateCol?.id || null,
            completionCol?.id || null,
          );

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

  return { properties, loading, isRefreshing, error, loadedCount, totalCount: boardConfigs.length, refetch };
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
