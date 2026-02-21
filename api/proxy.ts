import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    // CRITICAL: This stops Vercel from messing with the payload
    bodyParser: false, 
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Replace this with your actual destination URL
  const TARGET_URL = 'https://angelic-surprise-production.up.railway.app/payments/paynow/result';

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 1. Catch the incoming data stream as a raw Buffer
  const rawBody = await new Promise<Buffer>((resolve, reject) => {
    let chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  try {
    // 2. Forward the exact raw Buffer to your target server
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
        'X-Forwarded-For': (req.headers['x-forwarded-for'] as string) || '',
      },
      body: rawBody, 
    });

    // 3. Read the response from your target server (should be "OK")
    const responseText = await response.text();

    // 4. Send that exact response back to Paynow
    res.setHeader('Content-Type', 'text/plain');
    res.status(response.status).send(responseText);

  } catch (error) {
    console.error('Forwarding Error:', error);
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send('ERROR');
  }
}
