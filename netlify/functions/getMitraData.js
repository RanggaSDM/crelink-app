const { Client } = require('pg');
exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*' };

    try {
        const mitra_id = event.queryStringParameters.id;
        
        // 1. Ambil Proyek milik Mitra ini
        const projects = await client.query('SELECT * FROM projects WHERE mitra_id = $1 ORDER BY id DESC', [mitra_id]);
        
        // 2. Ambil Pelamar yang melamar ke proyek-proyek milik Mitra ini
        const applicants = await client.query(`
            SELECT a.*, p.judul as project_title 
            FROM applications a
            JOIN projects p ON a.project_id = p.id
            WHERE p.mitra_id = $1 AND a.status = 'pending'
        `, [mitra_id]);

        await client.end();
        return { 
            statusCode: 200, headers, 
            body: JSON.stringify({ projects: projects.rows, applicants: applicants.rows }) 
        };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};