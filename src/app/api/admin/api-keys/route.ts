import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Authenticate with admin access
    await withAdminAuth()(request);

    // Return API key management information
    const apiKeys = [
      {
        id: 'admin-key-1',
        name: 'Admin API Key',
        key: 'test-admin-api-key',
        permissions: ['admin', 'read', 'write', 'delete'],
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        isActive: true,
      },
    ];

    return NextResponse.json({
      apiKeys,
      total: apiKeys.length,
    });
  } catch (error) {
    console.error('API keys error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'AUTHORIZATION_ERROR' ? 403 : 500,
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
    // Authenticate with admin access
    await withAdminAuth()(request);

    const body = await request.json();
    const { name, permissions } = body;

    // Generate new API key (in production, use proper key generation)
    const newApiKey = {
      id: `admin-key-${Date.now()}`,
      name: name || 'New API Key',
      key: `generated-key-${Math.random().toString(36).substring(2, 15)}`,
      permissions: permissions || ['read'],
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true,
    };

    return NextResponse.json(newApiKey, { status: 201 });
  } catch (error) {
    console.error('Create API key error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'AUTHORIZATION_ERROR' ? 403 : 500,
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
