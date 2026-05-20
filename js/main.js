// ==================== INISIALISASI AOS ====================
AOS.init({ duration: 800, once: true });

// ==================== SISTEM PEMESANAN (FRONTEND-ONLY) ====================
let products = [];
let selectedProduct = null;
let currentFilter = 'all';

// Load data dari products.json
async function loadProducts() {
    const container = document.getElementById('productContainer');
    if (!container) return;
    container.innerHTML = '<div class="col-12 text-center"><p>⏳ Sedang memuat menu spesial...</p></div>';
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        products = data.products;
        displayProducts();
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="col-12 text-center"><p class="text-danger">❌ Gagal memuat menu. Pastikan products.json ada.</p></div>';
    }
}

function displayProducts() {
    const container = document.getElementById('productContainer');
    if (!container) return;
    let filtered = products;
    if (currentFilter !== 'all') {
        filtered = products.filter(p => p.category === currentFilter);
    }
    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Tidak ada produk untuk kategori ini.</p></div>';
        return;
    }
    let html = '';
    filtered.forEach(p => {
        const priceFormatted = 'Rp ' + p.price.toLocaleString('id-ID');
        html += `
            <div class="col-lg-4 col-md-6">
                <div class="product-card">
                    <img src="${p.image}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    <div class="product-info">
                        <h3 class="product-title">${p.name}</h3>
                        <p class="product-category">${p.category}</p>
                        <p class="product-price">${priceFormatted}</p>
                        <button class="btn-order" data-id="${p.id}">Pesan via WhatsApp</button>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    attachOrderButtons();
}

function attachOrderButtons() {
    document.querySelectorAll('.btn-order').forEach(btn => {
        btn.removeEventListener('click', handleOrderClick);
        btn.addEventListener('click', handleOrderClick);
    });
}

function handleOrderClick(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    selectedProduct = products.find(p => p.id === id);
    if (selectedProduct) openModal();
}

function openModal() {
    document.getElementById('modal-product-name').innerText = selectedProduct.name;
    document.getElementById('modal-quantity').value = 1;
    document.getElementById('modal-note').value = '';
    updateTotal();
    document.getElementById('quantityModal').style.display = 'flex';
}

function updateTotal() {
    if (!selectedProduct) return;
    let qty = parseInt(document.getElementById('modal-quantity').value) || 0;
    let total = selectedProduct.price * qty;
    document.getElementById('modal-total').innerHTML = `Rp ${total.toLocaleString('id-ID')}`;
}

function closeModal() {
    document.getElementById('quantityModal').style.display = 'none';
    selectedProduct = null;
}

function sendToWhatsApp() {
    if (!selectedProduct) return;
    let qty = parseInt(document.getElementById('modal-quantity').value) || 1;
    if (qty < 1) { alert('Jumlah minimal 1'); return; }
    let note = document.getElementById('modal-note').value.trim();
    let total = selectedProduct.price * qty;
    if (!confirm(`Kirim pesanan?\n\n${selectedProduct.name}\nJumlah: ${qty}\nTotal: Rp ${total.toLocaleString('id-ID')}`)) return;

    const message = `*PESANAN BARU*%0A%0A` +
        `📦 Produk: ${selectedProduct.name}%0A` +
        `🔢 Jumlah: ${qty}%0A` +
        `💰 Harga: Rp ${selectedProduct.price.toLocaleString('id-ID')}%0A` +
        `💵 Total: Rp ${total.toLocaleString('id-ID')}%0A%0A` +
        (note ? `📝 Catatan: ${note}%0A%0A` : '') +
        `_Dikirim dari Aplikasi Sate Turbo_`;
    const phoneNumber = '6289652257995';
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');

    saveOrderToHistory({
        productName: selectedProduct.name,
        productPrice: selectedProduct.price,
        quantity: qty,
        total: total,
        note: note
    });
    closeModal();
}

// Fungsi riwayat
function saveOrderToHistory(order) {
    let history = localStorage.getItem('orderHistory');
    history = history ? JSON.parse(history) : [];
    order.timestamp = new Date().toLocaleString('id-ID');
    order.id = Date.now();
    history.unshift(order);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('orderHistory', JSON.stringify(history));
}

function getOrderHistory() {
    let h = localStorage.getItem('orderHistory');
    return h ? JSON.parse(h) : [];
}

function displayHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    const history = getOrderHistory();
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align:center">📭 Belum ada pesanan</p>';
        return;
    }
    let html = '';
    history.forEach(item => {
        html += `<div class="history-item">
            <div class="history-date">📅 ${item.timestamp}</div>
            <div><strong>${item.productName}</strong></div>
            <div>Jumlah: ${item.quantity}</div>
            <div class="history-total">💰 Total: Rp ${item.total.toLocaleString('id-ID')}</div>
            ${item.note ? `<div>📝 Catatan: ${item.note}</div>` : ''}
        </div>`;
    });
    container.innerHTML = html;
}

function openHistoryModal() {
    displayHistory();
    document.getElementById('historyModal').style.display = 'flex';
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

function clearHistory() {
    if (confirm('Hapus semua riwayat?')) {
        localStorage.removeItem('orderHistory');
        displayHistory();
        alert('✅ Riwayat dihapus');
    }
}

// ==================== SETUP EVENTS (TERMASUK TOMBOL +/-) ====================
function setupEvents() {
    // ========== MODAL QUANTITY ==========
    const modal = document.getElementById('quantityModal');
    const closeBtn = document.querySelector('#quantityModal .close');
    const sendBtn = document.getElementById('sendWaBtn');
    const qtyInput = document.getElementById('modal-quantity');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    
    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Send button
    if (sendBtn) {
        sendBtn.addEventListener('click', sendToWhatsApp);
    }
    
    // Tombol MINUS
    if (qtyMinus && qtyInput) {
        qtyMinus.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            let val = parseInt(qtyInput.value) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
                updateTotal();
            }
        });
    }
    
    // Tombol PLUS
    if (qtyPlus && qtyInput) {
        qtyPlus.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            let val = parseInt(qtyInput.value) || 1;
            qtyInput.value = val + 1;
            updateTotal();
        });
    }
    
    // Update total saat quantity berubah (manual)
    if (qtyInput) {
        qtyInput.addEventListener('change', function() {
            let val = parseInt(this.value) || 1;
            if (val < 1) this.value = 1;
            updateTotal();
        });
    }
    
    // ========== RIWAYAT ==========
    const closeHistoryBtn = document.querySelector('#historyModal .close-history');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const showHistoryBtn = document.getElementById('showHistoryBtn');
    
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', closeHistoryModal);
    }
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearHistory);
    }
    if (showHistoryBtn) {
        showHistoryBtn.addEventListener('click', openHistoryModal);
    }
    
    // ========== TAB FILTER ==========
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.getAttribute('data-category');
                displayProducts();
            });
        });
    }
    
    // ========== KLIK DI LUAR MODAL ==========
    window.addEventListener('click', (e) => {
        const quantityModal = document.getElementById('quantityModal');
        const historyModal = document.getElementById('historyModal');
        if (e.target === quantityModal) closeModal();
        if (e.target === historyModal) closeHistoryModal();
    });
    
    // ========== BACK TO TOP ==========
    const backBtn = document.getElementById('backToTop');
    if (backBtn) {
        window.addEventListener('scroll', () => { 
            window.scrollY > 500 ? backBtn.classList.add('show') : backBtn.classList.remove('show'); 
        });
        backBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        });
    }
    
    // ========== ACTIVE NAV LINK ==========
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => { 
            if (scrollY >= section.offsetTop - 150) current = section.getAttribute('id'); 
        });
        document.querySelectorAll('.nav-link').forEach(link => { 
            link.classList.remove('active'); 
            if (link.getAttribute('href') === `#${current}`) link.classList.add('active'); 
        });
    });
    
    // ========== FOOTER LINKS ==========
    document.querySelectorAll('.footer .btn-link[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if(targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });
    document.querySelectorAll('.footer .btn-link[data-section="privacy"]').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); alert("📜 Privacy Policy: Demo."); });
    });
    document.querySelectorAll('.footer .btn-link[data-section="terms"]').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); alert("⚖️ Terms & Condition: Demo."); });
    });
    document.querySelectorAll('.footer .btn-social').forEach(icon => {
        icon.addEventListener('click', (e) => { e.preventDefault(); alert("🌐 Connect on social media (Demo)"); });
    });
    document.querySelectorAll('.newsletter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if(input && input.value.trim()) alert(`📧 Terima kasih: ${input.value.trim()}`);
            else alert("Masukkan email Anda.");
        });
    });
}

// ==================== RESERVASI VIA WHATSAPP ====================
function setupReservation() {
    const bookButton = document.querySelector('#bookingForm button[type="submit"]');
    if (bookButton) {
        bookButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const name = document.getElementById('resName')?.value.trim();
            const email = document.getElementById('resEmail')?.value.trim();
            const dateTime = document.getElementById('resDate')?.value;
            const people = document.getElementById('resPeople')?.value;
            const request = document.getElementById('resRequest')?.value.trim();
            
            if (!name) { alert('❌ Masukkan nama Anda!'); return; }
            if (!email) { alert('❌ Masukkan email Anda!'); return; }
            if (!dateTime) { alert('❌ Pilih tanggal dan jam reservasi!'); return; }
            
            let formattedDate = '';
            if (dateTime && dateTime.includes('T')) {
                const parts = dateTime.split('T');
                if (parts.length === 2) {
                    const dateParts = parts[0].split('-');
                    const tahun = dateParts[0];
                    const bulan = parseInt(dateParts[1]);
                    const tanggal = parseInt(dateParts[2]);
                    let waktuPart = parts[1].substring(0, 5);
                    const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    formattedDate = `${tanggal} ${bulanNama[bulan-1]} ${tahun}, ${waktuPart}`;
                }
            }
            if (!formattedDate) formattedDate = dateTime;
            
            let plainMessage = `*RESERVASI MEJA BARU*\n\n`;
            plainMessage += `👤 Nama: ${name}\n`;
            plainMessage += `📧 Email: ${email}\n`;
            plainMessage += `📅 Tanggal & Jam: ${formattedDate}\n`;
            plainMessage += `👥 Jumlah tamu: ${people}\n`;
            if (request) plainMessage += `📝 Permintaan khusus: ${request}\n\n`;
            plainMessage += `_Dikirim dari Sate Turbo App_`;
            
            const encodedMessage = encodeURIComponent(plainMessage);
            const waNumber = '6289652257995';
            window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, '_blank');
            alert('✅ Reservasi terkirim via WhatsApp');
            document.getElementById('bookingForm').reset();
        });
    }
}

// ==================== INISIALISASI ====================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEvents();
    setupReservation();
});