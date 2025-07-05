/**
 * ====
 * REMAINING MANAGERS - Gestori rimanenti + DASHBOARD COMPLETA (7 GRAFICI)
 * ====
 */

// ====
// PAGINATION MANAGER
// ====
const paginationManager = {
    /**
     * Gestisce il cambio della dimensione pagina
     */
    handlePageSizeChange() {
        pageSize = parseInt(domManager.elements.pageSizeSelect.value);
        currentPage = 1;
        domManager.updateTable();
    },

    /**
     * Cambia pagina
     */
    changePage(page) {
        const totalPages = Math.ceil(filteredContacts.length / pageSize);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            domManager.updateTable();
        }
    },

    /**
     * Aggiorna i controlli di paginazione
     */
    updateControls() {
        const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredContacts.length);
        
        domManager.elements.paginationInfo.textContent = 
            `Mostrando ${startIndex + 1} - ${endIndex} di ${filteredContacts.length} contatti`;
        
        domManager.elements.pageIndicator.textContent = `Pagina ${currentPage} di ${totalPages}`;
        
        domManager.elements.prevPageBtn.disabled = currentPage <= 1;
        domManager.elements.nextPageBtn.disabled = currentPage >= totalPages;
    },

    /**
     * Va alla prima pagina
     */
    goToFirstPage() {
        this.changePage(1);
    },

    /**
     * Va all'ultima pagina
     */
    goToLastPage() {
        const totalPages = Math.ceil(filteredContacts.length / pageSize);
        this.changePage(totalPages);
    }
};

// ====
// TREND MANAGER - VERSIONE CORRETTA
// ====
const trendManager = {
    /**
     * Aggiorna tutti i trend - VERSIONE CORRETTA
     */
    async updateTrends() {
        const currentYear = parseInt(domManager.elements.yearSelect.value);
        const currentMonth = parseInt(domManager.elements.monthSelect.value);
        
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = currentYear - 1;
        }
        
        try {
            // CORREZIONE: Await per ottenere i dati del mese precedente
            const prevContacts = await dataManager.getMonthData(prevYear, prevMonth);
            
            const currentTotal = allContacts.length;
            const prevTotal = prevContacts.length;
            const currentNew = allContacts.filter(c => c.nuovoCliente).length;
            const prevNew = prevContacts.filter(c => c.nuovoCliente).length;
            const currentExisting = currentTotal - currentNew;
            const prevExisting = prevTotal - prevNew;
            const currentRate = currentTotal > 0 ? (currentNew / currentTotal * 100) : 0;
            const prevRate = prevTotal > 0 ? (prevNew / prevTotal * 100) : 0;
            
            this.updateTrendElement(domManager.elements.totalTrend, currentTotal, prevTotal);
            this.updateTrendElement(domManager.elements.newClientsTrend, currentNew, prevNew);
            this.updateTrendElement(domManager.elements.existingTrend, currentExisting, prevExisting);
            this.updateTrendElement(domManager.elements.rateTrend, currentRate, prevRate, true);
            
        } catch (error) {
            console.error('Errore nell\'aggiornamento dei trend:', error);
            
            // Fallback: mostra trend neutri se c'è un errore
            const elements = [
                domManager.elements.totalTrend,
                domManager.elements.newClientsTrend,
                domManager.elements.existingTrend,
                domManager.elements.rateTrend
            ];
            
            elements.forEach(element => {
                if (element) {
                    element.textContent = '→ N/A';
                    element.className = 'stat-trend neutral';
                }
            });
        }
    },

    /**
     * Aggiorna singolo elemento trend
     */
    updateTrendElement(element, current, previous, isPercentage = false) {
        if (!element) return;
        
        let trend = '';
        let className = 'neutral';
        
        if (previous === 0) {
            trend = current > 0 ? '↗ Nuovo' : '→ 0';
            className = current > 0 ? 'up' : 'neutral';
        } else {
            const change = ((current - previous) / previous * 100);
            if (change > 5) {
                trend = `↗ +${change.toFixed(1)}%`;
                className = 'up';
            } else if (change < -5) {
                trend = `↘ ${change.toFixed(1)}%`;
                className = 'down';
            } else {
                trend = `→ ${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
                className = 'neutral';
            }
        }
        
        element.textContent = trend;
        element.className = `stat-trend ${className}`;
    },

    /**
     * Calcola trend a lungo termine - VERSIONE CORRETTA
     */
    async calculateLongTermTrend(months = 6) {
        const currentYear = parseInt(domManager.elements.yearSelect.value);
        const currentMonth = parseInt(domManager.elements.monthSelect.value);
        const data = [];
        
        try {
            for (let i = months - 1; i >= 0; i--) {
                let month = currentMonth - i;
                let year = currentYear;
                
                while (month <= 0) {
                    month += 12;
                    year -= 1;
                }
                
                // CORREZIONE: Await per ogni chiamata
                const contacts = await dataManager.getMonthData(year, month);
                data.push({
                    month: `${year}-${month.toString().padStart(2, '0')}`,
                    total: contacts.length,
                    newClients: contacts.filter(c => c.nuovoCliente).length
                });
            }
            
            return data;
        } catch (error) {
            console.error('Errore nel calcolo trend a lungo termine:', error);
            return [];
        }
    }
};

// ====
// ⭐ CHART INTERACTION MANAGER - NUOVO
// ====
const chartInteractionManager = {
    /**
     * Inizializza interazioni per tutti i grafici
     */
    initChartInteractions() {
        this.setupChartClickHandlers();
        this.setupChartHoverEffects();
        this.setupChartExportButtons();
        this.setupChartRefreshButtons();
    },

    /**
     * Gestisce click sui grafici per drill-down
     */
    setupChartClickHandlers() {
        // Click su grafico commerciali per filtrare
        const commercialChart = domManager.elements.commercialChart;
        if (commercialChart) {
            commercialChart.addEventListener('click', (event) => {
                const chart = chartManager.charts.commercial;
                if (chart) {
                    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                    if (points.length) {
                        const firstPoint = points[0];
                        const label = chart.data.labels[firstPoint.index];
                        this.filterByCommercial(label);
                    }
                }
            });
        }

        // Click su grafico geografico per filtrare
        const geographicChart = domManager.elements.geographicChart;
        if (geographicChart) {
            geographicChart.addEventListener('click', (event) => {
                const chart = chartManager.charts.geographic;
                if (chart) {
                    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                    if (points.length) {
                        const firstPoint = points[0];
                        const label = chart.data.labels[firstPoint.index];
                        this.filterByLocation(label);
                    }
                }
            });
        }

        // Click su grafico modalità per filtrare
        const modalityChart = domManager.elements.modalityChart;
        if (modalityChart) {
            modalityChart.addEventListener('click', (event) => {
                const chart = chartManager.charts.modality;
                if (chart) {
                    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                    if (points.length) {
                        const firstPoint = points[0];
                        const label = chart.data.labels[firstPoint.index];
                        this.filterByModality(label);
                    }
                }
            });
        }
    },

    /**
     * Effetti hover per i grafici
     */
    setupChartHoverEffects() {
        const chartElements = [
            'clientTypeChart', 'commercialChart', 'geographicChart', 
            'modalityChart', 'conversionChart', 'weeklyChart', 
            'topClientsChart', 'trendChart'
        ];

        chartElements.forEach(chartId => {
            const canvas = domManager.elements[chartId];
            if (canvas) {
                const container = canvas.closest('.chart-card');
                if (container) {
                    canvas.addEventListener('mouseenter', () => {
                        container.classList.add('active');
                    });
                    
                    canvas.addEventListener('mouseleave', () => {
                        container.classList.remove('active');
                    });
                }
            }
        });
    },

    /**
     * Bottoni export per singoli grafici
     */
    setupChartExportButtons() {
        const chartElements = [
            { id: 'clientTypeChart', name: 'Distribuzione Clienti' },
            { id: 'commercialChart', name: 'Performance Commerciali' },
            { id: 'geographicChart', name: 'Distribuzione Geografica' },
            { id: 'modalityChart', name: 'Modalità Comunicazione' },
            { id: 'conversionChart', name: 'Tasso Conversione' },
            { id: 'weeklyChart', name: 'Attività Settimanale' },
            { id: 'topClientsChart', name: 'Top Clienti' },
            { id: 'trendChart', name: 'Trend Mensile' }
        ];

        chartElements.forEach(({ id, name }) => {
            const canvas = domManager.elements[id];
            if (canvas) {
                const container = canvas.closest('.chart-card');
                if (container && !container.querySelector('.chart-export-btn')) {
                    const exportBtn = document.createElement('button');
                    exportBtn.className = 'chart-export-btn';
                    exportBtn.innerHTML = '📊';
                    exportBtn.title = `Esporta ${name}`;
                    exportBtn.style.cssText = `
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(52, 152, 219, 0.8);
                        border: none;
                        color: white;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        cursor: pointer;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        z-index: 10;
                    `;
                    
                    container.style.position = 'relative';
                    container.appendChild(exportBtn);
                    
                    // Mostra/nascondi al hover
                    container.addEventListener('mouseenter', () => {
                        exportBtn.style.opacity = '1';
                    });
                    
                    container.addEventListener('mouseleave', () => {
                        exportBtn.style.opacity = '0';
                    });
                    
                    // Click per export
                    exportBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.exportSingleChart(id, name);
                    });
                }
            }
        });
    },

    /**
     * Bottoni refresh per grafici
     */
    setupChartRefreshButtons() {
        const dashboardHeader = document.querySelector('.dashboard-header');
        if (dashboardHeader && !dashboardHeader.querySelector('.refresh-all-charts')) {
            const refreshAllBtn = document.createElement('button');
            // ⭐ CAMBIA QUESTA RIGA:
            refreshAllBtn.className = 'btn btn-warning btn-icon refresh-all-charts';
            refreshAllBtn.innerHTML = '🔄 Aggiorna Tutti';
            refreshAllBtn.title = 'Aggiorna tutti i grafici';
            
            refreshAllBtn.addEventListener('click', async () => {
                await this.refreshAllCharts();
            });
            
            const controls = dashboardHeader.querySelector('.dashboard-controls');
            if (controls) {
                controls.appendChild(refreshAllBtn);
            }
        }
    },

    /**
     * Filtra per commerciale
     */
    filterByCommercial(commercial) {
        if (domManager.elements.commercialFilter) {
            domManager.elements.commercialFilter.value = commercial;
            filterManager.applyAdvancedFilters();
            notifications.info(`Filtrato per commerciale: ${commercial}`);
        }
    },

    /**
     * Filtra per località
     */
    filterByLocation(location) {
        if (domManager.elements.provinceFilter) {
            domManager.elements.provinceFilter.value = location;
            filterManager.applyAdvancedFilters();
            notifications.info(`Filtrato per località: ${location}`);
        }
    },

    /**
     * Filtra per modalità
     */
    filterByModality(modality) {
        if (domManager.elements.modalityFilter) {
            domManager.elements.modalityFilter.value = modality;
            filterManager.applyAdvancedFilters();
            notifications.info(`Filtrato per modalità: ${modality}`);
        }
    },

    /**
     * Esporta singolo grafico
     */
    exportSingleChart(chartId, chartName) {
        const canvas = domManager.elements[chartId];
        if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${chartName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
            link.click();
            
            notifications.success(`Grafico "${chartName}" esportato!`);
        }
    },

    /**
     * Aggiorna tutti i grafici con feedback
     */
    async refreshAllCharts() {
        try {
            // Mostra loading su tutti i grafici
            domManager.showChartsLoading(true);
            
            // Aggiorna in parallelo
            await Promise.all([
                chartManager.updateCharts(),
                trendManager.updateTrends()
            ]);
            
            // Nascondi loading
            domManager.showChartsLoading(false);
            
            notifications.success('Tutti i grafici aggiornati!');
            
        } catch (error) {
            console.error('Errore refresh grafici:', error);
            domManager.showChartsLoading(false);
            notifications.error('Errore nell\'aggiornamento dei grafici');
        }
    }
};

// ====
// IMPORT MANAGER - VERSIONE CORRETTA
// ====
const importManager = {
    /**
     * Gestisce la selezione di file per l'import
     */
    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        domManager.elements.importProgress.style.display = 'block';
        domManager.elements.previewImport.disabled = true;
        domManager.elements.executeImport.disabled = true;

        try {
            let allData = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                domManager.updateImportProgress((i / files.length) * 100, `Elaborando ${file.name}...`);
                
                console.log(`📁 Elaborazione file: ${file.name} (${file.size} bytes)`);
                
                const data = await importExport.processFile(file);
                allData = allData.concat(data);
                
                console.log(`✅ File elaborato: ${data.length} record estratti`);
                await utilityFunctions.delay(100);
            }

            importData = allData;
            domManager.updateImportProgress(100, 'Completato!');
            
            console.log(`📊 IMPORT TOTALE: ${allData.length} record pronti`);
            
            setTimeout(() => {
                domManager.elements.importProgress.style.display = 'none';
                domManager.elements.previewImport.disabled = false;
                domManager.elements.executeImport.disabled = false;
                
                // ⭐ MESSAGGIO DETTAGLIATO
                const stats = importExport.getImportStats();
                notifications.success(`Import completato! ${allData.length} record pronti. Trovati ${stats.totalUniqueCommercials} commerciali e ${stats.totalUniqueModalities} modalità uniche.`);
            }, 1000);

        } catch (error) {
            console.error('❌ Errore import:', error);
            domManager.elements.importProgress.style.display = 'none';
            notifications.error(`Errore nell'elaborazione: ${error.message}`);
        }
    },

    /**
     * Mostra anteprima dei dati da importare - VERSIONE MIGLIORATA
     */
    showImportPreview() {
        if (importData.length === 0) {
            notifications.warning('Nessun dato da visualizzare');
            return;
        }

        const modal = domManager.elements.importPreviewModal;
        const head = domManager.elements.importPreviewHead;
        const body = domManager.elements.importPreviewBody;
        const stats = domManager.elements.importStats;

        // ⭐ VALIDAZIONE MIGLIORATA
        const validRecords = importData.filter(record => {
            const hasRequired = record.cliente && 
                record.commerciale && 
                record.data &&
                record.modalitaComm;
            
            if (!hasRequired) {
                console.warn('❌ Record non valido:', {
                    cliente: record.cliente || 'MANCANTE',
                    commerciale: record.commerciale || 'MANCANTE', 
                    data: record.data || 'MANCANTE',
                    modalitaComm: record.modalitaComm || 'MANCANTE'
                });
            }
            
            return hasRequired;
        });

        // ⭐ STATISTICHE DETTAGLIATE
        const commercials = new Set(validRecords.map(r => r.commerciale));
        const modalities = new Set(validRecords.map(r => r.modalitaComm));
        const newClients = validRecords.filter(r => r.nuovoCliente).length;

        stats.innerHTML = `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">📊 Statistiche Import Dettagliate</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    <div><strong>📁 Record totali:</strong> ${importData.length}</div>
                    <div><strong>✅ Record validi:</strong> ${validRecords.length}</div>
                    <div><strong>❌ Record con errori:</strong> ${importData.length - validRecords.length}</div>
                    <div><strong>👥 Commerciali unici:</strong> ${commercials.size}</div>
                    <div><strong>📞 Modalità uniche:</strong> ${modalities.size}</div>
                    <div><strong>🆕 Nuovi clienti:</strong> ${newClients}</div>
                </div>
                
                <div style="margin-top: 15px;">
                    <div><strong>👥 Commerciali trovati:</strong> ${Array.from(commercials).join(', ')}</div>
                    <div style="margin-top: 5px;"><strong>📞 Modalità trovate:</strong> ${Array.from(modalities).slice(0, 5).join(', ')}${modalities.size > 5 ? '...' : ''}</div>
                </div>
            </div>
        `;

        // ⭐ HEADERS MIGLIORATI
        const headers = ['commerciale', 'modalitaComm', 'cliente', 'luogo', 'data', 'nuovoCliente', 'tipo'];
        head.innerHTML = `<tr>${headers.map(h => `<th style="background: #34495e; color: white; padding: 12px; text-align: left;">${h}</th>`).join('')}<th style="background: #34495e; color: white; padding: 12px; text-align: left;">Stato</th></tr>`;

        body.innerHTML = '';
        
        // ⭐ MOSTRA PRIMI 25 RECORD con dettagli migliorati
        const recordsToShow = importData.slice(0, 25);
        recordsToShow.forEach((record, index) => {
            const isValid = record.cliente && record.commerciale && record.data && record.modalitaComm;
            const row = document.createElement('tr');
            
            // Stile alternato per righe
            if (index % 2 === 0) {
                row.style.backgroundColor = '#f8f9fa';
            }
            
            const cells = headers.map(field => {
                let value = record[field] || '';
                let cellStyle = 'padding: 8px; border-bottom: 1px solid #dee2e6;';
                
                // ⭐ EVIDENZIA CAMPI PROBLEMATICI
                if (['commerciale', 'modalitaComm', 'cliente', 'data'].includes(field) && !value) {
                    cellStyle += ' background-color: #f8d7da; color: #721c24;';
                    value = 'MANCANTE';
                }
                
                // Formatta valori specifici
                if (field === 'nuovoCliente') {
                    value = value ? 'Sì' : 'No';
                }
                if (field === 'data' && value && value !== 'MANCANTE') {
                    try {
                        value = new Date(value).toLocaleDateString('it-IT');
                    } catch (e) {
                        cellStyle += ' background-color: #fff3cd; color: #856404;';
                    }
                }
                
                return `<td style="${cellStyle}" title="${utilityFunctions.sanitizeInput(record[field] || '')}">${utilityFunctions.sanitizeInput(value)}</td>`;
            }).join('');
            
            // ⭐ STATO DETTAGLIATO
            let statusContent, statusStyle;
            if (isValid) {
                statusContent = '✅ Valido';
                statusStyle = 'background-color: #d4edda; color: #155724; padding: 8px; border-bottom: 1px solid #dee2e6; font-weight: bold;';
            } else {
                const missingFields = ['commerciale', 'modalitaComm', 'cliente', 'data'].filter(f => !record[f]);
                statusContent = `❌ Errore<br><small>Mancano: ${missingFields.join(', ')}</small>`;
                statusStyle = 'background-color: #f8d7da; color: #721c24; padding: 8px; border-bottom: 1px solid #dee2e6; font-weight: bold;';
            }
            
            row.innerHTML = cells + `<td style="${statusStyle}">${statusContent}</td>`;
            body.appendChild(row);
        });
        
        // ⭐ RIGA INFORMATIVA se ci sono più record
        if (importData.length > 25) {
            const infoRow = document.createElement('tr');
            infoRow.innerHTML = `<td colspan="${headers.length + 1}" style="text-align: center; padding: 15px; background-color: #e9ecef; font-style: italic;">... e altri ${importData.length - 25} record (mostrati primi 25)</td>`;
            body.appendChild(infoRow);
        }

        modal.style.display = 'block';
    },

    /**
     * Conferma e esegue l'import dei dati - VERSIONE CORRETTA
     */
    async confirmImportData() {
        const validRecords = importData.filter(record => {
            const isValid = record.cliente && 
                record.commerciale && 
                record.data &&
                record.modalitaComm;
            
            if (!isValid) {
                console.warn('❌ Record scartato durante import finale:', {
                    motivo: 'Campi obbligatori mancanti',
                    cliente: record.cliente || 'MANCANTE',
                    commerciale: record.commerciale || 'MANCANTE',
                    data: record.data || 'MANCANTE',
                    modalitaComm: record.modalitaComm || 'MANCANTE'
                });
            }
            
            return isValid;
        });
        
        if (validRecords.length === 0) {
            notifications.error('Nessun record valido da importare');
            return;
        }

        console.log(`📊 IMPORT FINALE: ${validRecords.length} record validi su ${importData.length} totali`);

        // ⭐ CONFERMA DETTAGLIATA
        const commercials = new Set(validRecords.map(r => r.commerciale));
        const periods = new Set(validRecords.map(r => {
            const date = new Date(r.data);
            return `${date.getMonth() + 1}/${date.getFullYear()}`;
        }));

        const confirmed = await confirm.show({
            title: 'Conferma Import Dettagliato',
            message: `Stai per importare ${validRecords.length} contatti validi su ${importData.length} totali.\n\nCommerciali: ${Array.from(commercials).join(', ')}\nPeriodi interessati: ${Array.from(periods).join(', ')}\n\nI record non validi verranno scartati. Continuare?`,
            confirmText: 'Importa Tutto',
            cancelText: 'Annulla'
        });

        if (confirmed) {
            const progressNotification = notifications.info('Import in corso...', 0);
            
            try {
                let successCount = 0;
                let errorCount = 0;
                const periodsUpdated = new Set();
                
                // ⭐ IMPORT RECORD PER RECORD con feedback
                for (let i = 0; i < validRecords.length; i++) {
                    const record = validRecords[i];
                    
                    try {
                        // Estrai anno/mese dalla data del contatto
                        const contactPeriod = contactManager.extractYearMonthFromDate(record.data);
                        if (!contactPeriod) {
                            console.error(`❌ Data contatto non valida: ${record.data}`);
                            errorCount++;
                            continue;
                        }
                        
                        periodsUpdated.add(`${contactPeriod.month}/${contactPeriod.year}`);
                        
                        // Calcola ID per il periodo specifico
                        const nextContactId = await contactManager.calculateNextIdForPeriod(contactPeriod.year, contactPeriod.month);
                        
                        const contact = {
                            id: nextContactId,
                            commerciale: record.commerciale,
                            modalitaComm: record.modalitaComm,
                            nuovoCliente: Boolean(record.nuovoCliente),
                            data: record.data,
                            cliente: record.cliente,
                            personaRif: record.personaRif || '',
                            luogo: record.luogo || '',
                            provincia: record.provincia || '',
                            tipo: record.tipo || '',
                            rifProgetto: record.rifProgetto || 'Importato da file Excel',
                            commenti: record.commenti || ''
                        };
                        
                        // ⭐ SALVA NEL PERIODO CORRETTO
                        const success = await dataManager.addContactToPeriod(contactPeriod.year, contactPeriod.month, contact);
                        if (success) {
                            successCount++;
                            console.log(`✅ Import record ${i + 1}/${validRecords.length}: ${contact.cliente} → ${contactPeriod.month}/${contactPeriod.year}`);
                        } else {
                            errorCount++;
                            console.error(`❌ Errore salvataggio record ${i + 1}: ${contact.cliente}`);
                        }
                        
                        // Aggiorna progresso ogni 5 record
                        if (i % 5 === 0 || i === validRecords.length - 1) {
                            const progress = Math.round((i + 1) / validRecords.length * 100);
                            progressNotification.querySelector('.notification-text').textContent = 
                                `Import in corso... ${i + 1}/${validRecords.length} (${progress}%)`;
                        }
                        
                    } catch (error) {
                        console.error(`❌ Errore processing record ${i + 1}:`, error);
                        errorCount++;
                    }
                }
                
                // ⭐ RICARICA DATI del periodo corrente
                await dataManager.loadData();
                
                // ⭐ AGGIORNA GRAFICI dopo import
                await chartManager.updateCharts();
                await trendManager.updateTrends();
                
                // Chiudi modal e pulisci
                domManager.elements.importPreviewModal.style.display = 'none';
                domManager.elements.importFile.value = '';
                importData = [];
                
                // Rimuovi notifica progresso
                notifications.remove(progressNotification);
                
                // ⭐ MESSAGGIO FINALE DETTAGLIATO
                const successMessage = `Import completato! ${successCount} contatti importati con successo` + 
                    (errorCount > 0 ? `, ${errorCount} errori` : '') + 
                    `. Periodi aggiornati: ${Array.from(periodsUpdated).join(', ')}`;
                
                if (errorCount === 0) {
                    notifications.success(successMessage);
                } else {
                    notifications.warning(successMessage);
                }
                
                console.log(`📊 IMPORT COMPLETATO: ${successCount} successi, ${errorCount} errori`);
                
            } catch (error) {
                notifications.remove(progressNotification);
                console.error('❌ Errore durante l\'import:', error);
                notifications.error('Errore durante l\'importazione');
            }
        }
    }
};

// ====
// EXPORT MANAGER - VERSIONE CORRETTA
// ====
const exportManager = {
    /**
     * Esporta dati nel formato specificato - VERSIONE MIGLIORATA
     */
    async exportData(format) {
        if (filteredContacts.length === 0) {
            notifications.warning('Nessun dato da esportare');
            return;
        }

        const year = domManager.elements.yearSelect.value;
        const month = parseInt(domManager.elements.monthSelect.value);
        const monthName = MONTHS[month - 1];

        console.log(`📤 EXPORT ${format.toUpperCase()}: Preparazione ${filteredContacts.length} contatti`);

        // ⭐ VERIFICA PRE-EXPORT: Controlla tutti i record
        filteredContacts.forEach((contact, index) => {
            console.log(`Pre-Export Record ${index + 1}: ID=${contact.id}, Commerciale="${contact.commerciale}", Cliente="${contact.cliente}"`);
        });

        // ⭐ MAPPING MIGLIORATO che preserva valori originali
        const exportData = filteredContacts.map((contact, index) => {
            const mappedRecord = {
                'N. Contatto': contact.id || (index + 1),
                'Commerciale': contact.commerciale || '', // ⭐ PRESERVA VALORE ORIGINALE
                'Modalità': contact.modalitaComm || '', // ⭐ PRESERVA VALORE ORIGINALE  
                'Nuovo Cliente': contact.nuovoCliente ? 'Sì' : 'No',
                'Data': contact.data || '',
                'Cliente': contact.cliente || '',
                'Persona di Riferimento': contact.personaRif || '',
                'Luogo': contact.luogo || '',
                'Provincia': contact.provincia || '',
                'Progetto': contact.rifProgetto || '',
                'Tipo': contact.tipo || '',
                'Commenti': contact.commenti || ''
            };
            
            // ⭐ DEBUG: Log ogni record mappato
            console.log(`Export Mapping ${index + 1}:`, {
                'ID originale': contact.id,
                'Commerciale originale': contact.commerciale,
                'Commerciale export': mappedRecord['Commerciale'],
                'Cliente': mappedRecord['Cliente']
            });
            
            return mappedRecord;
        });

        // ⭐ VERIFICA FINALE PRE-EXPORT
        console.log(`📊 VERIFICA EXPORT: ${exportData.length} record preparati per ${format}`);
        
        if (exportData.length !== filteredContacts.length) {
            console.error(`❌ ERRORE: Perdita record durante mapping! Originali: ${filteredContacts.length}, Mappati: ${exportData.length}`);
            notifications.error(`Errore: Perdita di ${filteredContacts.length - exportData.length} record durante l'export!`);
            return;
        }

        try {
            const filename = `Contatti_${monthName}_${year}`;
            
            switch (format) {
                case 'excel':
                    await importExport.exportToExcel(exportData, `${filename}.xlsx`);
                    break;
                case 'csv':
                    importExport.exportToCSV(exportData, `${filename}.csv`);
                    break;
                case 'json':
                    importExport.exportToJSON(exportData, `${filename}.json`);
                    break;
                case 'pdf':
                    await importExport.exportToPDF(exportData, {
                        includeCharts: domManager.elements.includeCharts.checked
                    });
                    break;
            }

            // ⭐ MESSAGGIO SUCCESSO DETTAGLIATO
            notifications.success(`Export ${format.toUpperCase()} completato: ${exportData.length} contatti salvati in ${filename}.${format === 'excel' ? 'xlsx' : format}`);
            
            console.log(`✅ Export ${format} completato con successo: ${exportData.length} record`);
            
        } catch (error) {
            console.error(`❌ Errore durante export ${format}:`, error);
            notifications.error(`Errore durante l'export: ${error.message}`);
        }
    },

    /**
     * ⭐ NUOVA FUNZIONE: Verifica integrità export
     */
    async verifyExportIntegrity(format) {
        console.log(`🔍 VERIFICA INTEGRITÀ EXPORT ${format.toUpperCase()}`);
        
        // Conta record attuali
        const currentCount = filteredContacts.length;
        console.log(`📊 Record attuali in filteredContacts: ${currentCount}`);
        
        // Verifica presenza campi critici
        const missingData = [];
        filteredContacts.forEach((contact, index) => {
            if (!contact.commerciale) {
                missingData.push(`Record ${index + 1}: commerciale mancante`);
            }
            if (!contact.cliente) {
                missingData.push(`Record ${index + 1}: cliente mancante`);
            }
        });
        
        if (missingData.length > 0) {
            console.warn(`⚠️ Dati mancanti trovati:`, missingData);
            notifications.warning(`Attenzione: ${missingData.length} record hanno dati mancanti`);
        }
        
        return missingData.length === 0;
    },

    /**
     * ⭐ EXPORT CON VERIFICA AUTOMATICA
     */
    async exportDataWithVerification(format) {
        // Verifica integrità prima dell'export
        const isValid = await this.verifyExportIntegrity(format);
        
        if (!isValid) {
            const confirmed = await confirm.show({
                title: 'Dati Incompleti',
                message: 'Alcuni record hanno dati mancanti. Vuoi continuare comunque con l\'export?',
                confirmText: 'Continua Export',
                cancelText: 'Annulla'
            });
            
            if (!confirmed) return;
        }
        
        // Procedi con export normale
        await this.exportData(format);
    },

    /**
     * Esporta dashboard come PDF - VERSIONE MIGLIORATA
     */
    async exportDashboardPDF() {
        try {
            if (typeof window.jspdf === 'undefined') {
                notifications.error('Libreria PDF non disponibile');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const year = domManager.elements.yearSelect.value;
            const month = parseInt(domManager.elements.monthSelect.value);
            const monthName = MONTHS[month - 1];
            
            // ⭐ HEADER MIGLIORATO
            doc.setFontSize(24);
            doc.text('Dashboard Analytics', 20, 25);
            doc.setFontSize(12);
            doc.text(`Periodo: ${monthName} ${year}`, 20, 35);
            doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 20, 45);
            
            // ⭐ STATISTICHE DETTAGLIATE
            doc.setFontSize(16);
            doc.text('Riepilogo Statistiche', 20, 65);
            doc.setFontSize(12);
            
            const stats = [
                `Contatti Totali: ${domManager.elements.totalContacts.textContent}`,
                `Nuovi Clienti: ${domManager.elements.newClients.textContent}`,
                `Clienti Esistenti: ${domManager.elements.existingClients.textContent}`,
                `Percentuale Nuovi Clienti: ${domManager.elements.newClientRate.textContent}`
            ];
            
            stats.forEach((stat, index) => {
                doc.text(stat, 30, 75 + (index * 10));
            });
            
            // ⭐ AGGIUNGI INFO COMMERCIALI
            if (filteredContacts.length > 0) {
                const commercials = [...new Set(filteredContacts.map(c => c.commerciale))];
                doc.setFontSize(14);
                doc.text('Commerciali Attivi', 20, 125);
                doc.setFontSize(10);
                doc.text(commercials.join(', '), 30, 135, { maxWidth: 150 });
            }
            
            doc.save(`dashboard_${monthName}_${year}.pdf`);
            notifications.success('Dashboard PDF esportata con successo!');
            
        } catch (error) {
            console.error('❌ Errore export dashboard:', error);
            notifications.error('Errore nell\'export della dashboard');
        }
    },

    /**
     * ⭐ NUOVA FUNZIONE: Export di debugging per sviluppatori
     */
    async exportDebugData() {
        const debugData = {
            timestamp: new Date().toISOString(),
            totalContacts: allContacts.length,
            filteredContacts: filteredContacts.length,
            currentPeriod: {
                year: domManager.elements.yearSelect.value,
                month: domManager.elements.monthSelect.value
            },
            activeFilters: activeFilters,
            allContactsData: allContacts,
            filteredContactsData: filteredContacts,
            importStats: importExport.getImportStats(),
            chartsStatus: {
                clientType: !!chartManager.charts.clientType,
                commercial: !!chartManager.charts.commercial,
                geographic: !!chartManager.charts.geographic,
                modality: !!chartManager.charts.modality,
                conversion: !!chartManager.charts.conversion,
                weekly: !!chartManager.charts.weekly,
                topClients: !!chartManager.charts.topClients,
                trend: !!chartManager.charts.trend
            }
        };
        
        const blob = new Blob([JSON.stringify(debugData, null, 2)], 
            { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `debug_data_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        notifications.success('Dati di debug esportati!');
    }
};

// ====
// EVENT MANAGER - AGGIORNATO PER GRAFICI
// ====
const eventManager = {
    /**
     * Inizializza tutti gli event listeners
     */
    initAllListeners() {
        this.initBasicListeners();
        this.initPaginationListeners();
        this.initFilterListeners();
        this.initImportExportListeners();
        this.initDashboardListeners();
        this.initModalListeners();
        this.initFormListeners();
        this.initKeyboardListeners();
        this.initGlobalListeners();
        
        // ⭐ NUOVI LISTENERS PER GRAFICI
        this.initChartListeners();
    },

    /**
     * ⭐ NUOVA FUNZIONE: Event listeners per i grafici
     */
    initChartListeners() {
        // Inizializza interazioni grafici
        chartInteractionManager.initChartInteractions();
        
        // Listener per resize window (aggiorna grafici)
        window.addEventListener('resize', utilityFunctions.debounce(() => {
            if (chartManager.charts) {
                Object.values(chartManager.charts).forEach(chart => {
                    if (chart && typeof chart.resize === 'function') {
                        chart.resize();
                    }
                });
            }
        }, 250));
        
        // Listener per cambio orientazione mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                chartManager.updateCharts();
            }, 500);
        });
    },

    /**
     * Event listeners di base
     */
    initBasicListeners() {
        domManager.elements.yearSelect?.addEventListener('change', () => dataManager.updatePeriod());
        domManager.elements.monthSelect?.addEventListener('change', () => dataManager.updatePeriod());
        domManager.elements.addContactBtn?.addEventListener('click', () => contactManager.openModal());
        domManager.elements.searchInput?.addEventListener('input', 
            utilityFunctions.debounce(() => filterManager.applyAdvancedFilters(), 300));
        
        // Nuovi controlli navigazione periodo
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        const currentPeriodBtn = document.getElementById('currentPeriodBtn');
        
        prevMonthBtn?.addEventListener('click', () => dataManager.goToPreviousMonth());
        nextMonthBtn?.addEventListener('click', () => dataManager.goToNextMonth());
        currentPeriodBtn?.addEventListener('click', () => dataManager.goToCurrentPeriod());
        
        // Click sul periodo corrente per andare a oggi
        domManager.elements.currentPeriod?.addEventListener('click', () => dataManager.goToCurrentPeriod());
    },

    /**
     * Event listeners per la paginazione
     */
    initPaginationListeners() {
        domManager.elements.pageSizeSelect?.addEventListener('change', () => paginationManager.handlePageSizeChange());
        domManager.elements.prevPageBtn?.addEventListener('click', () => paginationManager.changePage(currentPage - 1));
        domManager.elements.nextPageBtn?.addEventListener('click', () => paginationManager.changePage(currentPage + 1));
    },

    /**
     * Event listeners per i filtri
     */
    initFilterListeners() {
        domManager.elements.toggleFilters?.addEventListener('click', () => filterManager.toggleAdvancedFilters());
        domManager.elements.clientFilter?.addEventListener('change', () => filterManager.applyAdvancedFilters());
        domManager.elements.commercialFilter?.addEventListener('change', () => filterManager.applyAdvancedFilters());
        domManager.elements.modalityFilter?.addEventListener('change', () => filterManager.applyAdvancedFilters());
        domManager.elements.dateFromFilter?.addEventListener('change', () => filterManager.applyAdvancedFilters());
        domManager.elements.dateToFilter?.addEventListener('change', () => filterManager.applyAdvancedFilters());
        domManager.elements.provinceFilter?.addEventListener('input', 
            utilityFunctions.debounce(() => filterManager.applyAdvancedFilters(), 300));
        domManager.elements.projectTypeFilter?.addEventListener('change', () => filterManager.applyAdvancedFilters());
        domManager.elements.clearFilters?.addEventListener('click', () => filterManager.clearAllFilters());
        domManager.elements.applyFilters?.addEventListener('click', () => filterManager.applyAdvancedFilters());
        domManager.elements.saveFilters?.addEventListener('click', () => filterManager.saveFilterPreset());
    },

    /**
     * Event listeners per import/export
     */
    initImportExportListeners() {
        domManager.elements.importFile?.addEventListener('change', (e) => importManager.handleFileSelect(e));
        domManager.elements.downloadTemplate?.addEventListener('click', () => importExport.generateTemplate());
        domManager.elements.previewImport?.addEventListener('click', () => importManager.showImportPreview());
        domManager.elements.executeImport?.addEventListener('click', () => importManager.showImportPreview());
        domManager.elements.exportExcel?.addEventListener('click', () => exportManager.exportData('excel'));
        domManager.elements.exportCSV?.addEventListener('click', () => exportManager.exportData('csv'));
        domManager.elements.exportJSON?.addEventListener('click', () => exportManager.exportData('json'));
        domManager.elements.exportPDF?.addEventListener('click', () => exportManager.exportData('pdf'));
    },

    /**
     * ⭐ AGGIORNATO: Event listeners per la dashboard
     */
    initDashboardListeners() {
        domManager.elements.refreshDashboard?.addEventListener('click', async () => {
            await chartInteractionManager.refreshAllCharts();
        });
        
        domManager.elements.exportDashboard?.addEventListener('click', () => exportManager.exportDashboardPDF());
        
        // ⭐ NUOVO: Export tutti i grafici come immagini
        const exportChartsBtn = document.getElementById('exportChartsImages');
        if (exportChartsBtn) {
            exportChartsBtn.addEventListener('click', () => chartManager.exportChartsAsImages());
        }
    },

    /**
     * Event listeners per i modal
     */
    initModalListeners() {
        domManager.elements.closeModal?.addEventListener('click', () => contactManager.handleCloseModal());
        domManager.elements.cancelBtn?.addEventListener('click', () => contactManager.handleCloseModal());
        domManager.elements.contactForm?.addEventListener('submit', (e) => contactManager.saveContact(e));
        
        // Import preview modal
        domManager.elements.closeImportPreview?.addEventListener('click', () => {
            domManager.elements.importPreviewModal.style.display = 'none';
        });
        domManager.elements.cancelImport?.addEventListener('click', () => {
            domManager.elements.importPreviewModal.style.display = 'none';
        });
        domManager.elements.confirmImport?.addEventListener('click', () => importManager.confirmImportData());
    },

    /**
     * Event listeners per la validazione form
     */
    initFormListeners() {
        const formInputs = domManager.elements.contactForm?.querySelectorAll('input, select, textarea');
        formInputs?.forEach(input => {
            input.addEventListener('blur', () => contactManager.validateSingleField(input));
            input.addEventListener('input', () => {
                hasUnsavedChanges = true;
                contactManager.clearFieldError(input);
            });
        });
    },

    /**
     * ⭐ AGGIORNATO: Event listeners per scorciatoie da tastiera
     */
    initKeyboardListeners() {
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    },

    /**
     * Event listeners globali
     */
    initGlobalListeners() {
        // Protezione prima della chiusura
        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Gestione stato online/offline
        window.addEventListener('online', () => {
            notifications.success('Connessione ripristinata');
        });

        window.addEventListener('offline', () => {
            notifications.warning('Connessione persa - modalità offline');
        });

        // ⭐ AGGIORNATO: Gestione ridimensionamento finestra per grafici
        window.addEventListener('resize', utilityFunctions.debounce(() => {
            chartManager.updateCharts();
        }, 250));
    },

    /**
     * ⭐ AGGIORNATO: Gestisce le scorciatoie da tastiera
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: Nuovo contatto
        if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
            e.preventDefault();
            if (!domManager.elements.modal.style.display || domManager.elements.modal.style.display === 'none') {
                contactManager.openModal();
            }
        }
        
        // Ctrl/Cmd + F: Focus su ricerca
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            domManager.elements.searchInput?.focus();
        }
        
        // Escape: Chiudi modal
        if (e.key === 'Escape') {
            if (domManager.elements.modal.style.display === 'block') {
                contactManager.handleCloseModal();
            }
            if (domManager.elements.importPreviewModal && domManager.elements.importPreviewModal.style.display === 'block') {
                domManager.elements.importPreviewModal.style.display = 'none';
            }
            if (domManager.elements.confirmModal && domManager.elements.confirmModal.style.display === 'block') {
                confirm.hide();
            }
        }

        // Ctrl/Cmd + S: Salva (se in modal)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            if (domManager.elements.modal.style.display === 'block') {
                e.preventDefault();
                domManager.elements.contactForm.dispatchEvent(new Event('submit'));
            }
        }

        // Frecce per navigazione pagine
        if (e.altKey) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                paginationManager.changePage(currentPage - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                paginationManager.changePage(currentPage + 1);
            }
        }

        // Ctrl/Cmd + E: Export rapido
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportManager.exportData('excel');
        }

        // Ctrl/Cmd + I: Import
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            domManager.elements.importFile?.click();
        }
        
        // ⭐ NUOVO: Ctrl/Cmd + R: Refresh dashboard
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            chartInteractionManager.refreshAllCharts();
        }
        
        // ⭐ NUOVO: Ctrl/Cmd + D: Export dashboard
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            exportManager.exportDashboardPDF();
        }
    }
};

// ====
// BACKUP MANAGER
// ====
const backupManager = {
    /**
     * Crea backup completo dei dati
     */
    createFullBackup() {
        try {
            const backupData = {
                version: '1.0',
                created: new Date().toISOString(),
                data: dataManager.exportAllData(),
                filterPresets: filterManager.getFilterPresets(),
                userPreferences: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES) || '{}'),
                stats: dataManager.getStorageStats()
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], 
                { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `backup_contatti_${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            notifications.success('Backup creato con successo!');
            return true;
        } catch (error) {
            notifications.error('Errore nella creazione del backup');
            return false;
        }
    },

    /**
     * Ripristina backup completo
     */
    async restoreFromBackup(file) {
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);

            if (!backupData.version || !backupData.data) {
                throw new Error('File backup non valido');
            }

            const confirmed = await confirm.show({
                title: 'Ripristina Backup',
                message: 'ATTENZIONE: Questa operazione sostituirà tutti i dati esistenti. Continuare?',
                type: 'danger',
                confirmText: 'Ripristina',
                cancelText: 'Annulla'
            });

            if (!confirmed) return false;

            // Ripristina dati principali
            const imported = dataManager.importAllData(backupData.data);
            
            // Ripristina preset filtri
            if (backupData.filterPresets) {
                localStorage.setItem(STORAGE_KEYS.FILTER_PRESETS, 
                    JSON.stringify(backupData.filterPresets));
            }

            // Ripristina preferenze utente
            if (backupData.userPreferences) {
                localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, 
                    JSON.stringify(backupData.userPreferences));
            }

            // Ricarica dati correnti
            dataManager.loadData();

            notifications.success(`Backup ripristinato! ${imported} dataset importati.`);
            return true;
        } catch (error) {
            notifications.error(`Errore nel ripristino: ${error.message}`);
            return false;
        }
    },

    /**
     * Backup automatico periodico
     */
    setupAutoBackup(intervalHours = 24) {
        const interval = intervalHours * 60 * 60 * 1000;
        
        setInterval(() => {
            if (allContacts.length > 0) {
                this.createAutoBackup();
            }
        }, interval);
    },

    /**
     * Crea backup automatico nel localStorage
     */
    createAutoBackup() {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                data: dataManager.exportAllData()
            };

            localStorage.setItem('autoBackup', JSON.stringify(backupData));
            console.log('Backup automatico creato');
        } catch (error) {
            console.warn('Errore nel backup automatico:', error);
        }
    },

    /**
     * Ripristina ultimo backup automatico
     */
    restoreAutoBackup() {
        try {
            const autoBackup = localStorage.getItem('autoBackup');
            if (!autoBackup) {
                notifications.warning('Nessun backup automatico trovato');
                return false;
            }

            const backupData = JSON.parse(autoBackup);
            const backupDate = new Date(backupData.timestamp);
            
            const confirmed = confirm.show({
                title: 'Ripristina Backup Automatico',
                message: `Ripristinare backup del ${backupDate.toLocaleDateString('it-IT')} alle ${backupDate.toLocaleTimeString('it-IT')}?`,
                confirmText: 'Ripristina',
                cancelText: 'Annulla'
            });

            if (confirmed) {
                dataManager.importAllData(backupData.data);
                dataManager.loadData();
                notifications.success('Backup automatico ripristinato!');
                return true;
            }
        } catch (error) {
            notifications.error('Errore nel ripristino automatico');
        }
        
        return false;
    }
};

// ====
// SETTINGS MANAGER
// ====
const settingsManager = {
    defaultSettings: {
        theme: 'light',
        pageSize: 25,
        autoSave: true,
        notifications: true,
        soundEffects: false,
        compactView: false,
        showTrends: true,
        defaultExportFormat: 'excel',
        language: 'it',
        // ⭐ NUOVE IMPOSTAZIONI PER GRAFICI
        chartsAnimations: true,
        chartsAutoRefresh: false,
        chartsExportFormat: 'png'
    },

    /**
     * Carica impostazioni
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('appSettings');
            if (saved) {
                return { ...this.defaultSettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Errore nel caricamento impostazioni:', error);
        }
        
        return this.defaultSettings;
    },

    /**
     * Salva impostazioni
     */
    saveSettings(settings) {
        try {
            localStorage.setItem('appSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Errore nel salvataggio impostazioni:', error);
        }
    }
};