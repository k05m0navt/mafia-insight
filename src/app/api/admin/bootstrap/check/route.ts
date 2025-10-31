import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/bootstrap/check
 * Check if admin bootstrap is available (no admins exist)
 */
export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'admin' },
    });

    return NextResponse.json({
      available: adminCount === 0,
      message:
        adminCount === 0
          ? 'Admin bootstrap is available'
          : 'Admin users already exist',
    });
  } catch (error) {
    console.error('Bootstrap check error:', error);
    return NextResponse.json(
      { error: 'Failed to check bootstrap availability' },
      { status: 500 }
    );
  }
}
