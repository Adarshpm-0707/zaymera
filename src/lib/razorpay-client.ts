import { RazorpayOptions, RazorpaySuccessResponse, RazorpayFailureResponse } from '@/types/razorpay';

/**
 * Ensures Razorpay Checkout script is loaded on the client side.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }

    if (window.Razorpay) {
      return resolve(true);
    }

    // Check if script element already exists in document
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface CheckoutPayload {
  amountInPaise: number;
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    serverVerification: any;
  }) => void;
  onError: (errorMessage: string) => void;
  onDismiss?: () => void;
}

/**
 * Performs end-to-end Razorpay checkout:
 * 1. Calls /api/create-order to create order on server
 * 2. Launches Razorpay Standard Checkout modal
 * 3. On successful payment, calls /api/verify-payment to verify signature
 * 4. Calls onSuccess / onError / onDismiss callbacks
 */
export async function openRazorpayCheckout({
  amountInPaise,
  currency = 'INR',
  receipt,
  name = 'Zaymera Boutique',
  description = 'Online Fashion Order',
  notes,
  prefill,
  onSuccess,
  onError,
  onDismiss,
}: CheckoutPayload): Promise<void> {
  try {
    // 1. Ensure Razorpay script is available
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
    }

    // 2. Validate amount >= 100 paise (₹1)
    if (amountInPaise < 100) {
      throw new Error('Minimum payable amount is ₹1.00 (100 paise).');
    }

    // 3. Request order creation from our backend
    const createOrderRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      }),
    });

    const orderData = await createOrderRes.json();

    if (!createOrderRes.ok || !orderData.order_id) {
      throw new Error(orderData.error || 'Failed to initialize payment order with server.');
    }

    const keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      throw new Error('Razorpay public key (NEXT_PUBLIC_RAZORPAY_KEY_ID) is missing.');
    }

    // 4. Configure Razorpay modal
    const options: RazorpayOptions = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency || currency,
      name,
      description,
      order_id: orderData.order_id,
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || '',
      },
      notes: notes || {},
      theme: {
        color: '#9B2242', // Zaymera Brand Velvet Crimson
      },
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          // 5. Send verification payload to backend
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            onError(verifyData.error || 'Payment verification failed on the server.');
            return;
          }

          // Signature verified successfully!
          onSuccess({
            ...response,
            serverVerification: verifyData,
          });
        } catch (verifyErr: any) {
          onError(verifyErr?.message || 'Error occurred during payment verification.');
        }
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (failResponse: RazorpayFailureResponse) => {
      const msg = failResponse?.error?.description || 'Payment was unsuccessful or cancelled.';
      onError(msg);
    });

    rzp.open();
  } catch (err: any) {
    console.error('[Razorpay Checkout Error]:', err);
    onError(err?.message || 'Unable to open payment checkout.');
  }
}
