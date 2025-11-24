import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Generative UI',
  description: '검색 결과에 따라 동적으로 UI를 생성하는 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
