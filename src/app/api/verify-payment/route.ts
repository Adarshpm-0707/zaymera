import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const orderId =
      body.razorpay_order_id ||
      body.order_id ||
      body.orderId;

    const paymentId =
      body.razorpay_payment_id ||
      body.payment_id ||
      body.paymentId;

    const signature =
      body.razorpay_signature ||
      body.signature;

    // Validate missing fields (return 400)
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters. razorpay_order_id, razorpay_payment_id, and razorpay_signature are mandatory.',
        },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyPaymentSignature({
      orderId: String(orderId).trim(),
      paymentId: String(paymentId).trim(),
      signature: String(signature).trim(),
    });

    if (!isValid) {
      // Signature mismatch: return 400, do NOT mark as paid
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed: signature mismatch',
        },
        { status: 400 }
      );
    }

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
        order_id: orderId,
        payment_id: paymentId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Razorpay /api/verify-payment Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error during payment verification',
      },
      { status: 500 }
    );
  }
}
