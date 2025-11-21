const { Client } = require('pg');
exports.handler = async (event) => {
    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { app_id, action, mitra_id, talenta_id, project_title } = JSON.parse(event.body);
        const status = action === 'terima' ? 'diterima' : 'ditolak';

        // 1. Update Status Lamaran
        await client.query('UPDATE applications SET status = $1 WHERE id = $2', [status, app_id]);

        // 2. Kirim Notifikasi ke TALENTA
        let notifPesan = `Lamaran Anda di "${project_title}" telah ${status}.`;
        if (action === 'terima') {
            // Ambil Email Mitra
            const resMitra = await client.query('SELECT email FROM users WHERE id = $1', [mitra_id]);
            const emailMitra = resMitra.rows[0].email;
            notifPesan += ` Silakan kirim cv kepada Mitra via email: ${emailMitra}`;
        }
        await client.query('INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)', [talenta_id, notifPesan, action === 'terima' ? 'success' : 'error']);

        // 3. Kirim Notifikasi ke MITRA (Konfirmasi)
        await client.query('INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)', [mitra_id, `Berhasil ${action} pelamar di proyek ${project_title}`, 'success']);

        await client.end();
        return { statusCode: 200, headers, body: JSON.stringify({ msg: "Sukses" }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};