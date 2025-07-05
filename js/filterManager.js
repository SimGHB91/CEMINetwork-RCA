/**
 * ============================================
 * FILTER MANAGER - Gestione filtri avanzati
 * ============================================
 */

const filterManager = {
    /**
     * Mostra/nasconde i filtri avanzati
     */
    toggleAdvancedFilters() {
        const content = domManager.elements.filtersContent;
        const isVisible = content.classList.contains('show');
        
        if (isVisible) {
            content.classList.remove('show');
            domManager.elements.toggleText.textContent = 'Mostra Filtri';
            domManager.elements.toggleIcon.textContent = '▼';
        } else {
            content.classList.add('show');
            domManager.elements.toggleText.textContent = 'Nascondi Filtri';
            domManager.elements.toggleIcon.textContent = '▲';
        }
    },

    /**
     * Applica tutti i filtri avanzati
     */
    applyAdvancedFilters() {
        const filters = {
            search: domManager.elements.searchInput.value.toLowerCase().trim(),
            clientType: domManager.elements.clientFilter.value,
            commercial: domManager.elements.commercialFilter.value,
            modality: domManager.elements.modalityFilter.value,
            dateFrom: domManager.elements.dateFromFilter.value,
            dateTo: domManager.elements.dateToFilter.value,
            province: domManager.elements.provinceFilter.value.toLowerCase().trim(),
            projectType: domManager.elements.projectTypeFilter.value
        };

        activeFilters = filters;

        filteredContacts = allContacts.filter(contact => {
            // Ricerca generale
            if (filters.search && !this.searchInContact(contact, filters.search)) {
                return false;
            }

            // Tipo cliente
            if (filters.clientType !== 'all') {
                if (filters.clientType === 'new' && !contact.nuovoCliente) return false;
                if (filters.clientType === 'existing' && contact.nuovoCliente) return false;
            }

            // Commerciale
            if (filters.commercial !== 'all' && contact.commerciale !== filters.commercial) {
                return false;
            }

            // Modalità
            if (filters.modality !== 'all' && contact.modalitaComm !== filters.modality) {
                return false;
            }

            // Range date
            if (filters.dateFrom && contact.data < filters.dateFrom) return false;
            if (filters.dateTo && contact.data > filters.dateTo) return false;

            // Provincia
            if (filters.province && (!contact.provincia || 
                !contact.provincia.toLowerCase().includes(filters.province))) {
                return false;
            }

            // Tipo progetto
            if (filters.projectType !== 'all' && contact.tipo !== filters.projectType) {
                return false;
            }

            return true;
        });

        currentPage = 1;
        domManager.updateTable();
        domManager.updateStats();
        this.updateActiveFiltersDisplay();
    },

    /**
     * Cerca testo nei campi del contatto
     */
    searchInContact(contact, searchTerm) {
        const searchFields = ['cliente', 'commerciale', 'luogo', 'provincia', 'rifProgetto', 'personaRif', 'commenti'];
        return searchFields.some(field => 
            contact[field] && contact[field].toLowerCase().includes(searchTerm)
        );
    },

    /**
     * Aggiorna il display dei filtri attivi
     */
    updateActiveFiltersDisplay() {
        const container = domManager.elements.activeFilters;
        if (!container) return;
        
        container.innerHTML = '';

        const filterLabels = {
            search: 'Ricerca',
            clientType: 'Tipo Cliente',
            commercial: 'Commerciale',
            modality: 'Modalità',
            dateFrom: 'Da',
            dateTo: 'A',
            province: 'Provincia',
            projectType: 'Tipo Progetto'
        };

        Object.entries(activeFilters).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                const tag = document.createElement('div');
                tag.className = 'filter-tag';
                
                let displayValue = value;
                if (key === 'clientType') {
                    displayValue = value === 'new' ? 'Nuovi Clienti' : 'Clienti Esistenti';
                } else if (key === 'dateFrom' || key === 'dateTo') {
                    displayValue = utilityFunctions.formatDate(value);
                }
                
                tag.innerHTML = `
                    ${filterLabels[key]}: ${utilityFunctions.sanitizeInput(displayValue)}
                    <button class="remove" onclick="filterManager.removeFilter('${key}')" aria-label="Rimuovi filtro">×</button>
                `;
                
                container.appendChild(tag);
            }
        });
    },

    /**
     * Rimuove un filtro specifico
     */
    removeFilter(filterKey) {
        const filterElements = {
            search: domManager.elements.searchInput,
            clientType: domManager.elements.clientFilter,
            commercial: domManager.elements.commercialFilter,
            modality: domManager.elements.modalityFilter,
            dateFrom: domManager.elements.dateFromFilter,
            dateTo: domManager.elements.dateToFilter,
            province: domManager.elements.provinceFilter,
            projectType: domManager.elements.projectTypeFilter
        };

        if (filterElements[filterKey]) {
            if (filterKey === 'search' || filterKey === 'province' || filterKey === 'dateFrom' || filterKey === 'dateTo') {
                filterElements[filterKey].value = '';
            } else {
                filterElements[filterKey].value = 'all';
            }
        }

        this.applyAdvancedFilters();
    },

    /**
     * Cancella tutti i filtri
     */
    clearAllFilters() {
        domManager.elements.searchInput.value = '';
        domManager.elements.clientFilter.value = 'all';
        domManager.elements.commercialFilter.value = 'all';
        domManager.elements.modalityFilter.value = 'all';
        domManager.elements.dateFromFilter.value = '';
        domManager.elements.dateToFilter.value = '';
        domManager.elements.provinceFilter.value = '';
        domManager.elements.projectTypeFilter.value = 'all';
        
        this.applyAdvancedFilters();
        notifications.success('Filtri cancellati');
    },

    /**
     * Salva un preset di filtri
     */
    saveFilterPreset() {
        const presetName = prompt('Nome per il preset di filtri:');
        if (presetName && presetName.trim()) {
            try {
                const presets = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILTER_PRESETS) || '{}');
                presets[presetName.trim()] = activeFilters;
                localStorage.setItem(STORAGE_KEYS.FILTER_PRESETS, JSON.stringify(presets));
                notifications.success(`Preset "${presetName}" salvato!`);
            } catch (error) {
                notifications.error('Errore nel salvataggio del preset');
            }
        }
    },

    /**
     * Carica un preset di filtri
     */
    loadFilterPreset(presetName) {
        try {
            const presets = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILTER_PRESETS) || '{}');
            const preset = presets[presetName];
            
            if (preset) {
                // Applica i filtri dal preset
                domManager.elements.searchInput.value = preset.search || '';
                domManager.elements.clientFilter.value = preset.clientType || 'all';
                domManager.elements.commercialFilter.value = preset.commercial || 'all';
                domManager.elements.modalityFilter.value = preset.modality || 'all';
                domManager.elements.dateFromFilter.value = preset.dateFrom || '';
                domManager.elements.dateToFilter.value = preset.dateTo || '';
                domManager.elements.provinceFilter.value = preset.province || '';
                domManager.elements.projectTypeFilter.value = preset.projectType || 'all';
                
                this.applyAdvancedFilters();
                notifications.success(`Preset "${presetName}" caricato!`);
            }
        } catch (error) {
            notifications.error('Errore nel caricamento del preset');
        }
    },

    /**
     * Ottiene tutti i preset salvati
     */
    getFilterPresets() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.FILTER_PRESETS) || '{}');
        } catch (error) {
            return {};
        }
    },

    /**
     * Elimina un preset di filtri
     */
    deleteFilterPreset(presetName) {
        try {
            const presets = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILTER_PRESETS) || '{}');
            delete presets[presetName];
            localStorage.setItem(STORAGE_KEYS.FILTER_PRESETS, JSON.stringify(presets));
            notifications.success(`Preset "${presetName}" eliminato!`);
        } catch (error) {
            notifications.error('Errore nell\'eliminazione del preset');
        }
    },

    /**
     * Applica filtri rapidi predefiniti
     */
    applyQuickFilter(type) {
        // Reset tutti i filtri
        this.clearAllFilters();
        
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        switch (type) {
            case 'today':
                domManager.elements.dateFromFilter.value = today;
                domManager.elements.dateToFilter.value = today;
                break;
            case 'week':
                domManager.elements.dateFromFilter.value = weekAgo.toISOString().split('T')[0];
                domManager.elements.dateToFilter.value = today;
                break;
            case 'month':
                domManager.elements.dateFromFilter.value = monthAgo.toISOString().split('T')[0];
                domManager.elements.dateToFilter.value = today;
                break;
            case 'newClients':
                domManager.elements.clientFilter.value = 'new';
                break;
            case 'existingClients':
                domManager.elements.clientFilter.value = 'existing';
                break;
        }
        
        this.applyAdvancedFilters();
    },

    /**
     * Esporta i filtri correnti come JSON
     */
    exportCurrentFilters() {
        const filtersData = {
            filters: activeFilters,
            exported: new Date().toISOString(),
            totalResults: filteredContacts.length
        };
        
        const blob = new Blob([JSON.stringify(filtersData, null, 2)], 
            { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `filtri_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        notifications.success('Filtri esportati!');
    },

    /**
     * Importa filtri da file JSON
     */
    async importFilters(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.filters) {
                const filters = data.filters;
                
                domManager.elements.searchInput.value = filters.search || '';
                domManager.elements.clientFilter.value = filters.clientType || 'all';
                domManager.elements.commercialFilter.value = filters.commercial || 'all';
                domManager.elements.modalityFilter.value = filters.modality || 'all';
                domManager.elements.dateFromFilter.value = filters.dateFrom || '';
                domManager.elements.dateToFilter.value = filters.dateTo || '';
                domManager.elements.provinceFilter.value = filters.province || '';
                domManager.elements.projectTypeFilter.value = filters.projectType || 'all';
                
                this.applyAdvancedFilters();
                notifications.success('Filtri importati con successo!');
            } else {
                notifications.error('File filtri non valido');
            }
        } catch (error) {
            notifications.error('Errore nell\'importazione dei filtri');
        }
    },

    /**
     * Ottiene suggerimenti per l'autocompletamento
     */
    getSuggestions(field) {
        const suggestions = new Set();
        
        allContacts.forEach(contact => {
            if (contact[field] && contact[field].trim()) {
                suggestions.add(contact[field].trim());
            }
        });
        
        return Array.from(suggestions).sort();
    },

    /**
     * Applica filtri con debounce per performance
     */
    debouncedApplyFilters: null,

    /**
     * Inizializza il debounce per i filtri
     */
    initDebounce() {
        this.debouncedApplyFilters = utilityFunctions.debounce(() => {
            this.applyAdvancedFilters();
        }, 300);
    }
};