import { NextResponse } from 'next/server';
import { fetchCategories } from '@/lib/supabase/services';
import { CATEGORY_TILES } from '@/constants/catalog';

// Dynamic rendering — no caching conflicts
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetchCategories();
    const data = (res.data && res.data.length > 0) ? res.data : CATEGORY_TILES;

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    console.error('[API /categories GET]', message);
    return NextResponse.json(
      { success: true, data: CATEGORY_TILES },
      { status: 200 } // Return 200 with fallback so UI always renders
    );
  }
}
