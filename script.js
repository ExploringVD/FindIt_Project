// --- INITIALIZATION ---
window.onload = function() {
    try {
        loadData(); 
    } catch(e) {
        console.log("Resetting corrupted data");
        localStorage.clear();
        location.reload();
    }
};

// --- DATA STRUCTURES ---
let lostItems = [];
let foundItems = [];
let karmaPoints = 0;
let isLoginMode = false;

// Starter Data
const starterItems = [
    {
        id: '1', type: 'found', name: 'Smart Watch', date: '2025-12-14', status: 'Found',
        loc: 'Lab 3, Desk 4', desc: 'Black Apple Watch with scratch', 
        postedTime: Date.now() - 86400000, 
        finder: { name: 'Rahul Sharma', email: 'rahul@college.edu', phone: '9876543210' }
    }
];

// --- LOCAL STORAGE ---
function saveData() {
    localStorage.setItem('findit_lost', JSON.stringify(lostItems));
    localStorage.setItem('findit_found', JSON.stringify(foundItems));
    localStorage.setItem('findit_karma', karmaPoints.toString());
}

function loadData() {
    const storedLost = localStorage.getItem('findit_lost');
    const storedFound = localStorage.getItem('findit_found');
    const storedKarma = localStorage.getItem('findit_karma');

    if (storedLost) lostItems = JSON.parse(storedLost);
    if (storedFound) {
        foundItems = JSON.parse(storedFound);
    } else {
        foundItems = starterItems;
        saveData();
    }
    if (storedKarma) karmaPoints = parseInt(storedKarma);

    const storedUser = localStorage.getItem('findit_user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            document.getElementById('profile-name').innerText = user.name || "User";
            document.getElementById('profile-email').innerText = user.email || "email@college.edu";
            document.getElementById('profile-phone').innerText = user.phone || "";
        } catch(e) {
            localStorage.removeItem('findit_user');
        }
    }

    updateKarmaUI();
    renderAllLists();
}

// --- AUTHENTICATION ---
function handleAuthAction() {
    const nameInput = document.getElementById('inp-name');
    const emailInput = document.getElementById('inp-email');
    const phoneInput = document.getElementById('inp-phone');
    const actionBtn = document.getElementById('auth-btn-action');
    const isSignUp = actionBtn.innerText.includes("Create");

    if (isSignUp) {
        const name = nameInput.value;
        const email = emailInput.value;
        const phone = phoneInput.value;
        if (!name || !email) { alert("Please fill Name and Email."); return; }

        const userObj = { name, email, phone };
        localStorage.setItem('findit_user', JSON.stringify(userObj));
        
        document.getElementById('profile-name').innerText = name;
        document.getElementById('profile-email').innerText = email;
        document.getElementById('profile-phone').innerText = phone;
        
        alert("Account Created! Welcome, " + name);
        showSection('home');
    } else {
        const email = emailInput.value;
        if (!email) { alert("Please enter email."); return; }
        const storedUser = localStorage.getItem('findit_user');
        if(storedUser) {
            const user = JSON.parse(storedUser);
            document.getElementById('profile-name').innerText = user.name;
            document.getElementById('profile-email').innerText = user.email;
            document.getElementById('profile-phone').innerText = user.phone;
            alert("Welcome back, " + user.name);
        } else {
            alert("Welcome back!");
        }
        showSection('home');
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const btn = document.querySelector('.auth-toggle button');
    const toggleText = document.getElementById('auth-toggle-text');
    const signupFields = document.getElementById('signup-fields');
    const actionBtn = document.getElementById('auth-btn-action');

    if (isLoginMode) {
        title.innerText = "Welcome Back";
        btn.innerText = "SIGN UP";
        toggleText.innerText = "Don't have an account?";
        signupFields.style.display = 'none';
        actionBtn.innerText = "Sign In";
    } else {
        title.innerText = "Create your FindIt Account";
        btn.innerText = "SIGN IN";
        toggleText.innerText = "Have an account?";
        signupFields.style.display = 'block';
        actionBtn.innerText = "Create Account";
    }
}

function handleLogout() {
    document.getElementById('inp-pass').value = "";
    showSection('auth');
    isLoginMode = true; 
    toggleAuthMode();
}

// --- RENDER LISTS ---
function renderAllLists() {
    const lostContainer = document.getElementById('container-lost');
    const foundContainer = document.getElementById('container-found');
    const grid = document.getElementById('unidentified-grid');

    if(!lostContainer) return;

    lostContainer.innerHTML = '';
    foundContainer.innerHTML = '';
    grid.innerHTML = '';

    if(lostItems.length === 0) lostContainer.innerHTML = '<p class="empty-msg">No items reported lost yet.</p>';
    lostItems.forEach(item => lostContainer.innerHTML += createCardHTML(item, true));

    if(foundItems.length === 0) foundContainer.innerHTML = '<p class="empty-msg">No items reported found yet.</p>';
    foundItems.forEach(item => {
        const currUser = document.getElementById('profile-name').innerText;
        // Profile shows items reported by current user OR items Resolved by current user
        const isFinder = item.finder && item.finder.name === currUser;
        const isReceiver = item.receiver && item.receiver.name === currUser;
        
        if(isFinder || isReceiver) {
            foundContainer.innerHTML += createCardHTML(item, true);
        }
        
        // Unidentified page shows ALL found items (Resolved or Not)
        grid.innerHTML += createCardHTML(item, false);
    });
}

function createCardHTML(item, isProfile) {
    // Check status logic
    const isResolved = item.status === 'Resolved';
    const statusText = isResolved ? "Resolved" : (item.type === 'lost' ? "Searching..." : "Found");
    const statusClass = isResolved ? "status-green" : (item.type === 'lost' ? "status-orange" : "status-green"); // Both Found and Resolved can be green
    const icon = item.type === 'lost' ? "❓" : (isResolved ? "🎉" : "✅");
    
    const timeString = timeAgo(item.postedTime);
    
    // We only pass ID and Type now. Much cleaner.
    return `
        <div class="item-card" onclick="openViewModal('${item.id}', '${item.type}')">
            <div class="item-thumb">${icon}</div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="date">Reported: ${item.date}</p>
                <p class="time-ago">${timeString}</p>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            ${isProfile ? `<button class="btn-delete" onclick="deleteItem('${item.id}', '${item.type}', event)">🗑️</button>` : ''}
        </div>
    `;
}

// --- SUBMIT REPORT ---
function submitReport(type) {
    const name = document.getElementById(type + '-name').value;
    const date = document.getElementById(type + '-date').value;
    const loc = document.getElementById(type + '-loc').value;
    const desc = document.getElementById(type + '-desc').value;

    if (!name || !date) { alert("Please fill Name and Date"); return; }

    const newItem = {
        id: Date.now().toString(),
        type: type,
        name: name,
        date: date,
        status: type === 'lost' ? 'Lost' : 'Found',
        loc: loc || "Not specified",
        desc: desc || "No description",
        postedTime: Date.now(),
        finder: {
            name: document.getElementById('profile-name').innerText,
            email: document.getElementById('profile-email').innerText,
            phone: document.getElementById('profile-phone').innerText || ''
        }
    };

    if (type === 'lost') lostItems.push(newItem);
    else {
        foundItems.push(newItem);
        karmaPoints += 10;
        updateKarmaUI();
    }
    saveData();
    renderAllLists();
    
    closeModal('modal-' + type);
    fireConfetti(); 
    
    document.getElementById(type + '-name').value = '';
    document.getElementById(type + '-date').value = '';
    document.getElementById(type + '-loc').value = '';
    document.getElementById(type + '-desc').value = '';
}

function deleteItem(id, type, event) {
    event.stopPropagation();
    if(!confirm("Delete this report?")) return;
    if(type === 'lost') lostItems = lostItems.filter(i => i.id !== id);
    else foundItems = foundItems.filter(i => i.id !== id);
    saveData();
    renderAllLists();
}

// --- SMART MODAL LOGIC (New) ---
function openViewModal(id, type) {
    // 1. Find the item
    let item;
    if (type === 'lost') item = lostItems.find(i => i.id === id);
    else item = foundItems.find(i => i.id === id);

    if(!item) return;

    // 2. Set Basic Info
    document.getElementById('view-name').innerText = item.name;
    document.getElementById('view-date').innerText = item.date;
    document.getElementById('view-posted').innerText = "Posted " + timeAgo(item.postedTime);
    document.getElementById('view-loc').innerText = item.loc;
    document.getElementById('view-desc').innerText = item.desc;
    
    const icon = item.type === 'lost' ? "❓" : (item.status === 'Resolved' ? "🎉" : "✅");
    document.getElementById('view-thumb').innerText = icon;

    const statusSpan = document.getElementById('view-status');
    statusSpan.className = 'status-badge ' + (item.type === 'lost' ? "status-orange" : "status-green");
    statusSpan.innerText = item.status === 'Resolved' ? "Resolved" : (item.type==='lost'?"Searching...":"Found");

    // 3. Store ID for Claim Logic
    document.getElementById('current-view-id').value = id;
    document.getElementById('current-view-type').value = type;

    // 4. Handle UI Visibility based on Status
    const claimWrapper = document.getElementById('claim-section-wrapper');
    const resolvedBox = document.getElementById('resolved-info');
    const claimBtn = document.getElementById('btn-claim-item');
    const contactBox = document.getElementById('claim-contact-info');

    // Reset
    claimWrapper.style.display = 'none';
    resolvedBox.style.display = 'none';
    contactBox.style.display = 'none';
    claimBtn.style.display = 'block';

    const currUser = document.getElementById('profile-name').innerText;

    if (item.status === 'Resolved') {
        // --- SCENARIO: RESOLVED ITEM ---
        resolvedBox.style.display = 'block';
        document.getElementById('res-finder').innerText = item.finder ? item.finder.name : "Unknown";
        document.getElementById('res-receiver').innerText = item.receiver ? item.receiver.name : "Unknown";
    } 
    else if (item.type === 'found') {
        // --- SCENARIO: FOUND (UNCLAIMED) ITEM ---
        // Only show claim if I am NOT the finder
        if (item.finder && item.finder.name !== currUser) {
            claimWrapper.style.display = 'block';
            document.getElementById('finder-name').innerText = item.finder.name;
            document.getElementById('finder-email').innerText = item.finder.email;
            document.getElementById('finder-phone').innerText = item.finder.phone;
        }
    }

    openModal('modal-view');
}

function showClaimDetails() {
    document.getElementById('btn-claim-item').style.display = 'none';
    document.getElementById('claim-contact-info').style.display = 'block';
}

function confirmResolution() {
    const id = document.getElementById('current-view-id').value;
    const type = document.getElementById('current-view-type').value; // Should be 'found'

    // Find Item
    const item = foundItems.find(i => i.id === id);
    if (!item) return;

    // Update Status
    item.status = 'Resolved';
    
    // Set Receiver as Current User
    item.receiver = {
        name: document.getElementById('profile-name').innerText,
        email: document.getElementById('profile-email').innerText,
        phone: document.getElementById('profile-phone').innerText
    };

    saveData(); // Save to LocalStorage
    renderAllLists(); // Re-render lists (updates badges etc)
    closeModal('modal-view');
    fireConfetti(); // Celebrate
    alert("Item successfully claimed and resolved!");
}

// --- UTILS ---
function updateKarmaUI() {
    const k1 = document.getElementById('header-karma');
    const k2 = document.getElementById('profile-karma');
    if(k1) k1.innerText = karmaPoints;
    if(k2) k2.innerText = karmaPoints;
}
function timeAgo(ts) {
    if(!ts) return '';
    const sec = Math.floor((Date.now() - ts)/1000);
    if(sec < 60) return "Just now";
    const min = Math.floor(sec/60);
    if(min < 60) return min + " mins ago";
    const hr = Math.floor(min/60);
    if(hr < 24) return hr + " hours ago";
    return Math.floor(hr/24) + " days ago";
}
function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.add('hidden-section');
        sec.classList.remove('active-section');
    });
    const target = document.getElementById(sectionId + '-section');
    if(target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
    }
    const header = document.getElementById('main-header');
    if(sectionId === 'auth') header.style.display = 'none';
    else header.style.display = 'flex';
}
function handleSearchKey(event) { if (event.key === 'Enter') searchUnidentified(); }
function searchUnidentified() {
    const query = document.getElementById('home-search').value.toLowerCase().trim();
    showSection('unidentified');
    const grid = document.getElementById('unidentified-grid');
    const cards = grid.getElementsByClassName('item-card');
    let hasResults = false;
    for(let i=0; i<cards.length; i++) {
        const title = cards[i].querySelector('h3').innerText.toLowerCase();
        if(title.includes(query) || query === "") {
            cards[i].style.display = "flex";
            hasResults = true;
        } else { cards[i].style.display = "none"; }
    }
    const msg = document.getElementById('no-results-msg');
    msg.style.display = hasResults ? "none" : "block";
}
function switchProfileTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
    const btns = document.querySelectorAll('.tab-btn');
    if(tabName === 'lost') btns[0].classList.add('active-tab');
    else btns[1].classList.add('active-tab');
    const lostDiv = document.getElementById('container-lost');
    const foundDiv = document.getElementById('container-found');
    if(tabName === 'lost') { lostDiv.style.display = 'block'; foundDiv.style.display = 'none'; }
    else { lostDiv.style.display = 'none'; foundDiv.style.display = 'block'; }
}
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(e) { if(e.target.classList.contains('modal-overlay')) e.target.style.display='none'; }
function checkImageUpload() {
    const file = document.getElementById('found-img-input');
    const btn = document.getElementById('btn-found-submit');
    if(file.files.length > 0) { btn.disabled=false; btn.style.opacity="1"; btn.style.cursor="pointer"; }
    else { btn.disabled=true; btn.style.opacity="0.5"; btn.style.cursor="not-allowed"; }
}
function fireConfetti() {
    const c = document.getElementById('confetti-canvas');
    if(!c) return;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const p = [];
    const clrs = ['#f00','#0f0','#00f','#ff0','#0ff'];
    for(let i=0;i<100;i++) p.push({x:c.width/2,y:c.height/2,vx:(Math.random()-0.5)*10,vy:(Math.random()-0.5)*10,c:clrs[Math.floor(Math.random()*clrs.length)],l:100});
    function anim(){
        ctx.clearRect(0,0,c.width,c.height);
        let act=false;
        p.forEach(x=>{if(x.l>0){act=true;x.x+=x.vx;x.y+=x.vy;x.l--;ctx.fillStyle=x.c;ctx.fillRect(x.x,x.y,5,5);}});
        if(act) requestAnimationFrame(anim);
    }
    anim();
}