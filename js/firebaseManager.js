/**
 * ============================================
 * FIREBASE MANAGER - Gestione database Firebase
 * ============================================
 */

const firebaseManager = {
    db: null,
    auth: null,
    isOnline: true,
    syncQueue: [],

    /**
     * Inizializza Firebase Manager
     */
    init() {
        try {
            this.db = window.db;
            this.auth = window.auth;
            
            if (!this.db) {
                throw new Error('Database Firebase non disponibile');
            }
            
            // Monitora stato connessione
            this.setupConnectionMonitoring();
            
            // Abilita persistenza offline
            this.enableOfflinePersistence();
            
            // Carica coda di sincronizzazione
            this.loadSyncQueue();
            
            console.log('Firebase Manager inizializzato correttamente');
            return true;
        } catch (error) {
            console.error('Errore nell\'inizializzazione Firebase Manager:', error);
            return false;
        }
    },

    /**
     * Abilita persistenza offline
     */
    async enableOfflinePersistence() {
        try {
            await this.db.enablePersistence();
            console.log('Persistenza offline abilitata');
        } catch (error) {
            if (error.code === 'failed-precondition') {
                console.warn('Persistenza non disponibile: più tab aperti');
            } else if (error.code === 'unimplemented') {
                console.warn('Browser non supporta persistenza offline');
            }
        }
    },

    /**
     * Monitora stato connessione
     */
    setupConnectionMonitoring() {
        // Monitora stato online/offline
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Connessione ripristinata');
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Connessione persa');
        });
    },

    /**
     * Salva contatti per un periodo specifico
     */
    async saveContacts(year, month, contacts) {
        const docId = `${year}_${month}`;
        const data = {
            contacts: contacts,
            lastModified: firebase.firestore.FieldValue.serverTimestamp(),
            year: parseInt(year),
            month: parseInt(month),
            totalContacts: contacts.length
        };

        try {
            await this.db.collection('contatti').doc(docId).set(data);
            console.log(`Contatti salvati per ${month}/${year}: ${contacts.length} elementi`);
            return true;
        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            
            // Se offline, aggiungi alla coda di sincronizzazione
            if (!this.isOnline) {
                this.addToSyncQueue('save', { docId, data });
                console.log('Salvato in coda di sincronizzazione');
                return true;
            }
            
            return false;
        }
    },

    /**
     * Carica contatti per un periodo specifico
     */
    async loadContacts(year, month) {
        const docId = `${year}_${month}`;

        try {
            const doc = await this.db.collection('contatti').doc(docId).get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log(`Contatti caricati per ${month}/${year}: ${data.contacts.length} elementi`);
                return {
                    contacts: data.contacts || [],
                    lastModified: data.lastModified,
                    nextId: this.calculateNextId(data.contacts || [])
                };
            } else {
                console.log(`Nessun dato trovato per ${month}/${year}`);
                return {
                    contacts: [],
                    lastModified: null,
                    nextId: 1
                };
            }
        } catch (error) {
            console.error('Errore nel caricamento:', error);
            throw error;
        }
    },

    /**
     * Aggiunge un singolo contatto
     */
    async addContact(year, month, contact) {
        const docId = `${year}_${month}`;

        try {
            // Usa una transazione per garantire consistenza
            await this.db.runTransaction(async (transaction) => {
                const docRef = this.db.collection('contatti').doc(docId);
                const doc = await transaction.get(docRef);
                
                let contacts = [];
                if (doc.exists) {
                    contacts = doc.data().contacts || [];
                }
                
                // Aggiungi il nuovo contatto
                contacts.push(contact);
                
                const data = {
                    contacts: contacts,
                    lastModified: firebase.firestore.FieldValue.serverTimestamp(),
                    year: parseInt(year),
                    month: parseInt(month),
                    totalContacts: contacts.length
                };
                
                transaction.set(docRef, data);
            });

            console.log('Contatto aggiunto con successo');
            return true;
        } catch (error) {
            console.error('Errore nell\'aggiunta del contatto:', error);
            
            if (!this.isOnline) {
                this.addToSyncQueue('addContact', { year, month, contact });
                return true;
            }
            
            return false;
        }
    },

    /**
     * Aggiorna un contatto esistente
     */
    async updateContact(year, month, contactId, updatedContact) {
        const docId = `${year}_${month}`;

        try {
            await this.db.runTransaction(async (transaction) => {
                const docRef = this.db.collection('contatti').doc(docId);
                const doc = await transaction.get(docRef);
                
                if (!doc.exists) {
                    throw new Error('Documento non trovato');
                }
                
                let contacts = doc.data().contacts || [];
                const index = contacts.findIndex(c => c.id === contactId);
                
                if (index === -1) {
                    throw new Error('Contatto non trovato');
                }
                
                contacts[index] = updatedContact;
                
                const data = {
                    contacts: contacts,
                    lastModified: firebase.firestore.FieldValue.serverTimestamp(),
                    year: parseInt(year),
                    month: parseInt(month),
                    totalContacts: contacts.length
                };
                
                transaction.set(docRef, data);
            });

            console.log('Contatto aggiornato con successo');
            return true;
        } catch (error) {
            console.error('Errore nell\'aggiornamento del contatto:', error);
            
            if (!this.isOnline) {
                this.addToSyncQueue('updateContact', { year, month, contactId, updatedContact });
                return true;
            }
            
            return false;
        }
    },

    /**
     * Elimina un contatto
     */
    async deleteContact(year, month, contactId) {
        const docId = `${year}_${month}`;

        try {
            await this.db.runTransaction(async (transaction) => {
                const docRef = this.db.collection('contatti').doc(docId);
                const doc = await transaction.get(docRef);
                
                if (!doc.exists) {
                    throw new Error('Documento non trovato');
                }
                
                let contacts = doc.data().contacts || [];
                contacts = contacts.filter(c => c.id !== contactId);
                
                const data = {
                    contacts: contacts,
                    lastModified: firebase.firestore.FieldValue.serverTimestamp(),
                    year: parseInt(year),
                    month: parseInt(month),
                    totalContacts: contacts.length
                };
                
                transaction.set(docRef, data);
            });

            console.log('Contatto eliminato con successo');
            return true;
        } catch (error) {
            console.error('Errore nell\'eliminazione del contatto:', error);
            
            if (!this.isOnline) {
                this.addToSyncQueue('deleteContact', { year, month, contactId });
                return true;
            }
            
            return false;
        }
    },

    /**
     * Coda di sincronizzazione per modalità offline
     */
    addToSyncQueue(operation, data) {
        this.syncQueue.push({
            operation,
            data,
            timestamp: Date.now()
        });
        
        // Salva la coda nel localStorage
        try {
            localStorage.setItem('firebase_sync_queue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.warn('Impossibile salvare la coda di sincronizzazione');
        }
    },

    /**
     * Processa la coda di sincronizzazione
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        let successCount = 0;
        
        for (const item of queue) {
            try {
                switch (item.operation) {
                    case 'save':
                        await this.db.collection('contatti').doc(item.data.docId).set(item.data.data);
                        break;
                    case 'addContact':
                        await this.addContact(item.data.year, item.data.month, item.data.contact);
                        break;
                    case 'updateContact':
                        await this.updateContact(item.data.year, item.data.month, item.data.contactId, item.data.updatedContact);
                        break;
                    case 'deleteContact':
                        await this.deleteContact(item.data.year, item.data.month, item.data.contactId);
                        break;
                }
                successCount++;
            } catch (error) {
                console.error('Errore nella sincronizzazione:', error);
                // Rimetti l'elemento nella coda se fallisce
                this.syncQueue.push(item);
            }
        }
        
        if (successCount > 0) {
            console.log(`${successCount} operazioni sincronizzate con successo!`);
        }
        
        // Aggiorna localStorage con la coda rimanente
        try {
            localStorage.setItem('firebase_sync_queue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.warn('Impossibile salvare la coda di sincronizzazione');
        }
    },

    /**
     * Carica coda di sincronizzazione da localStorage
     */
    loadSyncQueue() {
        try {
            const saved = localStorage.getItem('firebase_sync_queue');
            if (saved) {
                this.syncQueue = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Errore nel caricamento della coda di sincronizzazione');
            this.syncQueue = [];
        }
    },

    /**
     * Calcola il prossimo ID disponibile
     */
    calculateNextId(contacts) {
        if (contacts.length === 0) return 1;
        const maxId = Math.max(...contacts.map(c => c.id || 0));
        return maxId + 1;
    },

    /**
     * Migrazione da localStorage a Firebase
     */
    async migrateFromLocalStorage() {
        try {
            let migratedCount = 0;
            const localStorageKeys = [];
            
            // Trova tutte le chiavi di contatti nel localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('contacts_')) {
                    localStorageKeys.push(key);
                }
            }
            
            // Migra ogni dataset
            for (const key of localStorageKeys) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.contacts && data.contacts.length > 0) {
                        const [, year, month] = key.split('_');
                        
                        // Controlla se esistono già dati su Firebase per questo periodo
                        const existingData = await this.loadContacts(year, month);
                        
                        if (existingData.contacts.length === 0) {
                            // Migra solo se Firebase è vuoto per questo periodo
                            await this.saveContacts(year, month, data.contacts);
                            migratedCount++;
                            console.log(`Migrato periodo ${month}/${year}: ${data.contacts.length} contatti`);
                        }
                    }
                } catch (error) {
                    console.warn(`Errore nella migrazione di ${key}:`, error);
                }
            }
            
            return migratedCount;
        } catch (error) {
            console.error('Errore nella migrazione:', error);
            return 0;
        }
    }
};