'use client';

import { useState, useCallback } from 'react';
import { UIState, GenerateUIResponse } from '@/types';

interface UseGenerativeUIReturn {
  uiState: UIState | null;
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  updateUI: (query: string, feedback: string) => Promise<void>;
  reset: () => void;
}

export function useGenerativeUI(): UseGenerativeUIReturn {
  const [uiState, setUIState] = useState<UIState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '검색에 실패했습니다.');
      }

      const data: GenerateUIResponse = await response.json();
      setUIState(data.uiState);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUI = useCallback(async (query: string, feedback: string) => {
    if (!uiState) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentState: uiState,
          feedback,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'UI 업데이트에 실패했습니다.');
      }

      const data = await response.json();
      setUIState(data.uiState);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [uiState]);

  const reset = useCallback(() => {
    setUIState(null);
    setError(null);
  }, []);

  return {
    uiState,
    isLoading,
    error,
    search,
    updateUI,
    reset,
  };
}
