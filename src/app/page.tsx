'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { DynamicUIRenderer } from '@/components/DynamicUIRenderer';
import { useGenerativeUI } from '@/hooks/useGenerativeUI';
import styles from './page.module.css';

export default function Home() {
  const [query, setQuery] = useState('');
  const { uiState, isLoading, error, search, updateUI } = useGenerativeUI();

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    await search(searchQuery);
  };

  const handleFeedback = async (feedback: string) => {
    await updateUI(query, feedback);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Generative UI</h1>
          <p className={styles.subtitle}>
            검색 결과에 맞는 최적의 UI를 자동으로 생성합니다
          </p>
        </header>

        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {error && <div className={styles.error}>{error}</div>}

        {uiState && (
          <DynamicUIRenderer
            uiState={uiState}
            onFeedback={handleFeedback}
            isLoading={isLoading}
          />
        )}
      </div>
    </main>
  );
}
