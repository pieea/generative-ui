import { NextRequest, NextResponse } from 'next/server';
import { updateUIFromFeedback } from '@/services/uiGeneratorService';
import { UIState } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentState, feedback } = body as {
      currentState: UIState;
      feedback: string;
    };

    if (!currentState || !feedback) {
      return NextResponse.json(
        { error: '현재 UI 상태와 피드백이 필요합니다.' },
        { status: 400 }
      );
    }

    // 피드백 기반 UI 업데이트
    const updatedState = updateUIFromFeedback(currentState, feedback);

    return NextResponse.json({ uiState: updatedState });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: '피드백 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
