import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// 确保在客户端加载Stripe
// const stripe_secret_token = process.env.STRIPE_SECRET_KEY_TEST ?? "";
const stripe_secret_token = process.env.STRIPE_SECRET_KEY_LIVE ?? "";

const stripe = new Stripe(stripe_secret_token, {
  apiVersion: '2025-08-27.basil',
});


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'usd', description = 'Payment for services' } = req.body;
    
    console.log('API: Received payment request:', { amount, currency, description });

    // 验证金额
    if (!amount || amount <= 0) {
      console.log('API: Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // 将金额转换为分，使用Math.round确保精度
    const amountInCents = Math.round(amount * 100);
    console.log('API: Amount in cents:', amountInCents);

    // 验证转换后的金额
    if (amountInCents <= 0) {
      console.log('API: Amount too small after conversion:', amountInCents);
      return res.status(400).json({ message: 'Amount too small' });
    }

    // 验证最小金额（Stripe要求最小50分，即0.50 CAD）
    if (amountInCents < 50) {
      console.log('API: Amount below minimum (50 cents):', amountInCents);
      return res.status(400).json({ message: 'Amount must be at least 0.50 CAD' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: description,
            },
            unit_amount: amountInCents, // 使用转换后的整数金额
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/payment-cancelled`,
    });
    console.log('API: Successfully created session:', session.id);
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('API: Error creating checkout session:', error);
    res.status(500).json({ message: 'Error creating checkout session' });
  }
}
