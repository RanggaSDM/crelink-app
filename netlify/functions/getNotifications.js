const { Client } = require('pg');

exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*' };

    try {
        const { user_id } = event.queryStringParameters;
        
        // Ambil notifikasi user ini, urutkan dari yang paling baru
        const res = await client.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
        
        await client.end();
        return { statusCode: 200, headers, body: JSON.stringify(res.rows) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};