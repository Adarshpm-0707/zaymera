import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts, deleteAllProducts } from '@/lib/supabase/services';
import { PRODUCTS_CATALOG } from '@/constants/catalog';

// Dynamic rendering — no caching conflicts
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetchProducts();
    const data = (res.data && res.data.length > 0) ? res.data : PRODUCTS_CATALOG;

    return NextResponse.json(
      { success: true, data, count: data.length },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    console.error('[API /products GET]', message);
    return NextResponse.json(
      { success: false, data: PRODUCTS_CATALOG, error: message },
      { status: 200 } // Return 200 with fallback so client doesn't break
    );
  }
}

export async function DELETE() {
  try {
    await deleteAllProducts();
    return NextResponse.json(
      { success: true, message: 'All products deleted successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete all products';
    console.error('[API /products DELETE]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
