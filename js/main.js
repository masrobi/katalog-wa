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
        document.getElementById('modal-total').innerHTML = `💰 Total: Rp ${total.toLocaleString('id-ID')}`;
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
        const phoneNumber = '6289652257995'; // GANTI DENGAN NOMOR WHATSAPP ANDA
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');

        // Simpan ke riwayat
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

    function setupEvents() {
        document.querySelector('.close')?.addEventListener('click', closeModal);
        document.getElementById('sendWaBtn')?.addEventListener('click', sendToWhatsApp);
        document.getElementById('modal-quantity')?.addEventListener('input', updateTotal);
        document.querySelector('.close-history')?.addEventListener('click', closeHistoryModal);
        document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
        document.getElementById('showHistoryBtn')?.addEventListener('click', openHistoryModal);

// Event listener untuk tab filter kategori
const tabBtns = document.querySelectorAll('.tab-btn');
if (tabBtns.length) {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Hapus class active dari semua tab
            tabBtns.forEach(b => b.classList.remove('active'));
            // Tambah class active ke tab yang diklik
            this.classList.add('active');
            // Ambil nilai kategori dari atribut data-category
            const category = this.getAttribute('data-category');
            currentFilter = category;
            displayProducts(); // Tampilkan ulang produk
        });
    });
}

        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('quantityModal')) closeModal();
            if (e.target === document.getElementById('historyModal')) closeHistoryModal();
        });
        // Video trigger & booking form (dari landpage)
        document.getElementById('videoTrigger')?.addEventListener('click', () => alert("🎬 Sate Turbo Preview: A cinematic journey of refined tastes."));
        document.getElementById('bookingForm')?.addEventListener('submit', (e) => { 
            e.preventDefault(); 
            alert("✨ Reservation request received. Our concierge will confirm shortly."); 
            e.target.reset(); 
        });
        // Back to top
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
        // Active nav link
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
        // Footer links
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
                if(input && input.value.trim()) alert(`📧 Thank you for subscribing: ${input.value.trim()}`);
                else alert("Please enter your email.");
            });
        });
    }

    // Inisialisasi
    document.addEventListener('DOMContentLoaded', () => {
        loadProducts();
        setupEvents();
    });

// ==================== RESERVASI VIA WHATSAPP (VERSI FINAL) ====================
document.addEventListener('DOMContentLoaded', function() {
    const bookButton = document.querySelector('#bookingForm button[type="submit"]');
    if (bookButton) {
        bookButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Ambil nilai dari form
            const name = document.getElementById('resName')?.value.trim();
            const email = document.getElementById('resEmail')?.value.trim();
            const dateTime = document.getElementById('resDate')?.value;
            const people = document.getElementById('resPeople')?.value;
            const request = document.getElementById('resRequest')?.value.trim();
            
            // Validasi
            if (!name) { alert('❌ Masukkan nama Anda!'); return; }
            if (!email) { alert('❌ Masukkan email Anda!'); return; }
            if (!dateTime) { alert('❌ Pilih tanggal dan jam reservasi!'); return; }
            
            // ========== FORMAT TANGGAL ==========
            let formattedDate = '';
            
            // Cek apakah dateTime memiliki format yang benar
            if (dateTime && dateTime.includes('T')) {
                const parts = dateTime.split('T');
                if (parts.length === 2) {
                    const tanggalPart = parts[0]; // "2026-05-20"
                    let waktuPart = parts[1];     // "04:00" atau "04:00:00"
                    
                    // Ambil hanya HH:MM (5 karakter pertama)
                    if (waktuPart.length >= 5) {
                        waktuPart = waktuPart.substring(0, 5);
                    }
                    
                    const dateParts = tanggalPart.split('-');
                    if (dateParts.length === 3) {
                        const tahun = dateParts[0];
                        const bulan = parseInt(dateParts[1]);
                        const tanggal = parseInt(dateParts[2]);
                        
                        const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                                           'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                        
                        formattedDate = `${tanggal} ${bulanNama[bulan-1]} ${tahun}, ${waktuPart}`;
                    }
                }
            }
            
            // Jika format tanggal gagal, gunakan nilai asli
            if (!formattedDate) {
                formattedDate = dateTime;
            }
            
            // Debug (opsional, bisa dihapus setelah jadi)
            console.log('Formatted date:', formattedDate);
            
// Buat pesan WhatsApp (gunakan \n, bukan %0A)
let plainMessage = `*RESERVASI MEJA BARU*\n\n`;
plainMessage += `👤 Nama: ${name}\n`;
plainMessage += `📧 Email: ${email}\n`;
plainMessage += `📅 Tanggal & Jam: ${formattedDate}\n`;
plainMessage += `👥 Jumlah tamu: ${people}\n`;
if (request) plainMessage += `📝 Permintaan khusus: ${request}\n\n`;
plainMessage += `_Dikirim dari Sate Turbo App_`;

// Encode untuk URL WhatsApp
const encodedMessage = encodeURIComponent(plainMessage);

// Debug: lihat hasil encoded
console.log('Encoded message:', encodedMessage);

const waNumber = '6289652257995';
window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, '_blank');
            
            alert('✅ Reservasi terkirim via WhatsApp');
            document.getElementById('bookingForm').reset();
        });
    } else {
        console.error('Tombol booking tidak ditemukan!');
    }
});