import { NextRequest, NextResponse } from 'next/server';

import { InternalArchitectureController } from '@/adapters/controllers';

const controller = new InternalArchitectureController();

export async function GET(_request: NextRequest) {
  try {
    const guide = await controller.getOnboardingGuide();
    return NextResponse.json(guide);
  } catch (error) {
    console.error('Failed to fetch architecture onboarding guide', error);
    return NextResponse.json(
      {
        error: 'Failed to load architecture onboarding guide',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
