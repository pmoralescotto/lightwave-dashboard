import { useState, useEffect, useRef } from 'react';
import { BOARD_CONFIGS } from '../utils/boardConfigs';

const STORAGE_KEY = 'ownership_dashboard_board_configs';
const REMOVED_IDS = ['7684947431', '7484652124', '8401917956'];

// Bump this version string any time BOARD_CONFIGS changes — forces cache reset
const CONFIG_VERSION = BOARD_CONFIGS.map((b) => b.id).join(',');
const VERSION_KEY = 'ownership_dashboard_board_configs_version';

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
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const stored = storage.get(STORAGE_KEY);

    // If hardcoded list changed since last visit, reset to latest hardcoded list
    if (storedVersion !== CONFIG_VERSION) {
      storage.set(STORAGE_KEY, BOARD_CONFIGS);
      localStorage.setItem(VERSION_KEY, CONFIG_VERSION);
      setBoardConfigs(BOARD_CONFIGS);
    } else if (Array.isArray(stored) && stored.length > 0) {
      const filtered = stored.filter((c) => !REMOVED_IDS.includes(c.id));
      if (filtered.length !== stored.length) storage.set(STORAGE_KEY, filtered);
      setBoardConfigs(filtered);
    } else {
      storage.set(STORAGE_KEY, BOARD_CONFIGS);
      localStorage.setItem(VERSION_KEY, CONFIG_VERSION);
      setBoardConfigs(BOARD_CONFIGS);
    }
    setLoading(false);
  }, []);

  const addBoard = (config) => {
    setBoardConfigs((prev) => {
      const updated = [...prev, config];
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  };

  const updateBoard = (id, updates) => {
    setBoardConfigs((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  };

  const removeBoard = (id) => {
    setBoardConfigs((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  };

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
