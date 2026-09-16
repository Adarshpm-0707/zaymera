import { NextRequest, NextResponse } from 'next/server';
import { fetchProductById, updateProduct, deleteProduct } from '@/lib/supabase/services';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] — fetch a single product by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await fetchProductById(id);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] — update a product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { success, data, error } = await updateProduct(id, body);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Update failed' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — delete a product
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { success, error } = await deleteProduct(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Delete failed' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, message: 'Product deleted' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
