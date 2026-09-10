import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminOrders, createOrder, getOrderByNumber } from '@/lib/supabase/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');

    if (orderNumber) {
      const order = await getOrderByNumber(orderNumber.trim());
      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: order }, { status: 200 });
    }

    const { data, error } = await fetchAdminOrders();
    if (error) {
      console.error('[API /orders GET] fetchAdminOrders error:', error);
    }
    return NextResponse.json(
      { success: true, data: data || [] },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    console.error('[API /orders GET]', message);
    return NextResponse.json(
      { success: false, data: [], error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body || !body.orderNumber || !body.cartItems || !Array.isArray(body.cartItems)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order payload: orderNumber and cartItems are required' },
        { status: 400 }
      );
    }

    const result = await createOrder(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    console.error('[API /orders POST]', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
