const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Menangani request pre-flight (untuk keamanan browser)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    // Mengambil data proyek dari database
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
      body: JSON.stringify({ error: 'Gagal mengambil data', details: error.message })
    };
  }
};