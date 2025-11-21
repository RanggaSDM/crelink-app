// === STATE GLOBAL ===
let currentUser = null; 
let userAvatarUrl = "images/avatar.png"; 

// === 1. AUTH & NAVIGASI ===
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if(!email || !pass) return alert("Isi email dan password!");

    try {
        const res = await fetch('/.netlify/functions/auth', { method: 'POST', body: JSON.stringify({ action: 'login', email, password: pass }) });
        const data = await res.json();
        if (res.status === 200) {
            currentUser = data;
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

// === 2. DASHBOARD ===
function initDashboard() {
    document.getElementById('welcome-msg').innerText = `Hallo, ${currentUser.nama}!`;
    loadNotifications(); 

    if(currentUser.role === 'mitra') {
        document.getElementById('menu-academy').style.display = 'none';
        document.getElementById('top-search-bar').style.display = 'none';
        navigate('dashboard');
        loadMitraRealData();
    } else {
        document.getElementById('menu-academy').style.display = 'flex';
        document.getElementById('top-search-bar').style.display = 'block';
        navigate('dashboard');
        loadTalentaProjects(); 
    }
}

// === 3. LOGIKA NOTIFIKASI ===
async function loadNotifications() {
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');
    
    try {
        const res = await fetch(`/.netlify/functions/getNotifications?user_id=${currentUser.id}`);
        const data = await res.json();
        
        badge.innerText = data.length;
        badge.style.display = data.length > 0 ? 'block' : 'none';
        
        if(data.length === 0) {
            list.innerHTML = "<div class='empty-notif'>Tidak ada notifikasi</div>";
        } else {
            list.innerHTML = data.map(n => `
                <div style="padding: 10px; border-bottom:1px solid #eee; font-size: 12px; color: ${n.type === 'success' ? 'green' : 'red'}; background: ${n.read ? 'white' : '#f9f9f9'}; position: relative;">
                    <div style="padding-right: 20px;">${n.message}</div>
                    <div style="font-size:10px; color:#aaa; margin-top:2px;">${new Date(n.created_at).toLocaleDateString()}</div>
                    <span onclick="deleteNotif(event, ${n.id})" style="position: absolute; top: 5px; right: 5px; cursor: pointer; color: #999; font-weight: bold; padding: 0 5px;">&times;</span>
                </div>
            `).join('');
        }
    } catch (e) { console.log("Gagal load notif"); }
}

function toggleNotif(event) {
    event.stopPropagation(); // Mencegah klik tembus
    document.getElementById('notif-list').classList.toggle('show');
}

async function deleteNotif(e, id) {
    e.stopPropagation();
    if(!confirm("Hapus notifikasi ini?")) return;
    try {
        await fetch('/.netlify/functions/deleteNotif', { method: 'POST', body: JSON.stringify({ id: id }) });
        loadNotifications();
    } catch(e) { alert("Gagal hapus"); }
}

// === 4. FITUR MITRA ===
async function loadMitraRealData() {
    document.getElementById('mitra-active-projects').innerHTML = "<p style='color:white'>Loading...</p>";
    document.getElementById('mitra-applicant-list').innerHTML = "<p style='color:white'>Loading...</p>";

    try {
        const res = await fetch(`/.netlify/functions/getMitraData?id=${currentUser.id}`);
        const data = await res.json();

        const projContainer = document.getElementById('mitra-active-projects');
        if(data.projects.length === 0) projContainer.innerHTML = "<p style='color:white'>Belum ada proyek.</p>";
        else {
            projContainer.innerHTML = data.projects.map(p => `
                <div class="card-item" style="margin-bottom:10px; border-left:5px solid purple;">
                    <h4>${p.judul}</h4>
                    <p style="color:#888; font-size:12px;">${p.kategori}</p>
                    <p style="color:purple; font-weight:bold;">Rp ${parseInt(p.budget).toLocaleString()}</p>
                    <button class="main-btn" onclick="deleteProject(${p.id})" style="background:red; padding:5px; margin-top:5px;">Hapus</button>
                </div>
            `).join('');
        }

        const appContainer = document.getElementById('mitra-applicant-list');
        if(data.applicants.length === 0) appContainer.innerHTML = "<p style='color:white'>Belum ada pelamar pending.</p>";
        else {
            appContainer.innerHTML = data.applicants.map(a => `
                <div class="applicant-card">
                    <div class="app-header">
                        <h4>${a.talenta_name}</h4>
                        <p>${a.talenta_univ || 'Freelancer'}</p>
                    </div>
                    <div style="margin: 5px 0;"> <span class="app-meta">Lamar di: ${a.project_title}</span> </div>
                    <div class="app-actions">
                        <button class="btn-accept" onclick="processApplicant(${a.id}, 'terima', ${a.talenta_id}, '${a.project_title}')">Terima</button>
                        <button class="btn-reject" onclick="processApplicant(${a.id}, 'tolak', ${a.talenta_id}, '${a.project_title}')">Tolak</button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) { console.log(e); }
}

async function processApplicant(appId, action, talentaId, projectTitle) {
    if(!confirm(`Yakin ingin ${action} pelamar ini?`)) return;
    try {
        const res = await fetch('/.netlify/functions/handleRequest', {
            method: 'POST',
            body: JSON.stringify({ app_id: appId, action: action, mitra_id: currentUser.id, talenta_id: talentaId, project_title: projectTitle })
        });
        if(res.status === 200) {
            alert("Berhasil diproses!");
            loadMitraRealData();
            loadNotifications(); 
        }
    } catch(e) { alert("Gagal proses"); }
}

async function deleteProject(projId) {
    if(!confirm("Hapus proyek ini? Semua data pelamar juga akan terhapus.")) return;
    try {
        const res = await fetch('/.netlify/functions/deleteProject', { method: 'POST', body: JSON.stringify({ id: projId }) });
        if(res.status === 200) { alert("Proyek Terhapus!"); loadMitraRealData(); }
    } catch(e) { alert("Gagal hapus"); }
}

async function publishProject() {
    const title = document.getElementById('proj-title').value;
    const budget = document.getElementById('proj-budget').value;
    const date = document.getElementById('proj-date').value;
    const activeCat = document.querySelector('.cat-item.active');
    const category = activeCat ? activeCat.innerText.trim() : "General";
    if(!title || !budget) return alert("Lengkapi Data!");

    try {
        await fetch('/.netlify/functions/createProject', {
            method: 'POST',
            body: JSON.stringify({ judul: title, kategori: category, budget, deadline: date, mitra_id: currentUser.id })
        });
        alert("Proyek Terbit!");
        loadMitraRealData();
    } catch (e) { alert("Gagal"); }
}

// === 5. FITUR TALENTA ===
async function loadTalentaProjects() {
    const container = document.getElementById('talenta-project-list');
    const allContainer = document.getElementById('all-project-list');
    const loading = "<p style='color:white'>Loading...</p>";
    if(container) container.innerHTML = loading;
    if(allContainer) allContainer.innerHTML = loading;

    try {
        const res = await fetch('/.netlify/functions/getProjects');
        const data = await res.json();

        const cards = data.map(p => {
            let buttonHtml = currentUser.role === 'mitra' ? 
                `<button class="main-btn" style="background:#ccc; cursor:not-allowed; margin-top:10px;" disabled>Mode Mitra</button>` : 
                `<button class="main-btn" onclick="applyProject(${p.id})" style="margin-top:10px;">Apply</button>`;

            return `
            <div class="card-item">
                <h4>${p.judul}</h4>
                <span style="background:#eee; padding:5px; border-radius:5px; font-size:12px;">${p.kategori}</span>
                <h4 style="color:purple; margin-top:10px;">Rp ${parseInt(p.budget).toLocaleString()}</h4>
                ${buttonHtml}
            </div>
            `;
        }).join('');

        if(container) container.innerHTML = cards;
        if(allContainer) allContainer.innerHTML = cards;
    } catch (e) { console.log(e); }
}

async function applyProject(pId) {
    if(!confirm("Kirim Lamaran?")) return;
    try {
        const res = await fetch('/.netlify/functions/apply', {
            method: 'POST',
            body: JSON.stringify({ project_id: pId, talenta_id: currentUser.id, talenta_name: currentUser.nama, talenta_univ: "Univ. Udayana" })
        });
        const d = await res.json();
        if(res.status === 200) alert("Lamaran Terkirim! Tunggu konfirmasi Mitra.");
        else alert(d.error);
    } catch(e) { alert("Error"); }
}

// === 6. FORUM ===
async function loadForum() {
    const container = document.getElementById('forum-list-container');
    container.innerHTML = "<p style='color:white'>Memuat...</p>";
    try {
        const res = await fetch('/.netlify/functions/forum');
        const data = await res.json();
        container.innerHTML = data.map(post => `
            <div class="forum-card" style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px; margin-bottom:15px;">
                <div style="display:flex; gap:10px;">
                    <img src="${(post.user_avatar && post.user_avatar.length > 10) ? post.user_avatar : 'images/avatar.png'}" style="width:40px; height:40px; border-radius:50%;">
                    <div style="width:100%">
                        <h4 style="color:white; margin-bottom:5px;">${post.user_name} <small>(${post.user_role})</small></h4>
                        <p style="color:white;">${post.text}</p>
                        <button onclick="toggleReplyBox(${post.id})" style="background:none; border:none; color:#ccc; cursor:pointer; font-size:12px; margin-top:5px;"><i class="fas fa-reply"></i> Balas</button>
                        <div id="reply-box-${post.id}" class="hidden" style="margin-top:10px;">
                            <input type="text" id="reply-input-${post.id}" placeholder="Tulis balasan..." style="width:70%; padding:5px; color:black;">
                            <button onclick="submitReply(${post.id})" style="padding:5px 10px; background:white; color:purple; border:none; cursor:pointer;">Kirim</button>
                        </div>
                        ${post.replies ? post.replies.map(r => `<div class="reply-box"><strong style="color:white; font-size:12px;">${r.user}</strong><p style="color:rgba(255,255,255,0.8); font-size:13px;">${r.text}</p></div>`).join('') : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) { console.log(e); }
}
function toggleReplyBox(id) { document.getElementById(`reply-box-${id}`).classList.toggle('hidden'); }
async function submitReply(forumId) {
    const text = document.getElementById(`reply-input-${forumId}`).value;
    if(!text) return;
    try { await fetch('/.netlify/functions/replyForum', { method: 'POST', body: JSON.stringify({ forum_id: forumId, user: currentUser.nama, text: text }) }); loadForum(); } catch(e) { alert("Gagal balas"); }
}
async function addForumPost() {
    const text = document.getElementById('forum-input').value;
    if(!text) return;
    await fetch('/.netlify/functions/forum', { method: 'POST', body: JSON.stringify({ user_name: currentUser.nama, user_role: currentUser.role, user_avatar: userAvatarUrl, text: text }) });
    document.getElementById('forum-input').value = ""; loadForum();
}

// === UTILS ===
function goToLogin() { document.getElementById('landing-page').classList.add('hidden'); document.getElementById('auth-section').classList.remove('hidden'); }
function setAuthRole(role) { document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active')); const btns = document.querySelectorAll('.role-btn'); if(role==='mitra') btns[0].classList.add('active'); else btns[1].classList.add('active'); }
function toggleAuth(mode) { if(mode === 'register') { document.getElementById('login-form').classList.add('hidden'); document.getElementById('register-form').classList.remove('hidden'); } else { document.getElementById('login-form').classList.remove('hidden'); document.getElementById('register-form').classList.add('hidden'); } }
function handleRegister() { alert("Gunakan login akun demo dulu."); }
function navigate(page) { document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden')); let tId = 'view-' + page; if(page==='dashboard') tId = currentUser.role==='mitra'?'view-dashboard-mitra':'view-dashboard-talenta'; else if(page==='forum') loadForum(); else if(page==='proyek') loadTalentaProjects(); document.getElementById(tId).classList.remove('hidden'); }
function selectCategory(el, name) { document.querySelectorAll('.cat-item').forEach(e => { e.classList.remove('active'); e.classList.add('dimmed'); }); el.classList.remove('dimmed'); el.classList.add('active'); }
function handleLogout() { location.reload(); }
function handleSearch() {}
function previewProfile(e) { const reader = new FileReader(); reader.onloadend=async()=>{userAvatarUrl=reader.result; updateProfileUI(); await fetch('/.netlify/functions/updateProfile', {method:'POST',body:JSON.stringify({user_id:currentUser.id, avatar:userAvatarUrl})})}; reader.readAsDataURL(e.target.files[0]); }
async function saveSettings() { alert("Profil tersimpan!"); }
function openVideo(url) { window.open(url, '_blank'); }

// TUTUP NOTIFIKASI JIKA KLIK DI LUAR
window.onclick = function(event) {
    if (!event.target.closest('.notif-wrapper')) {
        const dropdown = document.getElementById('notif-list');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
}