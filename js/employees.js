// ================================================
// SWAP HRIS - EMPLOYEE MANAGEMENT MODULE
// employee.js - Version 4.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires app.js, api.js, auth.js, database-functions.js, utils.js
// ⚠️ PROVIDES: Complete employee management (CRUD, contracts, warnings, export)

// ================================================
// SECTION 1: CONFIGURATION & STATE MANAGEMENT
// ================================================

/**
 * Global state for employee management
 */
const employeesData = {
    all: [],
    filtered: [],
    currentPage: 1,
    itemsPerPage: 10,
    sortColumn: 'full_name',
    sortDirection: 'asc',
    searchQuery: '',
    filterStatus: '',
    filterDepartment: '',
    currentEmployeeId: null,
    deleteEmployeeId: null,
    currentTab: 'all'
};

// Aliases for backward compatibility (to be removed after refactoring)
let allEmployees = [];
let filteredEmployees = [];
let currentTab = 'all';
let currentPage = 1;
let itemsPerPage = 10;

// ================================================
// SECTION 2: HELPER FUNCTIONS - AUTO-CREATE
// ================================================

/**
 * Generate code from name
 * @param {string} name - Department or division name
 * @returns {string} Generated code
 * @example
 * generateCodeFromName("Human Resources") // "HR"
 * generateCodeFromName("Finance") // "FIN"
 */
function generateCodeFromName(name) {
    if (!name) return 'XXX';
    
    const words = name.trim().toUpperCase().split(/\s+/);
    
    if (words.length >= 2) {
        // Multiple words: take first letter of each word
        return words.map(word => word.charAt(0)).join('');
    } else {
        // Single word: take first 3 characters
        return words[0].substring(0, 3);
    }
}

/**
 * Get existing department by name or create new one
 * @param {string} departmentName - Department name
 * @returns {Promise<{id: string|null, error: Error|null}>}
 */
async function getOrCreateDepartment(departmentName) {
    if (!departmentName || !departmentName.trim()) {
        return { id: null, error: null };
    }
    
    const name = departmentName.trim();
    
    try {
        console.log('📂 Checking department:', name);
        
        // Check if department already exists (case-insensitive)
        const { data: existing, error: searchError } = await getDB()
            .from('departments')
            .select('id, name')
            .ilike('name', name)
            .limit(1);
        
        if (searchError) {
            console.error('❌ Error searching department:', searchError);
            return { id: null, error: searchError };
        }
        
        // If exists, return the ID
        if (existing && existing.length > 0) {
            console.log(`✅ Found existing department: ${existing[0].name} (${existing[0].id})`);
            return { id: existing[0].id, error: null };
        }
        
        // Generate code from name
        const code = generateCodeFromName(name);
        
        // Create new department
        console.log(`➕ Creating new department: ${name} (${code})`);
        const { data: newDept, error: createError } = await getDB()
            .from('departments')
            .insert({ 
                name: name,
                code: code
            })
            .select('id')
            .single();
        
        if (createError) {
            console.error('❌ Error creating department:', createError);
            return { id: null, error: createError };
        }
        
        console.log(`✅ Created new department: ${name} (${newDept.id})`);
        return { id: newDept.id, error: null };
        
    } catch (error) {
        console.error('❌ Error in getOrCreateDepartment:', error);
        return { id: null, error };
    }
}

/**
 * Get existing division by name or create new one
 * @param {string} divisionName - Division name
 * @returns {Promise<{id: string|null, error: Error|null}>}
 */
async function getOrCreateDivision(divisionName) {
    if (!divisionName || !divisionName.trim()) {
        return { id: null, error: null };
    }
    
    const name = divisionName.trim();
    
    try {
        console.log('📂 Checking division:', name);
        
        // Check if division already exists (case-insensitive)
        const { data: existing, error: searchError } = await getDB()
            .from('divisions')
            .select('id, name')
            .ilike('name', name)
            .limit(1);
        
        if (searchError) {
            console.error('❌ Error searching division:', searchError);
            return { id: null, error: searchError };
        }
        
        // If exists, return the ID
        if (existing && existing.length > 0) {
            console.log(`✅ Found existing division: ${existing[0].name} (${existing[0].id})`);
            return { id: existing[0].id, error: null };
        }
        
        // Generate code from name
        const code = generateCodeFromName(name);
        
        // Create new division
        console.log(`➕ Creating new division: ${name} (${code})`);
        const { data: newDiv, error: createError } = await getDB()
            .from('divisions')
            .insert({ 
                name: name,
                code: code
            })
            .select('id')
            .single();
        
        if (createError) {
            console.error('❌ Error creating division:', createError);
            return { id: null, error: createError };
        }
        
        console.log(`✅ Created new division: ${name} (${newDiv.id})`);
        return { id: newDiv.id, error: null };
        
    } catch (error) {
        console.error('❌ Error in getOrCreateDivision:', error);
        return { id: null, error };
    }
}

// ================================================
// SECTION 2.5: WHATSAPP HELPER
// ================================================

/**
 * Format phone number for WhatsApp
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number for WhatsApp
 * @example
 * formatPhoneForWhatsApp("0812-3456-7890") // "628123456789"
 * formatPhoneForWhatsApp("+62 812 3456 7890") // "628123456789"
 */
function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 62 (Indonesia country code)
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    
    // If doesn't start with country code, add 62
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }
    
    return cleaned;
}

/**
 * Open WhatsApp chat
 * @param {string} phone - Phone number
 */
function openWhatsApp(phone) {
    if (!phone) {
        if (typeof showNotification === 'function') {
            showNotification('Phone number not available', 'warning');
        }
        return;
    }
    
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const url = `https://web.whatsapp.com/send?phone=${formattedPhone}`;
    
    // Open in new tab
    window.open(url, '_blank');
    
    console.log(`📱 Opening WhatsApp chat: ${phone} → ${formattedPhone}`);
}

// ================================================
// SECTION 3: INITIALIZATION
// ================================================

/**
 * Initialize employees page
 */
async function initEmployeesPage() {
    try {
        console.log('🚀 Initializing Employees Page...');
        
        // Load initial data in parallel
        await Promise.all([
            loadDepartments(),
            loadDivisions(),
            loadPTKP(),
            loadEmployees()
        ]);
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('✅ Employees page initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing employees page:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error initializing page', 'error');
        }
    }
}

// ================================================
// SECTION 4: DATA LOADING
// ================================================

/**
 * Load all employees from database
 */
async function loadEmployees() {
    try {
        if (typeof showLoading === 'function') showLoading();
        
        const { data, error } = await getAllEmployees({ includeInactive: true });
        
        if (error) {
            console.error('❌ Error loading employees:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error loading employees', 'error');
            }
            if (typeof hideLoading === 'function') hideLoading();
            return;
        }
        
        // Update state
        employeesData.all = data || [];
        allEmployees = employeesData.all; // Backward compatibility
        
        console.log(`✅ Loaded ${employeesData.all.length} employees`);
        
        // Update UI
        updateStatCards();
        updateTabCounts();
        populateDepartmentFilter();
        applyFilters();
        renderTable();
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Fatal error loading employees:', error);
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Load departments for datalist autocomplete
 */
async function loadDepartments() {
    try {
        const { data, error } = await getAllDepartments();
        if (error) throw error;
        
        // Store departments data for reference
        window.departmentsData = data || [];
        
        // Populate datalist for autocomplete
        const datalist = document.getElementById('departmentList');
        if (datalist) {
            datalist.innerHTML = data.map(dept => 
                `<option value="${escapeHtml(dept.name)}">`
            ).join('');
        }
        
        // Also populate filter dropdown
        const filterSelect = document.getElementById('filterDepartment');
        if (filterSelect) {
            const options = data.map(dept => 
                `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`
            ).join('');
            filterSelect.innerHTML = '<option value="">All Departments</option>' + options;
        }
        
        console.log(`✅ Loaded ${data.length} departments`);
    } catch (error) {
        console.error('❌ Error loading departments:', error);
    }
}

/**
 * Load divisions for datalist autocomplete
 */
async function loadDivisions() {
    try {
        const { data, error } = await getAllDivisions();
        if (error) throw error;
        
        // Store divisions data for reference
        window.divisionsData = data || [];
        
        // Populate datalist for autocomplete
        const datalist = document.getElementById('divisionList');
        if (datalist) {
            datalist.innerHTML = data.map(div => 
                `<option value="${escapeHtml(div.name)}">`
            ).join('');
        }
        
        console.log(`✅ Loaded ${data.length} divisions`);
    } catch (error) {
        console.error('❌ Error loading divisions:', error);
    }
}

/**
 * Load PTKP categories
 */
async function loadPTKP() {
    try {
        const { data, error } = await getAllPTKP();
        if (error) throw error;
        
        const ptkpSelect = document.getElementById('employeePTKP');
        if (ptkpSelect) {
            const options = data.map(ptkp => 
                `<option value="${ptkp.id}">${escapeHtml(ptkp.code)} - ${escapeHtml(ptkp.description)}</option>`
            ).join('');
            ptkpSelect.innerHTML = '<option value="">Select PTKP</option>' + options;
        }
        
        console.log(`✅ Loaded ${data.length} PTKP categories`);
    } catch (error) {
        console.error('❌ Error loading PTKP:', error);
    }
}

/**
 * Populate department filter dropdown
 */
function populateDepartmentFilter() {
    const filterDepartment = document.getElementById('filterDepartment');
    if (!filterDepartment) return;
    
    // Get unique departments from employees
    const departments = [];
    const seen = new Set();
    
    employeesData.all.forEach(emp => {
        if (emp.department_id && !seen.has(emp.department_id)) {
            seen.add(emp.department_id);
            departments.push({
                id: emp.department_id,
                name: emp.departments?.name || 'Unknown'
            });
        }
    });
    
    // Sort by name
    departments.sort((a, b) => a.name.localeCompare(b.name));
    
    // Render options
    filterDepartment.innerHTML = `
        <option value="">All Departments</option>
        ${departments.map(dept => `
            <option value="${dept.id}">${escapeHtml(dept.name)}</option>
        `).join('')}
    `;
}

// ================================================
// SECTION 5: STATISTICS
// ================================================

/**
 * Update stat element with animation
 * @param {string} elementId - Element ID
 * @param {number|string} value - Value to display
 */
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        element.classList.add('scale-110');
        setTimeout(() => element.classList.remove('scale-110'), 200);
    }
}

/**
 * Update statistics cards with real data
 */
function updateStatCards() {
    console.log('📊 Updating stat cards...');
    
    const employees = employeesData.all || [];
    
    // 1. Total Employees
    const totalEmployees = employees.length;
    
    // 2. Active Employees
    const activeEmployees = employees.filter(emp => emp.is_active === true).length;
    
    // 3. Inactive Employees
    const inactiveEmployees = employees.filter(emp => emp.is_active !== true).length;
    
    // 4. New This Month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newHires = employees.filter(emp => {
        if (!emp.join_date) return false;
        const joinDate = new Date(emp.join_date);
        return joinDate.getMonth() === currentMonth && 
               joinDate.getFullYear() === currentYear;
    }).length;
    
    // Update DOM with animation
    updateStatElement('statTotalEmployees', totalEmployees);
    updateStatElement('statActiveEmployees', activeEmployees);
    updateStatElement('statInactiveEmployees', inactiveEmployees);
    updateStatElement('statNewHires', newHires);
    
    console.log('✅ Stats updated:', {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        newHires: newHires
    });
}

// ================================================
// SECTION 6: FILTERING & SORTING
// ================================================

/**
 * Apply all filters
 */
function applyFilters() {
    let filtered = [...employeesData.all];
    
    // Tab filter (FIRST)
    const tab = employeesData.currentTab || currentTab;
    if (tab === 'active') {
        filtered = filtered.filter(emp => emp.is_active === true);
    } else if (tab === 'inactive') {
        filtered = filtered.filter(emp => emp.is_active === false);
    }
    
    // Search filter
    if (employeesData.searchQuery) {
        const query = employeesData.searchQuery.toLowerCase();
        filtered = filtered.filter(emp => {
            return (
                (emp.full_name && emp.full_name.toLowerCase().includes(query)) ||
                (emp.email && emp.email.toLowerCase().includes(query)) ||
                (emp.nik && emp.nik.toLowerCase().includes(query)) ||
                (emp.employee_code && emp.employee_code.toLowerCase().includes(query)) ||
                (emp.phone && emp.phone.toLowerCase().includes(query))
            );
        });
    }
    
    // Status filter (employment status)
    if (employeesData.filterStatus) {
        const status = employeesData.filterStatus.replace('_', ' ').toLowerCase();
        filtered = filtered.filter(emp => {
            return emp.employment_status && emp.employment_status.toLowerCase() === status;
        });
    }
    
    // Department filter
    if (employeesData.filterDepartment) {
        filtered = filtered.filter(emp => emp.department_id === employeesData.filterDepartment);
    }
    
    // Sort
    if (employeesData.sortColumn) {
        filtered.sort((a, b) => {
            const aVal = a[employeesData.sortColumn] || '';
            const bVal = b[employeesData.sortColumn] || '';
            const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return employeesData.sortDirection === 'asc' ? comparison : -comparison;
        });
    }
    
    employeesData.filtered = filtered;
    filteredEmployees = filtered; // Backward compatibility
    employeesData.currentPage = 1;
    currentPage = 1; // Backward compatibility
    
    console.log(`🔍 Filtered: ${filtered.length} / ${employeesData.all.length} employees`);
}

/**
 * Handle search input
 * @param {string} query - Search query
 */
function handleSearch(query) {
    employeesData.searchQuery = query;
    applyFilters();
    renderTable();
}

/**
 * Handle status filter
 * @param {string} status - Employment status
 */
function handleStatusFilter(status) {
    employeesData.filterStatus = status;
    applyFilters();
    renderTable();
}

/**
 * Handle department filter
 * @param {string} departmentId - Department ID
 */
function handleDepartmentFilter(departmentId) {
    employeesData.filterDepartment = departmentId;
    applyFilters();
    renderTable();
}

/**
 * Handle items per page change
 * @param {number} value - Items per page
 */
function handleItemsPerPageChange(value) {
    employeesData.itemsPerPage = parseInt(value);
    itemsPerPage = employeesData.itemsPerPage; // Backward compatibility
    employeesData.currentPage = 1;
    currentPage = 1; // Backward compatibility
    renderTable();
}

/**
 * Sort table by column
 * @param {string} column - Column name
 */
function sortTable(column) {
    if (employeesData.sortColumn === column) {
        employeesData.sortDirection = employeesData.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        employeesData.sortColumn = column;
        employeesData.sortDirection = 'asc';
    }
    
    applyFilters();
    renderTable();
    updateSortIcons(column);
}

/**
 * Update sort icons
 * @param {string} activeColumn - Active column name
 */
function updateSortIcons(activeColumn) {
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.className = 'sort-icon fas fa-sort text-gray-300';
    });
    
    const activeButton = document.querySelector(`[data-sort="${activeColumn}"]`);
    if (activeButton) {
        const icon = activeButton.querySelector('.sort-icon');
        if (icon) {
            icon.className = `sort-icon fas fa-sort-${employeesData.sortDirection === 'asc' ? 'up' : 'down'} text-primary-600`;
        }
    }
}

// ================================================
// SECTION 7: TAB HANDLING
// ================================================

/**
 * Handle tab change
 * @param {string} tab - Tab name (all|active|inactive)
 */
function handleTabChange(tab) {
    employeesData.currentTab = tab;
    currentTab = tab; // Backward compatibility
    
    // Reset status filter when changing tabs
    employeesData.filterStatus = '';
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) filterStatus.value = '';
    
    // Update tab UI
    updateTabUI(tab);
    
    // Apply filters and render
    applyFilters();
    renderTable();
}

/**
 * Update tab UI styling
 * @param {string} activeTab - Active tab name
 */
function updateTabUI(activeTab) {
    const tabs = ['All', 'Active', 'Inactive'];
    
    tabs.forEach(tab => {
        const tabBtn = document.getElementById(`tab${tab}`);
        if (!tabBtn) return;
        
        const isActive = tab.toLowerCase() === activeTab;
        
        if (isActive) {
            tabBtn.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50');
            tabBtn.classList.add('border-primary-500', 'text-primary-600', 'bg-primary-50');
        } else {
            tabBtn.classList.remove('border-primary-500', 'text-primary-600', 'bg-primary-50');
            tabBtn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50');
        }
    });
}

/**
 * Update tab counts
 */
function updateTabCounts() {
    const total = employeesData.all.length;
    const active = employeesData.all.filter(emp => emp.is_active === true).length;
    const inactive = employeesData.all.filter(emp => emp.is_active === false).length;
    
    const countAll = document.getElementById('countAll');
    const countActive = document.getElementById('countActive');
    const countInactive = document.getElementById('countInactive');
    
    if (countAll) countAll.textContent = total;
    if (countActive) countActive.textContent = active;
    if (countInactive) countInactive.textContent = inactive;
}

// ================================================
// SECTION 8: TABLE RENDERING
// ================================================

/**
 * Render table
 */
function renderTable() {
    renderTableRows();
    renderPagination();
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Get status badge HTML
 * @param {Object} employee - Employee object
 * @returns {string} HTML badge
 */
function getStatusBadge(employee) {
    if (!employee.is_active) {
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <i class="fas fa-circle text-gray-400 mr-1.5" style="font-size: 6px;"></i>
            Inactive
        </span>`;
    }
    
    const status = employee.employment_status || 'Active';
    const configs = {
        'Permanent': { color: 'green', icon: 'check-circle' },
        'Contract': { color: 'blue', icon: 'file-contract' },
        'Probation': { color: 'yellow', icon: 'clock' },
        'Intern': { color: 'purple', icon: 'user-graduate' },
        'On Leave': { color: 'orange', icon: 'calendar-times' }
    };
    
    const config = configs[status] || { color: 'gray', icon: 'circle' };
    
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800">
        <i class="fas fa-${config.icon} mr-1.5"></i>
        ${status}
    </span>`;
}

/**
 * Calculate contract days remaining
 * @param {string} endDate - Contract end date
 * @returns {number|null} Days remaining
 */
function calculateContractDaysRemaining(endDate) {
    if (!endDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Get contract status badge
 * @param {number|null} days - Days remaining
 * @returns {string} HTML badge
 */
function getContractStatusBadge(days) {
    if (days === null || days === undefined) {
        return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <i class="fas fa-minus-circle mr-1"></i>
            -
        </span>`;
    }
    
    let badgeClass, icon, text;
    
    if (days <= 0) {
        badgeClass = 'bg-red-100 text-red-800 border border-red-200';
        icon = 'fa-exclamation-circle';
        text = 'KONTRAK BERAKHIR';
    } else if (days <= 30) {
        badgeClass = 'bg-orange-100 text-orange-800 border border-orange-200';
        icon = 'fa-bell';
        text = 'FOLLOW UP KONTRAK';
    } else if (days <= 45) {
        badgeClass = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        icon = 'fa-exclamation-triangle';
        text = 'KONTRAK SEGERA BERAKHIR';
    } else {
        badgeClass = 'bg-green-100 text-green-800 border border-green-200';
        icon = 'fa-check-circle';
        text = 'AKTIF';
    }
    
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}">
        <i class="fas ${icon} mr-1"></i>
        ${text}
    </span>`;
}

/**
 * Format date
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Render table rows
 */
function renderTableRows() {
    const tbody = document.getElementById('employeeTableBody');
    
    if (!tbody) {
        console.error('❌ Table body element not found');
        return;
    }

    if (!employeesData.filtered || employeesData.filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center text-gray-400">
                        <i class="fas fa-users text-5xl mb-4"></i>
                        <p class="text-lg font-medium">No employees found</p>
                        <p class="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const startIndex = (employeesData.currentPage - 1) * employeesData.itemsPerPage;
    const endIndex = startIndex + employeesData.itemsPerPage;
    const paginatedEmployees = employeesData.filtered.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedEmployees.map(emp => {
        const statusBadge = getStatusBadge(emp);
        const positionDisplay = emp.position_custom || emp.positions?.title || '-';
        const contractDays = calculateContractDaysRemaining(emp.current_contract_end);
        const contractStatusBadge = getContractStatusBadge(contractDays);
        
        let contractDaysDisplay = '-';
        if (contractDays !== null) {
            if (contractDays < 0) {
                contractDaysDisplay = `<span class="text-red-600 font-semibold">${Math.abs(contractDays)} hari lalu</span>`;
            } else if (contractDays === 0) {
                contractDaysDisplay = `<span class="text-orange-600 font-semibold">Hari ini</span>`;
            } else {
                contractDaysDisplay = `<span class="text-gray-900 font-semibold">${contractDays} hari</span>`;
            }
        }
        
        return `
            <tr class="hover:bg-gray-50 transition-colors border-b border-gray-200">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md">
                                ${getInitials(emp.full_name)}
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${escapeHtml(emp.full_name)}</div>
                            <div class="text-xs text-gray-500">
                                <i class="fas fa-id-badge mr-1"></i>${escapeHtml(emp.employee_code)}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                        <div class="flex items-center mb-1">
                            <i class="fas fa-envelope text-gray-400 mr-2 w-4"></i>
                            <a href="mailto:${emp.email || ''}" class="text-primary-600 hover:text-primary-800 hover:underline">
                                ${escapeHtml(emp.email || '-')}
                            </a>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-phone text-gray-400 mr-2 w-4"></i>
                            <a href="tel:${emp.phone || ''}" class="text-gray-600 hover:text-primary-600">
                                ${escapeHtml(emp.phone || '-')}
                            </a>
                            ${emp.phone ? `
                                <button onclick="openWhatsApp('${emp.phone}')" 
                                        class="ml-2 text-green-600 hover:text-green-800 hover:bg-green-50 p-1.5 rounded-lg transition-colors" 
                                        title="Chat on WhatsApp">
                                    <i class="fab fa-whatsapp text-lg"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm">
                        <div class="font-medium text-gray-900">${escapeHtml(emp.departments?.name || '-')}</div>
                        <div class="text-xs text-gray-500">${escapeHtml(emp.divisions?.name || '-')}</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 font-medium">
                        ${escapeHtml(positionDisplay)}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        ${emp.join_date ? formatDate(emp.join_date) : '-'}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${statusBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-sm">
                        ${contractDaysDisplay}
                    </div>
                    ${emp.current_contract_end ? `
                        <div class="text-xs text-gray-500 mt-1">
                            ${formatDate(emp.current_contract_end)}
                        </div>
                    ` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    ${contractStatusBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <button onclick="viewEmployee('${emp.id}')" 
                                class="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg" 
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editEmployee('${emp.id}')" 
                                class="text-primary-600 hover:text-primary-800 transition-colors p-2 hover:bg-primary-50 rounded-lg" 
                                title="Edit Employee">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="viewContractHistory('${emp.id}')" 
                                class="text-purple-600 hover:text-purple-800 transition-colors p-2 hover:bg-purple-50 rounded-lg" 
                                title="Contract History">
                            <i class="fas fa-file-contract"></i>
                        </button>
                        <button onclick="viewWarningLetters('${emp.id}')" 
                                class="text-orange-600 hover:text-orange-800 transition-colors p-2 hover:bg-orange-50 rounded-lg" 
                                title="Warning Letters">
                            <i class="fas fa-exclamation-triangle"></i>
                        </button>
                        <button onclick="confirmDeleteEmployee('${emp.id}')" 
                                class="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg" 
                                title="Delete Employee">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ================================================
// SECTION 9: PAGINATION
// ================================================

/**
 * Render pagination
 */
function renderPagination() {
    const totalPages = Math.ceil(employeesData.filtered.length / employeesData.itemsPerPage);
    const currentPageNum = employeesData.currentPage;
    
    // Update info text
    const start = (currentPageNum - 1) * employeesData.itemsPerPage + 1;
    const end = Math.min(start + employeesData.itemsPerPage - 1, employeesData.filtered.length);
    const total = employeesData.filtered.length;
    
    const infoElement = document.getElementById('paginationInfo');
    if (infoElement) {
        infoElement.textContent = `Showing ${start} to ${end} of ${total} entries`;
    }
    
    // Render buttons
    const buttonsContainer = document.getElementById('paginationButtons');
    if (!buttonsContainer) return;
    
    if (totalPages <= 1) {
        buttonsContainer.innerHTML = '';
        return;
    }
    
    let buttons = '';
    
    // Previous button
    buttons += `
        <button onclick="goToPage(${currentPageNum - 1})" 
                ${currentPageNum === 1 ? 'disabled' : ''}
                class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPageNum - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        buttons += `<button onclick="goToPage(1)" class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">1</button>`;
        if (startPage > 2) {
            buttons += `<span class="px-2 text-gray-500">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttons += `
            <button onclick="goToPage(${i})" 
                    class="px-3 py-1.5 rounded-lg border ${i === currentPageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} text-sm font-medium transition-colors">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            buttons += `<span class="px-2 text-gray-500">...</span>`;
        }
        buttons += `<button onclick="goToPage(${totalPages})" class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">${totalPages}</button>`;
    }
    
    // Next button
    buttons += `
        <button onclick="goToPage(${currentPageNum + 1})" 
                ${currentPageNum === totalPages ? 'disabled' : ''}
                class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    buttonsContainer.innerHTML = buttons;
}

/**
 * Go to specific page
 * @param {number} page - Page number
 */
function goToPage(page) {
    const totalPages = Math.ceil(employeesData.filtered.length / employeesData.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    employeesData.currentPage = page;
    currentPage = page; // Backward compatibility
    renderTable();
}

// ================================================
// SECTION 10: MODAL - ADD/EDIT EMPLOYEE
// ================================================

/**
 * Open modal
 * @param {string} mode - Modal mode (add|edit)
 * @param {string} employeeId - Employee ID (for edit mode)
 */
async function openModal(mode, employeeId = null) {
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    const modalTitle = document.getElementById('modalTitle');
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeIsActive').checked = true;
    
    if (mode === 'edit' && employeeId) {
        // Set modal title
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-user-edit mr-2"></i>Edit Employee';
        }
        
        // Load employee data to form
        const success = await loadEmployeeToForm(employeeId);
        
        if (!success) {
            closeModal();
            return;
        }
    } else {
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Add New Employee';
        }
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('employeeModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Load employee data to form (for editing)
 * @param {string} employeeId - Employee ID
 * @returns {Promise<boolean>} Success status
 */
async function loadEmployeeToForm(employeeId) {
    try {
        console.log('📝 Loading employee data for edit:', employeeId);
        
        // Fetch employee data
        const { data: employee, error } = await getEmployeeById(employeeId);

        if (error) {
            console.error('❌ Error fetching employee:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error loading employee data', 'error');
            }
            return false;
        }

        if (!employee) {
            if (typeof showNotification === 'function') {
                showNotification('Employee not found', 'error');
            }
            return false;
        }

        console.log('✅ Employee data loaded:', employee);

        // Helper function to safely set value
        const setFieldValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value !== false;
                } else {
                    element.value = value || '';
                }
            } else {
                console.warn(`⚠️ Element not found: ${id}`);
            }
        };

        // Set employee ID in hidden field
        setFieldValue('employeeId', employee.id);

        // Populate form fields
        setFieldValue('employeeCode', employee.employee_code);
        setFieldValue('employeeFullName', employee.full_name);
        setFieldValue('employeeDepartment', employee.departments?.name || '');
        setFieldValue('employeeDivision', employee.divisions?.name || '');
        setFieldValue('employeePositionCustom', employee.position_custom || employee.positions?.title);
        setFieldValue('employeeNIK', employee.nik);
        setFieldValue('employeeEmail', employee.email);
        setFieldValue('employeeBirthPlace', employee.birth_place);
        setFieldValue('employeeBirthDate', employee.birth_date);
        setFieldValue('employeePhone', employee.phone);
        setFieldValue('employeeGender', employee.gender);
        setFieldValue('employeeMotherName', employee.mother_maiden_name);
        setFieldValue('employeeKTPAddress', employee.ktp_address);
        setFieldValue('employeeCurrentAddress', employee.current_address);
        setFieldValue('employeeBankName', employee.bank_name);
        setFieldValue('employeeBankAccountNumber', employee.bank_account_number);
        setFieldValue('employeeBankAccountName', employee.bank_account_name);
        setFieldValue('employeeEmploymentStatus', employee.employment_status);
        setFieldValue('employeePTKP', employee.ptkp_id);
        setFieldValue('employeeJoinDate', employee.join_date);
        setFieldValue('employeeResignDate', employee.resign_date);
        setFieldValue('employeeIsActive', employee.is_active);

        // Show/hide resign date field based on status
        if (typeof toggleResignDateField === 'function') {
            toggleResignDateField();
        }

        return true;

    } catch (error) {
        console.error('❌ Error loading employee:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error loading employee data', 'error');
        }
        return false;
    }
}

/**
 * Save employee (create or update)
 */
async function saveEmployee() {
    try {
        console.log('💾 Saving employee...');
        
        // Helper function to safely get value
        const getFieldValue = (id, defaultValue = null) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`⚠️ Element not found: ${id}`);
                return defaultValue;
            }
            if (element.type === 'checkbox') {
                return element.checked;
            }
            const value = element.value?.trim();
            return value || defaultValue;
        };

        // Validate required fields first
        const employeeCode = getFieldValue('employeeCode', '');
        const fullName = getFieldValue('employeeFullName', '');
        const departmentName = getFieldValue('employeeDepartment', '');
        
        if (!employeeCode) {
            if (typeof showNotification === 'function') {
                showNotification('Employee Code is required', 'error');
            }
            return;
        }
        if (!fullName) {
            if (typeof showNotification === 'function') {
                showNotification('Full Name is required', 'error');
            }
            return;
        }
        if (!departmentName) {
            if (typeof showNotification === 'function') {
                showNotification('Department is required', 'error');
            }
            return;
        }

        if (typeof showLoading === 'function') showLoading();

        // AUTO-CREATE: Get or create department
        const departmentResult = await getOrCreateDepartment(departmentName);
        if (departmentResult.error) {
            if (typeof hideLoading === 'function') hideLoading();
            if (typeof showNotification === 'function') {
                showNotification('Error processing department: ' + departmentResult.error.message, 'error');
            }
            return;
        }

        // AUTO-CREATE: Get or create division (optional)
        const divisionName = getFieldValue('employeeDivision', '');
        const divisionResult = await getOrCreateDivision(divisionName);
        if (divisionResult.error) {
            if (typeof hideLoading === 'function') hideLoading();
            if (typeof showNotification === 'function') {
                showNotification('Error processing division: ' + divisionResult.error.message, 'error');
            }
            return;
        }

        // Build employee data with resolved IDs
        const employeeData = {
            employee_code: employeeCode,
            full_name: fullName,
            department_id: departmentResult.id,
            division_id: divisionResult.id,
            position_id: null,
            position_custom: getFieldValue('employeePositionCustom') || null,
            nik: getFieldValue('employeeNIK') || null,
            email: getFieldValue('employeeEmail') || null,
            birth_place: getFieldValue('employeeBirthPlace') || null,
            birth_date: getFieldValue('employeeBirthDate') || null,
            phone: getFieldValue('employeePhone') || null,
            gender: getFieldValue('employeeGender') || null,
            mother_maiden_name: getFieldValue('employeeMotherName') || null,
            ktp_address: getFieldValue('employeeKTPAddress') || null,
            current_address: getFieldValue('employeeCurrentAddress') || null,
            bank_name: getFieldValue('employeeBankName') || null,
            bank_account_number: getFieldValue('employeeBankAccountNumber') || null,
            bank_account_name: getFieldValue('employeeBankAccountName') || null,
            employment_status: getFieldValue('employeeEmploymentStatus') || null,
            ptkp_id: getFieldValue('employeePTKP') || null,
            join_date: getFieldValue('employeeJoinDate') || null,
            resign_date: getFieldValue('employeeResignDate') || null,
            is_resigned: getFieldValue('employeeEmploymentStatus') === 'Resigned',
            is_active: getFieldValue('employeeIsActive', true),
        };

        console.log('📦 Employee data to save:', employeeData);

        // Check if editing or creating
        const employeeId = getFieldValue('employeeId');
        let result;

        if (employeeId) {
            console.log('🔄 Updating employee:', employeeId);
            result = await updateEmployee(employeeId, employeeData);
        } else {
            console.log('➕ Creating new employee');
            result = await createEmployee(employeeData);
        }

        if (typeof hideLoading === 'function') hideLoading();

        if (result.error) {
            console.error('❌ Database error:', result.error);
            if (typeof showNotification === 'function') {
                showNotification('Error saving employee: ' + result.error.message, 'error');
            }
            return;
        }

        // Success
        console.log('✅ Employee saved successfully!');
        if (typeof showNotification === 'function') {
            showNotification(
                employeeId ? 'Employee updated successfully' : 'Employee created successfully',
                'success'
            );
        }

        // Close modal and reload
        closeModal();
        await loadEmployees();
        
    } catch (error) {
        if (typeof hideLoading === 'function') hideLoading();
        console.error('❌ Fatal error saving employee:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error saving employee: ' + error.message, 'error');
        }
    }
}

/**
 * Open edit modal for employee
 * @param {string} employeeId - Employee ID
 */
async function editEmployee(employeeId) {
    if (!employeeId) {
        console.error('❌ Employee ID is required');
        return;
    }
    
    console.log('✏️ Editing employee:', employeeId);
    await openModal('edit', employeeId);
}

/**
 * Toggle resign date field visibility based on employment status
 */
function toggleResignDateField() {
    const statusSelect = document.getElementById('employeeEmploymentStatus');
    const resignDateContainer = document.getElementById('resignDateContainer');
    const resignDateInput = document.getElementById('employeeResignDate');
    
    if (!statusSelect || !resignDateContainer) return;
    
    const status = statusSelect.value;
    
    if (status === 'Resigned') {
        resignDateContainer.classList.remove('hidden');
        if (resignDateInput) resignDateInput.required = true;
    } else {
        resignDateContainer.classList.add('hidden');
        if (resignDateInput) {
            resignDateInput.required = false;
            resignDateInput.value = '';
        }
    }
}

// ================================================
// SECTION 11: MODAL - VIEW EMPLOYEE
// ================================================

/**
 * View employee details
 * @param {string} employeeId - Employee ID
 */
async function viewEmployee(employeeId) {
    try {
        if (typeof showLoading === 'function') showLoading();
        
        const { data, error } = await getEmployeeById(employeeId);
        
        if (error) throw error;
        
        const content = document.getElementById('viewEmployeeContent');
        if (content) {
            content.innerHTML = generateEmployeeDetailsHTML(data);
        }
        
        const modal = document.getElementById('viewEmployeeModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error viewing employee:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to load employee details', 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Calculate age from birth date
 * @param {string} birthDate - Birth date
 * @returns {number} Age in years
 */
function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

/**
 * Calculate work duration from join date
 * @param {string} joinDate - Join date
 * @returns {string} Work duration text
 */
function calculateWorkDuration(joinDate) {
    if (!joinDate) return '-';
    
    const today = new Date();
    const join = new Date(joinDate);
    
    let years = today.getFullYear() - join.getFullYear();
    let months = today.getMonth() - join.getMonth();
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    if (years === 0 && months === 0) {
        const days = Math.floor((today - join) / (1000 * 60 * 60 * 24));
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
}

/**
 * Format number with thousand separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(number) {
    if (!number) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Generate employee details HTML (FULL VERSION)
 * @param {Object} emp - Employee object
 * @returns {string} HTML string
 */
function generateEmployeeDetailsHTML(emp) {
    const statusBadge = getStatusBadge(emp);
    
    return `
        <div class="space-y-6">
            <!-- Header Card -->
            <div class="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-200">
                <div class="flex items-start space-x-4">
                    <div class="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
                        ${getInitials(emp.full_name)}
                    </div>
                    <div class="flex-1">
                        <h4 class="text-2xl font-bold text-gray-900 mb-1">${escapeHtml(emp.full_name)}</h4>
                        <div class="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                            <span class="flex items-center">
                                <i class="fas fa-id-badge mr-1.5 text-primary-600"></i>
                                ${escapeHtml(emp.employee_code || '-')}
                            </span>
                            <span class="flex items-center">
                                <i class="fas fa-briefcase mr-1.5 text-primary-600"></i>
                                ${escapeHtml(emp.position_custom || emp.positions?.title || '-')}
                            </span>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${statusBadge}
                            ${emp.employment_status ? `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    ${escapeHtml(emp.employment_status)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Grid Layout for Details -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <!-- LEFT COLUMN -->
                <div class="space-y-6">
                    
                    <!-- Personal Information -->
                    <div class="bg-white rounded-lg border border-gray-200 p-5">
                        <h5 class="text-base font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
                            <i class="fas fa-user-circle text-primary-600 mr-2 text-lg"></i>
                            Personal Information
                        </h5>
                        <div class="space-y-3 text-sm">
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">NIK:</span>
                                <span class="font-medium text-gray-900 break-all">${escapeHtml(emp.nik || '-')}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Gender:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.gender || '-')}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Birth Place:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.birth_place || '-')}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Birth Date:</span>
                                <span class="font-medium text-gray-900">${emp.birth_date ? formatDate(emp.birth_date) : '-'}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Age:</span>
                                <span class="font-medium text-gray-900">${emp.birth_date ? calculateAge(emp.birth_date) + ' years' : '-'}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Mother's Name:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.mother_maiden_name || '-')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="bg-white rounded-lg border border-gray-200 p-5">
                        <h5 class="text-base font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
                            <i class="fas fa-address-book text-primary-600 mr-2 text-lg"></i>
                            Contact Information
                        </h5>
                        <div class="space-y-3 text-sm">
                            <div class="flex items-start">
                                <span class="text-gray-500 w-32 flex-shrink-0">Email:</span>
                                <a href="mailto:${emp.email || ''}" class="font-medium text-primary-600 hover:text-primary-700 break-all">
                                    ${escapeHtml(emp.email || '-')}
                                </a>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Phone:</span>
                                <a href="tel:${emp.phone || ''}" class="font-medium text-primary-600 hover:text-primary-700">
                                    ${escapeHtml(emp.phone || '-')}
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Address Information -->
                    <div class="bg-white rounded-lg border border-gray-200 p-5">
                        <h5 class="text-base font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
                            <i class="fas fa-map-marker-alt text-primary-600 mr-2 text-lg"></i>
                            Address Information
                        </h5>
                        <div class="space-y-4 text-sm">
                            <div>
                                <div class="text-gray-500 font-medium mb-1">KTP Address:</div>
                                <div class="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                    ${escapeHtml(emp.ktp_address || '-')}
                                </div>
                            </div>
                            <div>
                                <div class="text-gray-500 font-medium mb-1">Current Address:</div>
                                <div class="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                    ${escapeHtml(emp.current_address || '-')}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- RIGHT COLUMN -->
                <div class="space-y-6">
                    
                    <!-- Employment Information -->
                    <div class="bg-white rounded-lg border border-gray-200 p-5">
                        <h5 class="text-base font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
                            <i class="fas fa-briefcase text-primary-600 mr-2 text-lg"></i>
                            Employment Information
                        </h5>
                        <div class="space-y-3 text-sm">
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Department:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.departments?.name || '-')}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Division:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.divisions?.name || '-')}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Position:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.position_custom || emp.positions?.title || '-')}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Join Date:</span>
                                <span class="font-medium text-gray-900">${emp.join_date ? formatDate(emp.join_date) : '-'}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Work Duration:</span>
                                <span class="font-medium text-gray-900">${emp.join_date ? calculateWorkDuration(emp.join_date) : '-'}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Status:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.employment_status || '-')}</span>
                            </div>
                            ${emp.resign_date ? `
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Resign Date:</span>
                                <span class="font-medium text-red-600">
                                    <i class="fas fa-door-open mr-1"></i>
                                    ${formatDate(emp.resign_date)}
                                </span>
                            </div>
                            ` : ''}
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Active:</span>
                                <span class="font-medium ${emp.is_active ? 'text-green-600' : 'text-red-600'}">
                                    <i class="fas fa-circle text-xs mr-1"></i>
                                    ${emp.is_active ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Contract Information -->
                    ${emp.current_contract_end ? `
                        <div class="bg-white rounded-lg border border-gray-200 p-5">
                            <h5 class="text-base font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
                                <i class="fas fa-file-contract text-primary-600 mr-2 text-lg"></i>
                                Current Contract
                            </h5>
                            <div class="space-y-3 text-sm">
                                ${emp.current_contract_start ? `
                                    <div class="flex">
                                        <span class="text-gray-500 w-32 flex-shrink-0">Start Date:</span>
                                        <span class="font-medium text-gray-900">${formatDate(emp.current_contract_start)}</span>
                                    </div>
                                ` : ''}
                                <div class="flex">
                                    <span class="text-gray-500 w-32 flex-shrink-0">End Date:</span>
                                    <span class="font-medium text-gray-900">${formatDate(emp.current_contract_end)}</span>
                                </div>
                                <div class="flex">
                                    <span class="text-gray-500 w-32 flex-shrink-0">Days Remaining:</span>
                                    <span class="font-semibold ${calculateContractDaysRemaining(emp.current_contract_end) <= 30 ? 'text-red-600' : 'text-green-600'}">
                                        ${calculateContractDaysRemaining(emp.current_contract_end)} days
                                    </span>
                                </div>
                                <div class="flex">
                                    <span class="text-gray-500 w-32 flex-shrink-0">Status:</span>
                                    ${getContractStatusBadge(calculateContractDaysRemaining(emp.current_contract_end))}
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Bank Information -->
                    <div class="bg-white rounded-lg border border-gray-200 p-5">
                        <h5 class="text-base font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
                            <i class="fas fa-university text-primary-600 mr-2 text-lg"></i>
                            Bank Information
                        </h5>
                        <div class="space-y-3 text-sm">
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Bank Name:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.bank_name || '-')}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Account Number:</span>
                                <span class="font-medium text-gray-900 font-mono">${escapeHtml(emp.bank_account_number || '-')}</span>
                            </div>
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">Account Name:</span>
                                <span class="font-medium text-gray-900">${escapeHtml(emp.bank_account_name || '-')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tax Information -->
                    <div class="bg-white rounded-lg border border-gray-200 p-5">
                        <h5 class="text-base font-semibold text-gray-900 mb-4 flex items-center pb-2 border-b border-gray-200">
                            <i class="fas fa-file-invoice-dollar text-primary-600 mr-2 text-lg"></i>
                            Tax Information
                        </h5>
                        <div class="space-y-3 text-sm">
                            <div class="flex">
                                <span class="text-gray-500 w-32 flex-shrink-0">PTKP Status:</span>
                                <span class="font-medium text-gray-900">
                                    ${emp.ptkp_categories ? 
                                        `${escapeHtml(emp.ptkp_categories.code)} - ${escapeHtml(emp.ptkp_categories.description)}` 
                                        : '-'}
                                </span>
                            </div>
                            ${emp.ptkp_categories ? `
                                <div class="flex">
                                    <span class="text-gray-500 w-32 flex-shrink-0">PTKP Amount:</span>
                                    <span class="font-medium text-gray-900">
                                        Rp ${formatNumber(emp.ptkp_categories.annual_amount || 0)}
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                </div>
            </div>

            <!-- System Information Footer -->
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                        <i class="fas fa-clock mr-1"></i>
                        <span class="font-medium">Created:</span> 
                        ${emp.created_at ? new Date(emp.created_at).toLocaleString('en-US', { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                        }) : '-'}
                    </div>
                    <div>
                        <i class="fas fa-sync-alt mr-1"></i>
                        <span class="font-medium">Last Updated:</span> 
                        ${emp.updated_at ? new Date(emp.updated_at).toLocaleString('en-US', { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                        }) : '-'}
                    </div>
                </div>
            </div>

        </div>
    `;
}

/**
 * Close view modal
 */
function closeViewModal() {
    const modal = document.getElementById('viewEmployeeModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// ================================================
// SECTION 12: MODAL - DELETE EMPLOYEE
// ================================================

/**
 * Confirm delete employee
 * @param {string} employeeId - Employee ID
 */
function confirmDeleteEmployee(employeeId) {
    console.log('🗑️ Confirming delete for employee:', employeeId);
    
    const employee = employeesData.all.find(emp => emp.id === employeeId);
    
    if (!employee) {
        console.error('❌ Employee not found:', employeeId);
        return;
    }
    
    employeesData.deleteEmployeeId = employeeId;
    
    const infoElement = document.getElementById('deleteEmployeeInfo');
    if (infoElement) {
        infoElement.innerHTML = `
            <p class="mb-2">Are you sure you want to delete this employee?</p>
            <div class="bg-gray-50 rounded-lg p-3 text-left">
                <p class="font-semibold text-gray-900">${escapeHtml(employee.full_name)}</p>
                <p class="text-sm text-gray-600">${escapeHtml(employee.employee_code || '')}</p>
            </div>
            <p class="text-sm text-red-600 mt-3">This action cannot be undone!</p>
        `;
    }
    
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('hidden', '!hidden');
        modal.classList.add('flex');
    }
}

/**
 * Handle delete employee
 */
async function handleDeleteEmployee() {
    if (!employeesData.deleteEmployeeId) return;
    
    try {
        if (typeof showLoading === 'function') showLoading();
        
        const { error } = await deleteEmployee(employeesData.deleteEmployeeId);
        
        if (error) throw error;
        
        if (typeof showNotification === 'function') {
            showNotification('Employee deleted successfully', 'success');
        }
        
        closeDeleteModal();
        await loadEmployees();
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error deleting employee:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to delete employee: ' + error.message, 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex', '!hidden');
    }
    employeesData.deleteEmployeeId = null;
}

// ================================================
// SECTION 13: CONTRACT HISTORY MODAL
// ================================================

/**
 * View contract history for employee
 * @param {string} employeeId - Employee ID
 */
async function viewContractHistory(employeeId) {
    try {
        if (typeof showLoading === 'function') showLoading();
        
        // Get employee data
        const { data: employee, error: empError } = await getEmployeeById(employeeId);
        if (empError) throw empError;
        
        // Get contract history
        const { data: contracts, error: contractError } = await getContractHistory(employeeId);
        if (contractError) throw contractError;
        
        // Store current employee
        employeesData.currentEmployeeId = employeeId;
        
        // Update modal header
        const headerElement = document.getElementById('contractHistoryEmployeeName');
        if (headerElement) {
            headerElement.textContent = employee.full_name || 'Unknown';
        }
        
        // Render contract history table
        renderContractHistoryTable(contracts || []);
        
        // Show modal
        const modal = document.getElementById('contractHistoryModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading contract history:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to load contract history: ' + error.message, 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Render contract history table
 * @param {Array} contracts - Contracts array
 */
function renderContractHistoryTable(contracts) {
    const tbody = document.getElementById('contractHistoryTableBody');
    if (!tbody) return;
    
    if (contracts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>No contract history found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = contracts.map(contract => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 text-sm text-gray-900">
                ${escapeHtml(contract.contract_number || '-')}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${escapeHtml(contract.contract_type || '-')}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${contract.start_date ? formatDate(contract.start_date) : '-'}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${contract.end_date ? formatDate(contract.end_date) : '-'}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${escapeHtml(contract.position_at_time || '-')}
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="editContract('${contract.id}')" 
                        class="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 p-2 rounded-lg transition-colors mr-2" 
                        title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteContract('${contract.id}')" 
                        class="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors" 
                        title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = rows;
}

/**
 * Open contract form modal
 * @param {string} contractId - Contract ID (optional, for edit)
 */
function openContractForm(contractId = null) {
    const modal = document.getElementById('contractFormModal');
    const form = document.getElementById('contractForm');
    const title = document.getElementById('contractFormTitle');
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    document.getElementById('contractId').value = '';
    document.getElementById('contractEmployeeId').value = employeesData.currentEmployeeId;
    
    if (contractId) {
        if (title) {
            title.innerHTML = '<i class="fas fa-file-signature mr-2"></i>Edit Contract';
        }
        loadContractToForm(contractId);
    } else {
        if (title) {
            title.innerHTML = '<i class="fas fa-file-signature mr-2"></i>Add New Contract';
        }
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Load contract data to form
 * @param {string} contractId - Contract ID
 */
async function loadContractToForm(contractId) {
    try {
        if (typeof showLoading === 'function') showLoading();
        
        const db = getDB();
        const { data, error } = await db
            .from('contract_history')
            .select('*')
            .eq('id', contractId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('contractId').value = data.id;
        document.getElementById('contractNumber').value = data.contract_number || '';
        document.getElementById('contractType').value = data.contract_type || '';
        document.getElementById('contractStartDate').value = data.start_date || '';
        document.getElementById('contractEndDate').value = data.end_date || '';
        document.getElementById('contractSalary').value = data.salary || '';
        document.getElementById('contractPosition').value = data.position_at_time || '';
        document.getElementById('contractNotes').value = data.notes || '';
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading contract:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to load contract data', 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Save contract
 */
async function saveContract() {
    try {
        const form = document.getElementById('contractForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const contractData = {
            employee_id: document.getElementById('contractEmployeeId').value,
            contract_number: document.getElementById('contractNumber').value || null,
            contract_type: document.getElementById('contractType').value,
            start_date: document.getElementById('contractStartDate').value,
            end_date: document.getElementById('contractEndDate').value || null,
            salary: document.getElementById('contractSalary').value || null,
            position_at_time: document.getElementById('contractPosition').value || null,
            notes: document.getElementById('contractNotes').value || null
        };
        
        const contractId = document.getElementById('contractId').value;
        
        if (typeof showLoading === 'function') showLoading();
        
        const db = getDB();
        
        if (contractId) {
            const { error } = await db
                .from('contract_history')
                .update(contractData)
                .eq('id', contractId);
            
            if (error) throw error;
            if (typeof showToast === 'function') {
                showToast('Contract updated successfully', 'success');
            }
        } else {
            const { error } = await db
                .from('contract_history')
                .insert([contractData]);
            
            if (error) throw error;
            if (typeof showToast === 'function') {
                showToast('Contract added successfully', 'success');
            }
        }
        
        closeContractForm();
        
        // Refresh contract history
        await viewContractHistory(employeesData.currentEmployeeId);
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error saving contract:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to save contract: ' + error.message, 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Edit contract
 * @param {string} contractId - Contract ID
 */
function editContract(contractId) {
    openContractForm(contractId);
}

/**
 * Delete contract
 * @param {string} contractId - Contract ID
 */
async function deleteContract(contractId) {
    if (!confirm('Are you sure you want to delete this contract?')) return;
    
    try {
        if (typeof showLoading === 'function') showLoading();
        
        const db = getDB();
        const { error } = await db
            .from('contract_history')
            .delete()
            .eq('id', contractId);
        
        if (error) throw error;
        
        if (typeof showToast === 'function') {
            showToast('Contract deleted successfully', 'success');
        }
        
        // Refresh contract history
        await viewContractHistory(employeesData.currentEmployeeId);
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error deleting contract:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to delete contract: ' + error.message, 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Close contract form modal
 */
function closeContractForm() {
    const modal = document.getElementById('contractFormModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Close contract history modal
 */
function closeContractHistory() {
    const modal = document.getElementById('contractHistoryModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    employeesData.currentEmployeeId = null;
}

// ================================================
// SECTION 14: WARNING LETTERS MODAL
// ================================================

/**
 * View warning letters for employee
 * @param {string} employeeId - Employee ID
 */
async function viewWarningLetters(employeeId) {
    try {
        if (typeof showLoading === 'function') showLoading();
        
        // Get employee data
        const { data: employee, error: empError } = await getEmployeeById(employeeId);
        if (empError) throw empError;
        
        // Get warning letters
        const { data: warnings, error: warningError } = await getWarningLetters(employeeId);
        if (warningError) throw warningError;
        
        // Store current employee
        employeesData.currentEmployeeId = employeeId;
        
        // Update modal header
        const headerElement = document.getElementById('warningLettersEmployeeName');
        if (headerElement) {
            headerElement.textContent = employee.full_name || 'Unknown';
        }
        
        // Render warning letters table
        renderWarningLettersTable(warnings || []);
        
        // Show modal
        const modal = document.getElementById('warningLettersModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading warning letters:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to load warning letters: ' + error.message, 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Get warning level badge
 * @param {string} level - Warning level (1, 2, 3)
 * @returns {string} HTML badge
 */
function getWarningLevelBadge(level) {
    const configs = {
        '1': { color: 'yellow', text: 'SP 1' },
        '2': { color: 'orange', text: 'SP 2' },
        '3': { color: 'red', text: 'SP 3' }
    };
    
    const config = configs[level] || { color: 'gray', text: 'Unknown' };
    
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800">
        ${config.text}
    </span>`;
}

/**
 * Get warning status badge
 * @param {string} status - Warning status
 * @returns {string} HTML badge
 */
function getWarningStatusBadge(status) {
    const configs = {
        'Active': { color: 'red', icon: 'exclamation-circle' },
        'Resolved': { color: 'green', icon: 'check-circle' },
        'Escalated': { color: 'orange', icon: 'arrow-up' },
        'Expired': { color: 'gray', icon: 'clock' }
    };
    
    const config = configs[status] || { color: 'gray', icon: 'circle' };
    
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800">
        <i class="fas fa-${config.icon} mr-1.5"></i>
        ${status}
    </span>`;
}

/**
 * Render warning letters table
 * @param {Array} warnings - Warnings array
 */
function renderWarningLettersTable(warnings) {
    const tbody = document.getElementById('warningLettersTableBody');
    if (!tbody) return;
    
    if (warnings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>No warning letters found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = warnings.map(warning => {
        const levelBadge = getWarningLevelBadge(warning.warning_level);
        const statusBadge = getWarningStatusBadge(warning.status);
        
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${escapeHtml(warning.letter_number || '-')}
                </td>
                <td class="px-6 py-4">
                    ${levelBadge}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${warning.issue_date ? formatDate(warning.issue_date) : '-'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${escapeHtml(warning.violation_type || '-')}
                </td>
                <td class="px-6 py-4">
                    ${statusBadge}
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="editWarning('${warning.id}')" 
                            class="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 p-2 rounded-lg transition-colors mr-2" 
                            title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteWarning('${warning.id}')" 
                            class="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors" 
                            title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = rows;
}

/**
 * Open warning form modal
 * @param {string} warningId - Warning ID (optional, for edit)
 */
function openWarningForm(warningId = null) {
    const modal = document.getElementById('warningFormModal');
    const form = document.getElementById('warningForm');
    const title = document.getElementById('warningFormTitle');
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    document.getElementById('warningId').value = '';
    document.getElementById('warningEmployeeId').value = employeesData.currentEmployeeId;
    document.getElementById('warningStatus').value = 'Active';
    
    if (warningId) {
        if (title) {
            title.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Edit Warning Letter';
        }
        loadWarningToForm(warningId);
    } else {
        if (title) {
            title.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Add Warning Letter';
        }
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Load warning data to form
 * @param {string} warningId - Warning ID
 */
async function loadWarningToForm(warningId) {
    try {
        if (typeof showLoading === 'function') showLoading();
        
        const db = getDB();
        const { data, error } = await db
            .from('warning_letters')
            .select('*')
            .eq('id', warningId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('warningId').value = data.id;
        document.getElementById('warningLetterNumber').value = data.letter_number || '';
        document.getElementById('warningLevel').value = data.warning_level || '';
        document.getElementById('warningIssueDate').value = data.issue_date || '';
        document.getElementById('warningViolationType').value = data.violation_type || '';
        document.getElementById('warningDescription').value = data.description || '';
        document.getElementById('warningActionTaken').value = data.action_taken || '';
        document.getElementById('warningFollowUpDate').value = data.follow_up_date || '';
        document.getElementById('warningStatus').value = data.status || 'Active';
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading warning:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to load warning data', 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Save warning letter
 */
async function saveWarningLetter() {
    try {
        const form = document.getElementById('warningForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const warningData = {
            employee_id: document.getElementById('warningEmployeeId').value,
            letter_number: document.getElementById('warningLetterNumber').value,
            warning_level: document.getElementById('warningLevel').value,
            issue_date: document.getElementById('warningIssueDate').value,
            violation_type: document.getElementById('warningViolationType').value,
            description: document.getElementById('warningDescription').value || null,
            action_taken: document.getElementById('warningActionTaken').value || null,
            follow_up_date: document.getElementById('warningFollowUpDate').value || null,
            status: document.getElementById('warningStatus').value
        };
        
        const warningId = document.getElementById('warningId').value;
        
        if (typeof showLoading === 'function') showLoading();
        
        const db = getDB();
        
        if (warningId) {
            const { error } = await db
                .from('warning_letters')
                .update(warningData)
                .eq('id', warningId);
            
            if (error) throw error;
            if (typeof showToast === 'function') {
                showToast('Warning letter updated successfully', 'success');
            }
        } else {
            const { error } = await db
                .from('warning_letters')
                .insert([warningData]);
            
            if (error) throw error;
            if (typeof showToast === 'function') {
                showToast('Warning letter added successfully', 'success');
            }
        }
        
        closeWarningForm();
        
        // Refresh warning letters
        await viewWarningLetters(employeesData.currentEmployeeId);
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error saving warning letter:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to save warning letter: ' + error.message, 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Edit warning
 * @param {string} warningId - Warning ID
 */
function editWarning(warningId) {
    openWarningForm(warningId);
}

/**
 * Delete warning
 * @param {string} warningId - Warning ID
 */
async function deleteWarning(warningId) {
    if (!confirm('Are you sure you want to delete this warning letter?')) return;
    
    try {
        if (typeof showLoading === 'function') showLoading();
        
        const db = getDB();
        const { error } = await db
            .from('warning_letters')
            .delete()
            .eq('id', warningId);
        
        if (error) throw error;
        
        if (typeof showToast === 'function') {
            showToast('Warning letter deleted successfully', 'success');
        }
        
        // Refresh warning letters
        await viewWarningLetters(employeesData.currentEmployeeId);
        
        if (typeof hideLoading === 'function') hideLoading();
        
    } catch (error) {
        console.error('❌ Error deleting warning:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to delete warning letter: ' + error.message, 'error');
        }
        if (typeof hideLoading === 'function') hideLoading();
    }
}

/**
 * Close warning form modal
 */
function closeWarningForm() {
    const modal = document.getElementById('warningFormModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Close warning letters modal
 */
function closeWarningLetters() {
    const modal = document.getElementById('warningLettersModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    employeesData.currentEmployeeId = null;
}

// ================================================
// SECTION 15: EXPORT FUNCTIONALITY
// ================================================

/**
 * Export employees to CSV
 */
function exportEmployees() {
    try {
        if (employeesData.filtered.length === 0) {
            if (typeof showToast === 'function') {
                showToast('No data to export', 'warning');
            }
            return;
        }
        
        // CSV headers
        const headers = [
            'Employee Code',
            'NIK',
            'Full Name',
            'Email',
            'Phone',
            'Department',
            'Position',
            'Join Date',
            'Employment Status',
            'Is Active'
        ];
        
        // CSV rows
        const rows = employeesData.filtered.map(emp => [
            emp.employee_code || '',
            emp.nik || '',
            emp.full_name || '',
            emp.email || '',
            emp.phone || '',
            emp.departments?.name || '',
            emp.positions?.title || emp.position_custom || '',
            emp.join_date || '',
            emp.employment_status || '',
            emp.is_active ? 'Active' : 'Inactive'
        ]);
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Employees exported successfully', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error exporting employees:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to export employees', 'error');
        }
    }
}

// ================================================
// SECTION 16: UTILITY FUNCTIONS
// ================================================

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
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
 * Escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Notification type (info|success|error|warning)
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification-toast');
    existing.forEach(el => el.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-0';
    
    // Set color based on type
    let bgColor, iconClass;
    switch(type) {
        case 'success':
            bgColor = 'bg-green-500 text-white';
            iconClass = 'fa-check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-500 text-white';
            iconClass = 'fa-exclamation-circle';
            break;
        case 'warning':
            bgColor = 'bg-yellow-500 text-white';
            iconClass = 'fa-exclamation-triangle';
            break;
        default:
            bgColor = 'bg-blue-500 text-white';
            iconClass = 'fa-info-circle';
    }
    
    notification.className += ` ${bgColor}`;
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${iconClass} text-xl"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ================================================
// SECTION 17: EVENT LISTENERS
// ================================================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            handleSearch(e.target.value);
        }, 300));
    }
    
    // Status filter
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            handleStatusFilter(e.target.value);
        });
    }
    
    // Department filter
    const filterDepartment = document.getElementById('filterDepartment');
    if (filterDepartment) {
        filterDepartment.addEventListener('change', (e) => {
            handleDepartmentFilter(e.target.value);
        });
    }
    
    // Items per page
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            handleItemsPerPageChange(e.target.value);
        });
    }
    
    console.log('✅ Event listeners setup complete');
}

// ================================================
// EXPOSE FUNCTIONS TO WINDOW (Global Access)
// ================================================

// WhatsApp Helper
window.openWhatsApp = openWhatsApp;

// Tab Management
window.handleTabChange = handleTabChange;

// Sorting
window.sortTable = sortTable;

// Pagination
window.goToPage = goToPage;

// Modal: Add/Edit Employee
window.openModal = openModal;
window.closeModal = closeModal;
window.saveEmployee = saveEmployee;
window.editEmployee = editEmployee;
window.toggleResignDateField = toggleResignDateField;

// Modal: View Employee
window.viewEmployee = viewEmployee;
window.closeViewModal = closeViewModal;

// Modal: Delete Employee
window.confirmDeleteEmployee = confirmDeleteEmployee;
window.handleDeleteEmployee = handleDeleteEmployee;
window.closeDeleteModal = closeDeleteModal;

// Modal: Contract History
window.viewContractHistory = viewContractHistory;
window.closeContractHistory = closeContractHistory;
window.openContractForm = openContractForm;
window.closeContractForm = closeContractForm;
window.saveContract = saveContract;
window.editContract = editContract;
window.deleteContract = deleteContract;

// Modal: Warning Letters
window.viewWarningLetters = viewWarningLetters;
window.closeWarningLetters = closeWarningLetters;
window.openWarningForm = openWarningForm;
window.closeWarningForm = closeWarningForm;
window.saveWarningLetter = saveWarningLetter;
window.editWarning = editWarning;
window.deleteWarning = deleteWarning;

// Export
window.exportEmployees = exportEmployees;

// Main Initialization
window.initEmployeesPage = initEmployeesPage;

// ================================================
// AUTO-INITIALIZATION
// ================================================

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmployeesPage);
} else {
    initEmployeesPage();
}

// ================================================
// ERROR HANDLERS
// ================================================

window.addEventListener('error', function(e) {
    console.error('❌ Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Unhandled promise rejection:', e.reason);
});

// ================================================
// DEBUG UTILITIES
// ================================================

window.debugEmployees = {
    data: employeesData,
    all: () => employeesData.all,
    filtered: () => employeesData.filtered,
    reload: initEmployeesPage,
    state: () => ({
        currentPage: employeesData.currentPage,
        itemsPerPage: employeesData.itemsPerPage,
        sortColumn: employeesData.sortColumn,
        sortDirection: employeesData.sortDirection,
        filters: {
            search: employeesData.searchQuery,
            status: employeesData.filterStatus,
            department: employeesData.filterDepartment,
            tab: employeesData.currentTab
        }
    })
};

// ================================================
// INITIALIZATION SUMMARY
// ================================================

console.log('✅ EMPLOYEE.js v4.0 - CLEANED & ORGANIZED');
console.log('📦 Loaded Sections:');
console.log('   1️⃣  Configuration & State Management');
console.log('   2️⃣  Helper Functions - Auto-Create (3 functions)');
console.log('   3️⃣  Initialization (1 function)');
console.log('   4️⃣  Data Loading (5 functions)');
console.log('   5️⃣  Statistics (2 functions)');
console.log('   6️⃣  Filtering & Sorting (7 functions)');
console.log('   7️⃣  Tab Handling (3 functions)');
console.log('   8️⃣  Table Rendering (6 functions)');
console.log('   9️⃣  Pagination (2 functions)');
console.log('   🔟  Modal: Add/Edit Employee (6 functions)');
console.log('   1️⃣1️⃣  Modal: View Employee (6 functions)');
console.log('   1️⃣2️⃣  Modal: Delete Employee (3 functions)');
console.log('   1️⃣3️⃣  Contract History Modal (8 functions)');
console.log('   1️⃣4️⃣  Warning Letters Modal (9 functions)');
console.log('   1️⃣5️⃣  Export Functionality (1 function)');
console.log('   1️⃣6️⃣  Utility Functions (3 functions)');
console.log('   1️⃣7️⃣  Event Listeners (1 function)');
console.log('📊 Total: 70+ functions');
console.log('🌐 Exposed: 28 functions to window');
console.log('🔗 Dependencies: app.js, api.js, auth.js, database-functions.js, utils.js');

// ================================================
// END OF FILE
// ================================================
