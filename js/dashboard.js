// ================================================
// SWAP HRIS - DASHBOARD LOGIC
// dashboard.js - Version 2.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires app.js, api.js, auth.js, database-functions.js, utils.js, Chart.js
// ⚠️ PROVIDES: Dashboard page functionality (stats, alerts, charts, tasks)

// ================================================
// SECTION 1: CONFIGURATION
// ================================================

const DASHBOARD_CONFIG = {
    LEAVE_API_URL: 'https://script.google.com/macros/s/AKfycbyCrqKYonQ-MQAVL3M3pkBLWs1HpeCis9oBGiz1FvRqKzo34kCUUeauofyVR_Vd9I3x/exec',
    TIMEZONE: 'Asia/Jakarta', // WIB (UTC+7)
    CONTRACT_WARNING_DAYS: [30, 60, 90],
    PROBATION_WARNING_DAYS: 7,
    BIRTHDAY_LOOKAHEAD_DAYS: 7,
    ANNIVERSARY_LOOKAHEAD_DAYS: 14
};

// Global state management
let dashboardData = {
    employees: [],
    leaveData: [],
    recruitmentData: [],
    tasks: [],
    stats: {},
    alerts: []
};

// Chart instances (prevent memory leaks)
let headcountChartInstance = null;
let turnoverChartInstance = null;

// ================================================
// SECTION 2: UTILITY FUNCTIONS
// ================================================

/**
 * Get current date in WIB timezone
 * @returns {string} WIB date string
 */
function getWIBDate() {
    return new Date().toLocaleString('en-US', { timeZone: DASHBOARD_CONFIG.TIMEZONE });
}

/**
 * Format date to WIB display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatWIBDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        timeZone: DASHBOARD_CONFIG.TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Calculate days difference between two dates
 * @param {string|Date} date1 - Start date
 * @param {string|Date} date2 - End date
 * @returns {number} Days difference
 */
function daysDifference(date1, date2) {
    const diffTime = new Date(date2) - new Date(date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is within range
 * @param {string|Date} date - Date to check
 * @param {number} days - Days range
 * @returns {boolean}
 */
function isWithinDays(date, days) {
    const today = new Date(getWIBDate());
    const targetDate = new Date(date);
    const diff = daysDifference(today, targetDate);
    return diff >= 0 && diff <= days;
}

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
function isToday(date) {
    const today = new Date(getWIBDate());
    const target = new Date(date);
    return today.toDateString() === target.toDateString();
}

/**
 * Get birthday this year
 * @param {string|Date} birthDate - Birth date
 * @returns {Date} Birthday this year
 */
function getBirthdayThisYear(birthDate) {
    const today = new Date(getWIBDate());
    const birth = new Date(birthDate);
    return new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
}

/**
 * Get work anniversary this year
 * @param {string|Date} joinDate - Join date
 * @returns {Date} Anniversary this year
 */
function getAnniversaryThisYear(joinDate) {
    const today = new Date(getWIBDate());
    const join = new Date(joinDate);
    return new Date(today.getFullYear(), join.getMonth(), join.getDate());
}

/**
 * Calculate years of service
 * @param {string|Date} joinDate - Join date
 * @returns {number} Years of service
 */
function calculateYearsOfService(joinDate) {
    const today = new Date(getWIBDate());
    const join = new Date(joinDate);
    return today.getFullYear() - join.getFullYear();
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================================
// SECTION 3: DATA FETCHING FUNCTIONS
// ================================================

/**
 * Fetch all employees from Supabase
 * @returns {Promise<Array>}
 */
async function fetchEmployees() {
    try {
        console.log('📊 Fetching employees...');
        
        const { data, error } = await getAllEmployees({
            includeInactive: true // Include all for resign count
        });
        
        if (error) {
            console.error('❌ Fetch employees error:', error);
            return [];
        }
        
        console.log(`✅ Fetched ${data.length} employees`);
        return data;
        
    } catch (error) {
        console.error('❌ Fetch employees failed:', error);
        return [];
    }
}

/**
 * Fetch leave data from Google Sheets API
 * @returns {Promise<Array>}
 */
async function fetchLeaveData() {
    try {
        console.log('📊 Fetching leave data...');
        
        const response = await fetch(DASHBOARD_CONFIG.LEAVE_API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        let records = [];
        if (Array.isArray(data)) {
            records = data;
        } else if (data.records) {
            records = data.records;
        } else if (data.data) {
            records = data.data;
        }
        
        console.log(`✅ Fetched ${records.length} leave records`);
        return records;
        
    } catch (error) {
        console.error('❌ Fetch leave data failed:', error);
        return [];
    }
}

/**
 * Fetch recruitment data from Supabase
 * @returns {Promise<Array>}
 */
async function fetchRecruitmentData() {
    try {
        console.log('📊 Fetching recruitment data...');
        
        const db = getDB();
        const { data, error } = await db
            .from('recruitment_tracker')
            .select('*')
            .eq('status', 'Active')
            .order('apply_date', { ascending: false });
        
        if (error) {
            console.error('❌ Fetch recruitment error:', error);
            return [];
        }
        
        console.log(`✅ Fetched ${data.length} recruitment records`);
        return data;
        
    } catch (error) {
        console.error('❌ Fetch recruitment failed:', error);
        return [];
    }
}

/**
 * Fetch manual tasks from Supabase
 * @returns {Promise<Array>}
 */
async function fetchTasks() {
    try {
        console.log('📊 Fetching tasks...');
        
        const { data, error } = await getAllTasks();
        
        if (error) {
            console.error('❌ Fetch tasks error:', error);
            return [];
        }
        
        console.log(`✅ Fetched ${data.length} tasks`);
        return data;
        
    } catch (error) {
        console.error('❌ Fetch tasks failed:', error);
        return [];
    }
}

// ================================================
// SECTION 4: STATISTICS CALCULATION
// ================================================

/**
 * Calculate employee statistics
 * @param {Array} employees - Employees array
 * @returns {Object} Employee statistics
 */
function calculateEmployeeStats(employees) {
    const stats = {
        totalEmployees: 0,
        totalMale: 0,
        totalFemale: 0,
        activeEmployees: 0,
        activeMale: 0,
        activeFemale: 0,
        inactiveEmployees: 0,  // ✅ CHANGED: resignedEmployees → inactiveEmployees
        inactiveMale: 0,       // ✅ CHANGED: resignedMale → inactiveMale
        inactiveFemale: 0      // ✅ CHANGED: resignedFemale → inactiveFemale
    };
    
    employees.forEach(emp => {
        // Total
        stats.totalEmployees++;
        if (emp.gender === 'Male') stats.totalMale++;
        if (emp.gender === 'Female') stats.totalFemale++;
        
        // Active
        if (emp.is_active && !emp.is_resigned) {
            stats.activeEmployees++;
            if (emp.gender === 'Male') stats.activeMale++;
            if (emp.gender === 'Female') stats.activeFemale++;
        }
        
        // ✅ CHANGED: Inactive (was: Resigned)
        // Inactive = not active (regardless of resignation status)
        if (!emp.is_active) {
            stats.inactiveEmployees++;
            if (emp.gender === 'Male') stats.inactiveMale++;
            if (emp.gender === 'Female') stats.inactiveFemale++;
        }
    });
    
    return stats;
}

/**
 * Calculate leave statistics
 * @param {Array} leaveData - Leave data array
 * @returns {Object} Leave statistics
 */
function calculateLeaveStats(leaveData) {
    const stats = {
        pendingLeaves: 0,
        approvedLeaves: 0,
        rejectedLeaves: 0
    };
    
    leaveData.forEach(leave => {
        const status = normalizeLeaveStatus(leave.status);
        if (status === 'Pending') stats.pendingLeaves++;
        if (status === 'Approved') stats.approvedLeaves++;
        if (status === 'Declined') stats.rejectedLeaves++;
    });
    
    return stats;
}

/**
 * Normalize leave status
 * @param {string} status - Raw status
 * @returns {string} Normalized status
 */
function normalizeLeaveStatus(status) {
    if (!status) return 'Pending';
    const s = String(status).toLowerCase().trim();
    if (s.includes('approved') || s.includes('disetujui')) return 'Approved';
    if (s.includes('declined') || s.includes('rejected') || s.includes('ditolak')) return 'Declined';
    return 'Pending';
}

/**
 * Calculate recruitment pipeline stats
 * @param {Array} recruitmentData - Recruitment data array
 * @returns {Object} Recruitment statistics
 */
function calculateRecruitmentStats(recruitmentData) {
    const stats = {
        screening: 0,
        interview: 0,
        offering: 0
    };
    
    recruitmentData.forEach(candidate => {
        const stage = candidate.current_stage;
        if (stage === 'Screening') stats.screening++;
        if (stage === 'HR Interview' || stage === 'User Interview') stats.interview++;
        if (stage === 'Offering') stats.offering++;
    });
    
    return stats;
}

/**
 * Calculate department breakdown
 * @param {Array} employees - Employees array
 * @returns {Object} Department breakdown
 */
function calculateDepartmentBreakdown(employees) {
    const breakdown = {};
    
    employees.filter(e => e.is_active && !e.is_resigned).forEach(emp => {
        const deptName = emp.departments?.name || 'Unknown';
        if (!breakdown[deptName]) {
            breakdown[deptName] = { count: 0, male: 0, female: 0 };
        }
        breakdown[deptName].count++;
        if (emp.gender === 'Male') breakdown[deptName].male++;
        if (emp.gender === 'Female') breakdown[deptName].female++;
    });
    
    return breakdown;
}

/**
 * Calculate monthly headcount for last 6 months
 * @param {Array} employees - Employees array
 * @returns {Object} Monthly headcount data
 */
function calculateMonthlyHeadcount(employees) {
    const today = new Date(getWIBDate());
    const months = [];
    const labels = [];
    const activeData = [];
    const totalData = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(date);
        labels.push(date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));
    }
    
    // Calculate headcount for each month
    months.forEach(month => {
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        let activeCount = 0;
        let totalCount = 0;
        
        employees.forEach(emp => {
            const joinDate = emp.join_date ? new Date(emp.join_date) : null;
            const resignDate = emp.resign_date ? new Date(emp.resign_date) : null;
            
            // Employee joined before or during this month
            if (joinDate && joinDate <= monthEnd) {
                totalCount++;
                
                // Still active (no resign date or resigned after this month)
                if (!resignDate || resignDate > monthEnd) {
                    activeCount++;
                }
            }
        });
        
        activeData.push(activeCount);
        totalData.push(totalCount);
    });
    
    return {
        labels,
        active: activeData,
        total: totalData
    };
}

/**
 * Calculate turnover data
 * @param {Array} employees - Employees array
 * @returns {Object} Turnover data
 */
function calculateTurnoverData(employees) {
    let active = 0;
    let resigned = 0;
    let inactive = 0;
    
    employees.forEach(emp => {
        if (emp.is_resigned) {
            resigned++;
        } else if (emp.is_active) {
            active++;
        } else {
            inactive++;
        }
    });
    
    return {
        active,
        resigned,
        inactive,
        total: employees.length,
        turnoverRate: employees.length > 0 
            ? ((resigned / employees.length) * 100).toFixed(1) 
            : 0
    };
}

// ================================================
// SECTION 5: CRITICAL ALERTS GENERATION
// ================================================

/**
 * Generate critical alerts from data
 * @param {Array} employees - Employees array
 * @param {Array} leaveData - Leave data array
 * @returns {Array} Critical alerts
 */
function generateCriticalAlerts(employees, leaveData) {
    const alerts = [];
    const today = new Date(getWIBDate());
    
    // 1. Contract Expiring Alerts
    employees.filter(e => e.is_active && e.current_contract_end).forEach(emp => {
        const daysUntilExpiry = daysDifference(today, emp.current_contract_end);
        
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            alerts.push({
                type: 'contract',
                priority: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low',
                title: `Contract Expiring: ${emp.full_name}`,
                description: `Contract ends in ${daysUntilExpiry} days (${formatWIBDate(emp.current_contract_end)})`,
                employee: emp,
                daysRemaining: daysUntilExpiry,
                action: 'Review & Renew'
            });
        }
    });
    
    // 2. Birthday Today Alerts
    employees.filter(e => e.is_active && e.birth_date).forEach(emp => {
        const birthdayThisYear = getBirthdayThisYear(emp.birth_date);
        if (isToday(birthdayThisYear)) {
            alerts.push({
                type: 'birthday',
                priority: 'medium',
                title: `🎂 Birthday Today: ${emp.full_name}`,
                description: `Send birthday wishes!`,
                employee: emp,
                action: 'Send Wishes'
            });
        }
    });
    
    // 3. Work Anniversary Alerts
    employees.filter(e => e.is_active && e.join_date).forEach(emp => {
        const anniversaryThisYear = getAnniversaryThisYear(emp.join_date);
        const daysUntilAnniversary = daysDifference(today, anniversaryThisYear);
        
        if (daysUntilAnniversary >= 0 && daysUntilAnniversary <= 7) {
            const years = calculateYearsOfService(emp.join_date);
            alerts.push({
                type: 'anniversary',
                priority: 'low',
                title: `🎉 Work Anniversary: ${emp.full_name}`,
                description: `${years} years of service (${formatWIBDate(emp.join_date)})`,
                employee: emp,
                years: years,
                action: 'Send Congratulations'
            });
        }
    });
    
    // 4. Probation Ending Alerts
    employees.filter(e => e.is_active && e.employment_status === 'Probation').forEach(emp => {
        // Assume probation is 3 months from join_date
        const probationEnd = new Date(emp.join_date);
        probationEnd.setMonth(probationEnd.getMonth() + 3);
        
        const daysUntilProbationEnd = daysDifference(today, probationEnd);
        
        if (daysUntilProbationEnd >= 0 && daysUntilProbationEnd <= DASHBOARD_CONFIG.PROBATION_WARNING_DAYS) {
            alerts.push({
                type: 'probation',
                priority: 'high',
                title: `Probation Ending: ${emp.full_name}`,
                description: `Probation ends in ${daysUntilProbationEnd} days (${formatWIBDate(probationEnd)})`,
                employee: emp,
                daysRemaining: daysUntilProbationEnd,
                action: 'Review Performance'
            });
        }
    });
    
    // 5. Leave Pending > 2 Days
    leaveData.filter(leave => normalizeLeaveStatus(leave.status) === 'Pending').forEach(leave => {
        const requestDate = new Date(leave.timestamp || leave.tanggalPermohonan);
        const daysPending = daysDifference(requestDate, today);
        
        if (daysPending > 2) {
            alerts.push({
                type: 'leave_pending',
                priority: daysPending > 5 ? 'high' : 'medium',
                title: `Leave Pending: ${leave.namaLengkap}`,
                description: `Pending for ${daysPending} days`,
                leave: leave,
                daysPending: daysPending,
                action: 'Review Request'
            });
        }
    });
    
    // Sort by priority (high > medium > low)
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    console.log(`🚨 Generated ${alerts.length} critical alerts`);
    return alerts;
}

// ================================================
// SECTION 6: RENDER FUNCTIONS - STATISTICS
// ================================================

/**
 * Render employee statistics
 * @param {Object} stats - Employee statistics
 */
function renderEmployeeStats(stats) {
    document.getElementById('stat-total-employees').textContent = stats.totalEmployees;
    document.getElementById('stat-total-male').textContent = `${stats.totalMale} Laki-laki`;
    document.getElementById('stat-total-female').textContent = `${stats.totalFemale} Perempuan`;
    
    document.getElementById('stat-active-employees').textContent = stats.activeEmployees;
    document.getElementById('stat-active-male').textContent = `${stats.activeMale} Laki-laki`;
    document.getElementById('stat-active-female').textContent = `${stats.activeFemale} Perempuan`;
    
    // ✅ CHANGED: Update inactive employee stats (was: resigned)
    document.getElementById('stat-inactive-employees').textContent = stats.inactiveEmployees;
    document.getElementById('stat-inactive-male').textContent = `${stats.inactiveMale} Laki-laki`;
    document.getElementById('stat-inactive-female').textContent = `${stats.inactiveFemale} Perempuan`;
}

/**
 * Render leave statistics
 * @param {Object} stats - Leave statistics
 */
function renderLeaveStats(stats) {
    document.getElementById('stat-pending-leaves').textContent = stats.pendingLeaves;
    document.getElementById('stat-leave-approved').textContent = `${stats.approvedLeaves} Approved`;
    document.getElementById('stat-leave-rejected').textContent = `${stats.rejectedLeaves} Rejected`;
}

/**
 * Render recruitment pipeline
 * @param {Object} stats - Recruitment statistics
 */
function renderRecruitmentPipeline(stats) {
    // Update text labels
    document.getElementById('pipeline-screening').textContent = `${stats.screening} candidates`;
    document.getElementById('pipeline-interview').textContent = `${stats.interview} candidates`;
    document.getElementById('pipeline-offer').textContent = `${stats.offering} candidates`;
    
    // Update badge numbers
    document.getElementById('badge-screening').textContent = stats.screening;
    document.getElementById('badge-interview').textContent = stats.interview;
    document.getElementById('badge-offer').textContent = stats.offering;
}

/**
 * Render department breakdown
 * @param {Object} breakdown - Department breakdown data
 */
function renderDepartmentBreakdown(breakdown) {
    const container = document.getElementById('department-breakdown');
    
    if (!container) {
        console.warn('⚠️ Department breakdown container not found');
        return;
    }
    
    const departments = Object.entries(breakdown)
        .sort((a, b) => b[1].count - a[1].count);
    
    if (departments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-sitemap text-4xl mb-2"></i>
                <p class="text-sm">No department data</p>
            </div>
        `;
        return;
    }
    
    const total = departments.reduce((sum, [_, data]) => sum + data.count, 0);
    
    container.innerHTML = departments.map(([deptName, data]) => {
        const percentage = total > 0 
            ? ((data.count / total) * 100).toFixed(1) 
            : 0;
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex-1">
                    <p class="font-medium text-gray-800">${escapeHtml(deptName)}</p>
                    <div class="flex items-center space-x-3 mt-1">
                        <span class="text-xs text-gray-500">
                            <i class="fas fa-mars text-blue-500"></i> ${data.male}
                        </span>
                        <span class="text-xs text-gray-500">
                            <i class="fas fa-venus text-pink-500"></i> ${data.female}
                        </span>
                    </div>
                    <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                             style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="text-right ml-4">
                    <p class="text-2xl font-bold text-gray-800">${data.count}</p>
                    <p class="text-xs text-gray-500">${percentage}%</p>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('✅ Department breakdown rendered');
}

// ================================================
// SECTION 7: RENDER FUNCTIONS - ALERTS & TASKS
// ================================================

/**
 * Render critical alerts
 * @param {Array} alerts - Critical alerts array
 */
function renderCriticalAlerts(alerts) {
    const container = document.getElementById('critical-alerts-container');
    
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <i class="fas fa-check-circle text-4xl mb-2 text-green-500"></i>
                <p class="text-sm">No critical alerts at this time</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = alerts.map((alert, index) => {
        const priorityColors = {
            high: 'bg-red-50 border-red-500 text-red-700',
            medium: 'bg-yellow-50 border-yellow-500 text-yellow-700',
            low: 'bg-blue-50 border-blue-500 text-blue-700'
        };
        
        const priorityIcons = {
            high: 'fa-exclamation-circle',
            medium: 'fa-exclamation-triangle',
            low: 'fa-info-circle'
        };
        
        return `
            <div class="p-4 rounded-lg border-l-4 ${priorityColors[alert.priority]}">
                <div class="flex items-start space-x-3">
                    <i class="fas ${priorityIcons[alert.priority]} text-xl mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold text-sm mb-1">${alert.title}</h4>
                        <p class="text-xs opacity-90">${alert.description}</p>
                        <button 
                            onclick="handleAlertAction('${alert.type}', ${index})"
                            class="mt-2 text-xs font-medium underline hover:no-underline cursor-pointer transition-colors hover:opacity-70">
                            ${alert.action} →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render auto-generated tasks
 * @param {Array} alerts - Critical alerts array
 */
function renderAutoTasks(alerts) {
    const container = document.getElementById('tasks-auto');
    const tabBadge = document.getElementById('tab-auto');
    
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-check-circle text-4xl mb-2"></i>
                <p class="text-sm">No auto-generated tasks</p>
            </div>
        `;
        tabBadge.textContent = `Auto-Generated (0)`;
        return;
    }
    
    tabBadge.textContent = `Auto-Generated (${alerts.length})`;
    
    container.innerHTML = alerts.map(alert => {
        const priorityColors = {
            high: 'text-red-600',
            medium: 'text-yellow-600',
            low: 'text-blue-600'
        };
        
        return `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <input type="checkbox" class="w-4 h-4 text-primary-600 rounded" disabled>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${alert.title}</p>
                    <p class="text-xs text-gray-500">${alert.description}</p>
                </div>
                <span class="px-2 py-1 text-xs font-medium rounded ${priorityColors[alert.priority]}">
                    ${alert.priority}
                </span>
            </div>
        `;
    }).join('');
}

/**
 * Render manual tasks
 * @param {Array} tasks - Tasks array
 */
function renderManualTasks(tasks) {
    const container = document.getElementById('tasks-manual');
    const tabBadge = document.getElementById('tab-manual');
    
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    if (pendingTasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-clipboard-list text-4xl mb-2"></i>
                <p class="text-sm">No manual tasks yet. Click "Add Task" to create one.</p>
            </div>
        `;
        tabBadge.textContent = `Manual Tasks (0)`;
        return;
    }
    
    tabBadge.textContent = `Manual Tasks (${pendingTasks.length})`;
    
    container.innerHTML = pendingTasks.map(task => {
        const priorityColors = {
            high: 'text-red-600',
            medium: 'text-yellow-600',
            low: 'text-blue-600'
        };
        
        const dueDateText = task.due_date 
            ? `Due: ${formatWIBDate(task.due_date)}` 
            : 'No due date';
        
        return `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <input type="checkbox" 
                       class="w-4 h-4 text-primary-600 rounded cursor-pointer" 
                       onchange="toggleTaskCompletion('${task.id}')">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${task.title}</p>
                    <p class="text-xs text-gray-500">${dueDateText}</p>
                </div>
                <span class="px-2 py-1 text-xs font-medium rounded ${priorityColors[task.priority]}">
                    ${task.priority}
                </span>
                <button onclick="deleteTaskConfirm('${task.id}')" 
                        class="text-red-500 hover:text-red-700 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

// ================================================
// SECTION 8: RENDER FUNCTIONS - EMPLOYEE EVENTS
// ================================================

/**
 * Render birthdays this month
 * @param {Array} employees - Employees array
 */
function renderBirthdaysThisMonth(employees) {
    const container = document.getElementById('birthdays-list');
    
    const today = new Date(getWIBDate());
    const currentMonth = today.getMonth();
    
    const birthdays = employees
        .filter(e => e.is_active && e.birth_date)
        .filter(e => {
            const birthDate = new Date(e.birth_date);
            return birthDate.getMonth() === currentMonth;
        })
        .map(e => ({
            ...e,
            birthdayThisYear: getBirthdayThisYear(e.birth_date)
        }))
        .sort((a, b) => a.birthdayThisYear - b.birthdayThisYear);
    
    if (birthdays.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-birthday-cake text-4xl mb-2"></i>
                <p class="text-sm">No birthdays this month</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = birthdays.slice(0, 5).map(emp => {
        const isTodayBirthday = isToday(emp.birthdayThisYear);
        
        return `
            <div class="p-3 hover:bg-gray-50 rounded-lg transition-colors ${isTodayBirthday ? 'bg-pink-50' : ''}">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        ${emp.full_name.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">${emp.full_name}</p>
                        <p class="text-xs text-gray-500">
                            ${formatWIBDate(emp.birthdayThisYear)}
                            ${isTodayBirthday ? '🎂 Today!' : ''}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render work anniversaries
 * @param {Array} employees - Employees array
 */
function renderWorkAnniversaries(employees) {
    const container = document.getElementById('anniversaries-list');
    
    const today = new Date(getWIBDate());
    
    const anniversaries = employees
        .filter(e => e.is_active && e.join_date)
        .map(e => ({
            ...e,
            anniversaryThisYear: getAnniversaryThisYear(e.join_date),
            yearsOfService: calculateYearsOfService(e.join_date)
        }))
        .filter(e => isWithinDays(e.anniversaryThisYear, DASHBOARD_CONFIG.ANNIVERSARY_LOOKAHEAD_DAYS))
        .sort((a, b) => a.anniversaryThisYear - b.anniversaryThisYear);
    
    if (anniversaries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-award text-4xl mb-2"></i>
                <p class="text-sm">No upcoming anniversaries</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = anniversaries.slice(0, 5).map(emp => {
        const isTodayAnniversary = daysDifference(today, emp.anniversaryThisYear) === 0;
        
        return `
            <div class="p-3 hover:bg-gray-50 rounded-lg transition-colors ${isTodayAnniversary ? 'bg-yellow-50' : ''}">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        ${emp.yearsOfService}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">${emp.full_name}</p>
                        <p class="text-xs text-gray-500">
                            ${emp.yearsOfService} years • ${formatWIBDate(emp.anniversaryThisYear)}
                            ${isTodayAnniversary ? '🎉 Today!' : ''}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render contracts expiring soon
 * @param {Array} employees - Employees array
 */
function renderContractsExpiring(employees) {
    const container = document.getElementById('contracts-expiring');
    
    const today = new Date(getWIBDate());
    
    const expiringContracts = employees
        .filter(e => e.is_active && e.current_contract_end)
        .map(e => ({
            ...e,
            daysUntilExpiry: daysDifference(today, e.current_contract_end)
        }))
        .filter(e => e.daysUntilExpiry >= 0 && e.daysUntilExpiry <= 90)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    
    if (expiringContracts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-file-contract text-4xl mb-2"></i>
                <p class="text-sm">No contracts expiring soon</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = expiringContracts.slice(0, 5).map(emp => {
        const urgencyColor = emp.daysUntilExpiry <= 7 
            ? 'bg-red-100 text-red-700' 
            : emp.daysUntilExpiry <= 30 
            ? 'bg-yellow-100 text-yellow-700' 
            : 'bg-blue-100 text-blue-700';
        
        return `
            <div class="p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        ${emp.daysUntilExpiry}d
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">${emp.full_name}</p>
                        <p class="text-xs text-gray-500">
                            Expires: ${formatWIBDate(emp.current_contract_end)}
                        </p>
                    </div>
                    <span class="px-2 py-1 text-xs font-medium rounded ${urgencyColor}">
                        ${emp.daysUntilExpiry}d
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ================================================
// SECTION 9: CHART RENDERING FUNCTIONS
// ================================================

/**
 * Render Headcount Trend Chart (Line Chart)
 * @param {Array} employees - Employees array
 */
function renderHeadcountChart(employees) {
    const canvas = document.getElementById('headcountChart');
    if (!canvas) {
        console.warn('⚠️ Headcount chart canvas not found');
        return;
    }
    
    // Destroy previous chart instance if exists
    if (headcountChartInstance) {
        headcountChartInstance.destroy();
    }
    
    // Calculate last 6 months headcount data
    const monthsData = calculateMonthlyHeadcount(employees);
    
    const ctx = canvas.getContext('2d');
    headcountChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthsData.labels,
            datasets: [
                {
                    label: 'Active Employees',
                    data: monthsData.active,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Total Employees',
                    data: monthsData.total,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    console.log('✅ Headcount chart rendered');
}

/**
 * Render Turnover Rate Chart (Doughnut Chart)
 * @param {Array} employees - Employees array
 */
function renderTurnoverChart(employees) {
    const canvas = document.getElementById('turnoverChart');
    if (!canvas) {
        console.warn('⚠️ Turnover chart canvas not found');
        return;
    }
    
    // Destroy previous chart instance if exists
    if (turnoverChartInstance) {
        turnoverChartInstance.destroy();
    }
    
    // Calculate turnover data
    const turnoverData = calculateTurnoverData(employees);
    
    const ctx = canvas.getContext('2d');
    turnoverChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive', 'Resigned'],
            datasets: [{
                data: [
                    turnoverData.active,
                    turnoverData.inactive,
                    turnoverData.resigned
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green - Active
                    'rgba(239, 68, 68, 0.8)',   // Red - Inactive
                    'rgba(156, 163, 175, 0.8)'  // Gray - Resigned
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)',
                    'rgb(156, 163, 175)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
    
    console.log('✅ Turnover chart rendered');
}

// ================================================
// SECTION 10: TASK MANAGEMENT FUNCTIONS
// ================================================

/**
 * Handle add task form submission
 * @param {Event} event - Submit event
 */
async function handleAddTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title) {
        if (typeof window.showToast === 'function') {
            window.showToast('Task title is required', 'error');
        }
        return;
    }
    
    if (typeof window.showLoading === 'function') {
        window.showLoading('Creating task...');
    }
    
    const taskData = {
        title,
        description: description || null,
        priority,
        due_date: dueDate || null,
        status: 'pending'
    };
    
    const { data, error } = await createTask(taskData);
    
    if (typeof window.hideLoading === 'function') {
        window.hideLoading();
    }
    
    if (error) {
        console.error('❌ Create task error:', error);
        if (typeof window.showToast === 'function') {
            window.showToast('Failed to create task', 'error');
        }
        return;
    }
    
    if (typeof window.showToast === 'function') {
        window.showToast('Task created successfully', 'success');
    }
    
    if (typeof window.closeAddTaskModal === 'function') {
        window.closeAddTaskModal();
    }
    
    // Refresh tasks
    await loadDashboardData();
}

/**
 * Toggle task completion
 * @param {string} taskId - Task ID
 */
async function toggleTaskCompletion(taskId) {
    const { data, error } = await toggleTaskStatus(taskId);
    
    if (error) {
        console.error('❌ Toggle task error:', error);
        if (typeof window.showToast === 'function') {
            window.showToast('Failed to update task', 'error');
        }
        return;
    }
    
    if (typeof window.showToast === 'function') {
        window.showToast('Task updated', 'success');
    }
    
    // Refresh tasks
    await loadDashboardData();
}

/**
 * Delete task with confirmation
 * @param {string} taskId - Task ID
 */
async function deleteTaskConfirm(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    if (typeof window.showLoading === 'function') {
        window.showLoading('Deleting task...');
    }
    
    const { data, error } = await deleteTask(taskId);
    
    if (typeof window.hideLoading === 'function') {
        window.hideLoading();
    }
    
    if (error) {
        console.error('❌ Delete task error:', error);
        if (typeof window.showToast === 'function') {
            window.showToast('Failed to delete task', 'error');
        }
        return;
    }
    
    if (typeof window.showToast === 'function') {
        window.showToast('Task deleted', 'success');
    }
    
    // Refresh tasks
    await loadDashboardData();
}

// ================================================
// SECTION 11: ALERT ACTION HANDLERS
// ================================================

/**
 * Handle alert action button click
 * @param {string} type - Alert type
 * @param {number} index - Alert index
 */
function handleAlertAction(type, index) {
    const alert = dashboardData.alerts[index];
    
    if (!alert) {
        console.error('❌ Alert not found:', index);
        return;
    }
    
    console.log('🔔 Handling alert action:', type, alert);
    
    switch (type) {
        case 'contract':
            handleContractExpiringAction(alert);
            break;
            
        case 'birthday':
            handleBirthdayAction(alert);
            break;
            
        case 'anniversary':
            handleAnniversaryAction(alert);
            break;
            
        case 'probation':
            handleProbationAction(alert);
            break;
            
        case 'leave_pending':
            handleLeavePendingAction(alert);
            break;
            
        default:
            console.warn('⚠️ Unknown alert type:', type);
            alert('Action not available yet');
    }
}

/**
 * Handle contract expiring action
 * @param {Object} alert - Alert object
 */
function handleContractExpiringAction(alert) {
    if (!alert.employee || !alert.employee.id) {
        alert('Employee data not available');
        return;
    }
    
    // Redirect to employee detail page (with contract tab active)
    window.location.href = `employees.html?id=${alert.employee.id}&tab=contract`;
}

/**
 * Handle birthday action
 * @param {Object} alert - Alert object
 */
function handleBirthdayAction(alert) {
    if (!alert.employee || !alert.employee.id) {
        alert('Employee data not available');
        return;
    }
    
    // Redirect to WhatsApp Blast with birthday template
    window.location.href = `whatsapp-blast.html?template=birthday&employee=${alert.employee.id}`;
}

/**
 * Handle anniversary action
 * @param {Object} alert - Alert object
 */
function handleAnniversaryAction(alert) {
    if (!alert.employee || !alert.employee.id) {
        alert('Employee data not available');
        return;
    }
    
    // Redirect to WhatsApp Blast with anniversary template
    window.location.href = `whatsapp-blast.html?template=anniversary&employee=${alert.employee.id}&years=${alert.years}`;
}

/**
 * Handle probation ending action
 * @param {Object} alert - Alert object
 */
function handleProbationAction(alert) {
    if (!alert.employee || !alert.employee.id) {
        alert('Employee data not available');
        return;
    }
    
    // Redirect to employee detail page
    window.location.href = `employees.html?id=${alert.employee.id}&action=review_probation`;
}

/**
 * Handle leave pending action
 * @param {Object} alert - Alert object
 */
function handleLeavePendingAction(alert) {
    if (!alert.leave) {
        alert('Leave data not available');
        return;
    }
    
    // Redirect to leave management page
    window.location.href = `leave.html`;
}

// ================================================
// SECTION 12: MAIN DATA LOADING FUNCTION
// ================================================

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Fetch all data in parallel
        const [employees, leaveData, recruitmentData, tasks] = await Promise.all([
            fetchEmployees(),
            fetchLeaveData(),
            fetchRecruitmentData(),
            fetchTasks()
        ]);
        
        // Store in global state
        dashboardData.employees = employees;
        dashboardData.leaveData = leaveData;
        dashboardData.recruitmentData = recruitmentData;
        dashboardData.tasks = tasks;
        
        // Calculate statistics
        const empStats = calculateEmployeeStats(employees);
        const leaveStats = calculateLeaveStats(leaveData);
        const recruitmentStats = calculateRecruitmentStats(recruitmentData);
        const deptBreakdown = calculateDepartmentBreakdown(employees);
        
        dashboardData.stats = {
            ...empStats,
            ...leaveStats,
            ...recruitmentStats
        };
        
        // Generate critical alerts
        dashboardData.alerts = generateCriticalAlerts(employees, leaveData);
        
        // Render all sections
        renderEmployeeStats(empStats);
        renderLeaveStats(leaveStats);
        renderCriticalAlerts(dashboardData.alerts);
        renderAutoTasks(dashboardData.alerts);
        renderManualTasks(tasks);
        renderBirthdaysThisMonth(employees);
        renderWorkAnniversaries(employees);
        renderContractsExpiring(employees);
        renderRecruitmentPipeline(recruitmentStats);
        renderDepartmentBreakdown(deptBreakdown);
        
        // Render Charts
        renderHeadcountChart(employees);
        renderTurnoverChart(employees);
        
        // Update notification badge
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge && dashboardData.alerts.length > 0) {
            notificationBadge.classList.remove('hidden');
        }
        
        console.log('✅ Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('❌ Load dashboard data failed:', error);
        if (typeof window.showToast === 'function') {
            window.showToast('Failed to load dashboard data', 'error');
        }
    }
}

/**
 * Refresh dashboard
 */
async function refreshDashboard() {
    if (typeof window.showLoading === 'function') {
        window.showLoading('Refreshing dashboard...');
    }
    
    // Destroy chart instances before reload
    if (headcountChartInstance) {
        headcountChartInstance.destroy();
        headcountChartInstance = null;
    }
    if (turnoverChartInstance) {
        turnoverChartInstance.destroy();
        turnoverChartInstance = null;
    }
    
    await loadDashboardData();
    
    if (typeof window.hideLoading === 'function') {
        window.hideLoading();
    }
    
    if (typeof window.showToast === 'function') {
        window.showToast('Dashboard refreshed', 'success');
    }
}

// ================================================
// SECTION 13: INITIALIZATION
// ================================================

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    console.log('🚀 Initializing dashboard...');
    
    try {
        // Check authentication
        const session = await checkAuth();
        if (!session) {
            console.log('⚠️ No session - redirecting to login');
            window.location.replace('login.html');
            return;
        }
        
        console.log('✅ Session verified:', session.user.email);
        
        // Load dashboard data
        await loadDashboardData();
        
        // Attach event listeners
        const addTaskForm = document.getElementById('addTaskForm');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', handleAddTask);
        }
        
        console.log('🎉 Dashboard initialized successfully!');
        
    } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
        if (typeof window.showToast === 'function') {
            window.showToast('Failed to initialize dashboard', 'error');
        }
    }
}

// ================================================
// EXPOSE FUNCTIONS TO WINDOW (Global Access)
// ================================================

// Section 10: Task Management
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTaskConfirm = deleteTaskConfirm;
window.handleAddTask = handleAddTask;

// Section 11: Alert Actions
window.handleAlertAction = handleAlertAction;

// Section 12: Main Functions
window.loadDashboardData = loadDashboardData;
window.refreshDashboard = refreshDashboard;

// ================================================
// AUTO-INITIALIZATION
// ================================================

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}

// ================================================
// INITIALIZATION SUMMARY
// ================================================

console.log('✅ DASHBOARD.js v2.0 - CLEANED & ORGANIZED');
console.log('📦 Loaded Sections:');
console.log('   1️⃣  Configuration (Config + Global State)');
console.log('   2️⃣  Utility Functions (9 functions)');
console.log('   3️⃣  Data Fetching (4 functions)');
console.log('   4️⃣  Statistics Calculation (7 functions)');
console.log('   5️⃣  Critical Alerts Generation (1 function)');
console.log('   6️⃣  Render: Statistics (4 functions)');
console.log('   7️⃣  Render: Alerts & Tasks (3 functions)');
console.log('   8️⃣  Render: Employee Events (3 functions)');
console.log('   9️⃣  Chart Rendering (2 functions)');
console.log('   🔟  Task Management (3 functions)');
console.log('   1️⃣1️⃣  Alert Action Handlers (6 functions)');
console.log('   1️⃣2️⃣  Main Data Loading (2 functions)');
console.log('   1️⃣3️⃣  Initialization (1 function)');
console.log('📊 Total: 45+ functions');
console.log('🌐 Exposed: 6 critical functions to window');
console.log('🔗 Dependencies: app.js, api.js, auth.js, database-functions.js, utils.js, Chart.js');
