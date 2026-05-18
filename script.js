// ============================================================
// SESI 4: Modal untuk input quantity + kirim ke WhatsApp
// ============================================================

let products = [];
let selectedProduct = null;
let currentFilter = 'all';

// ============================================================
// FITUR RIWAYAT PESANAN (localStorage)
// ============================================================

// Simpan pesanan ke localStorage
function saveOrderToHistory(order) {
    let history = localStorage.getItem('orderHistory');
    if (history) {
        history = JSON.parse(history);
    } else {
        history = [];
    }
    
    // Tambahkan timestamp
    order.timestamp = new Date().toLocaleString('id-ID');
    order.id = Date.now();
    
    history.unshift(order); // Tambahkan di awal (terbaru di atas)
    
    // Batasi maksimal 50 riwayat
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    
    localStorage.setItem('orderHistory', JSON.stringify(history));
}

// Ambil semua riwayat
function getOrderHistory() {
    let history = localStorage.getItem('orderHistory');
    if (history) {
        return JSON.parse(history);
    }
    return [];
}

// Tampilkan riwayat di modal
function displayHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    const history = getOrderHistory();
    
    if (history.length === 0) {
        historyList.innerHTML = '<p style="color: #888; text-align: center;">📭 Belum ada pesanan</p>';
        return;
    }
    
    let html = '';
    for (let i = 0; i < history.length; i++) {
        const item = history[i];
        html += `
            <div class="history-item">
                <div class="history-date">📅 ${item.timestamp}</div>
                <div class="history-product">🍽️ ${item.productName}</div>
                <div>Jumlah: ${item.quantity}</div>
                <div class="history-total">💰 Total: Rp ${item.total.toLocaleString('id-ID')}</div>
                ${item.note ? `<div>📝 Catatan: ${item.note}</div>` : ''}
            </div>
        `;
    }
    historyList.innerHTML = html;
}

// Buka modal riwayat
function openHistoryModal() {
    displayHistory();
    document.getElementById('historyModal').style.display = 'flex';
}

// Tutup modal riwayat
function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

// Hapus semua riwayat
function clearHistory() {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat pesanan?')) {
        localStorage.removeItem('orderHistory');
        displayHistory();
        alert('✅ Semua riwayat telah dihapus');
    }
}

// ============================================================
// Load data dari JSON
// ============================================================
async function loadProducts() {
    try {
        const container = document.getElementById('productContainer');
        container.innerHTML = '<p>⏳ Sedang memuat data produk...</p>';
        
        const response = await fetch('products.json');
        
        if (!response.ok) {
            throw new Error('Gagal load file JSON: ' + response.status);
        }
        
        const data = await response.json();
        products = data.products;
        displayProducts();
        
    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('productContainer');
        container.innerHTML = '<p style="color:red;">❌ Gagal memuat data. Pastikan file products.json ada.</p>';
    }
}

// ============================================================
// Tampilkan produk ke halaman
// ============================================================
function displayProducts() {
    const container = document.getElementById('productContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Filter produk berdasarkan kategori yang dipilih
    let filteredProducts = products;
    if (currentFilter !== 'all') {
        filteredProducts = products.filter(p => p.category === currentFilter);
    }
    
    for (let i = 0; i < filteredProducts.length; i++) {
        const p = filteredProducts[i];
        const formattedPrice = 'Rp ' + p.price.toLocaleString('id-ID');
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" class="product-image" 
                 style="width:100%; height:200px; object-fit:cover;"
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-info">
                <h3 class="product-title">${p.name}</h3>
                <p class="product-category">${p.category}</p>
                <p class="product-price">${formattedPrice}</p>
                <button class="btn-order" data-id="${p.id}">Pesan via WhatsApp</button>
            </div>
        `;
        container.appendChild(card);
    }
    
    attachOrderButtons();
}

// ============================================================
// Pasang event ke tombol pesan
// ============================================================
function attachOrderButtons() {
    const buttons = document.querySelectorAll('.btn-order');
    
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        
        button.addEventListener('click', function() {
            const productId = parseInt(button.getAttribute('data-id'));
            
            // Cari produk yang dipilih
            for (let j = 0; j < products.length; j++) {
                if (products[j].id === productId) {
                    selectedProduct = products[j];
                    break;
                }
            }
            
            // Buka modal
            openModal();
        });
    }
}

// ============================================================
// Buka modal dan isi dengan data produk
// ============================================================
function openModal() {
    if (!selectedProduct) return;
    
    // Isi nama produk di modal
    document.getElementById('modal-product-name').innerText = selectedProduct.name;
    
    // Reset nilai quantity ke 1
    document.getElementById('modal-quantity').value = 1;
    
    // Kosongkan catatan
    document.getElementById('modal-note').value = '';
    
    // Hitung dan tampilkan total
    updateTotal();
    
    // Tampilkan modal
    document.getElementById('quantityModal').style.display = 'flex';
}

// ============================================================
// Hitung total harga berdasarkan quantity
// ============================================================
function updateTotal() {
    if (!selectedProduct) return;
    
    const quantity = parseInt(document.getElementById('modal-quantity').value) || 0;
    const total = selectedProduct.price * quantity;
    
    document.getElementById('modal-total').innerHTML = `💰 Total: Rp ${total.toLocaleString('id-ID')}`;
}

// ============================================================
// Kirim pesan ke WhatsApp
// ============================================================
function sendToWhatsApp() {
    if (!selectedProduct) return;
    
    const quantity = parseInt(document.getElementById('modal-quantity').value) || 1;
    
    if (quantity < 1) {
        alert('❌ Jumlah minimal adalah 1');
        return;
    }
    
    const note = document.getElementById('modal-note').value.trim();
    const total = selectedProduct.price * quantity;
    
    const confirmMsg = `Kirim pesanan?\n\nProduk: ${selectedProduct.name}\nJumlah: ${quantity}\nTotal: Rp ${total.toLocaleString('id-ID')}`;
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Format pesan WhatsApp
    const message = `*PESANAN BARU*%0A%0A` +
        `📦 Produk: ${selectedProduct.name}%0A` +
        `🔢 Jumlah: ${quantity}%0A` +
        `💰 Harga: Rp ${selectedProduct.price.toLocaleString('id-ID')}%0A` +
        `💵 Total: Rp ${total.toLocaleString('id-ID')}%0A%0A` +
        (note ? `📝 Catatan: ${note}%0A%0A` : '') +
        `_Dikirim dari Aplikasi Katalog_`;
    
    const phoneNumber = '6289652257995';
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
    // ========== TAMBAHKAN INI: Simpan ke riwayat ==========
    const orderData = {
        productName: selectedProduct.name,
        productPrice: selectedProduct.price,
        quantity: quantity,
        total: total,
        note: note
    };
    saveOrderToHistory(orderData);
    // ======================================================
    
    closeModal();
}

// ============================================================
// Tutup modal
// ============================================================
function closeModal() {
    document.getElementById('quantityModal').style.display = 'none';
    selectedProduct = null;
}

// ============================================================
// Event listener untuk modal
// ============================================================
function setupModalEvents() {
    // Tombol close (X)
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Tombol kirim ke WhatsApp
    const sendBtn = document.getElementById('sendWaBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendToWhatsApp);
    }
    
    // Input quantity: setiap berubah, update total
    const quantityInput = document.getElementById('modal-quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateTotal);
    }
	
// Event filter kategori
const categoryFilter = document.getElementById('categoryFilter');
if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
        currentFilter = this.value;
        displayProducts(); // Tampilkan ulang dengan filter baru
    });
}	
    
    // Klik di luar modal = tutup
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('quantityModal');
        if (event.target === modal) {
            closeModal();
        }
    });
	
// Klik di luar modal riwayat = tutup
window.addEventListener('click', function(event) {
    const historyModal = document.getElementById('historyModal');
    if (event.target === historyModal) {
        closeHistoryModal();
    }
});	
	
// Tombol riwayat pesanan
const historyBtn = document.getElementById('showHistoryBtn');
if (historyBtn) {
    historyBtn.addEventListener('click', openHistoryModal);
}

// Tombol close pada modal riwayat
const closeHistoryBtn = document.querySelector('.close-history');
if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', closeHistoryModal);
}

// Tombol hapus semua riwayat
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
}

	
}

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupModalEvents();
});