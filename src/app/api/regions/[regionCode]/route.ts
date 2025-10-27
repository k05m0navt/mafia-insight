import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const paramsSchema = z.object({
  regionCode: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ regionCode: string }> }
) {
  try {
    // Validate parameters
    const resolvedParams = await params;
    const { regionCode } = paramsSchema.parse(resolvedParams);

    // Parse and validate request body
    const body = await request.json();
    const updateData = updateSchema.parse(body);

    // Check if region exists
    const existingRegion = await prisma.region.findUnique({
      where: { code: regionCode },
    });

    if (!existingRegion) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    }

    // Update region
    const updatedRegion = await prisma.region.update({
      where: { code: regionCode },
      data: updateData,
    });

    // Transform response
    const response = {
      code: updatedRegion.code,
      name: updatedRegion.name,
      country: updatedRegion.country,
      isActive: updatedRegion.isActive,
      playerCount: updatedRegion.playerCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating region:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update region' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ regionCode: string }> }
) {
  try {
    // Validate parameters
    const resolvedParams = await params;
    const { regionCode } = paramsSchema.parse(resolvedParams);

    // Check if region exists
    const existingRegion = await prisma.region.findUnique({
      where: { code: regionCode },
    });

    if (!existingRegion) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    }

    // Check if region has players
    if (existingRegion.playerCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete region with existing players' },
        { status: 400 }
      );
    }

    // Delete region
    await prisma.region.delete({
      where: { code: regionCode },
    });

    return NextResponse.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete region' },
      { status: 500 }
    );
  }
}
