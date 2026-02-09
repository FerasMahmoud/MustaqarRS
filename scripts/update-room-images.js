const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const images = [
  '/room-images/comfort-studio/01-main-bedroom.jpg',
  '/room-images/comfort-studio/02-entertainment-workspace.jpg',
  '/room-images/comfort-studio/03-bed-detail.jpg',
  '/room-images/comfort-studio/04-kitchenette.jpg',
  '/room-images/comfort-studio/05-bedroom-tv.jpg',
  '/room-images/comfort-studio/06-bathroom.jpg',
  '/room-images/comfort-studio/07-wash-area.jpg',
  '/room-images/comfort-studio/08-bedroom-alternate.jpg'
];

const body = JSON.stringify({ images });

const options = {
  hostname: new URL(supabaseUrl).hostname,
  path: '/rest/v1/rooms?slug=eq.comfort-studio',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': body.length,
    'Authorization': `Bearer ${supabaseKey}`,
    'apikey': supabaseKey,
    'Prefer': 'return=representation'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      console.log('✓ Room images updated successfully');
      console.log('✓ Room:', result[0]?.name);
      console.log('✓ Images count:', result[0]?.images?.length);
    } else {
      console.error('Error:', res.statusCode, data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
  process.exit(1);
});

req.write(body);
req.end();
