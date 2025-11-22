import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { InternalArchitectureController } from '@/adapters/controllers';

const controller = new InternalArchitectureController();

const ValidationSchema = z.object({
  targetRef: z.string().trim().min(1, 'targetRef is required'),
  mode: z.enum(['full', 'incremental']).optional(),
  includeReports: z.boolean().optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const map = await controller.getArchitectureMap();
    return NextResponse.json(map);
  } catch (error) {
    console.error('Failed to generate architecture map', error);
    return NextResponse.json(
      {
        error: 'Failed to generate architecture map',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = ValidationSchema.parse(body);

    const result = await controller.validateArchitecture({
      targetRef: payload.targetRef,
      mode: payload.mode,
      includeReports: payload.includeReports ?? true,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid validation payload',
          details: error.issues,
        },
        { status: 422 }
      );
    }

    console.error('Failed to validate architecture dependencies', error);
    return NextResponse.json(
      {
        error: 'Failed to validate architecture guardrails',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
