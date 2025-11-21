const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // PENTING: Kita pakai variabel otomatis dari Netlify
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    // Ambil semua data dari tabel projects
    const result = await client.query('SELECT * FROM projects');
    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    console.error('Database Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Gagal ambil data', details: error.message })
    };
  }
};