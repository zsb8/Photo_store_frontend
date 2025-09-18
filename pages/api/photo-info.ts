import type { NextApiRequest, NextApiResponse } from 'next';

const urlprefix = 'ji4ct5zze5';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { id } = req.body as { id?: string };
        if (!id) {
            return res.status(400).json({ message: 'Missing id' });
        }

        const foo = process.env.foo || '';
        console.log('!!!!!!!!=======photo-info.ts env foo:', foo);
        const photoInfoUrl = `https://${urlprefix}.execute-api.us-east-1.amazonaws.com/photo_info`;

        const response = await fetch(photoInfoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // If your backend expects a header or token, include it here
                ...(foo ? { 'x-foo': foo } : {}),
            },
            body: JSON.stringify({ id }),
        });

        const result = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('photo-info API error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


