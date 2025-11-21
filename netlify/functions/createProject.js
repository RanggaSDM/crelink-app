const { Client } = require('pg');

exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        // PERUBAHAN 1: Kita ambil 'mitra_id' juga dari data yang dikirim
        const { judul, kategori, budget, deadline, mitra_id } = JSON.parse(event.body);
        
        // PERUBAHAN 2: Kita masukkan 'mitra_id' ke dalam database ($1)
        await client.query(
            'INSERT INTO projects (mitra_id, judul, kategori, budget, deadline) VALUES ($1, $2, $3, $4, $5)',
            [mitra_id, judul, kategori, budget, deadline]
        );
        
        await client.end();
        return { statusCode: 200, headers, body: JSON.stringify({ msg: "Proyek Terbit!" }) };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};