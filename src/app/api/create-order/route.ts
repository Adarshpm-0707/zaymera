import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check credentials early to return 401 on auth failure
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay authentication failed: Missing API credentials' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { amount, currency = 'INR', receipt, notes } = body;

    // Validate amount (must be >= 100 paise / ₹1)
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      return NextResponse.json(
        { error: 'Amount is required and must be at least 100 paise (₹1.00)' },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    // Receipt length in Razorpay can be max 40 characters
    const sanitizedReceipt = receipt
      ? String(receipt).slice(0, 40)
      : `rcpt_${Date.now()}`.slice(0, 40);

    const orderOptions: {
      amount: number;
      currency: string;
      receipt: string;
      notes?: Record<string, string>;
    } = {
      amount: Math.round(numericAmount),
      currency: (currency || 'INR').toUpperCase(),
      receipt: sanitizedReceipt,
    };

    if (notes && typeof notes === 'object') {
      orderOptions.notes = notes;
    }

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      id: order.id,
      receipt: order.receipt,
      status: order.status,
      key_id: keyId,
    });
  } catch (error: any) {
    console.error('[Razorpay /api/create-order Error]:', error);

    // Handle authentication failures from Razorpay API
    const statusCode = error?.statusCode || error?.status || 500;
    const errorDescription = error?.error?.description || error?.message || '';
    if (
      statusCode === 401 ||
      (error?.error?.code === 'BAD_REQUEST_ERROR' && errorDescription.toLowerCase().includes('auth'))
    ) {
      return NextResponse.json(
        {
          error: error?.error?.description
            ? `Razorpay authentication failed: ${error.error.description}`
            : 'Razorpay authentication failed. Please verify API credentials.',
        },
        { status: 401 }
      );
    }

    const errorMessage =
      error?.error?.description ||
      error?.message ||
      'Failed to create Razorpay order';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
