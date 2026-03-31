import { useEffect, useRef } from 'react';

export const useAutoRefresh = (callback, interval = 300000) => {
  const savedCallback = useRef();

  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    if (!interval) return;
    const id = setInterval(() => savedCallback.current?.(), interval);
    return () => clearInterval(id);
  }, [interval]);
};

export const useVisibilityRefresh = (callback) => {
  const savedCallback = useRef();

  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') savedCallback.current?.();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
};
