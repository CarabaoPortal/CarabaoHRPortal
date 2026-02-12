// ================================================
// SWAP HRIS - UTILITY FUNCTIONS
// utils.js - Version 2.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires app.js (for showToast)
// ⚠️ PROVIDES: UI helpers, validation, formatting, and utility functions

// ================================================
// SECTION 0: CORE HELPER FUNCTIONS
// ================================================

/**
 * Check if value is empty
 * @param {any} value - Value to check
 * @returns {boolean}
 */
function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
function isValidPhone(phone) {
    // Allow formats: 08xx, +628xx, 628xx (min 10 digits)
    const phoneRegex = /^(\+?62|0)8\d{8,11}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate NIK (16 digits)
 * @param {string} nik - NIK number
 * @returns {boolean}
 */
function isValidNIK(nik) {
    return /^\d{16}$/.test(nik);
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string}
 */
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
function debounce(func, wait = 500) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get form data as object
 * @param {string} formId - Form element ID
 * @returns {Object}
 */
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

// ================================================
// SECTION 1: TABLE RENDERING FUNCTIONS
// ================================================

/**
 * Render data to HTML table
 * @param {string} tableId - Table body element ID
 * @param {Array} data - Array of data objects
 * @param {Function} rowRenderer - Function to render each row
 */
function renderTable(tableId, data, rowRenderer) {
    const tbody = document.getElementById(tableId);
    
    if (!tbody) {
        console.error(`❌ Table body '${tableId}' not found`);
        return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="100%" class="text-center py-4 text-gray-500">
                    Tidak ada data
                </td>
            </tr>
        `;
        return;
    }
    
    // Render rows
    data.forEach((item, index) => {
        const row = rowRenderer(item, index);
        tbody.innerHTML += row;
    });
    
    console.log(`✅ Rendered ${data.length} rows`);
}

/**
 * Add row numbers to table
 * @param {string} tableId - Table body element ID
 */
function addRowNumbers(tableId) {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        const firstCell = row.querySelector('td');
        if (firstCell) {
            firstCell.textContent = index + 1;
        }
    });
}

/**
 * Show/hide table loading state
 * @param {string} tableId - Table body element ID
 * @param {boolean} show - Show or hide loading
 */
function toggleTableLoading(tableId, show = true) {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    
    if (show) {
        tbody.innerHTML = `
            <tr>
                <td colspan="100%" class="text-center py-4">
                    <div class="spinner"></div>
                    <p class="mt-2 text-gray-500">Memuat data...</p>
                </td>
            </tr>
        `;
    }
}

// ================================================
// SECTION 2: STATUS BADGE HELPERS
// ================================================

/**
 * Generate status badge HTML
 * @param {string} status - Status value
 * @param {Object} config - Custom status configuration
 * @returns {string} Badge HTML
 */
function getStatusBadge(status, config = null) {
    const defaultConfig = {
        'active': { label: 'Aktif', class: 'badge-success' },
        'inactive': { label: 'Nonaktif', class: 'badge-secondary' },
        'pending': { label: 'Pending', class: 'badge-warning' },
        'approved': { label: 'Disetujui', class: 'badge-success' },
        'rejected': { label: 'Ditolak', class: 'badge-danger' },
        'present': { label: 'Hadir', class: 'badge-success' },
        'late': { label: 'Terlambat', class: 'badge-warning' },
        'absent': { label: 'Absen', class: 'badge-danger' },
        'permission': { label: 'Izin', class: 'badge-info' },
        'sick': { label: 'Sakit', class: 'badge-info' },
        'paid': { label: 'Dibayar', class: 'badge-success' },
        'unpaid': { label: 'Belum Dibayar', class: 'badge-warning' },
        'new': { label: 'Baru', class: 'badge-info' },
        'interview': { label: 'Interview', class: 'badge-primary' },
        'hired': { label: 'Diterima', class: 'badge-success' }
    };
    
    const statusConfig = config || defaultConfig;
    const statusData = statusConfig[status?.toLowerCase()] || { 
        label: status, 
        class: 'badge-secondary' 
    };
    
    return `<span class="badge ${statusData.class}">${statusData.label}</span>`;
}

/**
 * Get attendance status badge with icon
 * @param {string} status - Attendance status
 * @returns {string} Badge HTML with icon
 */
function getAttendanceBadge(status) {
    const statusConfig = {
        'present': { label: 'Hadir', class: 'badge-success', icon: '✓' },
        'late': { label: 'Terlambat', class: 'badge-warning', icon: '⏰' },
        'absent': { label: 'Absen', class: 'badge-danger', icon: '✕' },
        'permission': { label: 'Izin', class: 'badge-info', icon: '📋' },
        'sick': { label: 'Sakit', class: 'badge-info', icon: '🏥' }
    };
    
    const statusData = statusConfig[status] || { 
        label: status, 
        class: 'badge-secondary', 
        icon: '•' 
    };
    
    return `
        <span class="badge ${statusData.class}">
            <span class="badge-icon">${statusData.icon}</span>
            ${statusData.label}
        </span>
    `;
}

// ================================================
// SECTION 3: ACTION BUTTONS HELPER
// ================================================

/**
 * Generate action buttons for table row
 * @param {string} id - Record ID
 * @param {Object} options - Button options
 * @returns {string} Action buttons HTML
 */
function getActionButtons(id, options = {}) {
    const defaults = {
        view: true,
        edit: true,
        delete: true,
        custom: []
    };
    
    const config = { ...defaults, ...options };
    let buttons = '<div class="action-buttons">';
    
    if (config.view) {
        buttons += `
            <button class="btn-icon btn-primary" onclick="viewRecord('${id}')" title="Lihat Detail">
                <i class="icon-eye"></i>
            </button>
        `;
    }
    
    if (config.edit) {
        buttons += `
            <button class="btn-icon btn-warning" onclick="editRecord('${id}')" title="Edit">
                <i class="icon-edit"></i>
            </button>
        `;
    }
    
    if (config.delete) {
        buttons += `
            <button class="btn-icon btn-danger" onclick="deleteRecord('${id}')" title="Hapus">
                <i class="icon-trash"></i>
            </button>
        `;
    }
    
    // Custom buttons
    config.custom.forEach(btn => {
        buttons += `
            <button class="btn-icon ${btn.class}" onclick="${btn.onclick}" title="${btn.title}">
                <i class="${btn.icon}"></i>
            </button>
        `;
    });
    
    buttons += '</div>';
    return buttons;
}

// ================================================
// SECTION 4: PAGINATION HELPERS
// ================================================

/**
 * Generate pagination HTML
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {string} onPageChange - Callback function name
 * @returns {string} Pagination HTML
 */
function generatePagination(currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return '';
    
    let html = '<div class="pagination">';
    
    // Previous button
    html += `
        <button class="pagination-btn" 
                onclick="${onPageChange}(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            ‹ Prev
        </button>
    `;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="${onPageChange}(1)">1</button>`;
        if (startPage > 2) html += '<span class="pagination-dots">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="${onPageChange}(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="pagination-dots">...</span>';
        html += `<button class="pagination-btn" onclick="${onPageChange}(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `
        <button class="pagination-btn" 
                onclick="${onPageChange}(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            Next ›
        </button>
    `;
    
    html += '</div>';
    return html;
}

/**
 * Render pagination to container
 * @param {string} containerId - Container element ID
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total pages
 * @param {string} onPageChange - Callback function name
 */
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = generatePagination(currentPage, totalPages, onPageChange);
}

// ================================================
// SECTION 5: SEARCH & FILTER HELPERS
// ================================================

/**
 * Initialize debounced search input
 * @param {string} inputId - Search input element ID
 * @param {Function} searchCallback - Search function to execute
 * @param {number} delay - Debounce delay in ms
 */
function initSearchInput(inputId, searchCallback, delay = 500) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const debouncedSearch = debounce(searchCallback, delay);
    
    input.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

/**
 * Filter array of objects by search term
 * @param {Array} data - Data array
 * @param {string} searchTerm - Search term
 * @param {Array} searchFields - Fields to search in
 * @returns {Array} Filtered data
 */
function filterData(data, searchTerm, searchFields = []) {
    if (!searchTerm || searchTerm.trim() === '') {
        return data;
    }
    
    const term = searchTerm.toLowerCase();
    
    return data.filter(item => {
        return searchFields.some(field => {
            const value = getNestedValue(item, field);
            return value && value.toString().toLowerCase().includes(term);
        });
    });
}

/**
 * Get nested object value by path
 * @param {Object} obj - Object
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {any} Value
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// ================================================
// SECTION 6: MODAL HELPERS
// ================================================

/**
 * Open modal
 * @param {string} modalId - Modal element ID
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`❌ Modal '${modalId}' not found`);
        return;
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    console.log(`✅ Modal opened: ${modalId}`);
}

/**
 * Close modal
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    console.log(`✅ Modal closed: ${modalId}`);
}

/**
 * Close all open modals
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = '';
    
    console.log(`✅ All modals closed`);
}

/**
 * Setup modal close on outside click
 * @param {string} modalId - Modal element ID
 */
function setupModalOutsideClick(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}

// ================================================
// SECTION 7: FORM VALIDATION HELPERS
// ================================================

/**
 * Validate form fields
 * @param {string} formId - Form element ID
 * @param {Object} rules - Validation rules
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) {
        return { valid: false, errors: { form: 'Form not found' } };
    }
    
    const formData = getFormData(formId);
    const errors = {};
    let valid = true;
    
    Object.keys(rules).forEach(field => {
        const rule = rules[field];
        const value = formData[field];
        
        // Required check
        if (rule.required && isEmpty(value)) {
            errors[field] = rule.messages?.required || `${field} harus diisi`;
            valid = false;
            return;
        }
        
        // Skip other validations if empty and not required
        if (isEmpty(value)) return;
        
        // Email validation
        if (rule.email && !isValidEmail(value)) {
            errors[field] = rule.messages?.email || 'Format email tidak valid';
            valid = false;
        }
        
        // Phone validation
        if (rule.phone && !isValidPhone(value)) {
            errors[field] = rule.messages?.phone || 'Format nomor telepon tidak valid';
            valid = false;
        }
        
        // NIK validation
        if (rule.nik && !isValidNIK(value)) {
            errors[field] = rule.messages?.nik || 'NIK harus 16 digit';
            valid = false;
        }
        
        // Min length
        if (rule.minLength && value.length < rule.minLength) {
            errors[field] = rule.messages?.minLength || `Minimal ${rule.minLength} karakter`;
            valid = false;
        }
        
        // Max length
        if (rule.maxLength && value.length > rule.maxLength) {
            errors[field] = rule.messages?.maxLength || `Maksimal ${rule.maxLength} karakter`;
            valid = false;
        }
        
        // Custom validation
        if (rule.custom && typeof rule.custom === 'function') {
            const customError = rule.custom(value);
            if (customError) {
                errors[field] = customError;
                valid = false;
            }
        }
    });
    
    return { valid, errors };
}

/**
 * Display form validation errors
 * @param {Object} errors - Errors object from validateForm
 */
function displayFormErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    
    // Display new errors
    Object.keys(errors).forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.classList.add('input-error');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errors[field];
            
            input.parentNode.appendChild(errorDiv);
        }
    });
}

/**
 * Clear form errors
 * @param {string} formId - Form element ID
 */
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// ================================================
// SECTION 8: DATA EXPORT HELPERS
// ================================================

/**
 * Export data to Excel (CSV format)
 * @param {Array} data - Data array
 * @param {Array} columns - Column definitions [{field, label, formatter}]
 * @param {string} filename - Output filename
 */
function exportToExcel(data, columns, filename = 'export.csv') {
    if (!data || data.length === 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Tidak ada data untuk diekspor', 'warning');
        }
        return;
    }
    
    // Create CSV header
    const headers = columns.map(col => col.label).join(',');
    
    // Create CSV rows
    const rows = data.map(item => {
        return columns.map(col => {
            const value = getNestedValue(item, col.field);
            
            // Handle special formatting
            if (col.formatter) {
                return col.formatter(value);
            }
            
            // Escape commas and quotes
            const stringValue = value?.toString() || '';
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    // Combine header and rows
    const csv = [headers, ...rows].join('\n');
    
    // Add BOM for UTF-8
    const BOM = '\uFEFF';
    const csvContent = BOM + csv;
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    if (typeof window.showToast === 'function') {
        window.showToast('Data berhasil diekspor', 'success');
    }
    
    console.log(`✅ Data exported: ${filename}`);
}

/**
 * Print table content
 * @param {string} tableId - Table element ID
 * @param {string} title - Print title
 */
function printTable(tableId, title = 'Report') {
    const table = document.getElementById(tableId);
    if (!table) {
        if (typeof window.showToast === 'function') {
            window.showToast('Tabel tidak ditemukan', 'error');
        }
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            ${table.outerHTML}
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
    
    console.log(`✅ Print initiated: ${title}`);
}

// ================================================
// SECTION 9: DATE RANGE PICKER HELPERS
// ================================================

/**
 * Setup date range inputs with validation
 * @param {string} startDateId - Start date input ID
 * @param {string} endDateId - End date input ID
 */
function setupDateRangePicker(startDateId, endDateId) {
    const startDate = document.getElementById(startDateId);
    const endDate = document.getElementById(endDateId);
    
    if (!startDate || !endDate) return;
    
    // Set min date for end date when start date changes
    startDate.addEventListener('change', () => {
        endDate.min = startDate.value;
        if (endDate.value && endDate.value < startDate.value) {
            endDate.value = startDate.value;
        }
    });
    
    // Set max date for start date when end date changes
    endDate.addEventListener('change', () => {
        startDate.max = endDate.value;
        if (startDate.value && startDate.value > endDate.value) {
            startDate.value = endDate.value;
        }
    });
    
    console.log(`✅ Date range picker setup: ${startDateId} ↔ ${endDateId}`);
}

/**
 * Get month name in Indonesian
 * @param {number} month - Month number (1-12)
 * @returns {string} Month name
 */
function getMonthName(month) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1] || '';
}

/**
 * Get day name in Indonesian
 * @param {string|Date} date - Date
 * @returns {string} Day name
 */
function getDayName(date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dateObj = new Date(date);
    return days[dateObj.getDay()];
}

// ================================================
// SECTION 10: NUMBER INPUT FORMATTERS
// ================================================

/**
 * Setup currency input formatter
 * @param {string} inputId - Input element ID
 */
function setupCurrencyInput(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value) {
            value = formatNumber(parseInt(value));
        }
        
        e.target.value = value;
    });
    
    // Store raw value in data attribute
    input.addEventListener('blur', (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        e.target.dataset.rawValue = rawValue;
    });
    
    console.log(`✅ Currency input setup: ${inputId}`);
}

/**
 * Get raw value from formatted currency input
 * @param {string} inputId - Input element ID
 * @returns {number} Raw number value
 */
function getCurrencyInputValue(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return 0;
    
    const value = input.value.replace(/\D/g, '');
    return parseInt(value) || 0;
}

// ================================================
// SECTION 11: DROPDOWN & SELECT HELPERS
// ================================================

/**
 * Populate select dropdown with options
 * @param {string} selectId - Select element ID
 * @param {Array} options - Array of {value, label} objects
 * @param {string} placeholder - Placeholder text
 */
function populateSelect(selectId, options, placeholder = 'Pilih...') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = `<option value="">${placeholder}</option>`;
    
    options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        select.appendChild(optionEl);
    });
    
    console.log(`✅ Select populated: ${selectId} (${options.length} options)`);
}

/**
 * Get selected option data
 * @param {string} selectId - Select element ID
 * @returns {Object} {value, label}
 */
function getSelectedOption(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return null;
    
    const selectedOption = select.options[select.selectedIndex];
    return {
        value: selectedOption.value,
        label: selectedOption.textContent
    };
}

// ================================================
// SECTION 12: FILE UPLOAD HELPERS
// ================================================

/**
 * Setup file input with preview
 * @param {string} inputId - File input element ID
 * @param {string} previewId - Preview container ID
 * @param {Array} allowedTypes - Allowed file types
 * @param {number} maxSize - Max file size in MB
 */
function setupFileInput(inputId, previewId, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'], maxSize = 2) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            preview.innerHTML = '';
            return;
        }
        
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
            if (typeof window.showToast === 'function') {
                window.showToast(`Tipe file tidak diizinkan. Gunakan: ${allowedTypes.join(', ')}`, 'error');
            }
            input.value = '';
            return;
        }
        
        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            if (typeof window.showToast === 'function') {
                window.showToast(`Ukuran file terlalu besar. Maksimal ${maxSize}MB`, 'error');
            }
            input.value = '';
            return;
        }
        
        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = `<p>File: ${file.name}</p>`;
        }
    });
    
    console.log(`✅ File input setup: ${inputId}`);
}

// ================================================
// SECTION 13: STATS CARD ANIMATION
// ================================================

/**
 * Animate number counter
 * @param {string} elementId - Element ID
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 */
function animateCounter(elementId, target, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

/**
 * Update stats card
 * @param {string} cardId - Card element ID
 * @param {Object} data - {value, label, icon, color}
 */
function updateStatsCard(cardId, data) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const valueEl = card.querySelector('.stats-value');
    const labelEl = card.querySelector('.stats-label');
    const iconEl = card.querySelector('.stats-icon');
    
    if (valueEl) {
        const currentValue = parseInt(valueEl.textContent) || 0;
        if (currentValue !== data.value) {
            animateCounter(valueEl.id, data.value);
        }
    }
    
    if (labelEl && data.label) labelEl.textContent = data.label;
    if (iconEl && data.icon) iconEl.innerHTML = data.icon;
    if (data.color) card.style.borderLeftColor = data.color;
}

// ================================================
// EXPOSE FUNCTIONS TO WINDOW (Global Access)
// ================================================

// Section 0: Core Helpers
window.isEmpty = isEmpty;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.isValidNIK = isValidNIK;
window.formatNumber = formatNumber;
window.debounce = debounce;
window.getFormData = getFormData;

// Section 1: Table Rendering
window.renderTable = renderTable;
window.addRowNumbers = addRowNumbers;
window.toggleTableLoading = toggleTableLoading;

// Section 2: Status Badges
window.getStatusBadge = getStatusBadge;
window.getAttendanceBadge = getAttendanceBadge;

// Section 3: Action Buttons
window.getActionButtons = getActionButtons;

// Section 4: Pagination
window.generatePagination = generatePagination;
window.renderPagination = renderPagination;

// Section 5: Search & Filter
window.initSearchInput = initSearchInput;
window.filterData = filterData;
window.getNestedValue = getNestedValue;

// Section 6: Modal Helpers
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.setupModalOutsideClick = setupModalOutsideClick;

// Section 7: Form Validation
window.validateForm = validateForm;
window.displayFormErrors = displayFormErrors;
window.clearFormErrors = clearFormErrors;

// Section 8: Data Export
window.exportToExcel = exportToExcel;
window.printTable = printTable;

// Section 9: Date Range Picker
window.setupDateRangePicker = setupDateRangePicker;
window.getMonthName = getMonthName;
window.getDayName = getDayName;

// Section 10: Number Input Formatters
window.setupCurrencyInput = setupCurrencyInput;
window.getCurrencyInputValue = getCurrencyInputValue;

// Section 11: Dropdown & Select
window.populateSelect = populateSelect;
window.getSelectedOption = getSelectedOption;

// Section 12: File Upload
window.setupFileInput = setupFileInput;

// Section 13: Stats Card Animation
window.animateCounter = animateCounter;
window.updateStatsCard = updateStatsCard;

// ================================================
// INITIALIZATION
// ================================================

console.log('✅ UTILS.js v2.0 - CLEANED & ORGANIZED');
console.log('📦 Loaded Sections:');
console.log('   0️⃣  Core Helpers (7 functions)');
console.log('   1️⃣  Table Rendering (3 functions)');
console.log('   2️⃣  Status Badges (2 functions)');
console.log('   3️⃣  Action Buttons (1 function)');
console.log('   4️⃣  Pagination (2 functions)');
console.log('   5️⃣  Search & Filter (3 functions)');
console.log('   6️⃣  Modal Helpers (4 functions)');
console.log('   7️⃣  Form Validation (3 functions)');
console.log('   8️⃣  Data Export (2 functions)');
console.log('   9️⃣  Date Range Picker (3 functions)');
console.log('   🔟  Number Formatters (2 functions)');
console.log('   1️⃣1️⃣  Dropdown & Select (2 functions)');
console.log('   1️⃣2️⃣  File Upload (1 function)');
console.log('   1️⃣3️⃣  Stats Card Animation (2 functions)');
console.log('📊 Total: 37 functions (all exposed globally)');
