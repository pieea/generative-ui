'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { ExampleQueries } from '@/components/ExampleQueries';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();

  const handleSearch = (searchQuery: string) => {
    // 검색어를 URL 경로로 인코딩하여 검색 페이지로 이동
    const encodedQuery = encodeURIComponent(searchQuery);
    router.push(`/search/${encodedQuery}`);
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

        <SearchBar onSearch={handleSearch} isLoading={false} />

        <ExampleQueries onSelect={handleSearch} isLoading={false} />
      </div>
    </main>
  );
}
