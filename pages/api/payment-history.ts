import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_Hrs6SAopgFPF0bZXSN3f6ELN', {
  apiVersion: '2025-08-27.basil',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { limit = 10, starting_after } = req.query;

    // 获取支付记录
    const sessions = await stripe.checkout.sessions.list({
      limit: Number(limit),
      starting_after: starting_after as string,
    });

    // 格式化响应数据
    const formattedSessions = sessions.data.map(session => ({
      id: session.id,
      amount: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
             description: session.line_items?.data[0]?.description || 'Purchase Photo服务',
      created: session.created,
      customer_email: session.customer_details?.email,
    }));

    res.status(200).json({
      sessions: formattedSessions,
      hasMore: sessions.has_more,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
}
