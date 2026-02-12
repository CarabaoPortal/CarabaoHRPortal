// ================================================
// SWAP HRIS - CORE APPLICATION
// app.js - Version 4.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires Supabase CDN script
// ⚠️ PROVIDES: Core utilities, auth helpers, and UI functions

// ================================================
// SECTION 1: SUPABASE CONFIGURATION & INITIALIZATION
// ================================================

const SUPABASE_CONFIG = {
    url: 'https://cqheisrbylhkpfxjiaiu.supabase.co', // ⚠️ REPLACE WITH YOUR SUPABASE URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxaGVpc3JieWxoa3BmeGppYWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjI2NTksImV4cCI6MjA4NTEzODY1OX0.7Jj7VnRwckhgc8aIjvUCPuEDiRwK1l4VEMWIgwdptXw' // ⚠️ REPLACE WITH YOUR SUPABASE ANON KEY
};

let supabaseClient = null;

/**
 * Initialize Supabase client with auth persistence
 */
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase library not loaded. Include CDN script.');
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
        
        console.log('✅ Supabase initialized');
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ Supabase init failed:', error);
        return null;
    }
}

/**
 * Get initialized Supabase client instance
 */
function getDB() {
    if (!supabaseClient) {
        supabaseClient = initSupabase();
    }
    return supabaseClient;
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});

// ================================================
// SECTION 2: AUTHENTICATION HELPERS
// ================================================

/**
 * Logout current user and clear session
 */
async function logout() {
    try {
        const { error } = await getDB().auth.signOut();
        
        if (error) {
            console.error('❌ Logout error:', error);
            return;
        }
        
        console.log('✅ User logged out');
        
        // Clear all storage
        clearStorage();
        
        // Redirect to login
        redirectToLogin();
        
    } catch (error) {
        console.error('❌ Logout failed:', error);
    }
}

/**
 * Check if user is authenticated (get current session)
 */
async function checkAuth() {
    try {
        const { data: { session }, error } = await getDB().auth.getSession();
        
        if (error) {
            console.error('❌ Session check error:', error);
            return null;
        }
        
        if (!session) {
            console.log('⚠️ No active session');
            return null;
        }
        
        console.log('✅ Session active:', session.user.email);
        return session;
        
    } catch (error) {
        console.error('❌ Auth check failed:', error);
        return null;
    }
}

// ================================================
// SECTION 3: NAVIGATION HELPERS
// ================================================

/**
 * Redirect to login page
 */
function redirectToLogin() {
    console.log('🔄 Redirecting to login...');
    window.location.href = 'login.html';
}

/**
 * Redirect to dashboard page
 */
function redirectToDashboard() {
    console.log('🔄 Redirecting to dashboard...');
    window.location.href = 'dashboard.html';
}

/**
 * Get current page filename
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page;
}

/**
 * Check if current page is login page
 */
function isLoginPage() {
    return getCurrentPage().includes('login.html');
}

/**
 * Check if current page requires authentication
 */
function isProtectedPage() {
    const protectedPages = [
        'dashboard.html',
        'employees.html',
        'attendance.html',
        'leave.html',
        'payroll.html',
        'recruitment.html',
        'whatsapp-blast.html',
        'settings.html'
    ];
    
    const currentPage = getCurrentPage();
    return protectedPages.includes(currentPage);
}

// ================================================
// SECTION 4: LOCAL STORAGE HELPERS
// ================================================

/**
 * Save data to localStorage with JSON serialization
 */
function saveToStorage(key, value) {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        return true;
    } catch (error) {
        console.error('❌ Storage save error:', error);
        return false;
    }
}

/**
 * Get data from localStorage with JSON parsing
 */
function getFromStorage(key) {
    try {
        const serialized = localStorage.getItem(key);
        if (serialized === null) {
            return null;
        }
        return JSON.parse(serialized);
    } catch (error) {
        console.error('❌ Storage get error:', error);
        return null;
    }
}

/**
 * Remove specific item from localStorage
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('❌ Storage remove error:', error);
        return false;
    }
}

/**
 * Clear all localStorage data
 */
function clearStorage() {
    try {
        localStorage.clear();
        console.log('✅ Storage cleared');
        return true;
    } catch (error) {
        console.error('❌ Storage clear error:', error);
        return false;
    }
}

// ================================================
// SECTION 5: FORM HELPERS
// ================================================

/**
 * Get form data as JavaScript object
 */
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        console.error(`❌ Form '${formId}' not found`);
        return {};
    }
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

/**
 * Reset form to initial state
 */
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/**
 * Disable submit button with loading state
 */
function disableSubmitButton(buttonId, loadingText = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
    }
}

/**
 * Enable submit button and restore original text
 */
function enableSubmitButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    }
}

// ================================================
// SECTION 6: UI HELPERS
// ================================================

/**
 * Show loading overlay with custom message
 */
function showLoading(message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        const textEl = overlay.querySelector('.loading-text');
        if (textEl) {
            textEl.textContent = message;
        }
        overlay.style.display = 'flex';
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Show toast notification
 * Auto-creates container if not exists
 */
function showToast(message, type = 'info', duration = 3000) {
    console.log(`📢 Toast: [${type}] ${message}`);
    
    // ========================================
    // ENSURE CONTAINER EXISTS (AUTO-CREATE)
    // ========================================
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        console.log('✅ Toast container auto-created');
    }
    
    const toastId = 'toast-' + Date.now();
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast toast-${type}`;
    
    // Inline critical styles
    toast.style.cssText = `
        min-width: 300px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 10px;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
        pointer-events: auto;
        position: relative;
        border-left: 4px solid ${getToastColor(type)};
    `;
    
    toast.innerHTML = `
        <div class="toast-content" style="
            display: flex;
            align-items: center;
            padding: 16px;
            gap: 12px;
        ">
            <span class="toast-icon" style="
                font-size: 20px;
                font-weight: bold;
                flex-shrink: 0;
                color: ${getToastColor(type)};
            ">${getToastIcon(type)}</span>
            <span class="toast-message" style="
                flex: 1;
                font-size: 14px;
                color: #333;
            ">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Trigger show animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * Get color for toast type
 */
function getToastColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

// Update window exposure (add getToastColor)
window.showToast = showToast;
window.getToastIcon = getToastIcon;
window.getToastColor = getToastColor;

/**
 * Get icon for toast notification type
 */
function getToastIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

/**
 * Show confirmation dialog with callbacks
 */
function showConfirmDialog(message, onConfirm, onCancel = null) {
    const dialogId = 'confirm-dialog-' + Date.now();
    
    const dialog = document.createElement('div');
    dialog.id = dialogId;
    dialog.className = 'confirm-dialog-overlay';
    dialog.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-dialog-header">
                <h3>Konfirmasi</h3>
            </div>
            <div class="confirm-dialog-body">
                <p>${message}</p>
            </div>
            <div class="confirm-dialog-footer">
                <button class="btn btn-secondary" id="${dialogId}-cancel">Batal</button>
                <button class="btn btn-danger" id="${dialogId}-confirm">Ya, Lanjutkan</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    document.getElementById(`${dialogId}-cancel`).addEventListener('click', () => {
        dialog.remove();
        if (onCancel) onCancel();
    });
    
    document.getElementById(`${dialogId}-confirm`).addEventListener('click', () => {
        dialog.remove();
        if (onConfirm) onConfirm();
    });
    
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
            if (onCancel) onCancel();
        }
    });
}

// ================================================
// SECTION 7: VALIDATION HELPERS
// ================================================

/**
 * Check if string value is empty or whitespace
 */
function isEmpty(value) {
    return value === null || value === undefined || value.trim() === '';
}

/**
 * Validate email format using regex
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate Indonesian phone number format
 */
function isValidPhone(phone) {
    const regex = /^(\+62|62|0)[0-9]{9,12}$/;
    return regex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate Indonesian NIK (16 digits)
 */
function isValidNIK(nik) {
    return /^\d{16}$/.test(nik);
}

// ================================================
// SECTION 8: DATE & TIME HELPERS
// ================================================

/**
 * Format date to Indonesian format (DD MMM YYYY)
 */
function formatDate(date, format = 'DD MMM YYYY') {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    
    return format
        .replace('DD', day)
        .replace('MMM', monthNames[month - 1])
        .replace('YYYY', year);
}

/**
 * Format time to HH:MM
 */
function formatTime(time) {
    if (!time) return '-';
    return time.substring(0, 5);
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM:SS format
 */
function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

// ================================================
// SECTION 9: NUMBER & CURRENCY HELPERS
// ================================================

/**
 * Format number with Indonesian thousand separators
 */
function formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number);
}

/**
 * Format number as Indonesian Rupiah currency
 */
function formatCurrency(amount) {
    return 'Rp ' + formatNumber(amount);
}

/**
 * Parse formatted number string to integer
 */
function parseFormattedNumber(formattedNumber) {
    return parseInt(formattedNumber.replace(/\D/g, '')) || 0;
}

// ================================================
// SECTION 10: UTILITY FUNCTIONS
// ================================================

/**
 * Debounce function execution
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Generate RFC4122 v4 UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Async sleep/delay function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================================
// EXPOSE FUNCTIONS TO WINDOW (Global Access)
// ================================================

// Section 1: Supabase
window.initSupabase = initSupabase;
window.getDB = getDB;

// Section 2: Authentication
window.logout = logout;
window.checkAuth = checkAuth;

// Section 3: Navigation
window.redirectToLogin = redirectToLogin;
window.redirectToDashboard = redirectToDashboard;
window.getCurrentPage = getCurrentPage;
window.isLoginPage = isLoginPage;
window.isProtectedPage = isProtectedPage;

// Section 4: Storage
window.saveToStorage = saveToStorage;
window.getFromStorage = getFromStorage;
window.removeFromStorage = removeFromStorage;
window.clearStorage = clearStorage;

// Section 5: Form Helpers
window.getFormData = getFormData;
window.resetForm = resetForm;
window.disableSubmitButton = disableSubmitButton;
window.enableSubmitButton = enableSubmitButton;

// Section 6: UI Helpers
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.getToastIcon = getToastIcon;
window.showConfirmDialog = showConfirmDialog;

// Section 7: Validation
window.isEmpty = isEmpty;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.isValidNIK = isValidNIK;

// Section 8: Date & Time
window.formatDate = formatDate;
window.formatTime = formatTime;
window.getCurrentDate = getCurrentDate;
window.getCurrentTime = getCurrentTime;

// Section 9: Numbers & Currency
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.parseFormattedNumber = parseFormattedNumber;

// Section 10: Utilities
window.debounce = debounce;
window.generateUUID = generateUUID;
window.sleep = sleep;

// ================================================
// INITIALIZATION
// ================================================

console.log('✅ APP.js v4.0 - CLEANED & ORGANIZED');
console.log('📦 Loaded Sections:');
console.log('   1️⃣  Supabase Config (2 functions)');
console.log('   2️⃣  Authentication (2 functions)');
console.log('   3️⃣  Navigation (5 functions)');
console.log('   4️⃣  Storage (4 functions)');
console.log('   5️⃣  Form Helpers (4 functions)');
console.log('   6️⃣  UI Helpers (5 functions)');
console.log('   7️⃣  Validation (4 functions)');
console.log('   8️⃣  Date & Time (4 functions)');
console.log('   9️⃣  Number & Currency (3 functions)');
console.log('   🔟  Utilities (3 functions)');
console.log('📊 Total: 36 functions ready');
