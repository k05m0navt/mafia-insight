import { NextRequest, NextResponse } from 'next/server';
import { formatErrorResponse } from '@/lib/errors';
import { importOrchestrator } from '@/lib/gomafia/import/orchestrator';

export async function GET(request: NextRequest) {
  try {
    // Check authentication via cookie
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please sign in to view import progress',
        },
        { status: 401 }
      );
    }

    // Get all imports from database
    const allImports = await importOrchestrator.getImportHistory(50);

    // Also get active imports from memory
    const activeImports = importOrchestrator.getActiveImports();

    // Merge and deduplicate (active imports take precedence)
    const importMap = new Map<string, (typeof allImports)[0]>();

    // Add all from database
    allImports.forEach((imp) => importMap.set(imp.id, imp));

    // Override with active imports (they have latest state)
    activeImports.forEach((imp) => importMap.set(imp.id, imp));

    const imports = Array.from(importMap.values()).sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // For backward compatibility, also return single progress if there's only one active
    const activeImport =
      activeImports.find((imp) => imp.status === 'RUNNING') || null;

    return NextResponse.json({
      progress: activeImport,
      imports: imports,
    });
  } catch (error) {
    console.error('Import progress error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'AUTHENTICATION_ERROR' ? 401 : 500,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication via cookie
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please sign in to start import',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, totalRecords } = body;

    if (!operation || !totalRecords) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'Operation and totalRecords are required',
        },
        { status: 400 }
      );
    }

    // Start new import using orchestrator
    const importId = await importOrchestrator.startImport(
      operation,
      totalRecords
    );
    const progress = await importOrchestrator.getImport(importId);

    if (!progress) {
      return NextResponse.json(
        {
          error: 'Failed to create import',
          message: 'Could not retrieve import progress',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error('Start import error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'AUTHENTICATION_ERROR' ? 401 : 500,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication via cookie
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please sign in to update progress',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { importId, processedRecords, errors } = body;

    if (!importId) {
      return NextResponse.json(
        {
          error: 'Missing importId',
          message: 'importId is required to update progress',
        },
        { status: 400 }
      );
    }

    // Update progress using orchestrator
    await importOrchestrator.updateProgress(
      importId,
      processedRecords || 0,
      errors || 0
    );
    const progress = await importOrchestrator.getImport(importId);

    if (!progress) {
      return NextResponse.json(
        {
          error: 'No active import',
          message: 'Import not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Update import progress error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'AUTHENTICATION_ERROR' ? 401 : 500,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication via cookie
    const authToken = request.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please sign in to modify import',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { importId, action } = body;

    if (!importId) {
      return NextResponse.json(
        {
          error: 'Missing importId',
          message: 'importId is required',
        },
        { status: 400 }
      );
    }

    let progress;
    switch (action) {
      case 'complete':
        await importOrchestrator.completeImport(importId);
        progress = await importOrchestrator.getImport(importId);
        break;
      case 'fail':
        await importOrchestrator.failImport(importId);
        progress = await importOrchestrator.getImport(importId);
        break;
      case 'cancel':
        await importOrchestrator.cancelImport(importId);
        progress = await importOrchestrator.getImport(importId);
        break;
      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            message: 'Action must be complete, fail, or cancel',
          },
          { status: 400 }
        );
    }

    if (!progress) {
      return NextResponse.json(
        {
          error: 'No active import',
          message: 'Import not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Import action error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'AUTHENTICATION_ERROR' ? 401 : 500,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
