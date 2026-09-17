import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, scene, reason, imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: '没有图片' });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `${scene}/${Date.now()}_${Math.random().toString(36).slice(2)}.png`;

    const { error: uploadError } = await supabase.storage
      .from('captures')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('captures')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { data, error } = await supabase
      .from('captures')
      .insert([{ username, scene, reason, image_url: imageUrl }])
      .select();

    if (error) throw error;
    res.json({ success: true, capture: data[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
