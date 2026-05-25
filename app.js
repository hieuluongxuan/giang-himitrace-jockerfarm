/* ==========================================================================
   HimiTrace Application Logic - LocalStorage State & Business Logic
   ========================================================================== */

// --- SEED DATA & STATE INITIALIZATION ---
const INITIAL_USERS = {
    "admin": { username: "admin", password: "123", role: "admin", name: "Admin Trang Trại" },
    "usera": { username: "usera", password: "123", role: "user", name: "Nguyễn Hương Giang", cccd: "012345678910", cash: 5000000 },
    "userb": { username: "userb", password: "123", role: "user", name: "Jocker Partner", cccd: "987654321098", cash: 15000000 }
};

const INITIAL_BOARS = {
    "PIG-BOAR-001": { code: "PIG-BOAR-001", breed: "Duroc Nhập khẩu Mỹ", age: "24 tháng", offspring: 12, avatar: "🐗" },
    "PIG-BOAR-002": { code: "PIG-BOAR-002", breed: "Landrace Đan Mạch", age: "18 tháng", offspring: 5, avatar: "🐗" }
};

const INITIAL_SOWS = {
    "PIG-SOW-045": { code: "PIG-SOW-045", breed: "Yorkshire Anh Quốc", age: "22 tháng", offspring: 3, avatar: "🐖" },
    "PIG-SOW-088": { code: "PIG-SOW-088", breed: "Landrace Kháng Bệnh", age: "20 tháng", offspring: 2, avatar: "🐖" }
};

const INITIAL_PIGS = [
    {
        code: "A012507260AA",
        name: "Heo Ủn Ỉn A1",
        dob: "2026-07-25",
        gender: "male",
        father: "PIG-BOAR-001",
        mother: "PIG-SOW-045",
        penId: "Pen-12",
        weightLogs: [
            { date: "2026-07-25", weight: 1.5 },
            { date: "2026-08-15", weight: 8.2 },
            { date: "2026-09-05", weight: 15.0 }
        ],
        vaccineLogs: [
            { date: "2026-07-26", name: "Vaccine Dịch Tả Heo", status: "Đã tiêm", vet: "Dr. Minh Nguyễn" },
            { date: "2026-08-05", name: "Vaccine Lở Mồm Long Móng", status: "Đã tiêm", vet: "Dr. Minh Nguyễn" }
        ],
        ownerCc: "012345678910",
        price: 1000000,
        isForSale: false,
        txHash: "0x7d8a9e2f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
        blockNum: 1827394
    }
];

const INITIAL_PLANTS = [
    {
        code: "A0103250726",
        name: "Cây Sầu Riêng Ri6",
        type: "Cây ăn quả",
        datePlanted: "2026-07-25",
        fertilizerSchedule: [
            { date: "2026-07-30", type: "Phân hữu cơ vi sinh", qty: "0.5kg" },
            { date: "2026-08-20", type: "NPK Đầu Trâu", qty: "0.2kg" }
        ],
        status: "Đang sinh trưởng tốt, cơi đọt thứ 2",
        harvestLogs: [],
        ownerCc: "012345678910",
        price: 800000,
        isForSale: false,
        growthImages: [
            { date: "2026-07-25", note: "Mới xuống giống tại ô C3" },
            { date: "2026-08-25", note: "Cây cao 50cm, bắt đầu bón phân hữu cơ" }
        ],
        txHash: "0x9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
        blockNum: 1827415
    }
];

// Initialize database
function initDatabase() {
    if (!localStorage.getItem("himitrace_users")) {
        localStorage.setItem("himitrace_users", JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem("himitrace_pigs")) {
        localStorage.setItem("himitrace_pigs", JSON.stringify(INITIAL_PIGS));
    }
    if (!localStorage.getItem("himitrace_plants")) {
        localStorage.setItem("himitrace_plants", JSON.stringify(INITIAL_PLANTS));
    }
    if (!localStorage.getItem("himitrace_boars")) {
        localStorage.setItem("himitrace_boars", JSON.stringify(INITIAL_BOARS));
    }
    if (!localStorage.getItem("himitrace_sows")) {
        localStorage.setItem("himitrace_sows", JSON.stringify(INITIAL_SOWS));
    }
}

// Get data helpers
function getData(key) {
    return JSON.parse(localStorage.getItem(key));
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Global Application State
let state = {
    currentUser: null, // Holds user object when logged in
    currentTraceAsset: null,
    growthChartInstance: null,
    activeAdminFilter: "all"
};

// --- DOM ELEMENTS & APP SETUP ---
document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    setupNavigation();
    setupAuth();
    setupTraceability();
    setupAdminPanel();
    setupUserPortal();
    
    // Default birth registration date to today
    const dateInput = document.getElementById("birthDate");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
    }
    
    // Monitor birth registration input fields to dynamically update note
    document.getElementById("totalPiglets").addEventListener("input", updateBirthRegNote);
    document.getElementById("malePiglets").addEventListener("input", updateBirthRegNote);
});

// --- NAVIGATION LOGIC ---
function setupNavigation() {
    const tabs = document.querySelectorAll(".tab-btn");
    const sections = document.querySelectorAll(".tab-section");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetTab = tab.getAttribute("data-tab");
            
            // Check if login is required
            if (targetTab === "admin-portal" && (!state.currentUser || state.currentUser.role !== "admin")) {
                showAdminSection(false);
            } else if (targetTab === "user-portal" && (!state.currentUser || state.currentUser.role !== "user")) {
                showUserSection(false);
            } else if (targetTab === "user-portal" && state.currentUser && state.currentUser.role === "user") {
                showUserSection(true);
                renderUserDashboard();
            } else if (targetTab === "admin-portal" && state.currentUser && state.currentUser.role === "admin") {
                showAdminSection(true);
                renderAdminDashboard();
            }

            // Toggle active classes
            tabs.forEach(t => t.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(targetTab + "Section").classList.add("active");
        });
    });
}

function showAdminSection(isLoggedIn) {
    if (isLoggedIn) {
        document.getElementById("adminLockBox").style.display = "none";
        document.getElementById("adminDashboardContainer").style.display = "block";
    } else {
        document.getElementById("adminLockBox").style.display = "block";
        document.getElementById("adminDashboardContainer").style.display = "none";
    }
}

function showUserSection(isLoggedIn) {
    if (isLoggedIn) {
        document.getElementById("userLoginBox").style.display = "none";
        document.getElementById("userPortalContainer").style.display = "block";
    } else {
        document.getElementById("userLoginBox").style.display = "block";
        document.getElementById("userPortalContainer").style.display = "none";
    }
}

// --- AUTHENTICATION LOGIC ---
function setupAuth() {
    const btnLoginSubmit = document.getElementById("btnLoginSubmit");
    const btnAdminLoginSubmit = document.getElementById("btnAdminLoginSubmit");
    const logoutBtn = document.getElementById("logoutBtn");

    // Regular User Login
    btnLoginSubmit.addEventListener("click", () => {
        const username = document.getElementById("loginUsername").value.trim();
        const pass = document.getElementById("loginPassword").value;
        performLogin(username, pass);
    });

    // Admin Login
    btnAdminLoginSubmit.addEventListener("click", () => {
        const username = document.getElementById("adminUsername").value.trim();
        const pass = document.getElementById("adminPassword").value;
        performLogin(username, pass);
    });

    // Logout
    logoutBtn.addEventListener("click", () => {
        state.currentUser = null;
        updateUserHeader();
        
        // Return to public trace tab
        document.querySelector('[data-tab="traceability"]').click();
        
        // Reset inputs
        document.getElementById("loginUsername").value = "";
        document.getElementById("loginPassword").value = "";
        document.getElementById("adminPassword").value = "";
    });
}

function performLogin(username, password) {
    const users = getData("himitrace_users");
    const user = users[username.toLowerCase()];

    if (user && user.password === password) {
        state.currentUser = user;
        updateUserHeader();
        alert(`Đăng nhập thành công! Chào mừng ${user.name}.`);

        if (user.role === "admin") {
            showAdminSection(true);
            renderAdminDashboard();
            document.getElementById("adminTabBtn").click();
        } else {
            showUserSection(true);
            renderUserDashboard();
            document.querySelector('[data-tab="user-portal"]').click();
        }
    } else {
        alert("Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại.");
    }
}

function quickLogin(username) {
    const users = getData("himitrace_users");
    const user = users[username];
    if (user) {
        state.currentUser = user;
        updateUserHeader();
        showUserSection(true);
        renderUserDashboard();
        document.querySelector('[data-tab="user-portal"]').click();
    }
}

function updateUserHeader() {
    const userStatusCard = document.getElementById("userStatusCard");
    const logoutBtn = document.getElementById("logoutBtn");
    const statusDot = userStatusCard.querySelector(".status-dot");
    const infoText = userStatusCard.querySelector(".user-info-text");

    if (state.currentUser) {
        statusDot.style.backgroundColor = state.currentUser.role === "admin" ? "#ef4444" : "#10b981";
        statusDot.style.boxShadow = state.currentUser.role === "admin" ? "0 0 8px #ef4444" : "0 0 8px #10b981";
        infoText.innerHTML = `Đang hoạt động: <strong>${state.currentUser.name}</strong> (${state.currentUser.role === "admin" ? "Admin" : "Người nuôi"})`;
        logoutBtn.style.display = "block";
    } else {
        statusDot.style.backgroundColor = "#10b981";
        statusDot.style.boxShadow = "0 0 8px #10b981";
        infoText.innerHTML = `Đang hoạt động: <strong>Khách vãng lai</strong>`;
        logoutBtn.style.display = "none";
        
        // Also reset visual lock states
        showAdminSection(false);
        showUserSection(false);
    }
}

// --- TAB 1: TRUY XUẤT NGUỒN GỐC (PUBLIC VIEW) ---
function setupTraceability() {
    const btnTraceSubmit = document.getElementById("btnTraceSubmit");
    const traceQueryInput = document.getElementById("traceQueryInput");
    const exampleTags = document.querySelectorAll(".example-tag");

    btnTraceSubmit.addEventListener("click", () => {
        const query = traceQueryInput.value.trim();
        performTraceability(query);
    });

    traceQueryInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = traceQueryInput.value.trim();
            performTraceability(query);
        }
    });

    exampleTags.forEach(tag => {
        tag.addEventListener("click", () => {
            const code = tag.getAttribute("data-code");
            traceQueryInput.value = code;
            performTraceability(code);
        });
    });

    // Sub-tab switching within traceability results
    const subtabs = document.querySelectorAll(".sub-tab-btn");
    subtabs.forEach(subtab => {
        subtab.addEventListener("click", () => {
            const targetSubtab = subtab.getAttribute("data-subtab");
            
            // Remove active classes
            subtabs.forEach(st => st.classList.remove("active"));
            document.querySelectorAll(".sub-tab-content").forEach(sc => sc.classList.remove("active"));
            
            // Add active classes
            subtab.classList.add("active");
            document.getElementById("subtab-" + targetSubtab).classList.add("active");
            
            if (targetSubtab === "growth" && state.currentTraceAsset) {
                // Re-render growth chart when tab opens
                setTimeout(renderGrowthChart, 50);
            }
        });
    });

    // Parent details modal trigger
    document.getElementById("fatherNode").addEventListener("click", () => showParentDetails("father"));
    document.getElementById("motherNode").addEventListener("click", () => showParentDetails("mother"));
}

function performTraceability(code) {
    if (!code) {
        alert("Vui lòng nhập mã thẻ tai heo hoặc mã cây trồng.");
        return;
    }

    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");
    const users = getData("himitrace_users");

    // Search pigs
    let asset = pigs.find(p => p.code.toLowerCase() === code.toLowerCase());
    let isPig = true;

    if (!asset) {
        // Search plants
        asset = plants.find(p => p.code.toLowerCase() === code.toLowerCase());
        isPig = false;
    }

    if (!asset) {
        alert(`Không tìm thấy dữ liệu cho mã: ${code}. Vui lòng kiểm tra lại.`);
        document.getElementById("traceResultContainer").style.display = "none";
        return;
    }

    // Set active asset
    state.currentTraceAsset = asset;
    state.currentTraceAsset.isPig = isPig;

    // Show result container
    document.getElementById("traceResultContainer").style.display = "block";

    // Scroll to results
    document.getElementById("traceResultContainer").scrollIntoView({ behavior: 'smooth' });

    // Render general details
    document.getElementById("detailCategoryBadge").textContent = isPig ? "Vật nuôi (Heo giống)" : "Cây trồng (Nông nghiệp)";
    document.getElementById("detailTitleName").textContent = asset.name;
    document.getElementById("detailCodeText").textContent = asset.code;
    document.getElementById("detailDobText").textContent = formatDate(asset.dob || asset.datePlanted);
    document.getElementById("detailGenderText").textContent = isPig ? (asset.gender === "male" ? "Đực" : "Cái") : asset.type;
    document.getElementById("detailPenText").textContent = asset.penId || asset.status.split(",")[0] || "Nông trại";
    document.getElementById("detailPriceText").textContent = formatPrice(asset.price);

    // Render Owner CCCD linked
    let ownerName = "Nông trại JockerFarm (Chưa bán)";
    if (asset.ownerCc) {
        const foundUser = Object.values(users).find(u => u.cccd === asset.ownerCc);
        if (foundUser) {
            ownerName = `${foundUser.name} (${asset.ownerCc})`;
        } else {
            ownerName = `CCCD: ${asset.ownerCc}`;
        }
    }
    document.getElementById("detailOwnerText").textContent = ownerName;

    // Simulated camera setup
    document.getElementById("streamPenName").textContent = isPig ? (asset.penId || "Chuồng số 12") : "Khu vườn V3";
    document.getElementById("visualTagCode").textContent = asset.code;
    document.getElementById("visualEmoji").textContent = isPig ? (asset.gender === "male" ? "🐗" : "🐷") : "🌳";
    
    // Set random simulated camera metrics
    document.getElementById("streamTemp").textContent = (26.5 + Math.random() * 3).toFixed(1);
    document.getElementById("streamHum").textContent = Math.floor(60 + Math.random() * 20);

    // Blockchain card details
    document.getElementById("bcTxHash").textContent = asset.txHash ? asset.txHash.slice(0, 10) + "..." + asset.txHash.slice(-8) : "0x" + Math.random().toString(16).substr(2, 40);
    document.getElementById("bcBlockNum").textContent = asset.blockNum || Math.floor(1820000 + Math.random() * 20000);

    // Sub-tab configuration based on type
    const pedigreeBtn = document.getElementById("subtabPedigreeBtn");
    if (!isPig) {
        pedigreeBtn.style.display = "none";
        // If pedigree active, switch to timeline
        if (document.querySelector(".sub-tab-btn.active").getAttribute("data-subtab") === "pedigree") {
            document.querySelector('[data-subtab="timeline"]').click();
        }
    } else {
        pedigreeBtn.style.display = "block";
        // Setup parents names
        document.getElementById("fatherCode").textContent = asset.father;
        document.getElementById("motherCode").textContent = asset.mother;
        document.getElementById("childCode").textContent = asset.code;
        document.getElementById("childIcon").textContent = asset.gender === "male" ? "🐗" : "🐷";
    }

    // Build timeline list
    renderTimeline(asset, isPig);

    // Draw growth chart
    renderGrowthChart();
}

function renderTimeline(asset, isPig) {
    const timelineList = document.getElementById("timelineList");
    timelineList.innerHTML = "";

    if (isPig) {
        // Event Birth
        addTimelineItem(timelineList, asset.dob, "Sự kiện: Khai sinh & Gắn thẻ tai", `Heo con mới sinh từ mẹ ${asset.mother} và bố ${asset.father}. Cân nặng sơ sinh đạt 1.5kg. Được gán mã QR và blockchain thành công.`, "Trang trại JockerFarm");
        
        // Vaccine events
        if (asset.vaccineLogs) {
            asset.vaccineLogs.forEach(log => {
                addTimelineItem(timelineList, log.date, `Tiêm phòng: ${log.name}`, `Trạng thái: ${log.status}. Đã tiêm chủng bởi bác sĩ phụ trách.`, log.vet);
            });
        }

        // Weight logs
        if (asset.weightLogs) {
            // Sort weights by date
            const sortedWeights = [...asset.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
            // Skip the first one if it's the birth weight
            sortedWeights.forEach(log => {
                if (log.weight > 1.5) {
                    addTimelineItem(timelineList, log.date, `Cập nhật cân nặng: ${log.weight} kg`, `Thực hiện cân định kỳ để theo dõi tăng trưởng. Cân nặng phát triển tốt.`, "Vet. Minh Nguyễn");
                }
            });
        }
    } else {
        // Plant timeline
        addTimelineItem(timelineList, asset.datePlanted, "Sự kiện: Xuống giống gieo trồng", `Cây giống được đưa ra đất trồng thực tế tại ô vườn C3. Hệ thống HimiTrace ghi nhận.`, "Kỹ sư nông nghiệp");
        
        if (asset.fertilizerSchedule) {
            asset.fertilizerSchedule.forEach(log => {
                addTimelineItem(timelineList, log.date, `Chăm sóc: Bón phân - Phun thuốc`, `Loại: ${log.type}. Liều lượng: ${log.qty}. Đã hoàn thành theo lịch trình.`, "Tổ kỹ thuật");
            });
        }

        if (asset.growthImages) {
            asset.growthImages.forEach(log => {
                addTimelineItem(timelineList, log.date, "Cập nhật phát triển cơi đọt", `${log.note}`, "Kỹ sư nông nghiệp");
            });
        }
    }
}

function addTimelineItem(container, date, title, desc, vet) {
    const li = document.createElement("li");
    li.innerHTML = `
        <span class="timeline-date">${formatDate(date)}</span>
        <span class="timeline-title">${title}</span>
        <p class="timeline-desc">${desc}</p>
        <p class="timeline-vet">✓ Xác thực bởi: ${vet}</p>
    `;
    container.appendChild(li);
}

function renderGrowthChart() {
    const canvas = document.getElementById("growthChartCanvas");
    if (!canvas) return;

    if (state.growthChartInstance) {
        state.growthChartInstance.destroy();
    }

    const asset = state.currentTraceAsset;
    if (!asset) return;

    let dates = [];
    let weights = [];
    let standardWeights = [];

    if (asset.isPig) {
        // Pig weight logs
        const sortedLogs = [...asset.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
        dates = sortedLogs.map(log => formatDate(log.date));
        weights = sortedLogs.map(log => log.weight);
        
        // Generate a mock standard growth curve for pigs (starts 1.5, ends 100)
        standardWeights = sortedLogs.map((log, index) => {
            // Simple curve representation
            return (1.5 + (index * 15)).toFixed(1);
        });
    } else {
        // Plant growth logs (mocking height or size indices)
        dates = ["Tháng 1", "Tháng 2", "Tháng 3"];
        weights = [20, 50, 75]; // height in cm
        standardWeights = [15, 45, 70];
    }

    const ctx = canvas.getContext("2d");
    state.growthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: asset.isPig ? 'Cân nặng thực tế (kg)' : 'Chiều cao thực tế (cm)',
                    data: weights,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Đường tăng trưởng tiêu chuẩn',
                    data: standardWeights,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#9ca3af', font: { family: 'Inter', size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

function showParentDetails(type) {
    const boars = getData("himitrace_boars");
    const sows = getData("himitrace_sows");
    const asset = state.currentTraceAsset;
    
    if (!asset) return;
    
    const parentCode = type === "father" ? asset.father : asset.mother;
    const parent = type === "father" ? boars[parentCode] : sows[parentCode];

    if (!parent) {
        alert("Không tìm thấy thông tin chi tiết của phụ huynh.");
        return;
    }

    document.getElementById("parentModalAvatar").textContent = parent.avatar;
    document.getElementById("parentModalCode").textContent = parent.code;
    document.getElementById("parentModalRole").textContent = type === "father" ? "Heo giống Bố (Boar)" : "Heo giống Mẹ (Sow)";
    document.getElementById("parentModalBreed").textContent = parent.breed;
    document.getElementById("parentModalAge").textContent = parent.age;
    document.getElementById("parentModalOffspring").textContent = parent.offspring + " lứa giống";

    // Load timeline of vaccination for parent
    const modalTimeline = document.getElementById("parentModalTimeline");
    modalTimeline.innerHTML = "";
    if (parent.timeline) {
        parent.timeline.forEach(log => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="timeline-date">${log.date}</span>
                <span class="timeline-title">${log.title}</span>
                <p class="timeline-desc">${log.desc}</p>
            `;
            modalTimeline.appendChild(li);
        });
    }

    openModal("parentDetailsModal");
}

// --- TAB 2: ADMIN PANEL (ADMIN DASHBOARD) ---
function setupAdminPanel() {
    const birthForm = document.getElementById("birthRegistrationForm");
    
    // Process Birth Registration
    birthForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const dob = document.getElementById("birthDate").value;
        const total = parseInt(document.getElementById("totalPiglets").value);
        const male = parseInt(document.getElementById("malePiglets").value);
        const father = document.getElementById("fatherSelect").value;
        const mother = document.getElementById("motherSelect").value;

        if (male > total) {
            alert("Số heo đực không thể lớn hơn tổng số heo con.");
            return;
        }

        const female = total - male;

        // Code Generation Base
        // Format dob from YYYY-MM-DD to DDMMYY
        const [year, month, day] = dob.split("-");
        const formattedDate = day + month + year.substring(2); // "250726"

        const pigs = getData("himitrace_pigs");
        
        // Generate codes for Males: A01 + DDMMYY + 0 + Suffix (AA, AB, AC...)
        let newPigletsCount = 0;
        for (let i = 0; i < male; i++) {
            const suffix = indexToLetters(i); // 0 -> AA, 1 -> AB...
            const code = `A01${formattedDate}0${suffix}`;
            
            // Check duplication
            if (pigs.some(p => p.code === code)) continue;

            pigs.push({
                code: code,
                name: `Heo Con Đực (${suffix})`,
                dob: dob,
                gender: "male",
                father: father,
                mother: mother,
                penId: "Pen-02 (Chuồng heo con)",
                weightLogs: [{ date: dob, weight: 1.5 }],
                vaccineLogs: [{ date: dob, name: "Vaccine Kháng Thể Mẹ Truyền", status: "Đã tiêm", vet: "Dr. Minh Nguyễn" }],
                ownerCc: null,
                price: 1000000,
                isForSale: false,
                txHash: "0x" + Math.random().toString(16).substr(2, 40),
                blockNum: 1827400 + Math.floor(Math.random() * 500)
            });
            newPigletsCount++;
        }

        // Generate codes for Females: A01 + DDMMYY + 1 + ♀ + Suffix (A, B, C...)
        for (let i = 0; i < female; i++) {
            const suffix = String.fromCharCode(65 + i); // 0 -> A, 1 -> B...
            const code = `A01${formattedDate}1♀${suffix}`;

            if (pigs.some(p => p.code === code)) continue;

            pigs.push({
                code: code,
                name: `Heo Con Cái (♀${suffix})`,
                dob: dob,
                gender: "female",
                father: father,
                mother: mother,
                penId: "Pen-02 (Chuồng heo con)",
                weightLogs: [{ date: dob, weight: 1.4 }],
                vaccineLogs: [{ date: dob, name: "Vaccine Kháng Thể Mẹ Truyền", status: "Đã tiêm", vet: "Dr. Minh Nguyễn" }],
                ownerCc: null,
                price: 1000000,
                isForSale: false,
                txHash: "0x" + Math.random().toString(16).substr(2, 40),
                blockNum: 1827400 + Math.floor(Math.random() * 500)
            });
            newPigletsCount++;
        }

        saveData("himitrace_pigs", pigs);
        alert(`Khai sinh thành công! Đã tạo ${newPigletsCount} heo giống mới trên Blockchain.`);
        
        // Reset form & reload dashboard
        updateBirthRegNote();
        renderAdminDashboard();
    });

    // Setup Filter buttons on Admin table
    document.getElementById("btnFilterAll").addEventListener("click", () => setAdminFilter("all"));
    document.getElementById("btnFilterPigs").addEventListener("click", () => setAdminFilter("pigs"));
    document.getElementById("btnFilterPlants").addEventListener("click", () => setAdminFilter("plants"));

    // Save Update Asset Modal button
    document.getElementById("btnSaveUpdateAsset").addEventListener("click", saveAssetUpdates);
}

function updateBirthRegNote() {
    const total = parseInt(document.getElementById("totalPiglets").value) || 0;
    const male = parseInt(document.getElementById("malePiglets").value) || 0;
    const female = Math.max(0, total - male);
    
    document.getElementById("birthRegNote").textContent = `Hệ thống sẽ tạo: ${male} Đực & ${female} Cái.`;
}

function setAdminFilter(filter) {
    state.activeAdminFilter = filter;
    
    document.querySelectorAll(".filter-buttons .btn").forEach(btn => btn.classList.remove("active"));
    if (filter === "all") document.getElementById("btnFilterAll").classList.add("active");
    if (filter === "pigs") document.getElementById("btnFilterPigs").classList.add("active");
    if (filter === "plants") document.getElementById("btnFilterPlants").classList.add("active");
    
    renderAdminDashboard();
}

function renderAdminDashboard() {
    const tbody = document.getElementById("adminTableBody");
    tbody.innerHTML = "";

    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");
    const users = getData("himitrace_users");

    let list = [];
    if (state.activeAdminFilter === "all" || state.activeAdminFilter === "pigs") {
        list = list.concat(pigs.map(p => ({ ...p, isPig: true })));
    }
    if (state.activeAdminFilter === "all" || state.activeAdminFilter === "plants") {
        list = list.concat(plants.map(p => ({ ...p, isPig: false })));
    }

    // Sort by date/code
    list.sort((a, b) => b.code.localeCompare(a.code));

    list.forEach(item => {
        const tr = document.createElement("tr");

        // Format Owner Name
        let ownerStr = `<span class="badge badge-no-owner">Chưa bán</span>`;
        if (item.ownerCc) {
            const ownerObj = Object.values(users).find(u => u.cccd === item.ownerCc);
            ownerStr = `<span class="badge badge-owner" title="CCCD: ${item.ownerCc}">👤 ${ownerObj ? ownerObj.name : item.ownerCc}</span>`;
        }

        // Format Gender or Plant type
        let typeStr = "";
        if (item.isPig) {
            typeStr = item.gender === "male" 
                ? `<span class="badge badge-gender-male">🐗 Đực</span>` 
                : `<span class="badge badge-gender-female">🐖 Cái</span>`;
        } else {
            typeStr = `<span class="badge badge-plant">🌳 Cây trồng</span>`;
        }

        // Format weight or status
        let weightOrStatus = "";
        if (item.isPig) {
            const lastWeight = item.weightLogs[item.weightLogs.length - 1];
            weightOrStatus = lastWeight ? `${lastWeight.weight} kg` : "N/A";
        } else {
            weightOrStatus = item.status.length > 20 ? item.status.substring(0, 17) + "..." : item.status;
        }

        tr.innerHTML = `
            <td><code>${item.code}</code></td>
            <td><strong>${item.name}</strong><br>${typeStr}</td>
            <td>${formatDate(item.dob || item.datePlanted)}</td>
            <td>${weightOrStatus}</td>
            <td>${ownerStr}</td>
            <td class="text-gold">${formatPrice(item.price)}</td>
            <td>
                <button class="btn btn-xs btn-primary" onclick="openUpdateAssetModal('${item.code}', ${item.isPig})">🛠️ Cập nhật</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function openUpdateAssetModal(code, isPig) {
    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");

    const asset = isPig 
        ? pigs.find(p => p.code === code)
        : plants.find(p => p.code === code);

    if (!asset) return;

    document.getElementById("modalUpdateTitle").textContent = `Cập nhật mã: ${asset.code}`;
    document.getElementById("modalUpdateCode").value = asset.code;
    document.getElementById("modalUpdateType").value = isPig ? "pig" : "plant";

    // Setup input values
    if (isPig) {
        const lastWeight = asset.weightLogs[asset.weightLogs.length - 1];
        document.getElementById("updateWeightOrStatus").value = lastWeight ? lastWeight.weight : "";
        document.getElementById("updatePenOrGarden").value = asset.penId || "";
        document.getElementById("logInputPigSection").style.display = "block";
        document.getElementById("logInputPlantSection").style.display = "none";
    } else {
        document.getElementById("updateWeightOrStatus").value = asset.status || "";
        document.getElementById("updatePenOrGarden").value = asset.penId || ""; // garden
        document.getElementById("logInputPigSection").style.display = "none";
        document.getElementById("logInputPlantSection").style.display = "block";
    }

    document.getElementById("updatePrice").value = asset.price || "";

    // Clear vaccination logs inputs
    document.getElementById("vaccineName").value = "";
    document.getElementById("fertilizerType").value = "";
    document.getElementById("fertilizerQty").value = "";

    switchUpdateSubTab('update-basic');
    openModal("updateAssetModal");
}

function switchUpdateSubTab(subtab) {
    // Switch modal subtabs
    document.querySelectorAll("#updateAssetModal .sub-tab-btn").forEach(st => st.classList.remove("active"));
    document.querySelectorAll("#updateAssetModal .sub-tab-content").forEach(sc => sc.classList.remove("active"));

    // Find clicked subtab
    const clickedBtn = Object.values(document.querySelectorAll("#updateAssetModal .sub-tab-btn")).find(btn => btn.getAttribute("data-subtab") === subtab);
    if (clickedBtn) clickedBtn.classList.add("active");
    
    document.getElementById(subtab + "-content").classList.add("active");
}

function saveAssetUpdates() {
    const code = document.getElementById("modalUpdateCode").value;
    const type = document.getElementById("modalUpdateType").value;
    const isPig = type === "pig";

    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");

    const assetList = isPig ? pigs : plants;
    const index = assetList.findIndex(x => x.code === code);
    if (index === -1) return;

    const asset = assetList[index];

    // Read general fields
    const weightOrStatus = document.getElementById("updateWeightOrStatus").value.trim();
    const penOrGarden = document.getElementById("updatePenOrGarden").value.trim();
    const price = parseInt(document.getElementById("updatePrice").value) || asset.price;

    asset.price = price;
    
    if (isPig) {
        asset.penId = penOrGarden;
        
        // Check weight changes
        if (weightOrStatus !== "") {
            const weightVal = parseFloat(weightOrStatus);
            const lastWeightObj = asset.weightLogs[asset.weightLogs.length - 1];
            
            // Add new weight log if it's different or doesn't exist
            if (!lastWeightObj || lastWeightObj.weight !== weightVal) {
                asset.weightLogs.push({
                    date: new Date().toISOString().split("T")[0],
                    weight: weightVal
                });
            }
        }

        // Check if vaccine input was filled
        const vacName = document.getElementById("vaccineName").value.trim();
        const vacVet = document.getElementById("vaccineVet").value.trim();
        if (vacName !== "") {
            asset.vaccineLogs.push({
                date: new Date().toISOString().split("T")[0],
                name: vacName,
                status: "Đã tiêm",
                vet: vacVet
            });
        }
    } else {
        asset.status = weightOrStatus; // updates status
        asset.penId = penOrGarden; // updates garden location
        
        // Check fertilizer input
        const fertType = document.getElementById("fertilizerType").value.trim();
        const fertQty = document.getElementById("fertilizerQty").value.trim();
        if (fertType !== "") {
            asset.fertilizerSchedule.push({
                date: new Date().toISOString().split("T")[0],
                type: fertType,
                qty: fertQty
            });
        }
    }

    // Save back to db
    if (isPig) {
        saveData("himitrace_pigs", pigs);
    } else {
        saveData("himitrace_plants", plants);
    }

    closeModal("updateAssetModal");
    alert("Cập nhật thông tin thành công!");
    
    // Refresh panels
    renderAdminDashboard();
    
    // If this asset is currently traced, refresh public trace panel as well
    if (state.currentTraceAsset && state.currentTraceAsset.code === code) {
        performTraceability(code);
    }
}

// --- TAB 3: USER PORTAL & MARKETPLACE ---
function setupUserPortal() {
    // Open deposit modal trigger
    document.getElementById("btnOpenDepositModal").addEventListener("click", openDepositModal);
    
    // Deposit simulation confirmations
    document.getElementById("btnSimulateDepositSuccess").addEventListener("click", simulateDepositSuccess);
}

function renderUserDashboard() {
    if (!state.currentUser || state.currentUser.role !== "user") return;

    // Reload user cash balance from DB (in case of transfer or transactions)
    const users = getData("himitrace_users");
    const userDbObj = users[state.currentUser.username];
    if (userDbObj) {
        state.currentUser = userDbObj;
    }

    document.getElementById("userNameDisplay").textContent = `Chào ${state.currentUser.name}!`;
    document.getElementById("userCccdDisplay").textContent = state.currentUser.cccd;
    document.getElementById("userCashDisplay").textContent = formatPrice(state.currentUser.cash);

    renderMyAssets();
    renderMarketplace();
}

function renderMyAssets() {
    const container = document.getElementById("myAssetList");
    container.innerHTML = "";

    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");
    
    // My Pigs
    const myPigs = pigs.filter(p => p.ownerCc === state.currentUser.cccd);
    // My Plants
    const myPlants = plants.filter(p => p.ownerCc === state.currentUser.cccd);

    const myList = myPigs.map(p => ({ ...p, isPig: true })).concat(myPlants.map(p => ({ ...p, isPig: false })));

    if (myList.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-4">Bạn chưa sở hữu tài sản vật nuôi hoặc cây trồng nào.</div>`;
        return;
    }

    myList.forEach(item => {
        const div = document.createElement("div");
        div.className = "asset-item";

        // Asset details
        let badgeStr = "";
        if (item.isForSale) {
            badgeStr = `<span class="badge-sale">Đang bán trên sàn: ${formatPrice(item.price)}</span>`;
        }

        const iconStr = item.isPig ? (item.gender === "male" ? "🐗" : "🐷") : "🌳";
        const typeStr = item.isPig ? "Heo giống" : "Cây trồng";

        div.innerHTML = `
            <div class="asset-info">
                <span class="asset-icon">${iconStr}</span>
                <div class="asset-details">
                    <h4>${item.name}</h4>
                    <p>${typeStr} | Mã: <code>${item.code}</code></p>
                    ${badgeStr}
                </div>
            </div>
            <div class="asset-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="transferOwnershipPrompt('${item.code}', ${item.isPig})">Chuyển sở hữu</button>
                <button class="btn btn-sm btn-gold" onclick="listOnMarketplacePrompt('${item.code}', ${item.isPig}, ${item.price})">
                    ${item.isForSale ? "Đổi giá bán" : "Đăng bán"}
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderMarketplace() {
    const container = document.getElementById("marketList");
    container.innerHTML = "";

    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");
    const users = getData("himitrace_users");

    // Get all items registered for sale AND not owned by current user
    const salePigs = pigs.filter(p => p.isForSale && p.ownerCc !== state.currentUser.cccd);
    const salePlants = plants.filter(p => p.isForSale && p.ownerCc !== state.currentUser.cccd);

    const saleList = salePigs.map(p => ({ ...p, isPig: true })).concat(salePlants.map(p => ({ ...p, isPig: false })));

    if (saleList.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-4">Hiện tại không có tài sản nào đang được rao bán trên sàn.</div>`;
        return;
    }

    saleList.forEach(item => {
        const div = document.createElement("div");
        div.className = "market-item";

        // Find Owner Name
        const ownerObj = Object.values(users).find(u => u.cccd === item.ownerCc);
        const ownerName = ownerObj ? ownerObj.name : "Nông dân khác";

        const iconStr = item.isPig ? (item.gender === "male" ? "🐗" : "🐷") : "🌳";
        const typeStr = item.isPig ? "Heo giống" : "Cây trồng";

        div.innerHTML = `
            <div class="market-info">
                <span class="market-icon">${iconStr}</span>
                <div class="market-details">
                    <h4>${item.name}</h4>
                    <p>Mã: <code>${item.code}</code> | Người bán: <strong>${ownerName}</strong></p>
                    <p>Phân loại: ${typeStr}</p>
                </div>
            </div>
            <div class="market-actions">
                <span class="text-gold font-weight-bold" style="align-self: center; margin-right: 1rem; font-size: 1.1rem; font-weight: 700;">
                    ${formatPrice(item.price)}
                </span>
                <button class="btn btn-sm btn-primary" onclick="buyAssetConfirm('${item.code}', ${item.isPig}, ${item.price})">Mua ngay</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// User Action: Transfer Ownership
function transferOwnershipPrompt(code, isPig) {
    const cccdRecipient = prompt("Nhập Số Căn cước công dân (CCCD) của người nhận chuyển quyền sở hữu:");
    if (cccdRecipient === null) return; // Cancelled
    
    if (cccdRecipient.trim() === "") {
        alert("Cần nhập số Căn cước công dân hợp lệ.");
        return;
    }

    if (cccdRecipient.trim() === state.currentUser.cccd) {
        alert("Bạn không thể chuyển quyền sở hữu cho chính mình.");
        return;
    }

    // Check if recipient exists in DB
    const users = getData("himitrace_users");
    const recipientUser = Object.values(users).find(u => u.cccd === cccdRecipient.trim());

    if (!recipientUser) {
        alert("Số Căn cước công dân không tồn tại trên hệ thống. Vui lòng kiểm tra lại.");
        return;
    }

    const confirmTransfer = confirm(`Xác nhận chuyển quyền sở hữu tài sản này sang cho:\n👤 ${recipientUser.name}\nCCCD: ${recipientUser.cccd}?`);
    if (!confirmTransfer) return;

    // Load assets
    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");

    const assetList = isPig ? pigs : plants;
    const asset = assetList.find(x => x.code === code);

    if (asset) {
        asset.ownerCc = recipientUser.cccd;
        asset.isForSale = false; // Turn off sale during transfer
        
        // Save
        if (isPig) {
            saveData("himitrace_pigs", pigs);
        } else {
            saveData("himitrace_plants", plants);
        }

        alert("Chuyển quyền sở hữu thành công! Giao dịch được ghi nhận blockchain.");
        renderUserDashboard();
    }
}

// User Action: Price and post to marketplace
function listOnMarketplacePrompt(code, isPig, currentPrice) {
    const newPriceStr = prompt("Nhập giá trị định giá muốn đăng bán (VNĐ):", currentPrice);
    if (newPriceStr === null) return;

    const newPrice = parseInt(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) {
        alert("Giá bán phải là số nguyên dương hợp lệ.");
        return;
    }

    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");

    const assetList = isPig ? pigs : plants;
    const asset = assetList.find(x => x.code === code);

    if (asset) {
        asset.price = newPrice;
        asset.isForSale = true;
        
        if (isPig) {
            saveData("himitrace_pigs", pigs);
        } else {
            saveData("himitrace_plants", plants);
        }

        alert(`Đăng bán thành công sản phẩm với giá ${formatPrice(newPrice)}.`);
        renderUserDashboard();
    }
}

// User Action: Purchase Asset from Market
function buyAssetConfirm(code, isPig, price) {
    // Reload user money
    const users = getData("himitrace_users");
    const buyerObj = users[state.currentUser.username];

    if (buyerObj.cash < price) {
        alert(`Số dư tài khoản không đủ để mua sản phẩm này.\nSố dư: ${formatPrice(buyerObj.cash)}\nGiá bán: ${formatPrice(price)}\nVui lòng nạp thêm tiền!`);
        openDepositModal();
        return;
    }

    const confirmBuy = confirm(`Xác nhận mua tài sản ${code} với giá ${formatPrice(price)}?\n(Hệ thống sẽ trừ tiền ví Cash của bạn tức thì)`);
    if (!confirmBuy) return;

    // Load assets
    const pigs = getData("himitrace_pigs");
    const plants = getData("himitrace_plants");

    const assetList = isPig ? pigs : plants;
    const asset = assetList.find(x => x.code === code);

    if (!asset || !asset.isForSale) {
        alert("Sản phẩm đã được bán hoặc không còn đăng trên sàn.");
        renderUserDashboard();
        return;
    }

    // Process Transaction
    const sellerCccd = asset.ownerCc;
    
    // 1. Deduct buyer cash
    buyerObj.cash -= price;
    
    // 2. Pay seller 98% of price (2% fee)
    const commissionFee = Math.floor(price * 0.02);
    const sellerProceeds = price - commissionFee;
    
    const sellerObj = Object.values(users).find(u => u.cccd === sellerCccd);
    if (sellerObj) {
        const sellerUsername = sellerObj.username;
        users[sellerUsername].cash += sellerProceeds;
    }

    // Update buyer state in memory
    state.currentUser.cash = buyerObj.cash;

    // 3. Update asset owner
    asset.ownerCc = buyerObj.cccd;
    asset.isForSale = false;

    // Save state
    saveData("himitrace_users", users);
    if (isPig) {
        saveData("himitrace_pigs", pigs);
    } else {
        saveData("himitrace_plants", plants);
    }

    alert(`Giao dịch thành công!\nBạn đã sở hữu tài sản mã: ${code}.\nNgười bán nhận được ${formatPrice(sellerProceeds)} (đã trừ 2% phí sàn).`);
    
    renderUserDashboard();
}

// --- PAYMENTS (DEPOSIT CASH MODAL) ---
function openDepositModal() {
    if (!state.currentUser) return;
    
    // Set VietQR info
    const username = state.currentUser.username;
    document.getElementById("vietQrContentText").textContent = `NAP_${username.toUpperCase()}`;
    
    // Set deposit amount and renderQR
    document.getElementById("depositAmount").value = 2000000;
    updateVietQR();
    
    openModal("depositModal");
}

function updateVietQR() {
    const amount = parseInt(document.getElementById("depositAmount").value) || 0;
    const username = state.currentUser.username;
    
    document.getElementById("vietQrAmountText").textContent = formatPrice(amount);
    
    // Generate VietQR Image URL via VietQR.io API
    // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
    const bankId = "MB";
    const accountNo = "9999123456789";
    const template = "print";
    const addInfo = `NAP_${username.toUpperCase()}`;
    const accountName = "HIMITRACE JOCKERFARM";
    
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(accountName)}`;
    
    document.getElementById("vietQrImg").src = qrUrl;
}

function simulateDepositSuccess() {
    const amount = parseInt(document.getElementById("depositAmount").value) || 0;
    
    if (amount <= 0) {
        alert("Số tiền nạp phải lớn hơn 0.");
        return;
    }

    // Load users
    const users = getData("himitrace_users");
    const userObj = users[state.currentUser.username];
    
    if (userObj) {
        userObj.cash += amount;
        saveData("himitrace_users", users);
        state.currentUser.cash = userObj.cash;
        
        alert(`Nạp tiền thành công! Đã cộng +${formatPrice(amount)} vào tài khoản ví Cash.`);
        
        closeModal("depositModal");
        renderUserDashboard();
    }
}

// --- MODAL UTILITIES ---
function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// --- UTILITY FUNCTIONS ---
function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatPrice(val) {
    if (val === undefined || val === null) return "0 VNĐ";
    return val.toLocaleString('vi-VN') + " VNĐ";
}

// Helper: base 26 conversion for sequence generation (0 -> AA, 1 -> AB, 2 -> AC...)
function indexToLetters(num) {
    let result = "";
    let temp = num;
    
    // We want 2 characters: AA, AB, AC...
    const char2 = String.fromCharCode(65 + (temp % 26));
    const char1 = String.fromCharCode(65 + Math.floor(temp / 26));
    
    return char1 + char2;
}
