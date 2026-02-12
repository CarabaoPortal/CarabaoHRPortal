// ================================================
// SWAP HRIS - AUTHENTICATION MODULE
// auth.js - Version 2.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires api.js and app.js
// ⚠️ PROVIDES: Login, logout, session management, and auth guards

// ================================================
// SECTION 1: LOGIN FUNCTIONALITY
// ================================================

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    
    console.log('🔐 ========================================');
    console.log('🔐 Login form submitted from auth.js');
    console.log('🔐 ========================================');
    
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    console.log('📧 Email:', email);
    console.log('🔒 Password length:', password ? password.length : 0);
    console.log('💾 Remember me:', rememberMe);
    
    // Validation - Empty fields
    if (!email || !password) {
        console.warn('⚠️ Validation failed: Empty fields');
        console.log('🔍 Calling showAlert...');
        
        if (typeof showAlert === 'function') {
            showAlert('Email dan password harus diisi', 'error');
        } else {
            console.error('❌ showAlert not found!');
            alert('Email dan password harus diisi');
        }
        return;
    }
    
    // Validation - Email format
    if (!isValidEmail(email)) {
        console.warn('⚠️ Validation failed: Invalid email');
        console.log('🔍 Calling showAlert for email...');
        
        if (typeof showAlert === 'function') {
            showAlert('Format email tidak valid', 'error');
        } else {
            console.error('❌ showAlert not found!');
            alert('Format email tidak valid');
        }
        return;
    }
    
    // Disable submit button
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
    }
    
    console.log('⏳ Showing loading...');
    if (typeof showLoading === 'function') {
        showLoading(true);
    }
    
    try {
        console.log('📡 Calling loginUser API...');
        
        // Call login API
        const result = await loginUser(email, password);
        
        // Check for errors
        if (result.error) {
            console.error('❌ Login failed:', result.error);
            
            if (typeof showLoading === 'function') {
                showLoading(false);
            }
            
            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Sign In</span>';
            }
            
            console.log('❌ Showing error alert...');
            if (typeof showAlert === 'function') {
                showAlert(getErrorMessage(result.error), 'error');
            } else {
                alert(getErrorMessage(result.error));
            }
            return;
        }
        
        console.log('✅ Login API success');
        
        // Wait for session to persist
        await sleep(500);
        
        // Verify session is stored
        const { data: { session }, error: sessionError } = await getDB().auth.getSession();
        
        if (sessionError || !session) {
            console.error('❌ Session verification failed');
            
            if (typeof showLoading === 'function') {
                showLoading(false);
            }
            
            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Sign In</span>';
            }
            
            if (typeof showAlert === 'function') {
                showAlert('Gagal menyimpan sesi. Silakan coba lagi.', 'error');
            } else {
                alert('Gagal menyimpan sesi. Silakan coba lagi.');
            }
            return;
        }
        
        console.log('✅ Session verified:', session.user.email);
        
        // Store remember me preference
        if (rememberMe) {
            saveToStorage('remember_me', true);
            saveToStorage('user_email', email);
        } else {
            removeFromStorage('remember_me');
            removeFromStorage('user_email');
        }
        
        // Store user session info
        saveToStorage('user_session', {
            email: result.data.user.email,
            id: result.data.user.id,
            login_time: new Date().toISOString()
        });
        
        console.log('✅ Login successful - redirecting...');
        
        if (typeof showLoading === 'function') {
            showLoading(false);
        }
        
        console.log('🎉 Showing success alert...');
        if (typeof showAlert === 'function') {
            showAlert('Login berhasil! Mengalihkan ke dashboard...', 'success');
        } else {
            alert('Login berhasil!');
        }
        
        // Redirect to dashboard
        console.log('🔄 Redirecting to dashboard in 1.5 seconds...');
        await sleep(1500);
        window.location.replace('dashboard.html');
        
    } catch (error) {
        if (typeof showLoading === 'function') {
            showLoading(false);
        }
        
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Sign In</span>';
        }
        
        console.error('❌ Login exception:', error);
        
        if (typeof showAlert === 'function') {
            showAlert('Terjadi kesalahan sistem', 'error');
        } else {
            alert('Terjadi kesalahan sistem');
        }
    }
}

/**
 * Get user-friendly error message from Supabase error
 * @param {string} error - Error message from Supabase
 * @returns {string} User-friendly message
 */
function getErrorMessage(error) {
    const errorMessages = {
        'Invalid login credentials': 'Email atau password salah',
        'Email not confirmed': 'Email belum diverifikasi',
        'User not found': 'User tidak ditemukan',
        'Invalid email': 'Format email tidak valid',
        'Password is too short': 'Password terlalu pendek (min. 6 karakter)',
        'Network request failed': 'Koneksi jaringan bermasalah'
    };
    
    return errorMessages[error] || 'Login gagal. Silakan coba lagi.';
}

// ================================================
// SECTION 2: AUTO-FILL REMEMBERED EMAIL
// ================================================

/**
 * Auto-fill email if "Remember Me" was previously checked
 */
function autoFillEmail() {
    const rememberMe = getFromStorage('remember_me');
    const savedEmail = getFromStorage('user_email');
    
    if (rememberMe && savedEmail) {
        const emailInput = document.getElementById('email');
        const rememberCheckbox = document.getElementById('rememberMe');
        
        if (emailInput) {
            emailInput.value = savedEmail;
        }
        
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
        
        console.log('✅ Email auto-filled');
    }
}

// ================================================
// SECTION 3: SESSION CHECK & AUTO-REDIRECT
// ================================================

/**
 * Check if user is already logged in
 * If on login page, redirect to dashboard
 */
async function checkExistingSession() {
    try {
        const { data: { session }, error } = await getDB().auth.getSession();
        
        if (error) {
            console.error('❌ Session check error:', error);
            return null;
        }
        
        if (session) {
            console.log('✅ Active session found:', session.user.email);
            
            // If on login page, redirect to dashboard
            if (isLoginPage()) {
                console.log('🔄 Already logged in, redirecting...');
                window.location.replace('dashboard.html');
            }
            
            return session;
        }
        
        console.log('⚠️ No active session');
        return null;
        
    } catch (error) {
        console.error('❌ Session check failed:', error);
        return null;
    }
}

// ================================================
// SECTION 4: PROTECTED PAGE INITIALIZATION
// ================================================

/**
 * Initialize authentication for protected pages
 * Redirects to login if no valid session
 */
async function initProtectedPage() {
    // Don't run on login page
    if (isLoginPage()) {
        return;
    }
    
    showLoading('Memverifikasi sesi...');
    
    try {
        const session = await checkAuth();
        
        if (!session) {
            console.log('⚠️ No session - redirecting to login');
            hideLoading();
            showToast('Sesi berakhir. Silakan login kembali.', 'error');
            await sleep(1000);
            window.location.replace('login.html');
            return null;
        }
        
        // Update UI with user info
        updateUserInfo(session.user);
        
        hideLoading();
        console.log('✅ Protected page initialized:', session.user.email);
        return session;
        
    } catch (error) {
        hideLoading();
        console.error('❌ Protected page init error:', error);
        showToast('Terjadi kesalahan sistem', 'error');
        await sleep(1000);
        window.location.replace('login.html');
        return null;
    }
}

/**
 * Update UI elements with user information
 * @param {Object} user - User object from session
 */
function updateUserInfo(user) {
    if (!user || !user.email) {
        console.warn('⚠️ No user data to update UI');
        return;
    }
    
    console.log('📝 Updating UI with user info:', user.email);
    
    // Extract user data
    const userName = user.user_metadata?.full_name || user.email.split('@')[0];
    const userEmail = user.email;
    const userRole = user.user_metadata?.role || 'HR Administrator';
    const userInitial = userName.charAt(0).toUpperCase();
    
    // ========================================
    // 1. UPDATE BY ID (Specific Elements)
    // ========================================
    
    // Header - User Name
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = userName;
        console.log('✅ Updated userName');
    }
    
    // Header - User Role
    const userRoleEl = document.getElementById('userRole');
    if (userRoleEl) {
        userRoleEl.textContent = userRole;
        console.log('✅ Updated userRole');
    }
    
    // Dropdown - User Name
    const dropdownUserNameEl = document.getElementById('dropdownUserName');
    if (dropdownUserNameEl) {
        dropdownUserNameEl.textContent = userName;
        console.log('✅ Updated dropdownUserName');
    }
    
    // Dropdown - User Email
    const dropdownUserEmailEl = document.getElementById('dropdownUserEmail');
    if (dropdownUserEmailEl) {
        dropdownUserEmailEl.textContent = userEmail;
        console.log('✅ Updated dropdownUserEmail');
    }
    
    // Welcome Message - Current User Name
    const currentUserNameEl = document.getElementById('currentUserName');
    if (currentUserNameEl) {
        currentUserNameEl.textContent = userName;
        console.log('✅ Updated currentUserName');
    }
    
    // ========================================
    // 2. UPDATE BY CLASS (Generic Elements)
    // ========================================
    
    // All elements with class .user-name
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = userName;
    });
    
    // All elements with class .user-email
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
        el.textContent = userEmail;
    });
    
    // All elements with class .user-avatar-text
    const userAvatarElements = document.querySelectorAll('.user-avatar-text');
    userAvatarElements.forEach(el => {
        el.textContent = userInitial;
    });
    
    // All elements with class .user-role
    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(el => {
        el.textContent = userRole;
    });
    
    console.log('✅ All UI elements updated with user info');
}

// ================================================
// SECTION 5: LOGOUT FUNCTIONALITY
// ================================================

/**
 * Handle logout with confirmation dialog
 */
async function handleLogout() {
    showConfirmDialog(
        'Apakah Anda yakin ingin logout?',
        async () => {
            showLoading('Logging out...');
            
            try {
                // Clear local storage
                clearStorage();
                
                // Sign out from Supabase
                await logout();
                
            } catch (error) {
                hideLoading();
                console.error('❌ Logout error:', error);
                showToast('Gagal logout. Silakan coba lagi.', 'error');
            }
        }
    );
}

// ================================================
// SECTION 6: PASSWORD VISIBILITY TOGGLE
// ================================================

/**
 * Toggle password field visibility
 * @param {string} inputId - Password input element ID
 * @param {string} toggleId - Toggle button element ID
 */
function togglePasswordVisibility(inputId = 'password', toggleId = 'toggle-password') {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = document.getElementById(toggleId);
    
    if (!passwordInput || !toggleButton) {
        return;
    }
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.innerHTML = '👁️';
    } else {
        passwordInput.type = 'password';
        toggleButton.innerHTML = '👁️‍🗨️';
    }
}

// ================================================
// SECTION 7: FORGOT PASSWORD
// ================================================

/**
 * Send password reset email
 * @param {string} email - User email address
 */
async function handleForgotPassword(email) {
    if (!email || !isValidEmail(email)) {
        showToast('Masukkan email yang valid', 'error');
        return;
    }
    
    showLoading('Mengirim link reset password...');
    
    try {
        const { error } = await getDB().auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        hideLoading();
        
        if (error) {
            showToast('Gagal mengirim email reset password', 'error');
            console.error('❌ Reset password error:', error);
            return;
        }
        
        showToast('Link reset password telah dikirim ke email Anda', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Forgot password error:', error);
        showToast('Terjadi kesalahan sistem', 'error');
    }
}

// ================================================
// SECTION 8: AUTO-INITIALIZE ON LOGIN PAGE
// ================================================

if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔐 Login page loaded');
        
        // Auto-fill email if remembered
        autoFillEmail();
        
        // Check existing session (auto-redirect if logged in)
        checkExistingSession();
        
        // Attach form handler
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            // Remove any existing handlers first
            loginForm.replaceWith(loginForm.cloneNode(true));
            
            // Get fresh reference and attach handler
            const freshForm = document.getElementById('login-form');
            freshForm.addEventListener('submit', handleLogin);
            
            console.log('✅ Login form handler attached');
        }
        
        // Attach password toggle handler
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                togglePasswordVisibility();
            });
        }
    });
}

// ================================================
// SECTION 9: AUTO-INITIALIZE ON PROTECTED PAGES
// ================================================

if (!window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🔒 Protected page loaded');
        
        // Initialize protected page (checks auth)
        await initProtectedPage();
        
        // Attach logout handlers to all logout buttons
        const logoutButtons = document.querySelectorAll('.logout-btn, #logout-btn, [data-action="logout"]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', handleLogout);
        });
        
        console.log('✅ Logout handlers attached');
    });
}

// ================================================
// EXPOSE FUNCTIONS TO WINDOW (Global Access)
// ================================================

// Section 1: Login
window.handleLogin = handleLogin;
window.getErrorMessage = getErrorMessage;

// Section 2: Auto-fill
window.autoFillEmail = autoFillEmail;

// Section 3: Session Check
window.checkExistingSession = checkExistingSession;

// Section 4: Protected Page
window.initProtectedPage = initProtectedPage;
window.updateUserInfo = updateUserInfo;

// Section 5: Logout
window.handleLogout = handleLogout;

// Section 6: Password Toggle
window.togglePasswordVisibility = togglePasswordVisibility;

// Section 7: Forgot Password
window.handleForgotPassword = handleForgotPassword;

// ================================================
// INITIALIZATION
// ================================================

console.log('✅ AUTH.js v2.0 - CLEANED & ORGANIZED');
console.log('📦 Loaded Sections:');
console.log('   1️⃣  Login Functionality (2 functions)');
console.log('   2️⃣  Auto-fill Email (1 function)');
console.log('   3️⃣  Session Check (1 function)');
console.log('   4️⃣  Protected Page Init (2 functions)');
console.log('   5️⃣  Logout (1 function)');
console.log('   6️⃣  Password Toggle (1 function)');
console.log('   7️⃣  Forgot Password (1 function)');
console.log('   8️⃣  Login Page Auto-Init');
console.log('   9️⃣  Protected Page Auto-Init');
console.log('📊 Total: 9 functions ready');
