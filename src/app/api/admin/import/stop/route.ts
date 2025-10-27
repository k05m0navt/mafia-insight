import { NextRequest, NextResponse } from 'next/server';
import { importOrchestrator } from '@/lib/gomafia/import/orchestrator';
import { z } from 'zod';

const requestSchema = z.object({
  importId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { importId } = requestSchema.parse(body);

    // Check if import exists and is running
    const importProgress = importOrchestrator.getImport(importId);
    if (!importProgress) {
      return NextResponse.json({ error: 'Import not found' }, { status: 404 });
    }

    if (importProgress.status !== 'RUNNING') {
      return NextResponse.json(
        { error: 'Import is not running' },
        { status: 400 }
      );
    }

    // Cancel the import
    await importOrchestrator.cancelImport(importId);

    return NextResponse.json({
      message: 'Import cancelled successfully',
      importId,
    });
  } catch (error) {
    console.error('Error stopping import:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to stop import' },
      { status: 500 }
    );
  }
}
