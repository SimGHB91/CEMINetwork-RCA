/**
 * ====
 * DOM MANAGER - VERSIONE CORRETTA (Fix Tabella + Loading)
 * ====
 */

const domManager = {
    elements: {},
    
    init() {
        this.elements = {
            // Basic controls
            yearSelect: document.getElementById('yearSelect'),
            monthSelect: document.getElementById('monthSelect'),
            currentPeriod: document.getElementById('currentPeriod'),
            addContactBtn: document.getElementById('addContactBtn'),
            searchInput: document.getElementById('searchInput'),
            clientFilter: document.getElementById('clientFilter'),
            tableTitle: document.getElementById('tableTitle'),
            emptyState: document.getElementById('emptyState'),
            tableWrapper: document.getElementById('tableWrapper'),
            contactsTableBody: document.getElementById('contactsTableBody'),
            
            // Statistics
            totalContacts: document.getElementById('totalContacts'),
            newClients: document.getElementById('newClients'),
            existingClients: document.getElementById('existingClients'),
            newClientRate: document.getElementById('newClientRate'),
            
            // Charts
            clientTypeChart: document.getElementById('clientTypeChart'),
            commercialChart: document.getElementById('commercialChart'),
            geographicChart: document.getElementById('geographicChart'),
            modalityChart: document.getElementById('modalityChart'),
            conversionChart: document.getElementById('conversionChart'),
            weeklyChart: document.getElementById('weeklyChart'),
            topClientsChart: document.getElementById('topClientsChart'),
            trendChart: document.getElementById('trendChart'),
            
            // Modal e altri elementi...
            modal: document.getElementById('contactModal'),
            modalTitle: document.getElementById('modalTitle'),
            closeModal: document.getElementById('closeModal'),
            contactForm: document.getElementById('contactForm'),
            cancelBtn: document.getElementById('cancelBtn'),
            
            // Pagination
            pageSizeSelect: document.getElementById('pageSizeSelect'),
            prevPageBtn: document.getElementById('prevPageBtn'),
            nextPageBtn: document.getElementById('nextPageBtn'),
            pageIndicator: document.getElementById('pageIndicator'),
            paginationInfo: document.getElementById('paginationInfo'),
            
            // Altri elementi necessari...
            confirmModal: document.getElementById('confirmModal'),
            confirmTitle: document.getElementById('confirmTitle'),
            confirmMessage: document.getElementById('confirmMessage'),
            confirmIcon: document.getElementById('confirmIcon'),
            confirmCancel: document.getElementById('confirmCancel'),
            confirmConfirm: document.getElementById('confirmConfirm'),
            
            toggleFilters: document.getElementById('toggleFilters'),
            filtersContent: document.getElementById('filtersContent'),
            toggleText: document.getElementById('toggleText'),
            toggleIcon: document.getElementById('toggleIcon'),
            commercialFilter: document.getElementById('commercialFilter'),
            modalityFilter: document.getElementById('modalityFilter'),
            dateFromFilter: document.getElementById('dateFromFilter'),
            dateToFilter: document.getElementById('dateToFilter'),
            provinceFilter: document.getElementById('provinceFilter'),
            projectTypeFilter: document.getElementById('projectTypeFilter'),
            clearFilters: document.getElementById('clearFilters'),
            applyFilters: document.getElementById('applyFilters'),
            saveFilters: document.getElementById('saveFilters'),
            activeFilters: document.getElementById('activeFilters'),
            
            importFile: document.getElementById('importFile'),
            downloadTemplate: document.getElementById('downloadTemplate'),
            previewImport: document.getElementById('previewImport'),
            executeImport: document.getElementById('executeImport'),
            importProgress: document.getElementById('importProgress'),
            importProgressBar: document.getElementById('importProgressBar'),
            importProgressText: document.getElementById('importProgressText'),
            exportExcel: document.getElementById('exportExcel'),
            exportCSV: document.getElementById('exportCSV'),
            exportJSON: document.getElementById('exportJSON'),
            exportPDF: document.getElementById('exportPDF'),
            includeCharts: document.getElementById('includeCharts'),
            
            refreshDashboard: document.getElementById('refreshDashboard'),
            exportDashboard: document.getElementById('exportDashboard'),
            totalTrend: document.getElementById('totalTrend'),
            newClientsTrend: document.getElementById('newClientsTrend'),
            existingTrend: document.getElementById('existingTrend'),
            rateTrend: document.getElementById('rateTrend'),
            
            importPreviewModal: document.getElementById('importPreviewModal'),
            closeImportPreview: document.getElementById('closeImportPreview'),
            importPreviewHead: document.getElementById('importPreviewHead'),
            importPreviewBody: document.getElementById('importPreviewBody'),
            importStats: document.getElementById('importStats'),
            cancelImport: document.getElementById('cancelImport'),
            confirmImport: document.getElementById('confirmImport')
        };
    },

    /**
     * ⭐ CORREGGI LOADING GRAFICI - Rimuovi rotellina infinita
     */
    showChartsLoading(show = false) {
        // NON mostrare mai loading sui grafici
        // Lascia che Chart.js gestisca le sue animazioni
        console.log('Loading grafici disabilitato per evitare rotellina infinita');
    },

    /**
     * ✅ TABELLA CORRETTA - Formato originale ripristinato
     */
    updateTable() {
        const tbody = this.elements.contactsTableBody;
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (filteredContacts.length === 0) {
            this.elements.emptyState.style.display = 'block';
            this.elements.tableWrapper.style.display = 'none';
            paginationManager.updateControls();
            return;
        }
        
        this.elements.emptyState.style.display = 'none';
        this.elements.tableWrapper.style.display = 'block';
        
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredContacts.length);
        const pageContacts = filteredContacts.slice(startIndex, endIndex);
        
        pageContacts.forEach(contact => {
            const row = document.createElement('tr');
            
            // ✅ FORMATO TABELLA ORIGINALE RIPRISTINATO
            row.innerHTML = `
                <td><strong>${contact.id}</strong></td>
                <td>${utilityFunctions.sanitizeInput(contact.commerciale || '')}</td>
                <td>${utilityFunctions.sanitizeInput(contact.modalitaComm || '')}</td>
                <td>
                    <div><strong>${utilityFunctions.sanitizeInput(contact.cliente || '')}</strong></div>
                    ${contact.personaRif ? `<div style="font-size: 12px; color: #666;">${utilityFunctions.sanitizeInput(contact.personaRif)}</div>` : ''}
                </td>
                <td>
                    <div>${utilityFunctions.sanitizeInput(contact.luogo || '')}</div>
                    ${contact.provincia ? `<div style="font-size: 12px; color: #666;">${utilityFunctions.sanitizeInput(contact.provincia)}</div>` : ''}
                </td>
                <td>${utilityFunctions.formatDate(contact.data)}</td>
                <td>
                    <span class="client-badge ${contact.nuovoCliente ? 'new' : 'existing'}">
                        ${contact.nuovoCliente ? 'Nuovo' : 'Esistente'}
                    </span>
                </td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${utilityFunctions.sanitizeInput(contact.rifProgetto || '')}">${utilityFunctions.sanitizeInput(contact.rifProgetto || '')}</td>
                <td>
                    <button class="btn btn-small" onclick="contactManager.editContact(${contact.id})" aria-label="Modifica contatto">Modifica</button>
                    <button class="btn btn-danger btn-small" onclick="contactManager.deleteContact(${contact.id})" aria-label="Elimina contatto">Elimina</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        paginationManager.updateControls();
    },

    /**
     * ⭐ ANIMAZIONE CONTATORI - Mantieni originale
     */
    animateCounter(element, targetValue, isPercentage = false, duration = 1200) {
        if (!element) return;
        
        const cleanTarget = isPercentage ? 
            parseInt(targetValue.toString().replace('%', '')) : 
            parseInt(targetValue) || 0;
        
        const startValue = 0;
        const startTime = Date.now();
        const suffix = isPercentage ? '%' : '';
        
        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
        
        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = easeOutQuart(progress);
            const currentValue = Math.round(startValue + (cleanTarget - startValue) * easedProgress);
            
            element.textContent = currentValue + suffix;
            
            if (!element.classList.contains('counter-animating')) {
                element.classList.add('counter-animating');
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = cleanTarget + suffix;
                element.classList.remove('counter-animating');
                element.classList.add('counter-completed');
                
                setTimeout(() => {
                    element.classList.remove('counter-completed');
                }, 500);
            }
        };
        
        requestAnimationFrame(updateCounter);
    },

    animateAllStats(total, newClientsCount, existingClientsCount, newClientRateValue) {
        setTimeout(() => this.animateCounter(this.elements.totalContacts, total), 0);
        setTimeout(() => this.animateCounter(this.elements.newClients, newClientsCount), 200);
        setTimeout(() => this.animateCounter(this.elements.existingClients, existingClientsCount), 400);
        setTimeout(() => this.animateCounter(this.elements.newClientRate, newClientRateValue, true), 600);
    },

    updateStats() {
        const total = filteredContacts.length;
        const newClientsCount = filteredContacts.filter(c => c.nuovoCliente).length;
        const existingClientsCount = total - newClientsCount;
        const newClientRateValue = total > 0 ? Math.round((newClientsCount / total) * 100) : 0;
        
        this.animateAllStats(total, newClientsCount, existingClientsCount, newClientRateValue);
    },

    updateStatsInstant() {
        const total = filteredContacts.length;
        const newClientsCount = filteredContacts.filter(c => c.nuovoCliente).length;
        const existingClientsCount = total - newClientsCount;
        const newClientRateValue = total > 0 ? Math.round((newClientsCount / total) * 100) : 0;
        
        this.elements.totalContacts.textContent = total;
        this.elements.newClients.textContent = newClientsCount;
        this.elements.existingClients.textContent = existingClientsCount;
        this.elements.newClientRate.textContent = `${newClientRateValue}%`;
    },

    /**
     * Resto delle funzioni originali...
     */
    updatePeriod() {
        const year = this.elements.yearSelect.value;
        const month = parseInt(this.elements.monthSelect.value);
        const monthName = MONTHS[month - 1];
        
        this.elements.currentPeriod.textContent = `${monthName} ${year}`;
        this.elements.tableTitle.textContent = `Contatti - ${monthName} ${year}`;
        
        const now = new Date();
        const isCurrentMonth = (year == now.getFullYear() && month == (now.getMonth() + 1));
        
        this.elements.currentPeriod.classList.remove('current-period-active', 'selected-period');
        
        if (isCurrentMonth) {
            this.elements.currentPeriod.classList.add('current-period-active');
            this.elements.currentPeriod.title = 'Periodo corrente (oggi)';
        } else {
            this.elements.currentPeriod.classList.add('selected-period');
            this.elements.currentPeriod.title = `Periodo selezionato: ${monthName} ${year}`;
        }
        
        this.updateNavigationButtons(year, month);
    },

    updateNavigationButtons(year, month) {
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        const currentPeriodBtn = document.getElementById('currentPeriodBtn');
        
        if (prevMonthBtn && nextMonthBtn && currentPeriodBtn) {
            let prevMonth = month - 1;
            let prevYear = year;
            if (prevMonth < 1) {
                prevMonth = 12;
                prevYear = year - 1;
            }
            
            let nextMonth = month + 1;
            let nextYear = year;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear = parseInt(year) + 1;
            }
            
            prevMonthBtn.title = `${MONTHS[prevMonth - 1]} ${prevYear}`;
            nextMonthBtn.title = `${MONTHS[nextMonth - 1]} ${nextYear}`;
            
            const now = new Date();
            const isCurrentPeriod = (year == now.getFullYear() && month == (now.getMonth() + 1));
            
            if (isCurrentPeriod) {
                currentPeriodBtn.textContent = 'Oggi';
                currentPeriodBtn.classList.remove('btn-warning');
                currentPeriodBtn.classList.add('btn-success');
                currentPeriodBtn.title = 'Sei già nel periodo corrente';
                currentPeriodBtn.disabled = true;
            } else {
                currentPeriodBtn.textContent = 'Oggi';
                currentPeriodBtn.classList.remove('btn-success');
                currentPeriodBtn.classList.add('btn-warning');
                currentPeriodBtn.title = `Vai a ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
                currentPeriodBtn.disabled = false;
            }
        }
    },

    // Altre funzioni di utilità mantengono la logica originale...
    startCalendarSync() {
        setInterval(() => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            
            if (now.getDate() === 1 && now.getHours() < 2) {
                const selectedYear = parseInt(this.elements.yearSelect.value);
                const selectedMonth = parseInt(this.elements.monthSelect.value);
                
                if (selectedYear !== currentYear || selectedMonth !== currentMonth) {
                    this.showPeriodUpdateSuggestion(currentYear, currentMonth);
                }
            }
        }, 60000);
    },

    async showPeriodUpdateSuggestion(newYear, newMonth) {
        const monthName = MONTHS[newMonth - 1];
        
        const confirmed = await confirm.show({
            title: '📅 Nuovo Periodo Disponibile',
            message: `È iniziato ${monthName} ${newYear}. Vuoi passare automaticamente al nuovo periodo?`,
            type: 'info',
            confirmText: `Vai a ${monthName} ${newYear}`,
            cancelText: 'Rimani qui'
        });
        
        if (confirmed) {
            dataManager.setPeriod(newYear, newMonth);
        }
    },

    showLoading(element, show = true) {
        if (show) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    },

    updatePaginationControls() {
        const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredContacts.length);
        
        this.elements.paginationInfo.textContent = 
            `Mostrando ${startIndex + 1} - ${endIndex} di ${filteredContacts.length} contatti`;
        
        this.elements.pageIndicator.textContent = `Pagina ${currentPage} di ${totalPages}`;
        
        this.elements.prevPageBtn.disabled = currentPage <= 1;
        this.elements.nextPageBtn.disabled = currentPage >= totalPages;
    },

    updateImportProgress(percentage, text) {
        this.elements.importProgressBar.style.width = `${percentage}%`;
        this.elements.importProgressText.textContent = `${Math.round(percentage)}%`;
    }
};