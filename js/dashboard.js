// Dashboard JavaScript
// File ini berisi fungsi-fungsi khusus untuk halaman dashboard

// Auto refresh dashboard setiap 30 detik
let autoRefreshInterval;

function startAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
        loadDashboardData();
    }, 30000); // 30 detik
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}

// Load data dashboard
async function loadDashboardData() {
    try {
        const response = await fetch('php/get_user.php');
        const result = await response.json();

        if (result.success) {
            updateDashboard(result.data);
        } else {
            if (result.message.includes('login')) {
                window.location.href = 'login.html';
            } else {
                console.error('Error loading dashboard:', result.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Update semua elemen dashboard
function updateDashboard(data) {
    const { user, stats, history } = data;

    // Update user info
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.nama;
    }

    // Update saldo dengan animasi
    animateValue('saldo', 0, user.saldo, 1000, (val) => {
        return 'Rp ' + formatNumber(val);
    });

    // Update stats
    if (document.getElementById('totalTransaksi')) {
        animateValue('totalTransaksi', 0, stats.total_transaksi || 0, 800);
    }

    if (document.getElementById('totalBerat')) {
        animateValue('totalBerat', 0, stats.total_berat || 0, 800, (val) => {
            return val.toFixed(1) + ' kg';
        });
    }

    if (document.getElementById('totalPendapatan')) {
        animateValue('totalPendapatan', 0, stats.total_pendapatan || 0, 1000, (val) => {
            return 'Rp ' + formatNumber(val);
        });
    }

    // Update history table
    if (typeof updateHistoryTable === 'function') {
        updateHistoryTable(history);
    }
}

// Animasi angka (counting up effect)
function animateValue(id, start, end, duration, formatter) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16); // 60 FPS
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        
        if (formatter) {
            element.textContent = formatter(current);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Format angka dengan separator
function formatNumber(num) {
    return Math.floor(num).toLocaleString('id-ID');
}

// Chart untuk statistik (opsional, jika ingin menambahkan chart)
function renderStatsChart(data) {
    // Implementasi chart menggunakan Chart.js atau library lain
    // Contoh: Chart total sampah per kategori
    console.log('Chart data:', data);
}

// Export data ke CSV (fitur tambahan)
function exportToCSV(data, filename) {
    let csv = '';
    
    // Headers
    const headers = Object.keys(data[0]);
    csv += headers.join(',') + '\n';
    
    // Rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
        });
        csv += values.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Print dashboard
function printDashboard() {
    window.print();
}

// Notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

// Show browser notification
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '♻️',
            badge: '♻️'
        });
    }
}

// Check for new transactions
let lastTransactionCount = 0;

function checkNewTransactions(currentCount) {
    if (lastTransactionCount > 0 && currentCount > lastTransactionCount) {
        showNotification('Transaksi Baru', 'Transaksi Anda telah diproses!');
        showToast('Transaksi baru telah ditambahkan!', 'success');
    }
    lastTransactionCount = currentCount;
}

// Dark mode toggle (fitur tambahan)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

// Load dark mode preference
function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }
}

// Konfirmasi sebelum logout
function confirmLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        window.location.href = 'php/logout.php';
    }
}

// Search/filter transaksi
function filterTransactions(searchTerm) {
    const rows = document.querySelectorAll('#historyTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Copy data ke clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Data berhasil disalin!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Get statistics untuk periode tertentu
async function getStatsByPeriod(startDate, endDate) {
    try {
        const response = await fetch(`php/get_stats.php?start=${startDate}&end=${endDate}`);
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
    return null;
}

// Initialize dashboard saat DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load dark mode preference
    loadDarkModePreference();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Start auto refresh jika di halaman dashboard
    if (document.getElementById('saldo')) {
        startAutoRefresh();
    }
    
    // Add event listeners untuk fitur tambahan
    const logoutLinks = document.querySelectorAll('a[href="php/logout.php"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            confirmLogout();
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R untuk refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            loadDashboardData();
            showToast('Data diperbarui!', 'info');
        }
        
        // Ctrl/Cmd + P untuk print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            printDashboard();
        }
    });
});

// Cleanup saat user meninggalkan halaman
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});

// Service Worker untuk offline support (opsional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Toast notification function (jika belum ada di main.js)
if (typeof showToast === 'undefined') {
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Export functions untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadDashboardData,
        formatNumber,
        exportToCSV,
        printDashboard
    };
}