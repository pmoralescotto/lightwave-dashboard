import { useState, useEffect } from 'react';

const STORAGE_KEY = 'admin_password_hash';

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setHasPassword(!!stored);
    setLoading(false);
  }, []);

  const verifyPassword = async (input) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const hash = await hashPassword(input);
    return hash === stored;
  };

  const setPassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    const hash = await hashPassword(newPassword);
    localStorage.setItem(STORAGE_KEY, hash);
    setHasPassword(true);
    return { success: true };
  };

  return { isAuthenticated, setIsAuthenticated, hasPassword, loading, verifyPassword, setPassword };
};
