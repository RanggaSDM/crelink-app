// === STATE MANAGEMENT ===
let currentUser = null; 
let selectedCategory = null;
let userAvatarUrl = "images/avatar.png"; 

// === DATA DUMMY ===
let globalProjects = [
    { id: 1, title: "Re-branding Logo", category: "Graphic Design", budget: 2000000, mitra: "Burger Banger", deadline: "2025-12-01" },
    { id: 2, title: "Website Company Profile", category: "Web Dev", budget: 4500000, mitra: "PT Sinergi", deadline: "2025-11-25" }
];

let mitraRequests = [
    { id: 101, name: "Nasa Fatimah Caesara", univ: "Universitas Udayana", age: "22 Tahun", project: "Editor Video Tiktok/Reels" },
    { id: 102, name: "I Gusti Agung Rangga", univ: "Universitas Udayana", age: "22 Tahun", project: "Editor Video Tiktok/Reels" }
];

let globalForum = [
    { 
        id: 1, user: "Freelancer123", userImg: "images/avatar.png", text: "Gimana cara nentuin harga desain buat UMKM?", time: "10 menit lalu",
        replies: [ { user: "SeniorDesain", text: "Hitung jam kerja dikali rate kamu bro.", time: "5 menit lalu" } ]
    }
];

// === NAVIGASI & AUTH ===
function goToLogin() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('landing-page').classList.remove('active-section');
    document.getElementById('auth-section').classList.remove('hidden');
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

// === DASHBOARD ===
function initDashboard() {
    document.getElementById('welcome-msg').innerText = `Hallo, ${currentUser === 'mitra' ? 'Mitra' : 'Talenta'}!`;
    if(currentUser === 'mitra') {
        document.getElementById('menu-academy').style.display = 'none';
        document.getElementById('top-search-bar').style.display = 'none';
        navigate('dashboard');
        loadMitraRequests();
        loadMitraProjects();
    } else {
        document.getElementById('menu-academy').style.display = 'flex';
        document.getElementById('top-search-bar').style.display = 'block';
        navigate('dashboard');
        loadTalentaProjects();
    }
}

function navigate(page) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active-menu'));
    
    let targetId = 'view-' + page;
    if(page === 'dashboard') targetId = currentUser === 'mitra' ? 'view-dashboard-mitra' : 'view-dashboard-talenta';
    else if (page === 'forum') loadForum();
    else if (page === 'proyek' && currentUser === 'talenta') loadAllProjects();

    const targetEl = document.getElementById(targetId);
    if(targetEl) targetEl.classList.remove('hidden');
}

// === LOGIKA MITRA (REQUEST & PROYEK) ===
function loadMitraRequests() {
    const container = document.getElementById('mitra-applicant-list');
    if(mitraRequests.length === 0) { container.innerHTML = "<p>Tidak ada permintaan pelamar baru.</p>"; return; }
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
    const status = action === 'terima' ? "Diterima" : "Ditolak";
    alert(`Pelamar berhasil ${status}!`);
    mitraRequests = mitraRequests.filter(r => r.id !== id);
    loadMitraRequests();
}

function loadMitraProjects() {
    const container = document.getElementById('mitra-active-projects');
    if(globalProjects.length === 0) { container.innerHTML = "<p>Tidak ada proyek aktif.</p>"; return; }
    container.innerHTML = globalProjects.map(p => `
        <div class="card-item" style="margin-bottom:10px;">
            <h4>${p.title}</h4>
            <p style="color:#888; font-size:12px;">Deadline: ${p.deadline}</p>
            <p style="color:var(--primary-purple); font-weight:bold;">Rp ${p.budget.toLocaleString()}</p>
            <button class="main-btn" onclick="deleteProject(${p.id})" style="padding:5px; background:red; font-size:12px; margin-top:5px;">Hapus Proyek</button>
        </div>
    `).join('');
}

function deleteProject(id) {
    if(confirm("Hapus proyek ini?")) { globalProjects = globalProjects.filter(p => p.id !== id); loadMitraProjects(); }
}

function publishProject() {
    const title = document.getElementById('proj-title').value;
    const budget = document.getElementById('proj-budget').value;
    if(!title) return alert("Isi judul dulu");
    globalProjects.unshift({ id: Date.now(), title: title, budget: parseInt(budget)||0, category: "New", deadline: "2025-12-31" });
    alert("Proyek Terbit!");
    loadMitraProjects();
}

// === FIX LOGIKA PILIH KATEGORI ===
function selectCategory(element, catName) {
    // Reset semua tombol jadi redup
    document.querySelectorAll('.cat-item').forEach(el => {
        el.classList.remove('active');
        el.classList.add('dimmed');
    });
    // Tombol yang diklik jadi terang
    element.classList.remove('dimmed');
    element.classList.add('active');
    selectedCategory = catName;
}

// === UTILS LAIN ===
function toggleNotif() { document.getElementById('notif-list').classList.toggle('show'); }
function handleRegister() { alert("Daftar sukses"); toggleAuth('login'); }
function loadTalentaProjects() { document.getElementById('talenta-project-list').innerHTML = globalProjects.map(p=>`<div class="card-item"><h4>${p.title}</h4><p>Rp ${p.budget}</p><button class="main-btn" style="margin-top:5px;">Apply</button></div>`).join(''); }
function loadAllProjects() { document.getElementById('all-project-list').innerHTML = globalProjects.map(p=>`<div class="card-item"><h4>${p.title}</h4><p>Rp ${p.budget}</p><button class="main-btn" style="margin-top:5px;">Apply</button></div>`).join(''); }

// === FORUM ===
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
function openVideo(url) { window.open(url, '_blank'); }