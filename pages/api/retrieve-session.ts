import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { secret } from '@aws-amplify/backend';

const SKTEST = secret('SKTEST')
console.log('!!!!!!========Has SKTEST secret?', !!SKTEST);

// const stripe = new Stripe('sk_test_Hrs6SAopgFPF0bZXSN3f6ELN', {
//   apiVersion: '2025-08-27.basil',
// });
const stripe = new Stripe(secret('SKTEST') as unknown as string, {
  apiVersion: '2025-08-27.basil',
});


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ message: 'Session ID is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.status(200).json(session);
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ message: 'Error retrieving session' });
  }
}
