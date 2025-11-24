'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { DynamicUIRenderer } from '@/components/DynamicUIRenderer';
import { useGenerativeUI } from '@/hooks/useGenerativeUI';
import styles from '../../page.module.css';

interface SearchPageProps {
  params: Promise<{
    query: string;
  }>;
}

export default function SearchPage({ params }: SearchPageProps) {
  const router = useRouter();
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const { uiState, isLoading, error, search, updateUI } = useGenerativeUI();

  // URL에서 검색어 추출 및 검색 실행
  useEffect(() => {
    const initSearch = async () => {
      const resolvedParams = await params;
      const decodedQuery = decodeURIComponent(resolvedParams.query);
      setCurrentQuery(decodedQuery);
      await search(decodedQuery);
    };
    initSearch();
  }, [params]);

  const handleSearch = async (searchQuery: string) => {
    // 새 검색어로 URL 이동
    const encodedQuery = encodeURIComponent(searchQuery);
    router.push(`/search/${encodedQuery}`);
  };

  const handleFeedback = async (feedback: string) => {
    await updateUI(currentQuery, feedback);
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <button onClick={handleBackToHome} className={styles.titleLink}>
              Generative UI
            </button>
          </h1>
          <p className={styles.subtitle}>
            검색 결과에 맞는 최적의 UI를 자동으로 생성합니다
          </p>
        </header>

        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
          initialValue={currentQuery}
        />

        {error && <div className={styles.error}>{error}</div>}

        {uiState && (
          <DynamicUIRenderer
            uiState={uiState}
            onFeedback={handleFeedback}
            isLoading={isLoading}
          />
        )}

        {isLoading && !uiState && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <p>검색 중...</p>
          </div>
        )}
      </div>
    </main>
  );
}
