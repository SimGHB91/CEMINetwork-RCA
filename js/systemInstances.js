/**
 * ============================================
 * SYSTEM INSTANCES - Correzioni Import/Export (VERSIONE CORRETTA URGENTE)
 * ============================================
 */

// ============================================
// NOTIFICATION SYSTEM CLASS
// ============================================
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notificationContainer');
        this.notifications = [];
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon"></div>
                <div class="notification-text">${this.escapeHtml(message)}</div>
                <button class="notification-close" aria-label="Chiudi notifica">×</button>
            </div>
        `;

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(notification));

        this.container.appendChild(notification);
        this.notifications.push(notification);

        if (duration > 0) {
            setTimeout(() => this.remove(notification), duration);
        }

        return notification;
    }

    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============================================
// CONFIRM SYSTEM CLASS
// ============================================
class ConfirmSystem {
    constructor() {
        this.modal = domManager.elements.confirmModal;
        this.title = domManager.elements.confirmTitle;
        this.message = domManager.elements.confirmMessage;
        this.icon = domManager.elements.confirmIcon;
        this.cancelBtn = domManager.elements.confirmCancel;
        this.confirmBtn = domManager.elements.confirmConfirm;
    }

    init() {
        this.cancelBtn.addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    show(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Conferma Azione',
                message = 'Sei sicuro di voler procedere?',
                type = 'warning',
                confirmText = 'Conferma',
                cancelText = 'Annulla'
            } = options;

            this.title.textContent = title;
            this.message.textContent = message;
            this.confirmBtn.textContent = confirmText;
            this.cancelBtn.textContent = cancelText;
            
            this.icon.className = `confirm-icon ${type}`;
            this.icon.textContent = type === 'danger' ? '⚠' : '❓';
            
            this.confirmBtn.className = `btn ${type === 'danger' ? 'btn-danger' : 'btn-success'}`;

            const handleConfirm = () => {
                this.hide();
                this.confirmBtn.removeEventListener('click', handleConfirm);
                resolve(true);
            };

            const handleCancel = () => {
                this.hide();
                this.confirmBtn.removeEventListener('click', handleConfirm);
                resolve(false);
            };

            this.confirmBtn.addEventListener('click', handleConfirm);
            this.cancelBtn.onclick = handleCancel;

            this.modal.style.display = 'block';
        });
    }

    hide() {
        this.modal.style.display = 'none';
    }
}

// ============================================
// VALIDATION SYSTEM CLASS
// ============================================
class ValidationSystem {
    constructor() {
        this.rules = {
            required: (value) => value && value.toString().trim() !== '',
            email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            minLength: (value, length) => !value || value.length >= length,
            maxLength: (value, length) => !value || value.length <= length,
            phone: (value) => !value || /^[\+]?[0-9\s\-\(\)]{8,}$/.test(value),
            date: (value) => !value || !isNaN(Date.parse(value))
        };
    }

    validateField(element, rules = []) {
        const group = element.closest('.form-group');
        const errorElement = group.querySelector('.error-message');
        const value = element.value;
        
        let isValid = true;
        let errorMessage = '';

        for (const rule of rules) {
            if (typeof rule === 'string') {
                if (!this.rules[rule](value)) {
                    isValid = false;
                    errorMessage = this.getErrorMessage(rule, element);
                    break;
                }
            } else if (typeof rule === 'object') {
                if (!this.rules[rule.type](value, rule.value)) {
                    isValid = false;
                    errorMessage = this.getErrorMessage(rule.type, element, rule.value);
                    break;
                }
            }
        }

        if (isValid) {
            group.classList.remove('error');
            errorElement.textContent = '';
        } else {
            group.classList.add('error');
            errorElement.textContent = errorMessage;
        }

        return isValid;
    }

    getErrorMessage(rule, element, value) {
        const label = element.closest('.form-group').querySelector('label').textContent.replace(' *', '');
        
        const messages = {
            required: `${label} è obbligatorio`,
            email: `${label} deve essere un'email valida`,
            minLength: `${label} deve essere di almeno ${value} caratteri`,
            maxLength: `${label} non può superare ${value} caratteri`,
            phone: `${label} deve essere un numero di telefono valido`,
            date: `${label} deve essere una data valida`
        };

        return messages[rule] || `${label} non è valido`;
    }

    validateForm(form) {
        const requiredFields = ['commerciale', 'modalitaComm', 'nuovoCliente', 'data', 'cliente', 'luogo', 'rifProgetto'];
        let isValid = true;
        
        requiredFields.forEach(fieldName => {
            const element = form.querySelector(`#${fieldName}`);
            if (element && !this.validateField(element, ['required'])) {
                isValid = false;
            }
        });

        const lengthValidations = [
            {field: 'cliente', max: 100},
            {field: 'personaRif', max: 100},
            {field: 'luogo', max: 100},
            {field: 'provincia', max: 50},
            {field: 'rifProgetto', max: 500},
            {field: 'commenti', max: 1000}
        ];

        lengthValidations.forEach(({field, max}) => {
            const element = form.querySelector(`#${field}`);
            if (element && !this.validateField(element, [{type: 'maxLength', value: max}])) {
                isValid = false;
            }
        });

        const dataElement = form.querySelector('#data');
        if (dataElement && dataElement.value > new Date().toISOString().split('T')[0]) {
            const group = dataElement.closest('.form-group');
            const errorElement = group.querySelector('.error-message');
            group.classList.add('error');
            errorElement.textContent = 'La data non può essere futura';
            isValid = false;
        }

        return isValid;
    }
}

// ============================================
// IMPORT/EXPORT SYSTEM CLASS 
// ============================================
class ImportExportSystem {
    constructor() {
        this.supportedFormats = ['xlsx', 'xls', 'csv', 'json'];
        this.originalCommercialValues = new Set();
        this.originalModalityValues = new Set();
    }

    async processFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (!this.supportedFormats.includes(extension)) {
            throw new Error('Formato file non supportato');
        }

        const arrayBuffer = await file.arrayBuffer();
        
        switch (extension) {
            case 'xlsx':
            case 'xls':
                return this.processExcel(arrayBuffer);
            case 'csv':
                return this.processCSV(arrayBuffer);
            case 'json':
                return this.processJSON(arrayBuffer);
            default:
                throw new Error('Formato non riconosciuto');
        }
    }

    processExcel(arrayBuffer) {
        if (typeof XLSX === 'undefined') {
            throw new Error('Libreria XLSX non disponibile');
        }
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('🔍 DEBUG EXCEL RAW DATA:');
        console.log('📊 Record Excel trovati:', data.length);
        
        // ⭐ STAMPA PRIME RIGHE PER CAPIRE LA STRUTTURA
        data.slice(0, 3).forEach((row, index) => {
            console.log(`\n📝 Excel Record ${index + 1}:`);
            console.log('  Colonne:', Object.keys(row));
            Object.entries(row).forEach(([key, value]) => {
                console.log(`    "${key}" = "${value}"`);
            });
        });
        
        return this.debugAndValidateImportData(data);
    }

    // ⭐ MAPPING CORRETTO BASATO SUL FILE EXCEL
    debugAndValidateImportData(data) {
        console.log('\n🔍 INIZIO VALIDAZIONE DATI:');
        console.log('📊 Totale record da processare:', data.length);
        
        const commercialsFound = new Set();
        const modalitiesFound = new Set();
        
        // ⭐ ANALISI COLONNE DEL FILE EXCEL
        if (data.length > 0) {
            const firstRow = data[0];
            console.log('\n📋 STRUTTURA COLONNE EXCEL:');
            Object.keys(firstRow).forEach(key => {
                console.log(`  - "${key}"`);
            });
        }
        
        data.forEach((row, index) => {
            Object.entries(row).forEach(([key, value]) => {
                const keyLower = key.toLowerCase().trim();
                
                // Traccia commerciali
                if (keyLower.includes('commercial') || keyLower === 'commerciale') {
                    if (value) commercialsFound.add(String(value).trim());
                }
                
                // Traccia modalità
                if (keyLower.includes('modalit') || keyLower.includes('modality')) {
                    if (value) modalitiesFound.add(String(value).trim());
                }
            });
        });
        
        console.log('\n📋 VALORI TROVATI:');
        console.log('Commerciali:', Array.from(commercialsFound));
        console.log('Modalità:', Array.from(modalitiesFound));
        
        this.originalCommercialValues = new Set([...this.originalCommercialValues, ...commercialsFound]);
        this.originalModalityValues = new Set([...this.originalModalityValues, ...modalitiesFound]);
        
        const normalized = this.normalizeDataWithExactMapping(data);
        
        console.log('\n✅ RISULTATO NORMALIZZAZIONE:');
        console.log(`   Input: ${data.length} record`);
        console.log(`   Output: ${normalized.length} record`);
        console.log(`   Persi: ${data.length - normalized.length} record`);
        
        return normalized;
    }

    // ⭐ MAPPING ESATTO PER IL FILE "datidaimportareGENNAIO 2025.xlsx"
    normalizeDataWithExactMapping(data) {
        const validatedRecords = [];
        const errors = [];

        data.forEach((row, index) => {
            console.log(`\n🔍 Processing record ${index + 1}:`);
            
            // ⭐ STAMPA TUTTI I CAMPI DEL RECORD
            Object.entries(row).forEach(([key, value]) => {
                console.log(`    "${key}": "${value}"`);
            });

            const normalizedRow = {};
            
            // ⭐ MAPPING DIRETTO DELLE COLONNE (CASE INSENSITIVE)
            const rowKeys = Object.keys(row);
            
            // COMMERCIALE
            const commercialeKey = rowKeys.find(key => 
                key.toLowerCase().includes('commercial') || 
                key.toLowerCase() === 'commerciale'
            );
            if (commercialeKey && row[commercialeKey]) {
                normalizedRow.commerciale = String(row[commercialeKey]).trim();
                this.originalCommercialValues.add(normalizedRow.commerciale);
            }

            // MODALITÀ
            const modalitaKey = rowKeys.find(key => 
                key.toLowerCase().includes('modalit') || 
                key.toLowerCase().includes('modality') ||
                key.toLowerCase() === 'modalità'
            );
            if (modalitaKey && row[modalitaKey]) {
                normalizedRow.modalitaComm = String(row[modalitaKey]).trim();
                this.originalModalityValues.add(normalizedRow.modalitaComm);
            }

            // CLIENTE (CRITICAL!)
            const clienteKey = rowKeys.find(key => 
                key.toLowerCase() === 'cliente' ||
                key.toLowerCase() === 'client' ||
                key.toLowerCase() === 'customer' ||
                key.toLowerCase() === 'company' ||
                key.toLowerCase() === 'azienda'
            );
            if (clienteKey && row[clienteKey]) {
                normalizedRow.cliente = String(row[clienteKey]).trim();
            }

            // NUOVO CLIENTE
            const nuovoClienteKey = rowKeys.find(key => 
                key.toLowerCase().includes('nuovo') ||
                key.toLowerCase().includes('new') ||
                key.toLowerCase().includes('tipo')
            );
            if (nuovoClienteKey) {
                const value = String(row[nuovoClienteKey] || '').toLowerCase().trim();
                normalizedRow.nuovoCliente = ['nuovo', 'new', 'sì', 'si', 'yes', 'true', '1'].includes(value);
            }

            // DATA
            const dataKey = rowKeys.find(key => 
                key.toLowerCase() === 'data' ||
                key.toLowerCase() === 'date' ||
                key.toLowerCase() === 'datetime'
            );
            if (dataKey && row[dataKey]) {
                normalizedRow.data = this.parseExcelDate(row[dataKey]);
            } else {
                normalizedRow.data = new Date().toISOString().split('T')[0];
            }

            // LUOGO
            const luogoKey = rowKeys.find(key => 
                key.toLowerCase() === 'luogo' ||
                key.toLowerCase() === 'place' ||
                key.toLowerCase() === 'city' ||
                key.toLowerCase() === 'location'
            );
            if (luogoKey && row[luogoKey]) {
                normalizedRow.luogo = String(row[luogoKey]).trim();
            }

            // PROVINCIA
            const provinciaKey = rowKeys.find(key => 
                key.toLowerCase() === 'provincia' ||
                key.toLowerCase() === 'province' ||
                key.toLowerCase() === 'state'
            );
            if (provinciaKey && row[provinciaKey]) {
                normalizedRow.provincia = String(row[provinciaKey]).trim();
            }

            // TIPO
            const tipoKey = rowKeys.find(key => 
                key.toLowerCase() === 'tipo' && 
                !key.toLowerCase().includes('cliente') // Evita confusione con "tipo cliente"
            );
            if (tipoKey && row[tipoKey]) {
                normalizedRow.tipo = String(row[tipoKey]).trim().toUpperCase();
            }

            // PROGETTO
            const progettoKey = rowKeys.find(key => 
                key.toLowerCase().includes('progetto') ||
                key.toLowerCase().includes('project') ||
                key.toLowerCase().includes('description')
            );
            if (progettoKey && row[progettoKey]) {
                normalizedRow.rifProgetto = String(row[progettoKey]).trim();
            } else {
                normalizedRow.rifProgetto = 'Progetto importato da Excel';
            }

            // PERSONA DI RIFERIMENTO
            const personaKey = rowKeys.find(key => 
                key.toLowerCase().includes('persona') ||
                key.toLowerCase().includes('riferimento') ||
                key.toLowerCase().includes('contact')
            );
            if (personaKey && row[personaKey]) {
                normalizedRow.personaRif = String(row[personaKey]).trim();
            }

            // COMMENTI
            const commentiKey = rowKeys.find(key => 
                key.toLowerCase().includes('comment') ||
                key.toLowerCase().includes('note') ||
                key.toLowerCase().includes('osservaz')
            );
            if (commentiKey && row[commentiKey]) {
                normalizedRow.commenti = String(row[commentiKey]).trim();
            }

            // ⭐ VALIDAZIONE FINALE
            const isValid = normalizedRow.commerciale && 
                           normalizedRow.cliente && 
                           normalizedRow.data;

            console.log(`    ✅ Mappato - Cliente: "${normalizedRow.cliente}", Commerciale: "${normalizedRow.commerciale}"`);
            console.log(`    📊 Valido: ${isValid}`);

            if (isValid) {
                validatedRecords.push(normalizedRow);
                console.log(`    ✅ Record ${index + 1} AGGIUNTO`);
            } else {
                const error = `Record ${index + 1}: Campi mancanti - Cliente: "${normalizedRow.cliente}", Commerciale: "${normalizedRow.commerciale}"`;
                errors.push(error);
                console.log(`    ❌ Record ${index + 1} SCARTATO: ${error}`);
            }
        });
        
        console.log(`\n📊 RIEPILOGO FINALE:`);
        console.log(`   Records processati: ${data.length}`);
        console.log(`   Records validati: ${validatedRecords.length}`);
        console.log(`   Records scartati: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log(`\n❌ ERRORI:`, errors);
        }
        
        // Aggiorna dropdown
        this.updateHTMLDropdowns();
        
        return validatedRecords;
    }

    // ⭐ PARSING DATE MIGLIORATO
    parseExcelDate(value) {
        if (!value) return new Date().toISOString().split('T')[0];
        
        let parsedDate = null;
        
        // Formato italiano dd/mm/yyyy
        if (typeof value === 'string' && value.includes('/')) {
            const parts = value.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
            }
        } 
        // Excel serial date number
        else if (typeof value === 'number') {
            parsedDate = new Date((value - 25569) * 86400 * 1000);
        }
        // Altri formati
        else {
            parsedDate = new Date(value);
        }
        
        if (parsedDate && !isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
        } else {
            console.warn(`Data non valida: ${value}, uso data corrente`);
            return new Date().toISOString().split('T')[0];
        }
    }

    // ⭐ AGGIORNA DROPDOWN HTML
    updateHTMLDropdowns() {
        const commercialSelects = document.querySelectorAll('#commerciale, #commercialFilter');
        commercialSelects.forEach(select => {
            if (select) {
                const existingValues = new Set();
                select.querySelectorAll('option').forEach(option => {
                    if (option.value) existingValues.add(option.value);
                });
                
                this.originalCommercialValues.forEach(value => {
                    if (value && !existingValues.has(value)) {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = value;
                        select.appendChild(option);
                        console.log(`➕ Aggiunto commerciale: "${value}"`);
                    }
                });
            }
        });
        
        const modalitySelects = document.querySelectorAll('#modalitaComm, #modalityFilter');
        modalitySelects.forEach(select => {
            if (select) {
                const existingValues = new Set();
                select.querySelectorAll('option').forEach(option => {
                    if (option.value) existingValues.add(option.value);
                });
                
                this.originalModalityValues.forEach(value => {
                    if (value && !existingValues.has(value)) {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = value;
                        select.appendChild(option);
                        console.log(`➕ Aggiunta modalità: "${value}"`);
                    }
                });
            }
        });
        
        notifications.success('Dropdown aggiornati con valori dal file!');
    }

    // ⭐ CSV, JSON, EXPORT FUNCTIONS (mantieni quelle esistenti)
    processCSV(arrayBuffer) {
        const text = new TextDecoder('utf-8').decode(arrayBuffer);
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            throw new Error('File CSV vuoto');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseCSVLine(lines[i]);
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return this.normalizeDataWithExactMapping(data);
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    processJSON(arrayBuffer) {
        const text = new TextDecoder('utf-8').decode(arrayBuffer);
        
        try {
            const data = JSON.parse(text);
            return this.normalizeDataWithExactMapping(Array.isArray(data) ? data : [data]);
        } catch (error) {
            throw new Error('File JSON non valido');
        }
    }

    async exportToExcel(data, filename = 'contatti.xlsx') {
        if (typeof XLSX === 'undefined') {
            throw new Error('Libreria XLSX non disponibile');
        }
        
        console.log(`📤 EXPORT: Preparazione ${data.length} record per export Excel`);
        
        data.forEach((record, index) => {
            console.log(`Export Record ${index + 1}: Commerciale="${record['Commerciale']}", Cliente="${record['Cliente']}"`);
        });
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        
        const columnWidths = [
            { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 30 },
            { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 40 }, { wch: 10 }, { wch: 30 }
        ];
        worksheet['!cols'] = columnWidths;
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatti');
        
        workbook.Props = {
            Title: 'Export Contatti Aziendali',
            Subject: `Export generato il ${new Date().toLocaleDateString('it-IT')}`,
            CreatedDate: new Date()
        };
        
        XLSX.writeFile(workbook, filename);
        console.log(`✅ Export Excel completato: ${filename} con ${data.length} record`);
    }

    exportToCSV(data, filename = 'contatti.csv') {
        console.log(`📤 EXPORT CSV: ${data.length} record`);
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(row => 
            Object.values(row).map(value => 
                '"' + String(value || '').replace(/"/g, '""') + '"'
            ).join(',')
        );
        const csv = '\uFEFF' + headers + '\n' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, filename);
    }

    exportToJSON(data, filename = 'contatti.json') {
        console.log(`📤 EXPORT JSON: ${data.length} record`);
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        this.downloadBlob(blob, filename);
    }

    async exportToPDF(data, options = {}) {
        if (typeof window.jspdf === 'undefined') {
            throw new Error('Libreria jsPDF non disponibile');
        }
        
        console.log(`📤 EXPORT PDF: ${data.length} record`);
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        
        const year = domManager.elements.yearSelect.value;
        const month = parseInt(domManager.elements.monthSelect.value);
        const monthName = MONTHS[month - 1];
        
        doc.setFontSize(20);
        doc.text('Report Contatti Aziendali', 20, 20);
        doc.setFontSize(14);
        doc.text(`Periodo: ${monthName} ${year}`, 20, 30);
        doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, 20, 40);
        doc.text(`Totale record: ${data.length}`, 20, 50);
        
        doc.save(`report_contatti_${monthName}_${year}.pdf`);
    }

    downloadBlob(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    generateTemplate() {
        const sampleCommercial = this.originalCommercialValues.size > 0 ? 
            Array.from(this.originalCommercialValues)[0] : 'LUCA';
        const sampleModality = this.originalModalityValues.size > 0 ? 
            Array.from(this.originalModalityValues)[0] : 'TELEFONATA';
            
        const template = [{
            'commerciale': sampleCommercial,
            'modalitaComm': sampleModality,
            'nuovoCliente': 'Sì',
            'data': '01/01/2025',
            'cliente': 'Esempio S.r.l.',
            'personaRif': 'Mario Rossi',
            'luogo': 'Milano',
            'provincia': 'MI',
            'tipo': 'BSR',
            'rifProgetto': 'Progetto esempio per import',
            'commenti': 'Note di esempio'
        }];
        
        if (typeof XLSX !== 'undefined') {
            const worksheet = XLSX.utils.json_to_sheet(template);
            
            if (!worksheet['!cols']) worksheet['!cols'] = [];
            worksheet['!cols'][3] = { wch: 12 };
            
            if (worksheet['D2']) {
                worksheet['D2'].t = 'd';
                worksheet['D2'].z = 'dd/mm/yyyy';
                const [day, month, year] = template[0].data.split('/');
                worksheet['D2'].v = new Date(year, month - 1, day);
            }
            
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatti');
            
            workbook.Props = {
                Title: 'Template Import Contatti',
                Subject: 'Template aggiornato con valori reali dal sistema'
            };
            
            XLSX.writeFile(workbook, 'template_import_contatti.xlsx');
            notifications.success('Template generato!');
        } else {
            notifications.error('Impossibile generare il template Excel');
        }
    }

    getImportStats() {
        return {
            originalCommercials: Array.from(this.originalCommercialValues),
            originalModalities: Array.from(this.originalModalityValues),
            totalUniqueCommercials: this.originalCommercialValues.size,
            totalUniqueModalities: this.originalModalityValues.size
        };
    }
}

// ============================================
// INIZIALIZZAZIONE SISTEMI
// ============================================
const systemInstances = {
    notifications: null,
    confirm: null,
    validator: null,
    importExport: null,

    init() {
        this.notifications = new NotificationSystem();
        this.confirm = new ConfirmSystem();
        this.validator = new ValidationSystem();
        this.importExport = new ImportExportSystem(); // ⭐ Nuova versione che preserva valori

        this.confirm.init();

        // Rendi disponibili globalmente
        window.notifications = this.notifications;
        window.confirm = this.confirm;
        window.validator = this.validator;
        window.importExport = this.importExport;
        
        console.log('✅ System Instances inizializzati con Import/Export che PRESERVA i valori originali');
    }
};