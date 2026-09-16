import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminOrders, updateOrderStatus } from '@/lib/supabase/services';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// GET /api/orders/[id] — fetch a single order by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, data }, { status: 200 });
      }
    }

    // Fallback: search through all orders
    const { data: allOrders } = await fetchAdminOrders();
    const order = allOrders?.find(o => o.id === id || o.order_number === id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] — update order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { order_status } = body;

    if (!order_status) {
      return NextResponse.json(
        { success: false, error: 'order_status is required in body' },
        { status: 400 }
      );
    }

    const validStatuses = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { success, error } = await updateOrderStatus(id, order_status);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Status update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: `Order status updated to ${order_status}` },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
