// === GANTI FUNGSI loadTalentaProjects DENGAN INI ===
async function loadTalentaProjects() {
    const container = document.getElementById('talenta-project-list');
    const allContainer = document.getElementById('all-project-list');
    
    // Tampilkan Loading
    const loadingHTML = "<p style='color:white; text-align:center;'>Sedang mengambil data dari database...</p>";
    if(container) container.innerHTML = loadingHTML;
    if(allContainer) allContainer.innerHTML = loadingHTML;

    try {
        // 1. Panggil Backend (Jembatan ke Database)
        const response = await fetch('/.netlify/functions/getProjects');
        
        // 2. Terima Data
        if (!response.ok) throw new Error("Gagal koneksi backend");
        const data = await response.json();

        // 3. Cek Data Kosong
        if(data.length === 0) {
            const empty = "<p>Belum ada proyek tersedia.</p>";
            if(container) container.innerHTML = empty;
            if(allContainer) allContainer.innerHTML = empty;
            return;
        }

        // 4. Render Kartu (Mapping kolom Database: judul, kategori, budget)
        const cardsHTML = data.map(p => `
            <div class="card-item">
                <h4>${p.judul}</h4> <p style="color:#888; font-size:12px;">Deadline: ${p.deadline ? p.deadline.split('T')[0] : '-'}</p>
                <div style="margin: 10px 0;">
                    <span style="background:#eee; padding:5px; border-radius:5px; font-size:12px;">${p.kategori}</span>
                </div>
                <h4 style="color:var(--primary-purple)">Rp ${parseInt(p.budget).toLocaleString('id-ID')}</h4>
                <button class="main-btn" style="width:100%; margin-top:10px;">Apply</button>
            </div>
        `).join('');

        if(container) container.innerHTML = cardsHTML;
        if(allContainer) allContainer.innerHTML = cardsHTML;

    } catch (error) {
        console.error(error);
        if(container) container.innerHTML = "<p style='color:red;'>Gagal memuat data.</p>";
    }
}