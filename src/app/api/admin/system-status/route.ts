import { NextResponse } from 'next/server';
import { collectPerformanceMetrics } from '@/lib/monitoring/metrics';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Get performance metrics
    const performance = await collectPerformanceMetrics();

    // Get database connection status
    const dbStatus = await prisma.$queryRaw`
      SELECT 1 as connected
    `.catch(() => null);

    // Calculate uptime percentage (simplified - would need to track actual uptime)
    const uptimeHours = performance.uptime / 3600;
    const uptimePercentage = uptimeHours > 24 ? 99.9 : (uptimeHours / 24) * 100;

    // Format response time
    const responseTime =
      performance.averageResponseTime < 1000
        ? `${performance.averageResponseTime.toFixed(1)}ms`
        : `${(performance.averageResponseTime / 1000).toFixed(2)}s`;

    return NextResponse.json({
      status: dbStatus ? 'Online' : 'Offline',
      uptime: `${uptimePercentage.toFixed(1)}%`,
      averageResponse: responseTime,
      memoryUsage: `${performance.memoryUsage.toFixed(1)}MB`,
    });
  } catch (error) {
    console.error('Failed to get system status:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}
