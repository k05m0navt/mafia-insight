import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        message: testError.message,
      });
    }

    // Test players table
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(5);

    if (playersError) {
      return NextResponse.json({
        success: false,
        error: 'Players table query failed',
        message: playersError.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        usersCount: testData,
        players: playersData,
      },
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
