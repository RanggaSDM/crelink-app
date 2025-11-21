const { Client } = require('pg');

exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        if (event.httpMethod === 'GET') {
            // Ambil semua chat
            const res = await client.query('SELECT * FROM forum ORDER BY id DESC');
            await client.end();
            return { statusCode: 200, headers, body: JSON.stringify(res.rows) };
        }

        if (event.httpMethod === 'POST') {
            // Posting Chat Baru
            const { user_name, user_role, user_avatar, text } = JSON.parse(event.body);
            await client.query(
                'INSERT INTO forum (user_name, user_role, user_avatar, text) VALUES ($1, $2, $3, $4)',
                [user_name, user_role, user_avatar, text]
            );
            await client.end();
            return { statusCode: 200, headers, body: JSON.stringify({ msg: "Terkirim" }) };
        }

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};