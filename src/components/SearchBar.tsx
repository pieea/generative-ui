'use client';

import { useState, useEffect, FormEvent } from 'react';
import styles from './components.module.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialValue?: string;
}

export function SearchBar({ onSearch, isLoading = false, initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  // initialValue가 변경되면 query 업데이트
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit}>
      <div className={styles.searchInputWrapper}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요..."
          className={styles.searchInput}
          disabled={isLoading}
        />
        <button
          type="submit"
          className={styles.searchButton}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <span className={styles.spinner} />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
