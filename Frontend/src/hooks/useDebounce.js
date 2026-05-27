import { useState, useEffect } from 'react';
 
/**
 * Debounces a value by the given delay (ms).
 * Returns the debounced value — only updates after the delay has elapsed
 * since the last change. Prevents unnecessary API calls on every keystroke.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
 
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
 
  return debouncedValue;
}