const { Client } = require('pg');
exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { id } = JSON.parse(event.body);
        await client.query('DELETE FROM notifications WHERE id = $1', [id]);
        await client.end();
        return { statusCode: 200, headers, body: JSON.stringify({ msg: "Terhapus" }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};