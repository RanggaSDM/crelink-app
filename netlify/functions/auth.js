const { Client } = require('pg');

exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    try {
        const { action, email, password, nama, role } = JSON.parse(event.body);

        if (action === 'login') {
            // Cek Email & Password
            const res = await client.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
            await client.end();
            if (res.rows.length > 0) return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
            return { statusCode: 401, headers, body: JSON.stringify({ error: "Email/Password Salah" }) };
        } 
        
        if (action === 'register') {
            // Daftar User Baru
            await client.query('INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4)', [nama, email, password, role]);
            await client.end();
            return { statusCode: 200, headers, body: JSON.stringify({ msg: "Sukses" }) };
        }

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};