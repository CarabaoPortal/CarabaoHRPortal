// ================================================
// SWAP HRIS - SETTINGS MODULE
// settings.js - Version 2.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires app.js, api.js
// ⚠️ PROVIDES: Settings page functionality (tabs, password, company profile)

(() => {
    "use strict";

    // ================================================
    // SECTION 1: HELPER FUNCTIONS
    // ================================================

    /**
     * Show toast notification (with fallback to alert)
     * @param {string} msg - Message to display
     * @param {string} type - Type: success, error, warning, info
     */
    const toast = (msg, type = "info") => {
        if (typeof window.showToast === "function") {
            return window.showToast(msg, type);
        }
        alert(msg);
    };

    /**
     * Quick getElementById shorthand
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    const $ = (id) => document.getElementById(id);

    /**
     * Get trimmed value from input element
     * @param {string} id - Element ID
     * @returns {string}
     */
    const val = (id) => $(id)?.value?.trim() ?? "";

    /**
     * Set value to input element
     * @param {string} id - Element ID
     * @param {string} v - Value to set
     */
    const setVal = (id, v) => {
        const node = $(id);
        if (node) node.value = v ?? "";
    };

    // ================================================
    // SECTION 2: TAB MANAGEMENT
    // ================================================

    /**
     * Switch between settings tabs
     * @param {string} tabKeyOrId - Tab key (e.g., "account") or full ID (e.g., "content-account")
     */
    function switchTab(tabKeyOrId) {
        // Map short keys to full IDs
        const map = {
            account: "content-account",
            company: "content-company"
        };

        // Convert if needed
        const tabId = map[tabKeyOrId] || tabKeyOrId;

        // Hide all tabs
        document.querySelectorAll(".tab-content").forEach((content) => {
            content.classList.add("hidden");
        });

        // Show target tab
        const target = $(tabId);
        if (target) {
            target.classList.remove("hidden");
        } else {
            console.warn(`⚠️ Tab not found: ${tabId}`);
            return;
        }

        // Update button active states
        document.querySelectorAll("[data-tab-target]").forEach((btn) => {
            const btnTarget = btn.getAttribute("data-tab-target");
            const isActive = btnTarget === tabId || btnTarget === tabKeyOrId;

            // Active styles
            btn.classList.toggle("text-primary-600", isActive);
            btn.classList.toggle("border-primary-600", isActive);
            btn.classList.toggle("border-b-2", isActive);
            btn.classList.toggle("font-semibold", isActive);

            // Inactive styles
            btn.classList.toggle("text-gray-500", !isActive);
            btn.classList.toggle("border-transparent", !isActive);
        });

        console.log(`📑 Tab switched: ${tabKeyOrId} → ${tabId}`);
    }

    /**
     * Initialize tab click handlers
     */
    function initTabs() {
        document.querySelectorAll("[data-tab-target]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const target = btn.getAttribute("data-tab-target");
                switchTab(target);
            });
        });

        // Show Account tab by default
        switchTab("content-account");
        console.log("✅ Tabs initialized");
    }

    // ================================================
    // SECTION 3: PASSWORD MANAGEMENT
    // ================================================

    /**
     * Toggle password field visibility
     * @param {string} fieldId - Password field element ID
     */
    function togglePassword(fieldId) {
        const field = $(fieldId);
        if (!field) return;

        const isHidden = field.type === "password";
        field.type = isHidden ? "text" : "password";

        // Toggle eye icon
        const icon = field.parentElement?.querySelector("i");
        if (icon) {
            icon.classList.toggle("fa-eye", !isHidden);
            icon.classList.toggle("fa-eye-slash", isHidden);
        }
    }

    /**
     * Handle password change form submission
     * @param {Event} e - Submit event
     */
    async function handlePasswordChange(e) {
        e.preventDefault();

        const current = val("current_password");
        const newPwd = val("new_password");
        const confirm = val("confirm_password");

        // Validation
        if (!current) {
            return toast("Please enter your current password.", "error");
        }

        if (!newPwd || newPwd.length < 8) {
            return toast("New password must be at least 8 characters.", "error");
        }

        // Check password strength (uppercase, lowercase, number)
        if (!/[A-Z]/.test(newPwd) || !/[a-z]/.test(newPwd) || !/[0-9]/.test(newPwd)) {
            return toast("Password must contain uppercase, lowercase, and a number.", "error");
        }

        if (newPwd !== confirm) {
            return toast("Confirm password does not match.", "error");
        }

        try {
            // Update password using Supabase
            const { error } = await getDB().auth.updateUser({ password: newPwd });

            if (error) throw error;

            // Reset form
            $("password-form")?.reset();

            toast("Password updated successfully!", "success");
            console.log("✅ Password updated");

        } catch (err) {
            console.error("❌ Password update error:", err);
            toast(`Failed: ${err.message}`, "error");
        }
    }

    // ================================================
    // SECTION 4: COMPANY PROFILE MANAGEMENT
    // ================================================

    const COMPANY_TABLE = "company_settings";

    /**
     * Load company profile data from database
     */
    async function loadCompany() {
        try {
            const { data, error } = await getDB()
                .from(COMPANY_TABLE)
                .select("*")
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                console.log("ℹ️ No company data yet");
                return;
            }

            // Populate form fields
            setVal("company_name", data.company_name);
            setVal("company_industry", data.industry);
            setVal("company_size", data.company_size);
            setVal("company_address", data.address);
            setVal("company_phone", data.phone);
            setVal("company_email", data.email);
            setVal("company_website", data.website);
            setVal("company_logo_url", data.logo_url);

            // Show logo preview if exists
            if (data.logo_url) {
                const preview = $("logo-preview");
                if (preview) {
                    preview.innerHTML = `<img src="${data.logo_url}" alt="Company Logo" class="w-full h-full object-cover rounded-xl">`;
                }
            }

            console.log("✅ Company data loaded");

        } catch (err) {
            console.error("❌ Load company error:", err);
            toast("Failed to load company data", "error");
        }
    }

    /**
     * Save company profile data to database
     * @param {Event} e - Submit event
     */
    async function saveCompany(e) {
        e.preventDefault();

        const name = val("company_name");
        if (!name) {
            return toast("Company Name is required.", "error");
        }

        const payload = {
            company_name: name,
            industry: val("company_industry") || null,
            company_size: val("company_size") || null,
            address: val("company_address") || null,
            phone: val("company_phone") || null,
            email: val("company_email") || null,
            website: val("company_website") || null,
            logo_url: val("company_logo_url") || null,
            updated_at: new Date().toISOString()
        };

        try {
            const db = getDB();

            // Check if record exists
            const { data: existing } = await db
                .from(COMPANY_TABLE)
                .select("id")
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            let result;
            if (existing?.id) {
                // Update existing record
                result = await db
                    .from(COMPANY_TABLE)
                    .update(payload)
                    .eq("id", existing.id);
            } else {
                // Insert new record
                result = await db
                    .from(COMPANY_TABLE)
                    .insert(payload);
            }

            if (result.error) throw result.error;

            toast("Company settings saved!", "success");
            console.log("✅ Company settings saved");

        } catch (err) {
            console.error("❌ Save company error:", err);
            toast(`Failed: ${err.message}`, "error");
        }
    }

    // ================================================
    // SECTION 5: FORM INITIALIZATION
    // ================================================

    /**
     * Initialize all form event handlers
     */
    function initForms() {
        // Password form
        const pwdForm = $("password-form");
        if (pwdForm) {
            pwdForm.addEventListener("submit", handlePasswordChange);
            console.log("✅ Password form bound");
        } else {
            console.warn("⚠️ password-form not found");
        }

        // Company form
        const companyForm = $("company-form");
        if (companyForm) {
            companyForm.addEventListener("submit", saveCompany);
            console.log("✅ Company form bound");
        } else {
            console.warn("⚠️ company-form not found");
        }

        // Cancel button - reload company data
        document.querySelectorAll("[data-action='company-cancel']").forEach((btn) => {
            btn.addEventListener("click", async () => {
                await loadCompany();
                toast("Changes reverted.", "info");
            });
        });

        // Logo upload button
        $("btn-upload-logo")?.addEventListener("click", () => {
            $("logo-upload-input")?.click();
        });

        // Logo file input change
        $("logo-upload-input")?.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast("File too large. Maximum 2MB allowed.", "error");
                return;
            }

            // Preview image
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = $("logo-preview");
                if (preview) {
                    preview.innerHTML = `<img src="${ev.target.result}" alt="Logo Preview" class="w-full h-full object-cover rounded-xl">`;
                }
            };
            reader.readAsDataURL(file);
        });

        // Remove logo button
        $("btn-remove-logo")?.addEventListener("click", () => {
            const preview = $("logo-preview");
            if (preview) {
                preview.innerHTML = `<i class="fas fa-building text-white text-4xl"></i>`;
            }

            const logoInput = $("company_logo_url");
            if (logoInput) {
                logoInput.value = "";
            }

            toast("Logo removed.", "info");
        });

        console.log("✅ Form handlers initialized");
    }

    // ================================================
    // SECTION 6: MAIN INITIALIZATION
    // ================================================

    /**
     * Initialize settings page
     */
    async function initSettings() {
        console.log("⚙️ Initializing settings page...");

        // Initialize tabs
        initTabs();

        // Initialize form handlers
        initForms();

        // Load company data if Supabase available
        if (typeof window.getDB === "function") {
            await loadCompany();
        } else {
            console.warn("⚠️ getDB() not found. Database features disabled.");
        }

        console.log("✅ Settings page ready");
    }

    // ================================================
    // EXPOSE FUNCTIONS TO WINDOW (Global Access)
    // ================================================

    // Section 2: Tab Management
    window.switchTab = switchTab;

    // Section 3: Password Management
    window.togglePassword = togglePassword;

    // Section 4: Company Profile (read-only exposure)
    window.loadCompanySettings = loadCompany;
    window.saveCompanySettings = saveCompany;

    // ================================================
    // AUTO-INITIALIZE
    // ================================================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSettings);
    } else {
        initSettings();
    }

    // ================================================
    // INITIALIZATION LOG
    // ================================================

    console.log("✅ SETTINGS.js v2.0 - CLEANED & ORGANIZED");
    console.log("📦 Loaded Sections:");
    console.log("   1️⃣  Helper Functions (4 functions)");
    console.log("   2️⃣  Tab Management (2 functions)");
    console.log("   3️⃣  Password Management (2 functions)");
    console.log("   4️⃣  Company Profile (2 functions)");
    console.log("   5️⃣  Form Initialization (1 function)");
    console.log("   6️⃣  Main Initialization (1 function)");
    console.log("📊 Total: 12 functions (4 exposed globally)");

})();
