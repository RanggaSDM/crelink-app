const { Client } = require('pg');
exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { project_id, talenta_id, talenta_name, talenta_univ } = JSON.parse(event.body);
        // Cek apakah sudah pernah apply
        const check = await client.query('SELECT * FROM applications WHERE project_id=$1 AND talenta_id=$2', [project_id, talenta_id]);
        if(check.rows.length > 0) {
            await client.end();
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Sudah melamar!" }) };
        }

        await client.query(
            'INSERT INTO applications (project_id, talenta_id, talenta_name, talenta_univ) VALUES ($1, $2, $3, $4)',
            [project_id, talenta_id, talenta_name, talenta_univ]
        );
        await client.end();
        return { statusCode: 200, headers, body: JSON.stringify({ msg: "Lamaran Terkirim!" }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};