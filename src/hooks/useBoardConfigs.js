import { useState, useEffect, useRef } from 'react';
import { BOARD_CONFIGS } from '../utils/boardConfigs';

const STORAGE_KEY = 'ownership_dashboard_board_configs';
const REMOVED_IDS = ['7684947431', '7484652124', '8401917956'];

const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

export const useBoardConfigs = () => {
  const [boardConfigs, setBoardConfigs] = useState([]);
  const boardConfigsRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { boardConfigsRef.current = boardConfigs; }, [boardConfigs]);

  useEffect(() => {
    const stored = storage.get(STORAGE_KEY);
    if (Array.isArray(stored) && stored.length > 0) {
      const filtered = stored.filter((c) => !REMOVED_IDS.includes(c.id));
      if (filtered.length !== stored.length) storage.set(STORAGE_KEY, filtered);
      setBoardConfigs(filtered);
    } else {
      setBoardConfigs(BOARD_CONFIGS);
      storage.set(STORAGE_KEY, BOARD_CONFIGS);
    }
    setLoading(false);
  }, []);

  const addBoard = (config) => setBoardConfigs((prev) => [...prev, config]);

  const updateBoard = (id, updates) =>
    setBoardConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const removeBoard = (id) =>
    setBoardConfigs((prev) => prev.filter((c) => c.id !== id));

  const saveBoardConfigs = async () => {
    try {
      storage.set(STORAGE_KEY, boardConfigsRef.current);
      return { success: true };
    } catch (err) {
      setError('Failed to save configurations');
      return { success: false, error: err.message };
    }
  };

  return { boardConfigs, loading, error, addBoard, updateBoard, removeBoard, saveBoardConfigs };
};
