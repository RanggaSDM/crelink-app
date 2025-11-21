// === STATE GLOBAL ===
let currentUser = null; 
let userAvatarUrl = "images/avatar.png"; 

// === 1. AUTH & NAVIGASI ===
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if(!email || !pass) return alert("Isi email dan password!");

    try {
        const res = await fetch('/.netlify/functions/auth', {
            method: 'POST',
            body: JSON.stringify({ action: 'login', email: email, password: pass })
        });
        const data = await res.json();

        if (res.status === 200) {
            currentUser = data;
            // Perbaiki path gambar jika rusak
            userAvatarUrl = (currentUser.avatar && currentUser.avatar.length > 10) ? currentUser.avatar : "images/avatar.png";
            
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            updateProfileUI();
            initDashboard();
        } else { alert(data.error); }
    } catch (e) { alert("Gagal Login: " + e); }
}

function updateProfileUI() {
    document.getElementById('header-profile-pic').src = userAvatarUrl;
    document.getElementById('preview-img').src = userAvatarUrl;
}

function handleLogout() { location.reload(); }

// === 2. DASHBOARD LOGIC ===
function initDashboard() {
    document.getElementById('welcome-msg').innerText = `Hallo, ${currentUser.nama}!`;
    
    if(currentUser.role === 'mitra') {
        document.getElementById('menu-academy').style.display = 'none';
        document.getElementById('top-search-bar').style.display = 'none';
        navigate('dashboard');
        loadMitraRealData(); // LOAD DATA ASLI MITRA
    } else {
        document.getElementById('menu-academy').style.display = 'flex';
        document.getElementById('top-search-bar').style.display = 'block';
        navigate('dashboard');
        loadTalentaProjects(); 
    }
}

// === 3. FITUR MITRA (REAL DATA) ===
async function loadMitraRealData() {
    document.getElementById('mitra-active-projects').innerHTML = "Loading...";
    document.getElementById('mitra-applicant-list').innerHTML = "Loading...";

    try {
        // Panggil API khusus Mitra
        const res = await fetch(`/.netlify/functions/getMitraData?id=${currentUser.id}`);
        const data = await res.json();

        // A. RENDER PROYEK SENDIRI
        const projContainer = document.getElementById('mitra-active-projects');
        if(data.projects.length === 0) {
            projContainer.innerHTML = "<p>Belum ada proyek.</p>";
        } else {
            projContainer.innerHTML = data.projects.map(p => `
                <div class="card-item" style="margin-bottom:10px; border-left:5px solid purple;">
                    <h4>${p.judul}</h4>
                    <p style="color:#888; font-size:12px;">${p.kategori} • Deadline: ${p.deadline ? p.deadline.split('T')[0] : '-'}</p>
                    <p style="color:purple; font-weight:bold;">Rp ${parseInt(p.budget).toLocaleString()}</p>
                    <button class="main-btn" style="background:red; padding:5px; margin-top:5px;">Hapus</button>
                </div>
            `).join('');
        }

        // B. RENDER PELAMAR (APPLICANTS)
        const appContainer = document.getElementById('mitra-applicant-list');
        if(data.applicants.length === 0) {
            appContainer.innerHTML = "<p>Belum ada pelamar masuk.</p>";
        } else {
            appContainer.innerHTML = data.applicants.map(a => `
                <div class="applicant-card">
                    <div class="app-header">
                        <h4>${a.talenta_name}</h4>
                        <p>${a.talenta_univ || 'Freelancer'}</p>
                    </div>
                    <div style="margin: 5px 0;"> <span class="app-meta">Lamar di: ${a.project_title}</span> </div>
                    <div class="app-actions">
                        <button class="btn-accept" onclick="alert('Fitur Terima sedang dikembangkan')">Terima</button>
                        <button class="btn-reject" onclick="alert('Ditolak')">Tolak</button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) { console.log(e); }
}

async function publishProject() {
    const title = document.getElementById('proj-title').value;
    const budget = document.getElementById('proj-budget').value;
    const date = document.getElementById('proj-date').value;
    const activeCat = document.querySelector('.cat-item.active');
    const category = activeCat ? activeCat.innerText.trim() : "General";

    if(!title || !budget) return alert("Lengkapi Data!");

    // KIRIM KE DATABASE dengan ID MITRA
    try {
        const res = await fetch('/.netlify/functions/createProject', {
            method: 'POST',
            body: JSON.stringify({ 
                judul: title, kategori: category, budget: budget, deadline: date,
                // PENTING: Kirim ID Mitra agar tahu ini proyek siapa
                mitra_id: currentUser.id 
            })
        });
        if(res.status === 200) {
            alert("Proyek Terbit!");
            loadMitraRealData(); // Refresh dashboard otomatis
        }
    } catch (e) { alert("Gagal: " + e); }
}

// === 4. FITUR TALENTA (APPLY) ===
async function loadTalentaProjects() {
    const container = document.getElementById('talenta-project-list');
    const allContainer = document.getElementById('all-project-list');
    const loading = "<p style='color:white'>Mengambil data...</p>";
    if(container) container.innerHTML = loading;
    if(allContainer) allContainer.innerHTML = loading;

    try {
        const res = await fetch('/.netlify/functions/getProjects');
        const data = await res.json();

        const cards = data.map(p => `
            <div class="card-item">
                <h4>${p.judul}</h4>
                <p style="color:#888; font-size:12px;">Oleh Mitra ID: ${p.mitra_id}</p>
                <span style="background:#eee; padding:5px; border-radius:5px; font-size:12px;">${p.kategori}</span>
                <h4 style="color:purple; margin-top:10px;">Rp ${parseInt(p.budget).toLocaleString()}</h4>
                <button class="main-btn" onclick="applyProject(${p.id})" style="margin-top:10px;">Apply</button>
            </div>
        `).join('');

        if(container) container.innerHTML = cards;
        if(allContainer) allContainer.innerHTML = cards;
    } catch (e) { console.log(e); }
}

async function applyProject(projectId) {
    if(!confirm("Yakin ingin melamar proyek ini?")) return;

    try {
        const res = await fetch('/.netlify/functions/apply', {
            method: 'POST',
            body: JSON.stringify({
                project_id: projectId,
                talenta_id: currentUser.id,
                talenta_name: currentUser.nama,
                talenta_univ: "Univ. Udayana" // Simulasi data kampus
            })
        });
        const data = await res.json();
        if(res.status === 200) alert("Lamaran Berhasil Dikirim!");
        else alert("Gagal: " + data.error);
    } catch(e) { alert("Error apply"); }
}

// === 5. FITUR FORUM (FIX REPLY) ===
async function loadForum() {
    const container = document.getElementById('forum-list-container');
    container.innerHTML = "<p style='color:white'>Memuat...</p>";

    try {
        const res = await fetch('/.netlify/functions/forum');
        const data = await res.json();

        container.innerHTML = data.map((post) => `
            <div class="forum-card" style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px; margin-bottom:15px;">
                <div style="display:flex; gap:10px;">
                    <img src="${(post.user_avatar && post.user_avatar.length > 10) ? post.user_avatar : 'images/avatar.png'}" style="width:40px; height:40px; border-radius:50%;">
                    <div style="width:100%">
                        <h4 style="color:white; margin-bottom:5px;">${post.user_name} <small>(${post.user_role})</small></h4>
                        <p style="color:white;">${post.text}</p>
                        
                        <button onclick="toggleReplyBox(${post.id})" style="background:none; border:none; color:#ccc; cursor:pointer; font-size:12px; margin-top:5px;">
                            <i class="fas fa-reply"></i> Balas
                        </button>
                        
                        <div id="reply-box-${post.id}" class="hidden" style="margin-top:10px;">
                            <input type="text" placeholder="Fitur reply database coming soon..." style="width:80%; padding:5px;">
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) { console.log(e); }
}

function toggleReplyBox(id) {
    const box = document.getElementById(`reply-box-${id}`);
    if(box) box.classList.toggle('hidden');
}

async function addForumPost() {
    const text = document.getElementById('forum-input').value;
    if(!text) return;
    await fetch('/.netlify/functions/forum', {
        method: 'POST',
        body: JSON.stringify({ user_name: currentUser.nama, user_role: currentUser.role, user_avatar: userAvatarUrl, text: text })
    });
    document.getElementById('forum-input').value = "";
    loadForum();
}

// === 6. UPLOAD FOTO PROFIL (DATABASE) ===
function previewProfile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onloadend = async function() {
        const base64String = reader.result;
        userAvatarUrl = base64String;
        updateProfileUI(); // Update tampilan lokal
    };
    reader.readAsDataURL(file);
}

async function saveSettings() {
    // Simpan ke Database
    try {
        const res = await fetch('/.netlify/functions/updateProfile', {
            method: 'POST',
            body: JSON.stringify({ user_id: currentUser.id, avatar: userAvatarUrl })
        });
        if(res.status === 200) alert("Profil Tersimpan di Database!");
    } catch(e) { alert("Gagal simpan profil"); }
}

// === UTILS ===
function goToLogin() { document.getElementById('landing-page').classList.add('hidden'); document.getElementById('auth-section').classList.remove('hidden'); }
function setAuthRole(role) { document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active')); const btns = document.querySelectorAll('.role-btn'); if(role==='mitra') btns[0].classList.add('active'); else btns[1].classList.add('active'); }
function toggleAuth(mode) { if(mode === 'register') { document.getElementById('login-form').classList.add('hidden'); document.getElementById('register-form').classList.remove('hidden'); } else { document.getElementById('login-form').classList.remove('hidden'); document.getElementById('register-form').classList.add('hidden'); } }
function handleRegister() { alert("Gunakan Login dulu, fitur Register DB sudah ada di kode sebelumnya."); } 
function navigate(page) { document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden')); let tId = 'view-' + page; if(page==='dashboard') tId = currentUser.role==='mitra'?'view-dashboard-mitra':'view-dashboard-talenta'; else if(page==='forum') loadForum(); else if(page==='proyek') loadTalentaProjects(); document.getElementById(tId).classList.remove('hidden'); }
function selectCategory(el, name) { document.querySelectorAll('.cat-item').forEach(e => { e.classList.remove('active'); e.classList.add('dimmed'); }); el.classList.remove('dimmed'); el.classList.add('active'); }
function toggleNotif() { document.getElementById('notif-list').classList.toggle('show'); }
function openVideo(url) { window.open(url, '_blank'); }
function handleSearch(v) {}