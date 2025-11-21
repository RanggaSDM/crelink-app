// === STATE GLOBAL ===
let currentUser = null; // Data user asli dari database
let userAvatarUrl = "images/avatar.png"; 

// === 1. AUTHENTICATION (REAL DATABASE) ===

// Login ke Database
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
            // LOGIN SUKSES
            currentUser = data; // Simpan data user
            alert(`Selamat datang, ${currentUser.nama}!`);
            
            // Pindah Halaman
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            
            // Set Profil
            document.getElementById('header-profile-pic').src = currentUser.avatar || "images/avatar.png";
            userAvatarUrl = currentUser.avatar || "images/avatar.png";
            
            initDashboard();
        } else {
            alert(data.error);
        }
    } catch (e) { alert("Gagal Login: " + e); }
}

// Register ke Database
async function handleRegister() {
    const nama = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    // Ambil role dari tombol yang aktif (Mitra/Talenta)
    const role = document.querySelector('.role-btn.active').innerText.toLowerCase();

    if(!nama || !email || !pass) return alert("Lengkapi data!");

    try {
        const res = await fetch('/.netlify/functions/auth', {
            method: 'POST',
            body: JSON.stringify({ action: 'register', nama, email, password: pass, role })
        });
        
        if(res.status === 200) {
            alert("Pendaftaran Berhasil! Silakan Login.");
            toggleAuth('login');
        } else {
            alert("Gagal Daftar.");
        }
    } catch(e) { alert("Error: " + e); }
}

// === 2. DASHBOARD LOGIC ===

function initDashboard() {
    document.getElementById('welcome-msg').innerText = `Hallo, ${currentUser.nama} (${currentUser.role})!`;
    
    if(currentUser.role === 'mitra') {
        document.getElementById('menu-academy').style.display = 'none';
        document.getElementById('top-search-bar').style.display = 'none';
        navigate('dashboard');
        loadMitraProjects(); // Load proyek sendiri (sementara dummy dulu utk edit)
    } else {
        document.getElementById('menu-academy').style.display = 'flex';
        document.getElementById('top-search-bar').style.display = 'block';
        navigate('dashboard');
        loadTalentaProjects(); // LOAD REAL DARI DB
    }
}

// === 3. PUBLISH PROYEK (REAL DATABASE) ===

async function publishProject() {
    const title = document.getElementById('proj-title').value;
    const budget = document.getElementById('proj-budget').value;
    const date = document.getElementById('proj-date').value;
    // Ambil kategori yang aktif
    const activeCat = document.querySelector('.cat-item.active');
    const category = activeCat ? activeCat.innerText.trim() : "General";

    if(!title || !budget) return alert("Lengkapi Judul & Budget!");

    try {
        const res = await fetch('/.netlify/functions/createProject', {
            method: 'POST',
            body: JSON.stringify({ judul: title, kategori: category, budget: budget, deadline: date })
        });

        if(res.status === 200) {
            alert("Proyek Berhasil Terbit di Database!");
            // Reset form
            document.getElementById('proj-title').value = "";
            document.getElementById('proj-budget').value = "";
        }
    } catch (e) { alert("Gagal posting: " + e); }
}

// === 4. LOAD PROYEK (REAL DATABASE) ===

async function loadTalentaProjects() {
    const container = document.getElementById('talenta-project-list');
    container.innerHTML = "<p style='color:white'>Mengambil data live...</p>";

    try {
        const res = await fetch('/.netlify/functions/getProjects');
        const data = await res.json();

        if(data.length === 0) { container.innerHTML = "<p>Belum ada proyek.</p>"; return; }

        container.innerHTML = data.map(p => `
            <div class="card-item">
                <h4>${p.judul}</h4>
                <p style="color:#888; font-size:12px;">Deadline: ${p.deadline ? p.deadline.split('T')[0] : '-'}</p>
                <span style="background:#eee; padding:5px; border-radius:5px; font-size:12px;">${p.kategori}</span>
                <h4 style="color:var(--primary-purple); margin-top:10px;">Rp ${parseInt(p.budget).toLocaleString('id-ID')}</h4>
                <button class="main-btn" style="margin-top:10px;">Apply</button>
            </div>
        `).join('');
    } catch (e) { console.log(e); }
}

// === 5. FORUM (REAL DATABASE) ===

async function loadForum() {
    const container = document.getElementById('forum-list-container');
    container.innerHTML = "<p style='color:white'>Memuat diskusi...</p>";

    try {
        const res = await fetch('/.netlify/functions/forum'); // GET
        const data = await res.json();

        container.innerHTML = data.map(post => `
            <div class="forum-card" style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px; margin-bottom:15px;">
                <div style="display:flex; gap:10px;">
                    <img src="${post.user_avatar || 'images/avatar.png'}" style="width:40px; height:40px; border-radius:50%;">
                    <div>
                        <h4 style="color:white; margin-bottom:5px;">${post.user_name} <small>(${post.user_role})</small></h4>
                        <p style="color:white;">${post.text}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) { console.log(e); }
}

async function addForumPost() {
    const text = document.getElementById('forum-input').value;
    if(!text) return;

    try {
        await fetch('/.netlify/functions/forum', {
            method: 'POST',
            body: JSON.stringify({
                user_name: currentUser.nama,
                user_role: currentUser.role,
                user_avatar: userAvatarUrl,
                text: text
            })
        });
        document.getElementById('forum-input').value = "";
        loadForum(); // Reload biar muncul
    } catch (e) { alert("Gagal kirim pesan"); }
}

// === UTILS & NAVIGATION ===
function goToLogin() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('landing-page').classList.remove('active-section');
    document.getElementById('auth-section').classList.remove('hidden');
}
function setAuthRole(role) {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    // Cari tombol berdasarkan text
    const btns = document.querySelectorAll('.role-btn');
    if(role==='mitra') btns[0].classList.add('active'); else btns[1].classList.add('active');
}
function toggleAuth(mode) {
    if(mode === 'register') { document.getElementById('login-form').classList.add('hidden'); document.getElementById('register-form').classList.remove('hidden'); }
    else { document.getElementById('login-form').classList.remove('hidden'); document.getElementById('register-form').classList.add('hidden'); }
}
function navigate(page) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    let targetId = 'view-' + page;
    if(page === 'dashboard') targetId = currentUser.role === 'mitra' ? 'view-dashboard-mitra' : 'view-dashboard-talenta';
    else if (page === 'forum') loadForum();
    else if (page === 'proyek' && currentUser.role === 'talenta') loadTalentaProjects();
    
    const targetEl = document.getElementById(targetId);
    if(targetEl) targetEl.classList.remove('hidden');
}
function selectCategory(el, name) {
    document.querySelectorAll('.cat-item').forEach(e => { e.classList.remove('active'); e.classList.add('dimmed'); });
    el.classList.remove('dimmed'); el.classList.add('active');
}
// Fungsi Dummy Pelamar (Tetap ada utk visual Mitra)
function loadMitraRequests() {
    // Bisa dikembangkan pakai database nanti, skrg dummy visual dulu
    const container = document.getElementById('mitra-applicant-list');
    container.innerHTML = `<div class="applicant-card"><h4>Nasa Fatimah</h4><p>Univ Udayana</p><div style="margin-top:5px;"><button class="btn-accept">Terima</button></div></div>`;
}
function loadMitraProjects() {
    // Load dummy lokal agar mitra bisa hapus2an simulasi
    document.getElementById('mitra-active-projects').innerHTML = `<p style='color:white'>Proyek aktif muncul di sini (simulasi).</p>`;
}
function handleLogout() { location.reload(); }
function toggleNotif() { document.getElementById('notif-list').classList.toggle('show'); }
function openVideo(url) { window.open(url, '_blank'); }
function previewProfile(e) { /* Logic preview gambar */ }
function saveSettings() { alert("Simpan profil"); }
function handleSearch(v) {}