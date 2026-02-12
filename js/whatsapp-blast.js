// ================================================
// SWAP HRIS - WHATSAPP BLAST MODULE
// whatsapp-blast.js - Version 2.0 (AUDITED & ORGANIZED)
// ================================================

// ⚠️ DEPENDENCIES: Requires app.js, api.js, database-functions.js
// ⚠️ PROVIDES: WhatsApp bulk messaging with template management

(function () {
  'use strict';

  // ================================================
  // SECTION 1: STATE MANAGEMENT
  // ================================================

  /**
   * WhatsApp Blast module
   * @namespace WA
   */
  const WA = {
    /**
     * Application state
     * @type {Object}
     */
    state: {
      employees: [],
      filteredEmployees: [],
      templates: [],
      lastAppliedText: '',
      variables: { A: '', B: '', C: '', D: '' },
    },

    // ================================================
    // SECTION 2: DOM REFERENCES
    // ================================================

    /**
     * DOM element getters (lazy evaluation)
     * @type {Object}
     */
    DOM: {
      btnSidebar: () => document.getElementById('btnSidebar'),
      sidebar: () => document.getElementById('sidebar'),

      btnReloadEmployees: () => document.getElementById('btnReloadEmployees'),
      btnCopyAll: () => document.getElementById('btnCopyAll'),

      varA: () => document.getElementById('varA'),
      varB: () => document.getElementById('varB'),
      varC: () => document.getElementById('varC'),
      varD: () => document.getElementById('varD'),

      templateText: () => document.getElementById('templateText'),
      btnApply: () => document.getElementById('btnApply'),
      previewBubble: () => document.getElementById('previewBubble'),

      templateSelect: () => document.getElementById('templateSelect'),
      btnLoadTemplate: () => document.getElementById('btnLoadTemplate'),
      btnSaveTemplate: () => document.getElementById('btnSaveTemplate'),

      searchInput: () => document.getElementById('searchInput'),
      employeeCount: () => document.getElementById('employeeCount'),
      tbody: () => document.getElementById('employeeTbody'),
      checkAll: () => document.getElementById('checkAll'),

      toast: () => document.getElementById('toast'),
      toastInner: () => document.getElementById('toastInner'),
    },

    // ================================================
    // SECTION 3: UI HELPERS
    // ================================================

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Notification type (info|success|error|warning)
     */
    showToast(message, type = 'info') {
      const toast = this.DOM.toast();
      const inner = this.DOM.toastInner();
      if (!toast || !inner) return;

      const palette = {
        success: 'bg-emerald-600 text-white',
        error: 'bg-rose-600 text-white',
        warning: 'bg-amber-500 text-white',
        info: 'bg-gray-900 text-white',
      };

      inner.className = `px-4 py-3 rounded-lg shadow-lg text-sm ${palette[type] || palette.info}`;
      inner.textContent = message;

      toast.classList.remove('hidden');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 2200);
    },

    /**
     * Escape HTML special characters
     * @param {*} str - String to escape
     * @returns {string} Escaped HTML string
     */
    escapeHtml(str) {
      if (str === null || str === undefined) return '';
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    },

    // ================================================
    // SECTION 4: PHONE & MESSAGE UTILITIES
    // ================================================

    /**
     * Normalize phone number to international format
     * @param {string} phone - Phone number to normalize
     * @returns {string} Normalized phone number (62xxx format)
     */
    normalizePhone(phone) {
      if (!phone) return '';
      const digits = String(phone).replace(/\D/g, '');
      if (!digits) return '';
      if (digits.startsWith('0')) return '62' + digits.slice(1);
      if (digits.startsWith('62')) return digits;
      // Assume Indonesia if starts with 8
      if (digits.startsWith('8')) return '62' + digits;
      return digits;
    },

    /**
     * Encode text for WhatsApp URL
     * @param {string} text - Text to encode
     * @returns {string} URL-encoded text
     */
    encodeWaText(text) {
      return encodeURIComponent(text || '');
    },

    /**
     * Generate WhatsApp Web link
     * @param {string} phone - Phone number
     * @param {string} text - Message text
     * @returns {string} WhatsApp Web URL
     */
    waLink(phone, text) {
      const p = this.normalizePhone(phone);
      const t = this.encodeWaText(text);
      if (!p) return '';
      return `https://web.whatsapp.com/send?phone=${p}&text=${t}`;
    },

    // ================================================
    // SECTION 5: TEMPLATE VARIABLE HANDLING
    // ================================================

    /**
     * Read variable values from UI inputs
     */
    readVariablesFromUI() {
      this.state.variables = {
        A: this.DOM.varA()?.value ?? '',
        B: this.DOM.varB()?.value ?? '',
        C: this.DOM.varC()?.value ?? '',
        D: this.DOM.varD()?.value ?? '',
      };
    },

    /**
     * Substitute template variables with actual values
     * @param {string} template - Template string with placeholders
     * @param {Object} employee - Employee data object
     * @returns {string} Substituted message
     */
    substitute(template, employee) {
      const v = this.state.variables;
      const safe = (x) => (x === null || x === undefined) ? '' : String(x);

      const map = {
        '{A}': safe(v.A),
        '{B}': safe(v.B),
        '{C}': safe(v.C),
        '{D}': safe(v.D),
        '{nama}': safe(employee.name),
        '{telepon}': safe(employee.phone),
        '{email}': safe(employee.email),
      };

      let out = template || '';
      // Replace all keys (simple, deterministic)
      Object.keys(map).forEach((k) => {
        out = out.split(k).join(map[k]);
      });
      return out;
    },

    // ================================================
    // SECTION 6: DATA LOADING
    // ================================================

    /**
     * Load employees from database
     * @async
     * @returns {Promise<void>}
     */
    async loadEmployees() {
      try {
        console.log('📂 Loading employees...');

        const { data, error } = await getDB()
          .from('employees')
          .select('id, employee_no, name, phone, email')
          .order('name', { ascending: true });

        if (error) throw error;

        this.state.employees = (data || []).map((e) => ({
          id: e.id,
          employeeNo: e.employee_no || '',
          name: e.name || '',
          phone: e.phone || '',
          email: e.email || '',
          selected: false,
        }));

        console.log(`✅ Loaded ${this.state.employees.length} employees`);

        this.applyFilterAndRender();
        this.updatePreview();
        this.showToast('Karyawan berhasil dimuat', 'success');
      } catch (err) {
        console.error('❌ loadEmployees error:', err);
        this.state.employees = [];
        this.applyFilterAndRender();
        this.showToast('Gagal memuat data karyawan', 'error');
      }
    },

    /**
     * Load message templates from database
     * @async
     * @returns {Promise<void>}
     */
    async loadTemplates() {
      try {
        console.log('📋 Loading templates...');

        const { data, error } = await getDB()
          .from('whatsapp_templates')
          .select('id, template_name, message_body, is_active')
          .eq('is_active', true)
          .order('template_name', { ascending: true });

        if (error) throw error;

        this.state.templates = data || [];
        console.log(`✅ Loaded ${this.state.templates.length} templates`);

        this.renderTemplateSelect();
      } catch (err) {
        console.error('❌ loadTemplates error:', err);
        this.state.templates = [];
        this.renderTemplateSelect();
      }
    },

    /**
     * Render template dropdown options
     */
    renderTemplateSelect() {
      const sel = this.DOM.templateSelect();
      if (!sel) return;

      sel.innerHTML = `<option value="">— Load Template —</option>`;
      this.state.templates.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = String(t.id);
        opt.textContent = t.template_name || `Template ${t.id}`;
        sel.appendChild(opt);
      });
    },

    // ================================================
    // SECTION 7: FILTERING & SEARCH
    // ================================================

    /**
     * Apply search filter and render table
     */
    applyFilterAndRender() {
      const q = (this.DOM.searchInput()?.value || '').trim().toLowerCase();
      
      if (!q) {
        this.state.filteredEmployees = [...this.state.employees];
      } else {
        this.state.filteredEmployees = this.state.employees.filter((e) => {
          return (
            (e.name || '').toLowerCase().includes(q) ||
            (e.phone || '').toLowerCase().includes(q) ||
            (e.employeeNo || '').toLowerCase().includes(q)
          );
        });
      }
      
      console.log(`🔍 Filtered: ${this.state.filteredEmployees.length} / ${this.state.employees.length} employees`);
      
      this.renderTable();
      this.updateCount();
    },

    /**
     * Update employee count display
     */
    updateCount() {
      const el = this.DOM.employeeCount();
      if (!el) return;
      el.textContent = `${this.state.filteredEmployees.length} karyawan`;
    },

    // ================================================
    // SECTION 8: TABLE RENDERING
    // ================================================

    /**
     * Render employee table with WhatsApp links
     */
    renderTable() {
      const tbody = this.DOM.tbody();
      if (!tbody) return;

      const template = this.DOM.templateText()?.value || '';
      this.readVariablesFromUI();

      if (this.state.filteredEmployees.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="px-4 py-6 text-center text-gray-500">
              Tidak ada data
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = this.state.filteredEmployees.map((e) => {
        const message = this.substitute(template, e);
        const link = this.waLink(e.phone, message);
        const phoneNorm = this.normalizePhone(e.phone);

        const disabled = (!phoneNorm || !template.trim());
        const btnClass = disabled
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white';

        const btnTitle = !template.trim()
          ? 'Isi template dulu'
          : (!phoneNorm ? 'Nomor WA kosong/tidak valid' : 'Buka WhatsApp Web');

        return `
          <tr class="hover:bg-gray-50 align-top">
            <td class="px-4 py-3">
              <input type="checkbox" class="row-check rounded border-gray-300"
                data-emp-id="${this.escapeHtml(e.id)}" ${e.selected ? 'checked' : ''}/>
            </td>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-800">${this.escapeHtml(e.name)}</div>
            </td>
            <td class="px-4 py-3 text-gray-700">${this.escapeHtml(e.employeeNo)}</td>
            <td class="px-4 py-3 text-gray-700">${this.escapeHtml(phoneNorm || e.phone || '')}</td>
            <td class="px-4 py-3">
              <div class="text-gray-900 whitespace-pre-wrap leading-relaxed max-w-xl">${this.escapeHtml(message)}</div>
            </td>
            <td class="px-4 py-3">
              <a
                class="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${btnClass}"
                href="${disabled ? 'javascript:void(0)' : link}"
                target="${disabled ? '' : '_blank'}"
                rel="noopener"
                title="${this.escapeHtml(btnTitle)}"
                ${disabled ? 'aria-disabled="true"' : ''}
              >
                <i class="fab fa-whatsapp"></i>
                Kirim WA
              </a>
            </td>
          </tr>
        `;
      }).join('');

      // Bind checkbox events
      tbody.querySelectorAll('.row-check').forEach((cb) => {
        cb.addEventListener('change', (ev) => {
          const id = ev.target.getAttribute('data-emp-id');
          const emp = this.state.employees.find((x) => String(x.id) === String(id));
          if (emp) emp.selected = !!ev.target.checked;
        });
      });
    },

    /**
     * Update message preview with sample employee
     */
    updatePreview() {
      const bubble = this.DOM.previewBubble();
      if (!bubble) return;

      const template = this.DOM.templateText()?.value || '';
      this.readVariablesFromUI();

      const sample = this.state.employees[0];
      if (!sample) {
        bubble.textContent = '—';
        return;
      }

      const msg = this.substitute(template, sample);
      bubble.textContent = msg || '—';
    },

    // ================================================
    // SECTION 9: TEMPLATE ACTIONS
    // ================================================

    /**
     * Apply template to table and update preview
     */
    applyToTable() {
      console.log('✨ Applying template to table');
      
      this.state.lastAppliedText = this.DOM.templateText()?.value || '';
      this.renderTable();
      this.updatePreview();
      this.showToast('Template diterapkan ke table', 'success');
    },

    /**
     * Save current template to database
     * @async
     * @returns {Promise<void>}
     */
    async saveTemplate() {
      const templateBody = (this.DOM.templateText()?.value || '').trim();
      if (!templateBody) {
        this.showToast('Template masih kosong', 'warning');
        return;
      }

      const name = prompt('Nama template? (contoh: Pengingat Meeting)');
      if (!name || !name.trim()) return;

      try {
        console.log('💾 Saving template:', name.trim());

        const payload = {
          template_name: name.trim(),
          message_body: templateBody,
          is_active: true,
        };

        const { error } = await getDB()
          .from('whatsapp_templates')
          .insert(payload);

        if (error) throw error;

        console.log('✅ Template saved successfully');
        this.showToast('Template berhasil disimpan', 'success');
        await this.loadTemplates();
      } catch (err) {
        console.error('❌ saveTemplate error:', err);
        this.showToast('Gagal menyimpan template', 'error');
      }
    },

    /**
     * Load selected template from database
     * @async
     * @returns {Promise<void>}
     */
    async loadSelectedTemplate() {
      const sel = this.DOM.templateSelect();
      const id = sel?.value;
      
      if (!id) {
        this.showToast('Pilih template dulu', 'warning');
        return;
      }

      try {
        console.log('📥 Loading template ID:', id);

        const { data, error } = await getDB()
          .from('whatsapp_templates')
          .select('id, template_name, message_body')
          .eq('id', id)
          .single();

        if (error) throw error;

        const ta = this.DOM.templateText();
        if (ta) ta.value = data.message_body || '';

        console.log('✅ Template loaded:', data.template_name);

        this.applyToTable();
        this.showToast(`Template "${data.template_name}" dimuat`, 'success');
      } catch (err) {
        console.error('❌ loadSelectedTemplate error:', err);
        this.showToast('Gagal memuat template', 'error');
      }
    },

    // ================================================
    // SECTION 10: BULK ACTIONS
    // ================================================

    /**
     * Copy selected employee messages to clipboard
     */
    copySelectedMessages() {
      const template = this.DOM.templateText()?.value || '';
      if (!template.trim()) {
        this.showToast('Isi template dulu', 'warning');
        return;
      }

      this.readVariablesFromUI();

      const selected = this.state.employees.filter((e) => e.selected);
      if (selected.length === 0) {
        this.showToast('Tidak ada karyawan yang dipilih', 'warning');
        return;
      }

      console.log(`📋 Copying messages for ${selected.length} selected employees`);

      const joined = selected.map((e) => {
        const msg = this.substitute(template, e);
        const phone = this.normalizePhone(e.phone);
        return `${e.name} (${phone || e.phone || '-'})\n${msg}\n---`;
      }).join('\n');

      navigator.clipboard.writeText(joined)
        .then(() => {
          console.log('✅ Messages copied to clipboard');
          this.showToast(`${selected.length} pesan berhasil dicopy`, 'success');
        })
        .catch((err) => {
          console.error('❌ Clipboard error:', err);
          this.showToast('Gagal copy ke clipboard', 'error');
        });
    },

    /**
     * Toggle all employee selections
     * @param {boolean} checked - Whether to select or deselect all
     */
    toggleAllSelections(checked) {
      console.log(`🔲 ${checked ? 'Selecting' : 'Deselecting'} all visible employees`);
      
      this.state.filteredEmployees.forEach((fe) => {
        const emp = this.state.employees.find((x) => x.id === fe.id);
        if (emp) emp.selected = checked;
      });

      this.renderTable();
    },

    // ================================================
    // SECTION 11: EVENT BINDING
    // ================================================

    /**
     * Bind all event listeners
     */
    bindEvents() {
      console.log('🔗 Binding event listeners...');

      // Sidebar toggle
      this.DOM.btnSidebar()?.addEventListener('click', () => {
        const sb = this.DOM.sidebar();
        if (!sb) return;
        sb.classList.toggle('-translate-x-full');
      });

      // Reload employees
      this.DOM.btnReloadEmployees()?.addEventListener('click', () => {
        console.log('🔄 Manual reload triggered');
        this.loadEmployees();
      });

      // Template apply
      this.DOM.btnApply()?.addEventListener('click', () => this.applyToTable());

      // Live update preview/table (debounced)
      const live = this._debounce(() => {
        this.updatePreview();
        this.renderTable();
      }, 250);

      [
        this.DOM.varA(),
        this.DOM.varB(),
        this.DOM.varC(),
        this.DOM.varD(),
        this.DOM.templateText()
      ].forEach((el) => el?.addEventListener('input', live));

      // Search
      this.DOM.searchInput()?.addEventListener('input', 
        this._debounce(() => this.applyFilterAndRender(), 200)
      );

      // Templates save/load
      this.DOM.btnSaveTemplate()?.addEventListener('click', () => this.saveTemplate());
      this.DOM.btnLoadTemplate()?.addEventListener('click', () => this.loadSelectedTemplate());

      // Copy selected
      this.DOM.btnCopyAll()?.addEventListener('click', () => this.copySelectedMessages());

      // Check all
      this.DOM.checkAll()?.addEventListener('change', (ev) => {
        this.toggleAllSelections(!!ev.target.checked);
      });

      console.log('✅ Event listeners bound');
    },

    // ================================================
    // SECTION 12: UTILITY FUNCTIONS
    // ================================================

    /**
     * Debounce function execution
     * @param {Function} fn - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    _debounce(fn, wait = 250) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    // ================================================
    // SECTION 13: INITIALIZATION
    // ================================================

    /**
     * Initialize WhatsApp Blast module
     * @async
     * @returns {Promise<void>}
     */
    async init() {
      console.log('🚀 Initializing WhatsApp Blast Module...');
      
      try {
        this.bindEvents();
        
        console.log('📋 Loading initial data...');
        await this.loadTemplates();
        await this.loadEmployees();
        this.updatePreview();
        
        console.log('✅ WhatsApp Blast Module initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize WhatsApp Blast:', error);
      }
    },
  };

  // ================================================
  // SECTION 14: GLOBAL EXPOSURE
  // ================================================

  /**
   * Export WA object to window for debugging and inline handlers
   */
  window.WA = WA;
  window.debugWA = {
    state: WA.state,
    employees: () => WA.state.employees,
    filtered: () => WA.state.filteredEmployees,
    templates: () => WA.state.templates,
    reload: () => WA.init(),
  };

  // ================================================
  // SECTION 15: AUTO-INITIALIZATION
  // ================================================

  /**
   * Auto-initialize on DOM ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WA.init());
  } else {
    WA.init();
  }

  // ================================================
  // INITIALIZATION SUMMARY
  // ================================================

  console.log('✅ WHATSAPP-BLAST.js v2.0 - CLEANED & ORGANIZED');
  console.log('📦 Loaded Sections:');
  console.log('   1️⃣  State Management');
  console.log('   2️⃣  DOM References (15 getters)');
  console.log('   3️⃣  UI Helpers (2 functions)');
  console.log('   4️⃣  Phone & Message Utilities (3 functions)');
  console.log('   5️⃣  Template Variable Handling (2 functions)');
  console.log('   6️⃣  Data Loading (3 functions)');
  console.log('   7️⃣  Filtering & Search (2 functions)');
  console.log('   8️⃣  Table Rendering (2 functions)');
  console.log('   9️⃣  Template Actions (3 functions)');
  console.log('   🔟  Bulk Actions (2 functions)');
  console.log('   1️⃣1️⃣  Event Binding (1 function)');
  console.log('   1️⃣2️⃣  Utility Functions (1 function)');
  console.log('   1️⃣3️⃣  Initialization (1 function)');
  console.log('   1️⃣4️⃣  Global Exposure');
  console.log('   1️⃣5️⃣  Auto-Initialization');
  console.log('📊 Total: 20+ functions');
  console.log('🌐 Global: window.WA, window.debugWA');
  console.log('🔗 Dependencies: app.js, api.js, database-functions.js');

  // ================================================
  // END OF MODULE
  // ================================================

})();
