'use client';

import { useState, FormEvent } from 'react';
import styles from './components.module.css';

interface FeedbackInputProps {
  onSubmit: (feedback: string) => void;
  isLoading?: boolean;
}

const suggestionExamples = [
  '프로필/위키로 보여줘',
  '캐러셀로 보여줘',
  '갤러리 형태로 보여줘',
  '타임라인으로 보여줘',
  '큰 이미지로 보여줘',
  '리스트 형태로 보여줘',
  '그리드 형태로 보여줘',
  '최신순으로 정렬해줘',
];

export function FeedbackInput({ onSubmit, isLoading = false }: FeedbackInputProps) {
  const [feedback, setFeedback] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (feedback.trim() && !isLoading) {
      onSubmit(feedback.trim());
      setFeedback('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSubmit(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={styles.feedbackContainer}>
      <div className={styles.feedbackHeader}>
        <span className={styles.feedbackLabel}>UI 조정하기</span>
        <button
          type="button"
          className={styles.suggestionToggle}
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          {showSuggestions ? '접기' : '예시 보기'}
        </button>
      </div>

      {showSuggestions && (
        <div className={styles.suggestions}>
          {suggestionExamples.map((suggestion, index) => (
            <button
              key={index}
              className={styles.suggestionChip}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form className={styles.feedbackForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="원하는 UI 변경사항을 입력하세요..."
          className={styles.feedbackInput}
          disabled={isLoading}
        />
        <button
          type="submit"
          className={styles.feedbackButton}
          disabled={isLoading || !feedback.trim()}
        >
          적용
        </button>
      </form>
    </div>
  );
}
