import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts, deleteAllProducts, createProduct } from '@/lib/supabase/services';
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

// POST /api/products — create a new product (JSON body, no file upload)
// For file uploads use the product form directly which calls createProduct service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.name || !body.price) {
      return NextResponse.json(
        { success: false, error: 'name and price are required' },
        { status: 400 }
      );
    }

    const result = await createProduct({
      name: body.name,
      category: body.category || 'general',
      price: Number(body.price),
      originalPrice: Number(body.originalPrice || body.price),
      purchasedPrice: body.purchasedPrice ? Number(body.purchasedPrice) : undefined,
      image: body.image || '',
      images: Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []),
      tag: body.tag || 'New Arrival',
      description: body.description || '',
      fabric: body.fabric || '',
      work: body.work || '',
      inStock: body.inStock !== false,
      sizes: body.sizes || [
        { size: 'S', inStock: true },
        { size: 'M', inStock: true },
        { size: 'L', inStock: true },
        { size: 'XL', inStock: true },
        { size: 'XXL', inStock: true },
      ],
    });

    return NextResponse.json(result, { status: result.success ? 201 : 500 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    console.error('[API /products POST]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
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
