import { NextRequest, NextResponse } from 'next/server';
import { formatErrorResponse } from '@/lib/errors';
import { importProgressManager } from '@/lib/importProgress';

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

    // Get current progress
    const progress = importProgressManager.getCurrentProgress();

    if (!progress) {
      return NextResponse.json({
        message: 'No import operation in progress',
        progress: null,
      });
    }

    return NextResponse.json(progress);
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

    // Start new import
    const progress = importProgressManager.startImport(operation, totalRecords);

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
    const { processedRecords, errors } = body;

    // Update progress
    const progress = importProgressManager.updateProgress(
      processedRecords,
      errors
    );

    if (!progress) {
      return NextResponse.json(
        {
          error: 'No active import',
          message: 'No import operation in progress',
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
    const { action } = body;

    let progress;
    switch (action) {
      case 'complete':
        progress = importProgressManager.completeImport();
        break;
      case 'fail':
        progress = importProgressManager.failImport();
        break;
      case 'cancel':
        progress = importProgressManager.cancelImport();
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
          message: 'No import operation in progress',
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
