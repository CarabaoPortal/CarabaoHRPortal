// ================================================
// SWAP HRIS - SUPABASE API OPERATIONS
// api.js - Version 3.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires app.js with getDB() and checkAuth()
// ⚠️ NO SUPABASE CONFIG HERE - All in app.js

// ================================================
// SECTION 1: CORE AUTHENTICATION & UTILITIES
// ================================================

/**
 * Login user with email and password
 */
async function loginUser(email, password) {
    try {
        const { data, error } = await getDB().auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Login error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Login successful:', email);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Login failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Register new user
 */
async function registerUser(email, password, userData = {}) {
    try {
        const { data, error } = await getDB().auth.signUp({
            email: email,
            password: password,
            options: {
                data: userData
            }
        });
        
        if (error) {
            console.error('❌ Registration error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Registration successful:', email);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Registration failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Global search across multiple tables
 */
async function globalSearch(searchTerm, tables = ['employees', 'recruitments']) {
    try {
        const results = {};
        
        for (const table of tables) {
            const { data, error } = await getDB()
                .from(table)
                .select('*')
                .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
            
            if (!error) {
                results[table] = data;
            }
        }
        
        console.log(`✅ Global search completed: ${searchTerm}`);
        return { data: results, error: null };
        
    } catch (error) {
        console.error('❌ Global search failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Batch delete records
 */
async function batchDelete(table, ids) {
    try {
        const { data, error } = await getDB()
            .from(table)
            .delete()
            .in('id', ids);
        
        if (error) {
            console.error('❌ Batch delete error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Batch deleted ${ids.length} records from ${table}`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Batch delete failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get row count with optional filters
 */
async function getRowCount(table, filters = {}) {
    try {
        let query = getDB()
            .from(table)
            .select('id', { count: 'exact', head: true });
        
        Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
        });
        
        const { count, error } = await query;
        
        if (error) {
            console.error('❌ Get row count error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Row count for ${table}: ${count}`);
        return { data: count, error: null };
        
    } catch (error) {
        console.error('❌ Get row count failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Real-time subscription to table changes
 */
function subscribeToTable(table, callback) {
    const subscription = getDB()
        .channel(`${table}_changes`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: table },
            (payload) => {
                console.log(`🔔 Change in ${table}:`, payload);
                callback(payload);
            }
        )
        .subscribe();
    
    console.log(`✅ Subscribed to ${table}`);
    return subscription;
}

/**
 * Unsubscribe from table changes
 */
function unsubscribeFromTable(subscription) {
    getDB().removeChannel(subscription);
    console.log('✅ Unsubscribed');
}

// ================================================
// SECTION 2: EMPLOYEES API (General - Used Everywhere)
// ================================================

/**
 * Get all employees with filters and relations
 */
async function getAllEmployees(filters = {}) {
    try {
        const db = getDB();
        
        let query = db
            .from('employees')
            .select(`
                *,
                departments:department_id (id, name),
                divisions:division_id (id, name),
                positions:position_id (id, title),
                ptkp_categories:ptkp_id (id, code, description)
            `, { count: 'exact' });
        
        // Apply filters
        if (filters.search) {
            query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,nik.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`);
        }
        
        if (filters.status) {
            query = query.eq('employment_status', filters.status);
        }
        
        if (filters.department) {
            query = query.eq('department_id', filters.department);
        }
        
        // Default: only active employees
        if (filters.includeInactive !== true) {
            query = query.eq('is_active', true);
        }
        
        query = query.order('full_name', { ascending: true });
        
        const { data, error, count } = await query;
        
        if (error) {
            console.error('❌ Get employees error:', error);
            return { data: null, error, count: 0 };
        }
        
        console.log(`✅ Retrieved ${data.length} employees`);
        return { data, error: null, count };
        
    } catch (error) {
        console.error('❌ Get employees failed:', error);
        return { data: null, error, count: 0 };
    }
}

/**
 * Get employee by ID with relations
 */
async function getEmployeeById(id) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('employees')
            .select(`
                *,
                departments:department_id (id, name),
                divisions:division_id (id, name),
                positions:position_id (id, title),
                ptkp_categories:ptkp_id (id, code, description)
            `)
            .eq('id', id)
            .single();
        
        if (error) {
            console.error('❌ Get employee error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Retrieved employee:', data.full_name);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get employee failed:', error);
        return { data: null, error };
    }
}

/**
 * Create new employee
 */
async function createEmployee(employeeData) {
    try {
        const db = getDB();
        
        const payload = {
            employee_code: employeeData.employee_code,
            nik: employeeData.nik,
            full_name: employeeData.full_name,
            email: employeeData.email,
            phone: employeeData.phone,
            birth_place: employeeData.birth_place,
            birth_date: employeeData.birth_date,
            gender: employeeData.gender,
            mother_maiden_name: employeeData.mother_maiden_name,
            ktp_address: employeeData.ktp_address,
            current_address: employeeData.current_address,
            bank_name: employeeData.bank_name,
            bank_account_number: employeeData.bank_account_number,
            bank_account_name: employeeData.bank_account_name,
            department_id: employeeData.department_id,
            division_id: employeeData.division_id,
            position_id: employeeData.position_id,
            ptkp_id: employeeData.ptkp_id,
            employment_status: employeeData.employment_status,
            join_date: employeeData.join_date,
            is_active: employeeData.is_active !== undefined ? employeeData.is_active : true,
            warning_letter_count: employeeData.warning_letter_count || 0,
            created_by: employeeData.created_by || null,
        };
        
        // Remove undefined values
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) delete payload[key];
        });
        
        const { data, error } = await db
            .from('employees')
            .insert(payload)
            .select(`
                *,
                departments:department_id (id, name),
                divisions:division_id (id, name),
                positions:position_id (id, title),
                ptkp_categories:ptkp_id (id, code, description)
            `)
            .single();
        
        if (error) {
            console.error('❌ Create employee error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Employee created:', data.full_name);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Create employee failed:', error);
        return { data: null, error };
    }
}

/**
 * Update employee
 */
async function updateEmployee(id, employeeData) {
    try {
        const db = getDB();
        
        const payload = {
            employee_code: employeeData.employee_code,
            nik: employeeData.nik,
            full_name: employeeData.full_name,
            email: employeeData.email,
            phone: employeeData.phone,
            birth_place: employeeData.birth_place,
            birth_date: employeeData.birth_date,
            gender: employeeData.gender,
            mother_maiden_name: employeeData.mother_maiden_name,
            ktp_address: employeeData.ktp_address,
            current_address: employeeData.current_address,
            bank_name: employeeData.bank_name,
            bank_account_number: employeeData.bank_account_number,
            bank_account_name: employeeData.bank_account_name,
            department_id: employeeData.department_id,
            division_id: employeeData.division_id,
            position_id: employeeData.position_id,
            ptkp_id: employeeData.ptkp_id,
            employment_status: employeeData.employment_status,
            join_date: employeeData.join_date,
            resign_date: employeeData.resign_date,
            is_resigned: employeeData.is_resigned || false,
            is_active: employeeData.is_active,
            warning_letter_count: employeeData.warning_letter_count,
            last_warning_date: employeeData.last_warning_date,
            warning_notes: employeeData.warning_notes,
            updated_by: employeeData.updated_by || null,
            updated_at: new Date().toISOString()
        };
        
        // Remove undefined values
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) delete payload[key];
        });
        
        const { data, error } = await db
            .from('employees')
            .update(payload)
            .eq('id', id)
            .select(`
                *,
                departments:department_id (id, name),
                divisions:division_id (id, name),
                positions:position_id (id, title),
                ptkp_categories:ptkp_id (id, code, description)
            `)
            .single();
        
        if (error) {
            console.error('❌ Update employee error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Employee updated:', data.full_name);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update employee failed:', error);
        return { data: null, error };
    }
}

/**
 * Delete employee
 */
async function deleteEmployee(id) {
    try {
        const { data, error } = await getDB()
            .from('employees')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('❌ Delete employee error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Employee deleted');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Delete employee failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Fetch active employees with phone numbers (for WhatsApp Blast)
 * @async
 * @returns {Promise<Object>} Array of active employees with phone
 */
async function fetchActiveEmployees() {
    try {
        console.log('📱 Fetching active employees with phone numbers...');
        
        const db = getDB();
        
        const { data, error } = await db
            .from('employees')
            .select(`
                id,
                full_name,
                email,
                phone,
                department_id,
                position_id,
                departments:department_id (id, name, code),
                positions:position_id (id, title)
            `)
            .eq('is_active', true)
            .not('phone', 'is', null)
            .order('full_name', { ascending: true });
        
        if (error) {
            console.error('❌ Fetch active employees error:', error);
            return { data: [], error };
        }
        
        // Filter valid phone numbers
        const validEmployees = (data || []).filter(emp => {
            const phone = emp.phone?.trim();
            return phone && (phone.startsWith('+') || phone.startsWith('0')) && phone.length >= 10;
        });
        
        console.log(`✅ Fetched ${validEmployees.length} active employees with valid phones`);
        return { data: validEmployees, error: null };
        
    } catch (error) {
        console.error('❌ Fetch active employees failed:', error);
        return { data: [], error };
    }
}

/**
 * Get employee count by department
 */
async function getEmployeeCountByDepartment() {
    try {
        const { data, error } = await getDB()
            .from('employees')
            .select('department')
            .eq('status', 'active');
        
        if (error) {
            console.error('❌ Get department count error:', error);
            return { data: null, error: error.message };
        }
        
        const counts = data.reduce((acc, emp) => {
            acc[emp.department] = (acc[emp.department] || 0) + 1;
            return acc;
        }, {});
        
        console.log('✅ Department count retrieved');
        return { data: counts, error: null };
        
    } catch (error) {
        console.error('❌ Get department count failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 3: CONTRACT & WARNING LETTERS API
// (Page-Specific: Employee Detail Page)
// ================================================

/**
 * Get contract history for employee
 */
async function getContractHistory(employeeId) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('contract_history')
            .select('*')
            .eq('employee_id', employeeId)
            .order('start_date', { ascending: false });
        
        if (error) {
            console.error('❌ Get contract history error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Contract history retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get contract history failed:', error);
        return { data: null, error };
    }
}

/**
 * Get latest contract for employee
 */
async function getLatestContract(employeeId) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('contract_history')
            .select('*')
            .eq('employee_id', employeeId)
            .order('start_date', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Get latest contract error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Latest contract retrieved');
        return { data: data || null, error: null };
        
    } catch (error) {
        console.error('❌ Get latest contract failed:', error);
        return { data: null, error };
    }
}

/**
 * Create contract history
 */
async function createContractHistory(contractData) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('contract_history')
            .insert([contractData])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Create contract error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Contract created');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Create contract failed:', error);
        return { data: null, error };
    }
}

/**
 * Update contract history
 */
async function updateContractHistory(contractId, contractData) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('contract_history')
            .update(contractData)
            .eq('id', contractId)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Update contract error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Contract updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update contract failed:', error);
        return { data: null, error };
    }
}

/**
 * Delete contract history
 */
async function deleteContractHistory(contractId) {
    try {
        const db = getDB();
        
        const { error } = await db
            .from('contract_history')
            .delete()
            .eq('id', contractId);
        
        if (error) {
            console.error('❌ Delete contract error:', error);
            return { error };
        }
        
        console.log('✅ Contract deleted');
        return { error: null };
        
    } catch (error) {
        console.error('❌ Delete contract failed:', error);
        return { error };
    }
}

/**
 * Get warning letters for employee
 */
async function getWarningLetters(employeeId) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('warning_letters')
            .select('*')
            .eq('employee_id', employeeId)
            .order('issue_date', { ascending: false });
        
        if (error) {
            console.error('❌ Get warning letters error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Warning letters retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get warning letters failed:', error);
        return { data: null, error };
    }
}

/**
 * Create warning letter
 */
async function createWarningLetter(warningData) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('warning_letters')
            .insert([warningData])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Create warning letter error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Warning letter created');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Create warning letter failed:', error);
        return { data: null, error };
    }
}

/**
 * Update warning letter
 */
async function updateWarningLetter(letterId, warningData) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('warning_letters')
            .update(warningData)
            .eq('id', letterId)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Update warning letter error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Warning letter updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update warning letter failed:', error);
        return { data: null, error };
    }
}

/**
 * Delete warning letter
 */
async function deleteWarningLetter(letterId) {
    try {
        const db = getDB();
        
        const { error } = await db
            .from('warning_letters')
            .delete()
            .eq('id', letterId);
        
        if (error) {
            console.error('❌ Delete warning letter error:', error);
            return { error };
        }
        
        console.log('✅ Warning letter deleted');
        return { error: null };
        
    } catch (error) {
        console.error('❌ Delete warning letter failed:', error);
        return { error };
    }
}

// ================================================
// SECTION 4: ATTENDANCE API
// (Page-Specific: Attendance Page)
// ================================================

/**
 * Get all attendance records with filters
 */
async function getAllAttendance(filters = {}) {
    try {
        let query = getDB()
            .from('attendance')
            .select(`
                *,
                employees (
                    name,
                    employee_id,
                    department
                )
            `)
            .order('date', { ascending: false });
        
        if (filters.date) {
            query = query.eq('date', filters.date);
        }
        if (filters.employee_id) {
            query = query.eq('employee_id', filters.employee_id);
        }
        if (filters.month) {
            query = query.gte('date', `${filters.month}-01`)
                         .lt('date', `${filters.month}-32`);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Get attendance error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Retrieved ${data.length} attendance records`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get attendance failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Clock in employee
 */
async function clockIn(employeeId) {
    try {
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        
        const { data: existing } = await getDB()
            .from('attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', currentDate)
            .single();
        
        if (existing) {
            return { data: null, error: 'Already clocked in today' };
        }
        
        const { data, error } = await getDB()
            .from('attendance')
            .insert([{
                employee_id: employeeId,
                date: currentDate,
                clock_in: currentTime,
                status: 'present'
            }])
            .select();
        
        if (error) {
            console.error('❌ Clock in error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Clock in successful');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Clock in failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Clock out employee
 */
async function clockOut(attendanceId) {
    try {
        const currentTime = getCurrentTime();
        
        const { data, error } = await getDB()
            .from('attendance')
            .update({
                clock_out: currentTime
            })
            .eq('id', attendanceId)
            .select();
        
        if (error) {
            console.error('❌ Clock out error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Clock out successful');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Clock out failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get attendance summary for employee
 */
async function getAttendanceSummary(employeeId, month) {
    try {
        const { data, error } = await getDB()
            .from('attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .gte('date', `${month}-01`)
            .lt('date', `${month}-32`);
        
        if (error) {
            console.error('❌ Get attendance summary error:', error);
            return { data: null, error: error.message };
        }
        
        const summary = {
            total_days: data.length,
            present: data.filter(d => d.status === 'present').length,
            late: data.filter(d => d.status === 'late').length,
            absent: data.filter(d => d.status === 'absent').length,
            permission: data.filter(d => d.status === 'permission').length
        };
        
        console.log('✅ Attendance summary calculated');
        return { data: summary, error: null };
        
    } catch (error) {
        console.error('❌ Get attendance summary failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 5: LEAVE API
// (Page-Specific: Leave Management Page)
// ================================================

/**
 * Get all leave requests with filters
 */
async function getAllLeaves(filters = {}) {
    try {
        let query = getDB()
            .from('leaves')
            .select(`
                *,
                employees (
                    name,
                    employee_id,
                    department
                )
            `)
            .order('created_at', { ascending: false });
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.employee_id) {
            query = query.eq('employee_id', filters.employee_id);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Get leaves error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Retrieved ${data.length} leave requests`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get leaves failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Create leave request
 */
async function createLeaveRequest(leaveData) {
    try {
        const { data, error } = await getDB()
            .from('leaves')
            .insert([{
                ...leaveData,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) {
            console.error('❌ Create leave error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Leave request created');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Create leave failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update leave status (approve/reject)
 */
async function updateLeaveStatus(leaveId, status, notes = '') {
    try {
        const { data, error } = await getDB()
            .from('leaves')
            .update({
                status: status,
                approval_notes: notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', leaveId)
            .select();
        
        if (error) {
            console.error('❌ Update leave status error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Leave ${status}`);
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Update leave status failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get leave balance for employee
 */
async function getLeaveBalance(employeeId) {
    try {
        const { data, error } = await getDB()
            .from('leave_balance')
            .select('*')
            .eq('employee_id', employeeId)
            .single();
        
        if (error) {
            console.error('❌ Get leave balance error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Leave balance retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get leave balance failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 6: RECRUITMENT API
// (Page-Specific: Recruitment Page)
// ================================================

/**
 * Get all recruitment applications with filters
 */
async function getAllRecruitments(filters = {}) {
    try {
        let query = getDB()
            .from('recruitments')
            .select('*')
            .order('applied_date', { ascending: false });
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.position) {
            query = query.eq('position', filters.position);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Get recruitments error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Retrieved ${data.length} applications`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get recruitments failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Create recruitment application
 */
async function createRecruitment(recruitmentData) {
    try {
        const { data, error } = await getDB()
            .from('recruitments')
            .insert([{
                ...recruitmentData,
                status: 'new',
                applied_date: new Date().toISOString()
            }])
            .select();
        
        if (error) {
            console.error('❌ Create recruitment error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Recruitment created');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Create recruitment failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update recruitment status
 */
async function updateRecruitmentStatus(recruitmentId, status) {
    try {
        const { data, error } = await getDB()
            .from('recruitments')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', recruitmentId)
            .select();
        
        if (error) {
            console.error('❌ Update recruitment error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Recruitment status: ${status}`);
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Update recruitment failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 7: DASHBOARD API
// (Page-Specific: Dashboard Page)
// ================================================

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
    try {
        const { data: employees, error: empError } = await getDB()
            .from('employees')
            .select('id, status')
            .eq('status', 'active');
        
        if (empError) throw empError;
        
        const currentDate = getCurrentDate();
        const { data: attendance, error: attError } = await getDB()
            .from('attendance')
            .select('id')
            .eq('date', currentDate);
        
        if (attError) throw attError;
        
        const { data: leaves, error: leaveError } = await getDB()
            .from('leaves')
            .select('id')
            .eq('status', 'pending');
        
        if (leaveError) throw leaveError;
        
        const { data: recruitments, error: recError } = await getDB()
            .from('recruitments')
            .select('id')
            .eq('status', 'new');
        
        if (recError) throw recError;
        
        const stats = {
            total_employees: employees.length,
            present_today: attendance.length,
            pending_leaves: leaves.length,
            new_applications: recruitments.length,
            attendance_rate: employees.length > 0 
                ? ((attendance.length / employees.length) * 100).toFixed(1) 
                : 0
        };
        
        console.log('✅ Dashboard stats retrieved');
        return { data: stats, error: null };
        
    } catch (error) {
        console.error('❌ Get dashboard stats failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get monthly attendance chart data
 */
async function getMonthlyAttendanceChart(month) {
    try {
        const { data, error } = await getDB()
            .from('attendance')
            .select('date, status')
            .gte('date', `${month}-01`)
            .lt('date', `${month}-32`);
        
        if (error) {
            console.error('❌ Get monthly attendance error:', error);
            return { data: null, error: error.message };
        }
        
        const chartData = data.reduce((acc, record) => {
            const date = record.date;
            if (!acc[date]) {
                acc[date] = { present: 0, late: 0, absent: 0 };
            }
            if (record.status === 'present') acc[date].present++;
            if (record.status === 'late') acc[date].late++;
            if (record.status === 'absent') acc[date].absent++;
            return acc;
        }, {});
        
        console.log('✅ Monthly chart data retrieved');
        return { data: chartData, error: null };
        
    } catch (error) {
        console.error('❌ Get monthly chart failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 8: TASKS API
// (Page-Specific: Tasks/To-Do Page)
// ================================================

/**
 * Get all tasks with filters
 */
async function getAllTasks(filters = {}) {
    try {
        const db = getDB();
        
        let query = db
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        if (filters.priority) {
            query = query.eq('priority', filters.priority);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Get tasks error:', error);
            return { data: null, error };
        }
        
        console.log(`✅ Retrieved ${data.length} tasks`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get tasks failed:', error);
        return { data: null, error };
    }
}

/**
 * Create new task
 */
async function createTask(taskData) {
    try {
        const db = getDB();
        const session = await checkAuth();
        
        const { data, error } = await db
            .from('tasks')
            .insert([{
                ...taskData,
                created_by: session?.user?.id || null,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Create task error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Task created');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Create task failed:', error);
        return { data: null, error };
    }
}

/**
 * Update task
 */
async function updateTask(taskId, taskData) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('tasks')
            .update({
                ...taskData,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Update task error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Task updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update task failed:', error);
        return { data: null, error };
    }
}

/**
 * Delete task
 */
async function deleteTask(taskId) {
    try {
        const db = getDB();
        
        const { data, error } = await db
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Delete task error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Task deleted');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Delete task failed:', error);
        return { data: null, error };
    }
}

/**
 * Toggle task completion status
 */
async function toggleTaskStatus(taskId) {
    try {
        const db = getDB();
        
        // Get current task
        const { data: task, error: getError } = await db
            .from('tasks')
            .select('status')
            .eq('id', taskId)
            .single();
        
        if (getError) throw getError;
        
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        
        const { data, error } = await db
            .from('tasks')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Toggle task status error:', error);
            return { data: null, error };
        }
        
        console.log(`✅ Task status: ${newStatus}`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Toggle task status failed:', error);
        return { data: null, error };
    }
}

// ================================================
// SECTION 9: SETTINGS API
// (Page-Specific: Settings Page)
// ================================================

/**
 * Get current user profile from system_users
 */
async function getCurrentUserProfile() {
    try {
        const session = await checkAuth();
        if (!session) {
            return { data: null, error: 'Not authenticated' };
        }

        const { data, error } = await getDB()
            .from('system_users')
            .select('*')
            .eq('user_email', session.user.email)
            .single();

        if (error) {
            console.error('❌ Get profile error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Profile retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get profile failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update user profile in system_users
 */
async function updateUserProfile(userId, profileData) {
    try {
        const { data, error } = await getDB()
            .from('system_users')
            .update({
                user_name: profileData.user_name,
                phone: profileData.phone,
                photo_url: profileData.photo_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('❌ Update profile error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Profile updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update profile failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update user preferences
 */
async function updateUserPreferences(userId, preferences) {
    try {
        const { data, error } = await getDB()
            .from('system_users')
            .update({
                language: preferences.language,
                timezone: preferences.timezone,
                date_format: preferences.date_format,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('❌ Update preferences error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Preferences updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update preferences failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Change user password via Supabase Auth
 */
async function changeUserPassword(newPassword) {
    try {
        const { data, error } = await getDB().auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('❌ Change password error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Password changed');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Change password failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Upload profile photo to Supabase Storage
 */
async function uploadProfilePhoto(userId, file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/avatar.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { data: uploadData, error: uploadError } = await getDB()
            .storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Upload photo error:', uploadError);
            return { data: null, error: uploadError.message };
        }

        const { data: urlData } = getDB()
            .storage
            .from('avatars')
            .getPublicUrl(filePath);

        const photoUrl = urlData.publicUrl + '?t=' + Date.now();

        console.log('✅ Photo uploaded');
        return { data: { url: photoUrl }, error: null };
        
    } catch (error) {
        console.error('❌ Upload photo failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get login history from audit_logs
 */
async function getLoginHistory(userEmail, limit = 10) {
    try {
        const { data, error } = await getDB()
            .from('audit_logs')
            .select('*')
            .eq('table_name', 'auth')
            .eq('changed_by_email', userEmail)
            .order('changed_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('❌ Get login history error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Login history retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get login history failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get company settings
 */
async function getCompanySettings() {
    try {
        const { data, error } = await getDB()
            .from('company_settings')
            .select('*')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Get company settings error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Company settings retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get company settings failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update company settings
 */
async function updateCompanySettings(settingsId, settingsData) {
    try {
        const session = await checkAuth();
        
        const { data, error } = await getDB()
            .from('company_settings')
            .update({
                ...settingsData,
                updated_at: new Date().toISOString(),
                updated_by: session?.user?.id || null
            })
            .eq('id', settingsId)
            .select()
            .single();

        if (error) {
            console.error('❌ Update company settings error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Company settings updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update company settings failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Upload company logo
 */
async function uploadCompanyLogo(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `company_logo.${fileExt}`;
        const filePath = `company/${fileName}`;

        const { data: uploadData, error: uploadError } = await getDB()
            .storage
            .from('company')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Upload logo error:', uploadError);
            return { data: null, error: uploadError.message };
        }

        const { data: urlData } = getDB()
            .storage
            .from('company')
            .getPublicUrl(filePath);

        const logoUrl = urlData.publicUrl + '?t=' + Date.now();

        console.log('✅ Logo uploaded');
        return { data: { url: logoUrl }, error: null };
        
    } catch (error) {
        console.error('❌ Upload logo failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get all work schedule templates with shifts
 */
async function getWorkScheduleTemplates() {
    try {
        const { data, error } = await getDB()
            .from('work_schedule_templates')
            .select(`
                *,
                shifts:work_schedule_shifts(*)
            `)
            .eq('is_active', true)
            .order('template_name');

        if (error) {
            console.error('❌ Get work schedules error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Work schedules retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get work schedules failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get single work schedule template with shifts
 */
async function getWorkScheduleTemplate(templateId) {
    try {
        const { data, error } = await getDB()
            .from('work_schedule_templates')
            .select(`
                *,
                shifts:work_schedule_shifts(*)
            `)
            .eq('id', templateId)
            .single();

        if (error) {
            console.error('❌ Get work schedule error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Work schedule retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get work schedule failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Create new work schedule template
 */
async function createWorkScheduleTemplate(templateData) {
    try {
        const session = await checkAuth();
        
        const { data, error } = await getDB()
            .from('work_schedule_templates')
            .insert({
                ...templateData,
                created_by: session?.user?.id || null
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Create work schedule error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Work schedule created');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Create work schedule failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update work schedule template
 */
async function updateWorkScheduleTemplate(templateId, templateData) {
    try {
        const session = await checkAuth();
        
        const { data, error } = await getDB()
            .from('work_schedule_templates')
            .update({
                ...templateData,
                updated_at: new Date().toISOString(),
                updated_by: session?.user?.id || null
            })
            .eq('id', templateId)
            .select()
            .single();

        if (error) {
            console.error('❌ Update work schedule error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Work schedule updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update work schedule failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Delete work schedule template (soft delete)
 */
async function deleteWorkScheduleTemplate(templateId) {
    try {
        const { data, error } = await getDB()
            .from('work_schedule_templates')
            .update({ is_active: false })
            .eq('id', templateId)
            .select()
            .single();

        if (error) {
            console.error('❌ Delete work schedule error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Work schedule deleted');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Delete work schedule failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Upsert work schedule shifts (bulk)
 */
async function upsertWorkScheduleShifts(templateId, shifts) {
    try {
        // Delete existing shifts
        await getDB()
            .from('work_schedule_shifts')
            .delete()
            .eq('template_id', templateId);

        // Insert new shifts
        const shiftsWithTemplate = shifts.map(shift => ({
            ...shift,
            template_id: templateId
        }));

        const { data, error } = await getDB()
            .from('work_schedule_shifts')
            .insert(shiftsWithTemplate)
            .select();

        if (error) {
            console.error('❌ Upsert shifts error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Shifts updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Upsert shifts failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get all leave policies
 */
async function getLeavePolicies() {
    try {
        const { data, error } = await getDB()
            .from('leave_policies')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) {
            console.error('❌ Get leave policies error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Leave policies retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get leave policies failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get single leave policy
 */
async function getLeavePolicy(policyId) {
    try {
        const { data, error } = await getDB()
            .from('leave_policies')
            .select('*')
            .eq('id', policyId)
            .single();

        if (error) {
            console.error('❌ Get leave policy error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Leave policy retrieved');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Get leave policy failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Create new leave policy
 */
async function createLeavePolicy(policyData) {
    try {
        const session = await checkAuth();
        
        const { data, error } = await getDB()
            .from('leave_policies')
            .insert({
                ...policyData,
                created_by: session?.user?.id || null
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Create leave policy error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Leave policy created');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Create leave policy failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update leave policy
 */
async function updateLeavePolicy(policyId, policyData) {
    try {
        const session = await checkAuth();
        
        const { data, error } = await getDB()
            .from('leave_policies')
            .update({
                ...policyData,
                updated_at: new Date().toISOString(),
                updated_by: session?.user?.id || null
            })
            .eq('id', policyId)
            .select()
            .single();

        if (error) {
            console.error('❌ Update leave policy error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Leave policy updated');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Update leave policy failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Delete leave policy (soft delete)
 */
async function deleteLeavePolicy(policyId) {
    try {
        const { data, error } = await getDB()
            .from('leave_policies')
            .update({ is_active: false })
            .eq('id', policyId)
            .select()
            .single();

        if (error) {
            console.error('❌ Delete leave policy error:', error);
            return { data: null, error: error.message };
        }

        console.log('✅ Leave policy deleted');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Delete leave policy failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 9.5: WHATSAPP BLAST API
// (Page-Specific: WhatsApp Blast Page)
// ================================================

// Section 9.5: WhatsApp Blast API
window.fetchWhatsAppTemplates = fetchWhatsAppTemplates; // ✅ TAMBAHKAN INI
window.getDefaultWhatsAppTemplates = getDefaultWhatsAppTemplates; // ✅ TAMBAHKAN INI

/**
 * Fetch WhatsApp message templates
 * @async
 * @returns {Promise<Object>} Array of WhatsApp templates
 */
async function fetchWhatsAppTemplates() {
    try {
        console.log('📝 Fetching WhatsApp message templates...');
        
        const db = getDB();
        
        // Try to fetch from database
        const { data, error } = await db
            .from('whatsapp_templates')
            .select('*')
            .eq('is_active', true)
            .order('template_name', { ascending: true });
        
        // If table doesn't exist, use default templates
        if (error && error.code === '42P01') {
            console.log('⚠️ whatsapp_templates table not found, using default templates');
            return {
                data: getDefaultWhatsAppTemplates(),
                error: null
            };
        }
        
        if (error) {
            console.error('❌ Fetch templates error:', error);
            return {
                data: getDefaultWhatsAppTemplates(),
                error: null
            };
        }
        
        console.log(`✅ Fetched ${data?.length || 0} WhatsApp templates`);
        return { data: data || [], error: null };
        
    } catch (error) {
        console.error('❌ Fetch templates failed:', error);
        return {
            data: getDefaultWhatsAppTemplates(),
            error: null
        };
    }
}

/**
 * Get default WhatsApp templates (fallback)
 * @returns {Array<Object>} Default templates
 */
function getDefaultWhatsAppTemplates() {
    return [
        {
            id: 'default-1',
            template_name: 'Ucapan Selamat',
            category: 'greeting',
            message: `Halo {{name}},

Kami dari {{company_name}} ingin mengucapkan selamat atas pencapaian Anda!

Terima kasih atas dedikasi dan kerja keras Anda.

Salam,
Tim HR {{company_name}}`,
            variables: ['name', 'company_name'],
            is_active: true
        },
        {
            id: 'default-2',
            template_name: 'Reminder Meeting',
            category: 'reminder',
            message: `Halo {{name}},

Reminder untuk meeting hari ini:
📅 Tanggal: {{date}}
⏰ Waktu: {{time}}
📍 Lokasi: {{location}}

Mohon hadir tepat waktu.

Terima kasih,
{{company_name}}`,
            variables: ['name', 'date', 'time', 'location', 'company_name'],
            is_active: true
        },
        {
            id: 'default-3',
            template_name: 'Pengumuman Umum',
            category: 'announcement',
            message: `Halo {{name}},

Kami ingin menyampaikan pengumuman penting:

{{announcement_text}}

Untuk informasi lebih lanjut, silakan hubungi departemen HR.

Salam,
{{company_name}}`,
            variables: ['name', 'announcement_text', 'company_name'],
            is_active: true
        },
        {
            id: 'default-4',
            template_name: 'Ucapan Ulang Tahun',
            category: 'greeting',
            message: `Selamat Ulang Tahun {{name}}! 🎉🎂

Semoga hari ini menjadi hari yang spesial dan penuh kebahagiaan.

Terima kasih telah menjadi bagian dari keluarga {{company_name}}.

Salam hangat,
Tim HR {{company_name}}`,
            variables: ['name', 'company_name'],
            is_active: true
        },
        {
            id: 'default-5',
            template_name: 'Reminder Kontrak',
            category: 'reminder',
            message: `Halo {{name}},

Kami ingin mengingatkan bahwa kontrak kerja Anda akan berakhir pada {{contract_end_date}}.

Mohon untuk menghubungi departemen HR untuk informasi lebih lanjut mengenai perpanjangan kontrak.

Terima kasih,
{{company_name}}`,
            variables: ['name', 'contract_end_date', 'company_name'],
            is_active: true
        }
    ];
}

// ================================================
// SECTION 10: FILE STORAGE API
// (General - Used across multiple pages)
// ================================================

/**
 * Upload file to Supabase Storage
 */
async function uploadFile(file, bucket, path) {
    try {
        const { data, error } = await getDB().storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('❌ Upload file error:', error);
            return { data: null, error: error.message };
        }
        
        const { data: urlData } = getDB().storage
            .from(bucket)
            .getPublicUrl(path);
        
        console.log('✅ File uploaded');
        return { data: { ...data, publicUrl: urlData.publicUrl }, error: null };
        
    } catch (error) {
        console.error('❌ Upload file failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Delete file from Supabase Storage
 */
async function deleteFile(bucket, path) {
    try {
        const { data, error } = await getDB().storage
            .from(bucket)
            .remove([path]);
        
        if (error) {
            console.error('❌ Delete file error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ File deleted');
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Delete file failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// EXPOSE FUNCTIONS TO WINDOW (Global Access)
// ================================================

// Section 1: Core Authentication & Utilities
window.loginUser = loginUser;
window.registerUser = registerUser;
window.globalSearch = globalSearch;
window.batchDelete = batchDelete;
window.getRowCount = getRowCount;
window.subscribeToTable = subscribeToTable;
window.unsubscribeFromTable = unsubscribeFromTable;

// Section 2: Employees API
window.getAllEmployees = getAllEmployees;
window.getEmployeeById = getEmployeeById;
window.fetchActiveEmployees = fetchActiveEmployees;
window.createEmployee = createEmployee;
window.updateEmployee = updateEmployee;
window.deleteEmployee = deleteEmployee;
window.getEmployeeCountByDepartment = getEmployeeCountByDepartment;

// Section 3: Contract & Warning Letters API
window.getContractHistory = getContractHistory;
window.getLatestContract = getLatestContract;
window.createContractHistory = createContractHistory;
window.updateContractHistory = updateContractHistory;
window.deleteContractHistory = deleteContractHistory;
window.getWarningLetters = getWarningLetters;
window.createWarningLetter = createWarningLetter;
window.updateWarningLetter = updateWarningLetter;
window.deleteWarningLetter = deleteWarningLetter;

// Section 4: Attendance API
window.getAllAttendance = getAllAttendance;
window.clockIn = clockIn;
window.clockOut = clockOut;
window.getAttendanceSummary = getAttendanceSummary;

// Section 5: Leave API
window.getAllLeaves = getAllLeaves;
window.createLeaveRequest = createLeaveRequest;
window.updateLeaveStatus = updateLeaveStatus;
window.getLeaveBalance = getLeaveBalance;

// Section 6: Recruitment API
window.getAllRecruitments = getAllRecruitments;
window.createRecruitment = createRecruitment;
window.updateRecruitmentStatus = updateRecruitmentStatus;

// Section 7: Dashboard API
window.getDashboardStats = getDashboardStats;
window.getMonthlyAttendanceChart = getMonthlyAttendanceChart;

// Section 8: Tasks API
window.getAllTasks = getAllTasks;
window.createTask = createTask;
window.updateTask = updateTask;
window.deleteTask = deleteTask;
window.toggleTaskStatus = toggleTaskStatus;

// Section 9: Settings API
window.getCurrentUserProfile = getCurrentUserProfile;
window.updateUserProfile = updateUserProfile;
window.updateUserPreferences = updateUserPreferences;
window.changeUserPassword = changeUserPassword;
window.uploadProfilePhoto = uploadProfilePhoto;
window.getLoginHistory = getLoginHistory;
window.getCompanySettings = getCompanySettings;
window.updateCompanySettings = updateCompanySettings;
window.uploadCompanyLogo = uploadCompanyLogo;
window.getWorkScheduleTemplates = getWorkScheduleTemplates;
window.getWorkScheduleTemplate = getWorkScheduleTemplate;
window.createWorkScheduleTemplate = createWorkScheduleTemplate;
window.updateWorkScheduleTemplate = updateWorkScheduleTemplate;
window.deleteWorkScheduleTemplate = deleteWorkScheduleTemplate;
window.upsertWorkScheduleShifts = upsertWorkScheduleShifts;
window.getLeavePolicies = getLeavePolicies;
window.getLeavePolicy = getLeavePolicy;
window.createLeavePolicy = createLeavePolicy;
window.updateLeavePolicy = updateLeavePolicy;
window.deleteLeavePolicy = deleteLeavePolicy;

// Section 10: File Storage API
window.uploadFile = uploadFile;
window.deleteFile = deleteFile;

// ================================================
// INITIALIZATION
// ================================================

console.log('✅ API.js v3.1 - WHATSAPP BLAST READY'); // 
console.log('📦 Loaded Sections:');
console.log('   1️⃣  Core Auth & Utilities (6 functions)');
console.log('   2️⃣  Employees (7 functions)'); // 
console.log('   3️⃣  Contract & Warnings (9 functions)');
console.log('   4️⃣  Attendance (4 functions)');
console.log('   5️⃣  Leave Management (4 functions)');
console.log('   6️⃣  Recruitment (3 functions)');
console.log('   7️⃣  Dashboard Stats (2 functions)');
console.log('   8️⃣  Tasks/To-Do (5 functions)');
console.log('   9️⃣  Settings (18 functions)');
console.log('   9️⃣.5️⃣  WhatsApp Blast (2 functions)'); // 
console.log('   🔟  File Storage (2 functions)');
console.log('📊 Total: 61 functions ready'); // 