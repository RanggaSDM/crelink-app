const { Client } = require('pg');
exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { user_id, avatar } = JSON.parse(event.body);
        await client.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, user_id]);
        await client.end();
        return { statusCode: 200, headers, body: JSON.stringify({ msg: "Profil Update" }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};