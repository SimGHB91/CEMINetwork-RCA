/**
 * ============================================
 * MAIN.JS - File principale SOLO Firebase con Sincronizzazione HTML (COMPLETO AGGIORNATO)
 * ============================================
 */

'use strict';

// Variabili globali
let allContacts = [];
let filteredContacts = [];
let currentEditId = null;
let nextId = 1;
let currentPage = 1;
let pageSize = 25;
let hasUnsavedChanges = false;
let importData = [];
let activeFilters = {};

// Charts instances
let clientTypeChart = null;
let commercialChart = null;
let trendChart = null;

// Costanti
const MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const STORAGE_KEYS = {
    CONTACTS: (year, month) => `contacts_${year}_${month}`,
    FILTER_PRESETS: 'filterPresets',
    USER_PREFERENCES: 'userPreferences'
};

/**
 * ============================================
 * FUNZIONI DI SINCRONIZZAZIONE HTML
 * ============================================
 */

/**
 * ⭐ NUOVA FUNZIONE: Sincronizza dropdown HTML con dati reali
 */
async function syncHTMLWithFirebaseData() {
    console.log('🔄 Sincronizzazione dropdown HTML con dati Firebase...');
    
    try {
        // Ottieni tutti i periodi con dati da Firebase
        const periodsWithData = await dataManager.getAllPeriodsWithData();
        
        const allCommercials = new Set();
        const allModalities = new Set();
        
        // Raccogli tutti i valori unici da tutti i periodi
        for (const period of periodsWithData) {
            const data = await firebaseManager.loadContacts(period.year, period.month);
            const contacts = data.contacts || [];
            
            contacts.forEach(contact => {
                if (contact.commerciale) {
                    allCommercials.add(contact.commerciale);
                }
                if (contact.modalitaComm) {
                    allModalities.add(contact.modalitaComm);
                }
            });
        }
        
        console.log(`📊 Valori unici trovati: ${allCommercials.size} commerciali, ${allModalities.size} modalità`);
        
        // Aggiorna dropdown commerciali
        updateDropdownOptions('#commerciale', allCommercials, 'Seleziona...');
        updateDropdownOptions('#commercialFilter', allCommercials, 'Tutti i commerciali', 'all');
        
        // Aggiorna dropdown modalità
        updateDropdownOptions('#modalitaComm', allModalities, 'Seleziona...');
        updateDropdownOptions('#modalityFilter', allModalities, 'Tutte le modalità', 'all');
        
        console.log('✅ Sincronizzazione HTML completata');
        
        if (allCommercials.size > 0 || allModalities.size > 0) {
            notifications.success(`Dropdown aggiornati: ${allCommercials.size} commerciali, ${allModalities.size} modalità`);
        }
        
        return {
            commercials: Array.from(allCommercials),
            modalities: Array.from(allModalities)
        };
        
    } catch (error) {
        console.error('❌ Errore sincronizzazione HTML:', error);
        notifications.error('Errore nella sincronizzazione dei dropdown');
        return null;
    }
}

/**
 * ⭐ FUNZIONE DI SUPPORTO: Aggiorna opzioni dropdown
 */
function updateDropdownOptions(selector, valuesSet, defaultText, defaultValue = '') {
    const select = document.querySelector(selector);
    if (!select) {
        console.warn(`⚠️ Dropdown ${selector} non trovato`);
        return;
    }
    
    // Mantieni valore attualmente selezionato
    const currentValue = select.value;
    
    // Ottieni opzioni esistenti
    const existingValues = new Set();
    select.querySelectorAll('option').forEach(option => {
        if (option.value && option.value !== 'all') {
            existingValues.add(option.value);
        }
    });
    
    // Aggiungi nuove opzioni
    let addedCount = 0;
    valuesSet.forEach(value => {
        if (value && !existingValues.has(value)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
            addedCount++;
        }
    });
    
    // Ripristina valore selezionato se ancora valido
    if (currentValue && (currentValue === defaultValue || valuesSet.has(currentValue))) {
        select.value = currentValue;
    }
    
    console.log(`➕ ${selector}: aggiunte ${addedCount} nuove opzioni`);
    
    return addedCount;
}

/**
 * ⭐ FUNZIONE DIAGNOSTICA: Verifica coerenza dati
 */
async function verifyDataConsistency() {
    console.log('🔍 VERIFICA COERENZA DATI...');
    
    const report = {
        timestamp: new Date().toISOString(),
        currentPeriod: {
            year: domManager.elements.yearSelect.value,
            month: domManager.elements.monthSelect.value
        },
        allContacts: allContacts.length,
        filteredContacts: filteredContacts.length,
        issues: []
    };
    
    // Verifica 1: Record duplicati
    const ids = allContacts.map(c => c.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
        report.issues.push(`ID duplicati: ${duplicateIds.join(', ')}`);
    }
    
    // Verifica 2: Campi obbligatori mancanti
    const missingFields = allContacts.filter(c => !c.commerciale || !c.cliente || !c.data);
    if (missingFields.length > 0) {
        report.issues.push(`${missingFields.length} record con campi obbligatori mancanti`);
    }
    
    // Verifica 3: Date non valide
    const invalidDates = allContacts.filter(c => {
        if (!c.data) return false;
        const date = new Date(c.data);
        return isNaN(date.getTime());
    });
    if (invalidDates.length > 0) {
        report.issues.push(`${invalidDates.length} record con date non valide`);
    }
    
    // Verifica 4: Commerciali non standard
    const allCommercials = new Set(allContacts.map(c => c.commerciale).filter(Boolean));
    report.uniqueCommercials = Array.from(allCommercials);
    
    // Verifica 5: Modalità non standard  
    const allModalities = new Set(allContacts.map(c => c.modalitaComm).filter(Boolean));
    report.uniqueModalities = Array.from(allModalities);
    
    console.log('📋 REPORT COERENZA:', report);
    
    if (report.issues.length === 0) {
        notifications.success('✅ Verifica coerenza: nessun problema trovato');
    } else {
        notifications.warning(`⚠️ Trovati ${report.issues.length} problemi di coerenza`);
        console.warn('❌ Problemi trovati:', report.issues);
    }
    
    return report;
}

/**
 * ============================================
 * INIZIALIZZAZIONE SISTEMA CON SINCRONIZZAZIONE
 * ============================================
 */

// ⭐ INIZIALIZZAZIONE PRINCIPALE CON SINCRONIZZAZIONE
async function initWithSync() {
    try {
        console.log('🚀 Inizializzazione sistema SOLO Firebase con sincronizzazione...');
        
        // PULIZIA LOCALSTORAGE ALL'AVVIO
        clearLocalStorageContacts();
        
        // Inizializza i sistemi principali
        domManager.init();
        systemInstances.init();
        
        // Attendi che Firebase sia disponibile
        await waitForFirebase();
        
        // Inizializza Firebase Manager
        const firebaseInitialized = firebaseManager.init();
        if (!firebaseInitialized) {
            throw new Error('Firebase Manager non inizializzato');
        }
        
        // Configura data corrente
        setCurrentDate();
        
        // IMPORTANTE: Aggiorna subito il display del periodo per applicare gli stili
        domManager.updatePeriod();
        
        // Inizializza event listeners
        eventManager.initAllListeners();
        
        // ⭐ SINCRONIZZAZIONE DROPDOWN con dati Firebase
        await syncHTMLWithFirebaseData();
        
        // Carica dati del periodo corrente DA FIREBASE
        await dataManager.loadData();
        
        // ⭐ VERIFICA COERENZA OPZIONALE
        if (allContacts.length > 0) {
            await verifyDataConsistency();
        }
        
        // Avvia sincronismo automatico calendario
        domManager.startCalendarSync();
        
        // Carica preferenze utente (solo quelle non relative ai contatti)
        loadUserPreferences();
        
        notifications.success('Sistema inizializzato e sincronizzato con successo!');
        
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione:', error);
        notifications.error('Errore durante l\'inizializzazione del sistema');
        
        // NON usare fallback localStorage - mostra solo errore
        showFirebaseError();
    }
}

/**
 * ============================================
 * FUNZIONI DI SUPPORTO
 * ============================================
 */

// NUOVA FUNZIONE: Pulisce tutti i dati contatti dal localStorage
function clearLocalStorageContacts() {
    console.log('🧹 Pulizia localStorage contatti...');
    
    const keysToRemove = [];
    
    // Trova tutte le chiavi relative ai contatti
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('contacts_')) {
            keysToRemove.push(key);
        }
    }
    
    // Rimuovi le chiavi trovate
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Rimossa chiave localStorage: ${key}`);
    });
    
    // Rimuovi anche eventuali backup automatici di contatti
    localStorage.removeItem('autoBackup');
    
    if (keysToRemove.length > 0) {
        console.log(`✅ Puliti ${keysToRemove.length} dataset di contatti dal localStorage`);
    }
}

// NUOVA FUNZIONE: Mostra errore se Firebase non funziona
function showFirebaseError() {
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        padding: 40px;
        border-radius: 15px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        text-align: center;
        z-index: 10000;
        max-width: 500px;
    `;
    
    errorContainer.innerHTML = `
        <div style="color: #e74c3c; font-size: 60px; margin-bottom: 20px;">⚠️</div>
        <h2 style="color: #2c3e50; margin-bottom: 15px;">Errore di Connessione</h2>
        <p style="color: #7f8c8d; margin-bottom: 25px; line-height: 1.6;">
            Impossibile connettersi al database Firebase.<br>
            Controlla la connessione internet e ricarica la pagina.
        </p>
        <button onclick="location.reload()" style="
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
        ">Ricarica Pagina</button>
    `;
    
    document.body.appendChild(errorContainer);
    
    // Crea overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(44, 62, 80, 0.8);
        z-index: 9999;
    `;
    document.body.appendChild(overlay);
}

// Attende che Firebase sia disponibile
async function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkFirebase = () => {
            attempts++;
            
            if (window.firebase && window.db) {
                console.log('✅ Firebase caricato correttamente');
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('Timeout nel caricamento di Firebase'));
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        
        checkFirebase();
    });
}

function setCurrentDate() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (domManager.elements.yearSelect) {
        domManager.elements.yearSelect.value = currentYear;
    }
    
    if (domManager.elements.monthSelect) {
        domManager.elements.monthSelect.value = currentMonth;
    }
    
    console.log(`📅 Data corrente impostata: ${currentMonth}/${currentYear}`);
}

function loadUserPreferences() {
    try {
        const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
        if (prefs) {
            const preferences = JSON.parse(prefs);
            
            if (preferences.pageSize && domManager.elements.pageSizeSelect) {
                domManager.elements.pageSizeSelect.value = preferences.pageSize;
                pageSize = parseInt(preferences.pageSize);
            }
            
            if (preferences.filtersExpanded && domManager.elements.filtersContent) {
                filterManager.toggleAdvancedFilters();
            }
        }
    } catch (error) {
        console.warn('⚠️ Errore nel caricamento delle preferenze:', error);
    }
}

function saveUserPreferences() {
    try {
        const preferences = {
            pageSize: pageSize,
            filtersExpanded: domManager.elements.filtersContent?.classList.contains('show'),
            lastUsed: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
        console.warn('⚠️ Errore nel salvataggio delle preferenze:', error);
    }
}

/**
 * ============================================
 * EVENT LISTENERS GLOBALI
 * ============================================
 */

// Gestione errori globali
window.addEventListener('error', (event) => {
    console.error('❌ Errore JavaScript:', event.error);
    notifications.error('Si è verificato un errore imprevisto');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejettata:', event.reason);
    notifications.error('Errore nell\'elaborazione dei dati');
});

// Cleanup
window.addEventListener('beforeunload', () => {
    saveUserPreferences();
});

/**
 * ============================================
 * COMANDI CONSOLE PER SVILUPPATORI
 * ============================================
 */

// ⭐ COMANDO MANUALE per sviluppatori (da console)
window.syncHTML = syncHTMLWithFirebaseData;
window.verifyData = verifyDataConsistency;
window.debugExport = () => exportManager.exportDebugData();

/**
 * ============================================
 * AVVIO APPLICAZIONE
 * ============================================
 */

// ⭐ AVVIO CON SINCRONIZZAZIONE
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWithSync);
} else {
    initWithSync();
}

/**
 * ============================================
 * ESPORTAZIONI GLOBALI
 * ============================================
 */

// Esporta funzioni globali necessarie
window.editContact = contactManager.editContact;
window.deleteContact = contactManager.deleteContact;
window.removeFilter = filterManager.removeFilter;