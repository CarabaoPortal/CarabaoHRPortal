// ================================================
// SWAP HRIS - DATABASE FUNCTIONS WRAPPER
// database-functions.js - Version 2.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires api.js and app.js
// ⚠️ PROVIDES: SQL function wrappers, dashboard stats, master data CRUD

// ================================================
// SECTION 1: ATTENDANCE CALCULATIONS (SQL RPC)
// ================================================

/**
 * Calculate total late minutes for employee in a month
 * @param {string} employeeId - Employee UUID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: number, error: string|null }
 */
async function calculateLateMinutes(employeeId, month, year) {
    try {
        const { data, error } = await getDB()
            .rpc('calculate_late_minutes', {
                p_employee_id: employeeId,
                p_month: month,
                p_year: year
            });
        
        if (error) {
            console.error('❌ Calculate late minutes error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Late minutes: ${data} min`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Calculate late minutes failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Calculate total overtime hours for employee in a month
 * @param {string} employeeId - Employee UUID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: number, error: string|null }
 */
async function calculateOvertimeHours(employeeId, month, year) {
    try {
        const { data, error } = await getDB()
            .rpc('calculate_overtime_hours', {
                p_employee_id: employeeId,
                p_month: month,
                p_year: year
            });
        
        if (error) {
            console.error('❌ Calculate overtime error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Overtime hours: ${data} hrs`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Calculate overtime failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Generate complete attendance summary for employee in a month
 * @param {string} employeeId - Employee UUID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: {total_present, total_late_minutes, total_overtime_hours}, error: string|null }
 */
async function generateAttendanceSummary(employeeId, month, year) {
    try {
        const { data, error } = await getDB()
            .rpc('generate_attendance_summary', {
                p_employee_id: employeeId,
                p_month: month,
                p_year: year
            });
        
        if (error) {
            console.error('❌ Attendance summary error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Attendance summary generated');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Attendance summary failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 2: PAYROLL CALCULATIONS (SQL RPC)
// ================================================

/**
 * Calculate gross salary (before deductions)
 * @param {string} employeeId - Employee UUID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: {basic_salary, total_allowances, total_overtime_pay, gross_salary}, error: string|null }
 */
async function calculateGrossSalary(employeeId, month, year) {
    try {
        const { data, error } = await getDB()
            .rpc('calculate_gross_salary', {
                p_employee_id: employeeId,
                p_month: month,
                p_year: year
            });
        
        if (error) {
            console.error('❌ Gross salary error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Gross salary calculated');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Gross salary failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Calculate BPJS Kesehatan contributions
 * @param {number} basicSalary - Basic salary amount
 * @returns {Object} { data: {employee_contribution, company_contribution, total}, error: string|null }
 */
async function calculateBPJSKesehatan(basicSalary) {
    try {
        const { data, error } = await getDB()
            .rpc('calculate_bpjs_kesehatan', {
                p_basic_salary: basicSalary
            });
        
        if (error) {
            console.error('❌ BPJS Kesehatan error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ BPJS Kesehatan calculated');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ BPJS Kesehatan failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Calculate BPJS Ketenagakerjaan contributions (JHT, JP, JKK, JKM)
 * @param {number} basicSalary - Basic salary amount
 * @returns {Object} { data: {...contributions...}, error: string|null }
 */
async function calculateBPJSKetenagakerjaan(basicSalary) {
    try {
        const { data, error } = await getDB()
            .rpc('calculate_bpjs_ketenagakerjaan', {
                p_basic_salary: basicSalary
            });
        
        if (error) {
            console.error('❌ BPJS Ketenagakerjaan error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ BPJS Ketenagakerjaan calculated');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ BPJS Ketenagakerjaan failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Calculate PPh21 tax based on PTKP status
 * @param {string} employeeId - Employee UUID
 * @param {number} grossSalary - Gross salary amount
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: {ptkp_amount, taxable_income, annual_tax, monthly_tax}, error: string|null }
 */
async function calculatePPh21(employeeId, grossSalary, month, year) {
    try {
        const { data, error } = await getDB()
            .rpc('calculate_pph21', {
                p_employee_id: employeeId,
                p_gross_salary: grossSalary,
                p_month: month,
                p_year: year
            });
        
        if (error) {
            console.error('❌ PPh21 error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ PPh21 calculated');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ PPh21 failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Calculate net salary (take home pay)
 * @param {string} employeeId - Employee UUID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: {...complete salary breakdown...}, error: string|null }
 */
async function calculateNetSalary(employeeId, month, year) {
    try {
        const { data, error } = await getDB()
            .rpc('calculate_net_salary', {
                p_employee_id: employeeId,
                p_month: month,
                p_year: year
            });
        
        if (error) {
            console.error('❌ Net salary error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Net salary calculated');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Net salary failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Generate complete payroll report for all employees in a month
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: [...employee payrolls...], error: string|null }
 */
async function generateMonthlyPayrollReport(month, year) {
    try {
        const { data, error } = await getDB()
            .rpc('generate_monthly_payroll_report', {
                p_month: month,
                p_year: year
            });
        
        if (error) {
            console.error('❌ Payroll report error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Payroll report: ${data.length} employees`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Payroll report failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 3: EMPLOYEE MANAGEMENT (SQL RPC)
// ================================================

/**
 * Get complete employee details with all related data
 * @param {string} employeeId - Employee UUID
 * @returns {Object} { data: {...complete employee data...}, error: string|null }
 */
async function getEmployeeFullDetails(employeeId) {
    try {
        const { data, error } = await getDB()
            .rpc('get_employee_full_details', {
                p_employee_id: employeeId
            });
        
        if (error) {
            console.error('❌ Employee details error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Employee details retrieved');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Employee details failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Calculate employee tenure (masa kerja)
 * @param {string} employeeId - Employee UUID
 * @returns {Object} { data: {years, months, days, total_months, join_date}, error: string|null }
 */
async function calculateEmployeeTenure(employeeId) {
    try {
        const { data, error } = await getDB()
            .rpc('calculate_employee_tenure', {
                p_employee_id: employeeId
            });
        
        if (error) {
            console.error('❌ Tenure error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Tenure calculated');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Tenure failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 4: LEAVE MANAGEMENT (SQL RPC)
// ================================================

/**
 * Check leave balance for employee
 * @param {string} employeeId - Employee UUID
 * @param {string} leaveTypeId - Leave type UUID
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: {total_days, used_days, remaining_days}, error: string|null }
 */
async function checkLeaveBalance(employeeId, leaveTypeId, year) {
    try {
        const { data, error } = await getDB()
            .rpc('check_leave_balance', {
                p_employee_id: employeeId,
                p_leave_type_id: leaveTypeId,
                p_year: year
            });
        
        if (error) {
            console.error('❌ Leave balance error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Leave balance checked');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Leave balance failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Deduct leave balance (after approval)
 * @param {string} employeeId - Employee UUID
 * @param {string} leaveTypeId - Leave type UUID
 * @param {number} daysToDeduct - Number of days to deduct
 * @param {number} year - Year (e.g., 2025)
 * @returns {Object} { data: {success, message, new_balance}, error: string|null }
 */
async function deductLeaveBalance(employeeId, leaveTypeId, daysToDeduct, year) {
    try {
        const { data, error } = await getDB()
            .rpc('deduct_leave_balance', {
                p_employee_id: employeeId,
                p_leave_type_id: leaveTypeId,
                p_days_to_deduct: daysToDeduct,
                p_year: year
            });
        
        if (error) {
            console.error('❌ Deduct leave error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Leave balance deducted');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Deduct leave failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 5: DEPARTMENT & POSITION (SQL RPC)
// ================================================

/**
 * Get all employees in a department
 * @param {string} departmentId - Department UUID
 * @returns {Object} { data: [...employees...], error: string|null }
 */
async function getDepartmentEmployees(departmentId) {
    try {
        const { data, error } = await getDB()
            .rpc('get_department_employees', {
                p_department_id: departmentId
            });
        
        if (error) {
            console.error('❌ Department employees error:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Retrieved ${data.length} dept employees`);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Department employees failed:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get salary range and statistics for a position
 * @param {string} positionId - Position UUID
 * @returns {Object} { data: {min_salary, max_salary, avg_salary, employee_count}, error: string|null }
 */
async function getPositionSalaryRange(positionId) {
    try {
        const { data, error } = await getDB()
            .rpc('get_position_salary_range', {
                p_position_id: positionId
            });
        
        if (error) {
            console.error('❌ Salary range error:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Salary range retrieved');
        return { data: data[0], error: null };
        
    } catch (error) {
        console.error('❌ Salary range failed:', error);
        return { data: null, error: error.message };
    }
}

// ================================================
// SECTION 6: DASHBOARD STATISTICS
// ================================================

/**
 * Get dashboard statistics (employees, attendance, leaves, payroll)
 * @returns {Object} { success: boolean, data: {...stats...}, error: string|null }
 */
async function getDashboardStats() {
    try {
        const db = getDB();
        
        // Total active employees
        const { count: totalEmployees, error: empError } = await db
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        
        if (empError) throw empError;
        
        // Today's attendance
        const today = new Date().toISOString().split('T')[0];
        const { count: todayAttendance, error: attError } = await db
            .from('attendances')
            .select('*', { count: 'exact', head: true })
            .eq('attendance_date', today)
            .neq('attendance_status', 'Absent');
        
        if (attError) throw attError;
        
        // Pending leave requests
        const { count: pendingLeaves, error: leaveError } = await db
            .from('leave_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending');
        
        if (leaveError) throw leaveError;
        
        // Current month payroll
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        const { data: payrollData, error: payrollError } = await db
            .from('payroll_periods')
            .select('status, total_employees, total_net_salary')
            .eq('year', currentYear)
            .eq('month', currentMonth)
            .maybeSingle();
        
        console.log('✅ Dashboard stats retrieved');
        
        return {
            success: true,
            data: {
                totalEmployees: totalEmployees || 0,
                todayAttendance: todayAttendance || 0,
                pendingLeaves: pendingLeaves || 0,
                payrollStatus: payrollData?.status || 'Not Created',
                payrollEmployees: payrollData?.total_employees || 0,
                payrollTotal: payrollData?.total_net_salary || 0
            },
            error: null
        };
        
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        return { success: false, data: null, error: error.message };
    }
}

/**
 * Get recent activities (attendance & leaves)
 * @param {number} limit - Number of records to fetch (default: 10)
 * @returns {Object} { success: boolean, data: {attendances, leaves}, error: string|null }
 */
async function getRecentActivities(limit = 10) {
    try {
        const db = getDB();
        
        // Recent attendance
        const { data: attendances, error: attError } = await db
            .from('attendances')
            .select(`
                id,
                attendance_date,
                check_in_time,
                check_out_time,
                attendance_status,
                employees!inner(
                    full_name,
                    employee_code
                )
            `)
            .order('attendance_date', { ascending: false })
            .order('check_in_time', { ascending: false })
            .limit(limit);
        
        if (attError) throw attError;
        
        // Recent leaves
        const { data: leaves, error: leaveError } = await db
            .from('leave_requests')
            .select(`
                id,
                start_date,
                end_date,
                leave_type,
                status,
                created_at,
                employees!inner(
                    full_name,
                    employee_code
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (leaveError) throw leaveError;
        
        console.log('✅ Recent activities retrieved');
        
        return {
            success: true,
            data: {
                attendances: attendances || [],
                leaves: leaves || []
            },
            error: null
        };
        
    } catch (error) {
        console.error('❌ Recent activities error:', error);
        return { success: false, data: null, error: error.message };
    }
}

// ================================================
// SECTION 7: DEPARTMENTS CRUD
// ================================================

/**
 * Get all active departments
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getAllDepartments() {
    try {
        const { data, error } = await getDB()
            .from('departments')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;

        console.log(`✅ Retrieved ${data?.length || 0} departments`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get departments error:', error);
        return { data: null, error };
    }
}

/**
 * Get department by ID
 * @param {string} departmentId - Department UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function getDepartmentById(departmentId) {
    try {
        if (!departmentId) {
            throw new Error('Department ID is required');
        }

        const { data, error } = await getDB()
            .from('departments')
            .select('*')
            .eq('id', departmentId)
            .single();

        if (error) throw error;

        console.log(`✅ Department retrieved: ${data.name}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get department error:', error);
        return { data: null, error };
    }
}

/**
 * Create new department
 * @param {Object} departmentData - Department data object
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function createDepartment(departmentData) {
    try {
        if (!departmentData.name) {
            throw new Error('Department name is required');
        }

        const { data, error } = await getDB()
            .from('departments')
            .insert([departmentData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Department created: ${data.name}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Create department error:', error);
        return { data: null, error };
    }
}

/**
 * Update department
 * @param {string} departmentId - Department UUID
 * @param {Object} departmentData - Department data to update
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function updateDepartment(departmentId, departmentData) {
    try {
        if (!departmentId) {
            throw new Error('Department ID is required');
        }

        const { data, error } = await getDB()
            .from('departments')
            .update(departmentData)
            .eq('id', departmentId)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Department updated: ${departmentId}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Update department error:', error);
        return { data: null, error };
    }
}

/**
 * Delete department
 * @param {string} departmentId - Department UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function deleteDepartment(departmentId) {
    try {
        if (!departmentId) {
            throw new Error('Department ID is required');
        }

        const { data, error } = await getDB()
            .from('departments')
            .delete()
            .eq('id', departmentId)
            .select()
            .single();

        if (error) throw error;

        console.log(`🗑️ Department deleted: ${departmentId}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Delete department error:', error);
        return { data: null, error };
    }
}

// ================================================
// SECTION 8: DIVISIONS CRUD
// ================================================

/**
 * Get all active divisions
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getAllDivisions() {
    try {
        const { data, error } = await getDB()
            .from('divisions')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;

        console.log(`✅ Retrieved ${data?.length || 0} divisions`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get divisions error:', error);
        return { data: null, error };
    }
}

/**
 * Get division by ID
 * @param {string} divisionId - Division UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function getDivisionById(divisionId) {
    try {
        if (!divisionId) {
            throw new Error('Division ID is required');
        }

        const { data, error } = await getDB()
            .from('divisions')
.select('*')
            .eq('id', divisionId)
            .single();

        if (error) throw error;

        console.log(`✅ Division retrieved: ${data.name}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get division error:', error);
        return { data: null, error };
    }
}

/**
 * Create new division
 * @param {Object} divisionData - Division data object
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function createDivision(divisionData) {
    try {
        if (!divisionData.name) {
            throw new Error('Division name is required');
        }

        const { data, error } = await getDB()
            .from('divisions')
            .insert([divisionData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Division created: ${data.name}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Create division error:', error);
        return { data: null, error };
    }
}

/**
 * Update division
 * @param {string} divisionId - Division UUID
 * @param {Object} divisionData - Division data to update
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function updateDivision(divisionId, divisionData) {
    try {
        if (!divisionId) {
            throw new Error('Division ID is required');
        }

        const { data, error } = await getDB()
            .from('divisions')
            .update(divisionData)
            .eq('id', divisionId)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Division updated: ${divisionId}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Update division error:', error);
        return { data: null, error };
    }
}

/**
 * Delete division
 * @param {string} divisionId - Division UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function deleteDivision(divisionId) {
    try {
        if (!divisionId) {
            throw new Error('Division ID is required');
        }

        const { data, error } = await getDB()
            .from('divisions')
            .delete()
            .eq('id', divisionId)
            .select()
            .single();

        if (error) throw error;

        console.log(`🗑️ Division deleted: ${divisionId}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Delete division error:', error);
        return { data: null, error };
    }
}

// ================================================
// SECTION 9: POSITIONS CRUD
// ================================================

/**
 * Get all active positions
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getAllPositions() {
    try {
        const { data, error } = await getDB()
            .from('positions')
            .select('*')
            .eq('is_active', true)
            .order('title', { ascending: true });

        if (error) throw error;

        console.log(`✅ Retrieved ${data?.length || 0} positions`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get positions error:', error);
        return { data: null, error };
    }
}

/**
 * Get position by ID
 * @param {string} positionId - Position UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function getPositionById(positionId) {
    try {
        if (!positionId) {
            throw new Error('Position ID is required');
        }

        const { data, error } = await getDB()
            .from('positions')
            .select('*')
            .eq('id', positionId)
            .single();

        if (error) throw error;

        console.log(`✅ Position retrieved: ${data.title}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get position error:', error);
        return { data: null, error };
    }
}

/**
 * Create new position
 * @param {Object} positionData - Position data object
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function createPosition(positionData) {
    try {
        if (!positionData.code) {
            throw new Error('Position code is required');
        }
        if (!positionData.title) {
            throw new Error('Position title is required');
        }

        const { data, error } = await getDB()
            .from('positions')
            .insert([positionData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Position created: ${data.title}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Create position error:', error);
        return { data: null, error };
    }
}

/**
 * Update position
 * @param {string} positionId - Position UUID
 * @param {Object} positionData - Position data to update
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function updatePosition(positionId, positionData) {
    try {
        if (!positionId) {
            throw new Error('Position ID is required');
        }

        const updateData = {
            ...positionData,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await getDB()
            .from('positions')
            .update(updateData)
            .eq('id', positionId)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Position updated: ${positionId}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Update position error:', error);
        return { data: null, error };
    }
}

/**
 * Delete position
 * @param {string} positionId - Position UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function deletePosition(positionId) {
    try {
        if (!positionId) {
            throw new Error('Position ID is required');
        }

        const { data, error } = await getDB()
            .from('positions')
            .delete()
            .eq('id', positionId)
            .select()
            .single();

        if (error) throw error;

        console.log(`🗑️ Position deleted: ${positionId}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Delete position error:', error);
        return { data: null, error };
    }
}

// ================================================
// SECTION 10: PTKP CRUD
// ================================================

/**
 * Get all active PTKP categories
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getAllPTKP() {
    try {
        const { data, error } = await getDB()
            .from('ptkp_categories')
            .select('*')
            .eq('is_active', true)
            .order('code', { ascending: true });

        if (error) throw error;

        console.log(`✅ Retrieved ${data?.length || 0} PTKP categories`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get PTKP error:', error);
        return { data: null, error };
    }
}

/**
 * Get PTKP by ID
 * @param {string} ptkpId - PTKP UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function getPTKPById(ptkpId) {
    try {
        if (!ptkpId) {
            throw new Error('PTKP ID is required');
        }

        const { data, error } = await getDB()
            .from('ptkp_categories')
            .select('*')
            .eq('id', ptkpId)
            .single();

        if (error) throw error;

        console.log(`✅ PTKP retrieved: ${data.code}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get PTKP error:', error);
        return { data: null, error };
    }
}

/**
 * Create new PTKP
 * @param {Object} ptkpData - PTKP data object
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function createPTKP(ptkpData) {
    try {
        if (!ptkpData.code) {
            throw new Error('PTKP code is required');
        }
        if (!ptkpData.description) {
            throw new Error('PTKP description is required');
        }
        if (!ptkpData.annual_amount) {
            throw new Error('PTKP annual amount is required');
        }
        if (!ptkpData.effective_year) {
            throw new Error('PTKP effective year is required');
        }

        const { data, error } = await getDB()
            .from('ptkp_categories')
            .insert([ptkpData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ PTKP created: ${data.code}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Create PTKP error:', error);
        return { data: null, error };
    }
}

/**
 * Update PTKP
 * @param {string} ptkpId - PTKP UUID
 * @param {Object} ptkpData - PTKP data to update
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function updatePTKP(ptkpId, ptkpData) {
    try {
        if (!ptkpId) {
            throw new Error('PTKP ID is required');
        }

        const { data, error } = await getDB()
            .from('ptkp_categories')
            .update(ptkpData)
            .eq('id', ptkpId)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ PTKP updated: ${ptkpId}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Update PTKP error:', error);
        return { data: null, error };
    }
}

/**
 * Delete PTKP
 * @param {string} ptkpId - PTKP UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function deletePTKP(ptkpId) {
    try {
        if (!ptkpId) {
            throw new Error('PTKP ID is required');
        }

        const { data, error } = await getDB()
            .from('ptkp_categories')
            .delete()
            .eq('id', ptkpId)
            .select()
            .single();

        if (error) throw error;

        console.log(`🗑️ PTKP deleted: ${ptkpId}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Delete PTKP error:', error);
        return { data: null, error };
    }
}

/**
 * Get PTKP by effective year
 * @param {number} year - Effective year
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getPTKPByYear(year) {
    try {
        if (!year) {
            throw new Error('Year is required');
        }

        const { data, error } = await getDB()
            .from('ptkp_categories')
            .select('*')
            .eq('is_active', true)
            .eq('effective_year', year)
            .order('code', { ascending: true });

        if (error) throw error;

        console.log(`✅ Retrieved ${data?.length || 0} PTKP for year ${year}`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get PTKP by year error:', error);
        return { data: null, error };
    }
}

// ================================================
// SECTION 11: EMPLOYEE CRUD (Enhanced)
// ================================================

/**
 * Create new employee
 * @param {Object} employeeData - Employee data object
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function createEmployee(employeeData) {
    try {
        console.log('📝 Creating employee:', employeeData.full_name);
        
        // Ensure all fields are present
        const dataToInsert = {
            employee_code: employeeData.employee_code,
            full_name: employeeData.full_name,
            department_id: employeeData.department_id,
            division_id: employeeData.division_id,
            position_id: employeeData.position_id,
            position_custom: employeeData.position_custom,
            nik: employeeData.nik,
            email: employeeData.email,
            birth_place: employeeData.birth_place,
            birth_date: employeeData.birth_date,
            phone: employeeData.phone,
            gender: employeeData.gender,
            mother_maiden_name: employeeData.mother_maiden_name,
            ktp_address: employeeData.ktp_address,
            current_address: employeeData.current_address,
            bank_name: employeeData.bank_name,
            bank_account_number: employeeData.bank_account_number,
            bank_account_name: employeeData.bank_account_name,
            employment_status: employeeData.employment_status,
            ptkp_id: employeeData.ptkp_id,
            join_date: employeeData.join_date,
            resign_date: employeeData.resign_date,
            is_resigned: employeeData.is_resigned || false,
            is_active: employeeData.is_active !== false
        };
        
        const { data, error } = await getDB()
            .from('employees')
            .insert([dataToInsert])
            .select(`
                *,
                departments (id, name, code),
                divisions (id, name, code),
                positions (id, title, code),
                ptkp_categories (id, code, description, annual_amount)
            `);
        
        if (error) throw error;
        
        console.log('✅ Employee created:', data[0]?.employee_code);
        return { data: data?.[0] || null, error: null };
        
    } catch (error) {
        console.error('❌ Create employee error:', error);
        return { data: null, error };
    }
}

/**
 * Update employee
 * @param {string} id - Employee UUID
 * @param {Object} employeeData - Employee data to update
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function updateEmployee(id, employeeData) {
    try {
        console.log('📝 Updating employee:', id);
        
        const { data, error } = await getDB()
            .from('employees')
            .update(employeeData)
            .eq('id', id)
            .select(`
                *,
                departments (id, name, code),
                divisions (id, name, code),
                positions (id, title, code),
                ptkp_categories (id, code, description, annual_amount)
            `);
        
        if (error) throw error;
        
        console.log('✅ Employee updated:', id);
        return { data: data?.[0] || null, error: null };
        
    } catch (error) {
        console.error('❌ Update employee error:', error);
        return { data: null, error };
    }
}

// ================================================
// SECTION 12: ADVANCED CONTRACT QUERIES
// ================================================
// ⚠️ NOTE: Basic contract CRUD is in api.js
// This section provides ADVANCED queries only

/**
 * Get active contract for employee
 * @param {string} employeeId - Employee UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
async function getActiveContract(employeeId) {
    try {
        if (!employeeId) {
            throw new Error('Employee ID is required');
        }

        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await getDB()
            .from('contract_history')
            .select('*')
            .eq('employee_id', employeeId)
            .lte('start_date', today)
            .or(`end_date.gte.${today},end_date.is.null`)
            .order('start_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        console.log(`✅ Active contract:`, data ? 'Found' : 'None');
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get active contract error:', error);
        return { data: null, error };
    }
}

/**
 * Get contracts expiring soon (within specified days)
 * @param {number} days - Number of days to check (default: 30)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getExpiringContracts(days = 30) {
    try {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        
        const todayStr = today.toISOString().split('T')[0];
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        const { data, error } = await getDB()
            .from('contract_history')
            .select(`
                *,
                employees:employee_id (
                    id,
                    full_name,
                    employee_code,
                    email
                )
            `)
            .gte('end_date', todayStr)
            .lte('end_date', futureDateStr)
            .order('end_date', { ascending: true });

        if (error) throw error;

        console.log(`⚠️ ${data?.length || 0} contracts expiring in ${days} days`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get expiring contracts error:', error);
        return { data: null, error };
    }
}

// ================================================
// SECTION 13: ADVANCED WARNING LETTER QUERIES
// ================================================
// ⚠️ NOTE: Basic warning CRUD is in api.js
// This section provides ADVANCED queries only

/**
 * Get active warning letters for employee
 * @param {string} employeeId - Employee UUID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getActiveWarningLetters(employeeId) {
    try {
        if (!employeeId) {
            throw new Error('Employee ID is required');
        }

        const { data, error } = await getDB()
            .from('warning_letters')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('status', 'Active')
            .order('issue_date', { ascending: false });

        if (error) throw error;

        console.log(`⚠️ ${data?.length || 0} active warnings`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get active warnings error:', error);
        return { data: null, error };
    }
}

/**
 * Get all active warning letters (company-wide)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getAllActiveWarningLetters() {
    try {
        const { data, error } = await getDB()
            .from('warning_letters')
            .select(`
                *,
                employees:employee_id (
                    id,
                    full_name,
                    employee_code,
                    email,
                    departments (
                        id,
                        name
                    )
                )
            `)
            .eq('status', 'Active')
            .order('issue_date', { ascending: false });

        if (error) throw error;

        console.log(`⚠️ ${data?.length || 0} active warnings company-wide`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get all active warnings error:', error);
        return { data: null, error };
    }
}

/**
 * Get warning letters requiring follow-up
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
async function getWarningLettersRequiringFollowUp() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await getDB()
            .from('warning_letters')
            .select(`
                *,
                employees:employee_id (
                    id,
                    full_name,
                    employee_code,
                    email
                )
            `)
            .eq('status', 'Active')
            .not('follow_up_date', 'is', null)
            .lte('follow_up_date', today)
            .order('follow_up_date', { ascending: true });

        if (error) throw error;

        console.log(`📋 ${data?.length || 0} warnings need follow-up`);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Get follow-up warnings error:', error);
        return { data: null, error };
    }
}

/**
 * Get warning letter statistics for employee
 * @param {string} employeeId - Employee UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function getWarningLetterStats(employeeId) {
    try {
        if (!employeeId) {
            throw new Error('Employee ID is required');
        }

        // Get all warning letters
        const { data: allWarnings, error: allError } = await getDB()
            .from('warning_letters')
            .select('warning_level, status')
            .eq('employee_id', employeeId);

        if (allError) throw allError;

        // Calculate statistics
        const stats = {
            total: allWarnings?.length || 0,
            active: allWarnings?.filter(w => w.status === 'Active').length || 0,
            resolved: allWarnings?.filter(w => w.status === 'Resolved').length || 0,
            sp1: allWarnings?.filter(w => w.warning_level === '1').length || 0,
            sp2: allWarnings?.filter(w => w.warning_level === '2').length || 0,
            sp3: allWarnings?.filter(w => w.warning_level === '3').length || 0,
            highestLevel: 0
        };

        // Determine highest active warning level
        const activeWarnings = allWarnings?.filter(w => w.status === 'Active') || [];
        if (activeWarnings.length > 0) {
            const levels = activeWarnings.map(w => parseInt(w.warning_level));
            stats.highestLevel = Math.max(...levels);
        }

        console.log(`📊 Warning stats calculated`);
        return { data: stats, error: null };

    } catch (error) {
        console.error('❌ Get warning stats error:', error);
        return { data: null, error };
    }
}

// ================================================
// SECTION 14: COMPREHENSIVE EMPLOYEE DATA
// ================================================

/**
 * Get comprehensive employee data (employee + contracts + warnings)
 * @param {string} employeeId - Employee UUID
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
async function getEmployeeCompleteData(employeeId) {
    try {
        if (!employeeId) {
            throw new Error('Employee ID is required');
        }

        console.log(`📦 Fetching complete data for ${employeeId}...`);

        // Fetch all data in parallel
        const [
            employeeResult,
            contractsResult,
            warningsResult,
            activeContractResult,
            warningStatsResult
        ] = await Promise.all([
            getEmployeeById(employeeId),
            getContractHistory(employeeId),
            window.getWarningLetters(employeeId), // Use api.js function
            getActiveContract(employeeId),
            getWarningLetterStats(employeeId)
        ]);

        // Check for errors
        if (employeeResult.error) throw employeeResult.error;

        // Combine all data
        const completeData = {
            employee: employeeResult.data,
            contracts: {
                all: contractsResult.data || [],
                active: activeContractResult.data || null,
                total: contractsResult.data?.length || 0
            },
            warnings: {
                all: warningsResult.data || [],
                stats: warningStatsResult.data || {},
                total: warningsResult.data?.length || 0
            }
        };

        console.log(`✅ Complete data retrieved`);
        return { data: completeData, error: null };

    } catch (error) {
        console.error('❌ Get complete data error:', error);
        return { data: null, error };
    }
}

// ================================================
// EXPOSE FUNCTIONS TO WINDOW (Global Access)
// ================================================

// Section 1: Attendance Calculations (SQL RPC)
window.calculateLateMinutes = calculateLateMinutes;
window.calculateOvertimeHours = calculateOvertimeHours;
window.generateAttendanceSummary = generateAttendanceSummary;

// Section 2: Payroll Calculations (SQL RPC)
window.calculateGrossSalary = calculateGrossSalary;
window.calculateBPJSKesehatan = calculateBPJSKesehatan;
window.calculateBPJSKetenagakerjaan = calculateBPJSKetenagakerjaan;
window.calculatePPh21 = calculatePPh21;
window.calculateNetSalary = calculateNetSalary;
window.generateMonthlyPayrollReport = generateMonthlyPayrollReport;

// Section 3: Employee Management (SQL RPC)
window.getEmployeeFullDetails = getEmployeeFullDetails;
window.calculateEmployeeTenure = calculateEmployeeTenure;

// Section 4: Leave Management (SQL RPC)
window.checkLeaveBalance = checkLeaveBalance;
window.deductLeaveBalance = deductLeaveBalance;

// Section 5: Department & Position (SQL RPC)
window.getDepartmentEmployees = getDepartmentEmployees;
window.getPositionSalaryRange = getPositionSalaryRange;

// Section 6: Dashboard Statistics
window.getDashboardStats = getDashboardStats;
window.getRecentActivities = getRecentActivities;

// Section 7: Departments CRUD
window.getAllDepartments = getAllDepartments;
window.getDepartmentById = getDepartmentById;
window.createDepartment = createDepartment;
window.updateDepartment = updateDepartment;
window.deleteDepartment = deleteDepartment;

// Section 8: Divisions CRUD
window.getAllDivisions = getAllDivisions;
window.getDivisionById = getDivisionById;
window.createDivision = createDivision;
window.updateDivision = updateDivision;
window.deleteDivision = deleteDivision;

// Section 9: Positions CRUD
window.getAllPositions = getAllPositions;
window.getPositionById = getPositionById;
window.createPosition = createPosition;
window.updatePosition = updatePosition;
window.deletePosition = deletePosition;

// Section 10: PTKP CRUD
window.getAllPTKP = getAllPTKP;
window.getPTKPById = getPTKPById;
window.createPTKP = createPTKP;
window.updatePTKP = updatePTKP;
window.deletePTKP = deletePTKP;
window.getPTKPByYear = getPTKPByYear;

// Section 11: Employee CRUD (Enhanced)
window.createEmployee = createEmployee;
window.updateEmployee = updateEmployee;

// Section 12: Advanced Contract Queries
window.getActiveContract = getActiveContract;
window.getExpiringContracts = getExpiringContracts;

// Section 13: Advanced Warning Queries
window.getActiveWarningLetters = getActiveWarningLetters;
window.getAllActiveWarningLetters = getAllActiveWarningLetters;
window.getWarningLettersRequiringFollowUp = getWarningLettersRequiringFollowUp;
window.getWarningLetterStats = getWarningLetterStats;

// Section 14: Comprehensive Data
window.getEmployeeCompleteData = getEmployeeCompleteData;

// ================================================
// INITIALIZATION
// ================================================

console.log('✅ DATABASE-FUNCTIONS.js v2.0 - CLEANED & ORGANIZED');
console.log('📦 Loaded Sections:');
console.log('   1️⃣  Attendance Calculations (3 SQL RPC)');
console.log('   2️⃣  Payroll Calculations (6 SQL RPC)');
console.log('   3️⃣  Employee Management (2 SQL RPC)');
console.log('   4️⃣  Leave Management (2 SQL RPC)');
console.log('   5️⃣  Dept & Position (2 SQL RPC)');
console.log('   6️⃣  Dashboard Stats (2 functions)');
console.log('   7️⃣  Departments CRUD (5 functions)');
console.log('   8️⃣  Divisions CRUD (5 functions)');
console.log('   9️⃣  Positions CRUD (5 functions)');
console.log('   🔟  PTKP CRUD (6 functions)');
console.log('   1️⃣1️⃣  Employee CRUD Enhanced (2 functions)');
console.log('   1️⃣2️⃣  Advanced Contract Queries (2 functions)');
console.log('   1️⃣3️⃣  Advanced Warning Queries (4 functions)');
console.log('   1️⃣4️⃣  Comprehensive Data (1 functions)');
console.log('📊 Total: 47 functions ready');