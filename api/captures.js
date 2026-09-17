import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabase
    .from('captures')
    .select('*')
    .order('captured_at', { ascending: false })
    .limit(300);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
