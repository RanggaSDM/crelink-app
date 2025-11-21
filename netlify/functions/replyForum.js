const { Client } = require('pg');
exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { forum_id, user, text } = JSON.parse(event.body);
        
        // Tambahkan balasan ke dalam array JSON di database
        const newReply = { user, text, time: "Baru saja" };
        
        await client.query(`
            UPDATE forum 
            SET replies = replies || $1::jsonb 
            WHERE id = $2
        `, [JSON.stringify([newReply]), forum_id]);

        await client.end();
        return { statusCode: 200, headers, body: JSON.stringify({ msg: "Terkirim" }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};