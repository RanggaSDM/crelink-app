// === STATE MANAGEMENT ===
let currentUser = null; 
let selectedCategory = null;
let userAvatarUrl = "images/avatar.png"; 

// === DATA DUMMY (FALLBACK) ===
let globalProjects = []; // Nanti diisi dari database

// Data Request Pelamar untuk Mitra
let mitraRequests = [
    { id: 101, name: "Nasa Fatimah Caesara", univ: "Universitas Udayana", age: "22 Tahun", project: "Editor Video Tiktok/Reels" },
    { id: 102, name: "I Gusti Agung Rangga", univ: "Universitas Udayana", age: "22 Tahun", project: "Editor Video Tiktok/Reels" }
];

// Data Forum
let globalForum = [
    { 
        id: 1, user: "Freelancer123", userImg: "images/avatar.png", text: "Gimana cara nentuin harga desain buat UMKM?", time: "10 menit lalu",
        replies: [ { user: "SeniorDesain", text: "Hitung jam kerja dikali rate kamu bro.", time: "5 menit lalu" } ]
    }
];

// === 1. NAVIGASI & AUTH (PENTING AGAR TIDAK STUCK) ===

function goToLogin() {
    // Sembunyikan Landing Page
    const landing = document.getElementById('landing-page');
    landing.classList.add('hidden');
    landing.classList.remove('active-section');
    
    // Munculkan Halaman Login
    const auth = document.getElementById('auth-section');
    auth.classList.remove('hidden');
}

function setAuthRole(role) {
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    const buttons = document.querySelectorAll('.role-btn');
    if(role === 'mitra') buttons[0].classList.add('active');
    else buttons[1].classList.add('active');
}

function handleLogin() {
    const activeBtn = document.querySelector('.role-btn.active');
    currentUser = activeBtn.innerText === 'Mitra' ? 'mitra' : 'talenta';
    
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    // Set Avatar
    document.getElementById('header-profile-pic').src = userAvatarUrl;
    document.getElementById('preview-img').src = userAvatarUrl;
    
    initDashboard();
}

function handleLogout() { location.reload(); }

function toggleAuth(mode) {
    const login = document.getElementById('login-form');
    const reg = document.getElementById('register-form');
    if(mode === 'register') { login.classList.add('hidden'); reg.classList.remove('hidden'); }
    else { login.classList.remove('hidden'); reg.classList.add('hidden'); }
}

// === 2. DASHBOARD LOGIC ===

function initDashboard() {
    document.getElementById('welcome-msg').innerText = `Hallo, ${currentUser === 'mitra' ? 'Mitra' : 'Talenta'}!`;
    
    if(currentUser === 'mitra') {
        // Tampilan Mitra
        document.getElementById('menu-academy').style.display = 'none';
        document.getElementById('top-search-bar').style.display = 'none';
        navigate('dashboard');
        
        loadMitraRequests(); // Muat pelamar
        loadMitraProjects(); // Muat proyek sendiri
    } else {
        // Tampilan Talenta
        document.getElementById('menu-academy').style.display = 'flex';
        document.getElementById('top-search-bar').style.display = 'block';
        navigate('dashboard');
        
        loadTalentaProjects(); // AMBIL DARI DATABASE NEON
    }
}

function navigate(page) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active-menu'));
    
    let targetId = 'view-' + page;
    if(page === 'dashboard') targetId = currentUser === 'mitra' ? 'view-dashboard-mitra' : 'view-dashboard-talenta';
    else if (page === 'forum') loadForum();
    else if (page === 'proyek' && currentUser === 'talenta') loadTalentaProjects(); // Load DB saat klik proyek

    const targetEl = document.getElementById(targetId);
    if(targetEl) targetEl.classList.remove('hidden');
}

// === 3. INTEGRASI DATABASE NEON (TALENTA) ===

async function loadTalentaProjects() {
    const container = document.getElementById('talenta-project-list');
    const allContainer = document.getElementById('all-project-list');
    
    // Tampilkan Loading
    const loadingHTML = "<p style='color:white; text-align:center;'>Sedang mengambil data dari database...</p>";
    if(container) container.innerHTML = loadingHTML;
    if(allContainer) allContainer.innerHTML = loadingHTML;

    try {
        // PANGGIL BACKEND NETLIFY
        const response = await fetch('/.netlify/functions/getProjects');
        
        if (!response.ok) throw new Error("Gagal koneksi backend");
        const data = await response.json();

        // Cek Kosong
        if(data.length === 0) {
            const empty = "<p>Belum ada proyek tersedia.</p>";
            if(container) container.innerHTML = empty;
            if(allContainer) allContainer.innerHTML = empty;
            return;
        }

        // Render Data Database
        const cardsHTML = data.map(p => `
            <div class="card-item">
                <h4>${p.judul}</h4>
                <p style="color:#888; font-size:12px;">Deadline: ${p.deadline ? p.deadline.split('T')[0] : '-'}</p>
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
        const errMsg = "<p style='color:red;'>Gagal memuat data (Cek console).</p>";
        if(container) container.innerHTML = errMsg;
    }
}

// === 4. FITUR MITRA (SIMULASI LOKAL) ===

function loadMitraRequests() {
    const container = document.getElementById('mitra-applicant-list');
    if(mitraRequests.length === 0) { container.innerHTML = "<p>Tidak ada permintaan.</p>"; return; }
    container.innerHTML = mitraRequests.map(req => `
        <div class="applicant-card">
            <div class="app-header">
                <h4>${req.name}</h4>
                <p>${req.univ}</p>
                <p style="font-size:11px; color:#888;">Usia: ${req.age}</p>
            </div>
            <div style="margin: 5px 0;"> <span class="app-meta">Proyek: ${req.project}</span> </div>
            <div class="app-actions">
                <button class="btn-accept" onclick="handleRequest(${req.id}, 'terima')">Terima</button>
                <button class="btn-reject" onclick="handleRequest(${req.id}, 'tolak')">Tolak</button>
            </div>
        </div>
    `).join('');
}

function handleRequest(id, action) {
    alert(`Pelamar ${action === 'terima' ? 'Diterima' : 'Ditolak'}!`);
    mitraRequests = mitraRequests.filter(r => r.id !== id);
    loadMitraRequests();
}

function loadMitraProjects() {
    // Mitra masih pakai data dummy lokal untuk simulasi
    // (Nanti bisa kita sambungkan ke DB juga untuk fitur POST)
    const container = document.getElementById('mitra-active-projects');
    const dummyMitraProj = [
        { id: 99, title: "Editor Video Tiktok", deadline: "2025-11-20", budget: 750000 }
    ];
    container.innerHTML = dummyMitraProj.map(p => `
        <div class="card-item" style="margin-bottom:10px;">
            <h4>${p.title}</h4>
            <p style="color:#888; font-size:12px;">Deadline: ${p.deadline}</p>
            <p style="color:var(--primary-purple); font-weight:bold;">Rp ${p.budget.toLocaleString()}</p>
            <button class="main-btn" onclick="alert('Hapus Proyek')" style="padding:5px; background:red; font-size:12px; margin-top:5px;">Hapus</button>
        </div>
    `).join('');
}

function publishProject() {
    alert("Fitur Publish akan segera hadir menggunakan Database!");
}

function selectCategory(element, catName) {
    document.querySelectorAll('.cat-item').forEach(el => {
        el.classList.remove('active');
        el.classList.add('dimmed');
    });
    element.classList.remove('dimmed');
    element.classList.add('active');
    selectedCategory = catName;
}

// === 5. FORUM & UTILS ===

function loadForum() {
    const container = document.getElementById('forum-list-container');
    container.innerHTML = globalForum.map((post, index) => `
        <div class="forum-card" style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px; margin-bottom:15px;">
            <div style="display:flex; gap:10px; align-items:flex-start;">
                <img src="${post.userImg}" style="width:40px; height:40px; border-radius:50%; background:white;">
                <div style="width:100%;">
                    <h4 style="color:white; margin-bottom:5px;">${post.user} <span style="font-size:10px; font-weight:normal; opacity:0.7;">${post.time}</span></h4>
                    <p style="color:white; font-size:14px;">${post.text}</p>
                    <button onclick="toggleReplyInput(${index})" style="background:transparent; border:none; color:#ccc; cursor:pointer; font-size:12px; margin-top:5px;"><i class="fas fa-reply"></i> Balas</button>
                    <div id="reply-input-${index}" class="hidden" style="margin-top:10px;">
                        <input type="text" id="reply-text-${index}" placeholder="Tulis balasan..." style="width:80%; padding:5px;">
                        <button onclick="submitReply(${index})" style="padding:5px 10px; background:white; color:purple; border:none; border-radius:4px; cursor:pointer;">Kirim</button>
                    </div>
                    ${post.replies.map(rep => `<div class="reply-box"><strong style="color:white; font-size:12px;">${rep.user}</strong><p style="color:rgba(255,255,255,0.8); font-size:13px;">${rep.text}</p></div>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function addForumPost() {
    const text = document.getElementById('forum-input').value;
    if(!text) return;
    globalForum.unshift({ id: Date.now(), user: currentUser === 'mitra'?"Mitra":"Talenta", userImg: userAvatarUrl, text: text, time: "Baru saja", replies: [] });
    document.getElementById('forum-input').value = ""; loadForum();
}

function toggleReplyInput(index) { document.getElementById(`reply-input-${index}`).classList.toggle('hidden'); }

function submitReply(index) {
    const text = document.getElementById(`reply-text-${index}`).value; if(!text) return;
    globalForum[index].replies.push({ user: currentUser==='mitra'?"Mitra":"Talenta", text: text, time: "Baru saja" });
    loadForum();
}

function previewProfile(event) {
    const reader = new FileReader();
    reader.onload = function(){ userAvatarUrl = reader.result; document.getElementById('preview-img').src = userAvatarUrl; document.getElementById('header-profile-pic').src = userAvatarUrl; };
    reader.readAsDataURL(event.target.files[0]);
}

function saveSettings() { alert("Profil disimpan!"); }
function toggleNotif() { document.getElementById('notif-list').classList.toggle('show'); }
function handleRegister() { alert("Daftar sukses"); toggleAuth('login'); }
function openVideo(url) { window.open(url, '_blank'); }
function handleSearch(val) { console.log("Search:", val); }