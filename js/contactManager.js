/**
 * ============================================
 * CONTACT MANAGER - Gestione contatti CRUD con salvataggio basato su data (CORRETTO)
 * ============================================
 */

const contactManager = {
    /**
     * ⭐ NUOVA FUNZIONE: Estrae anno e mese da una data
     */
    extractYearMonthFromDate(dateString) {
        if (!dateString) return null;
        
        try {
            const date = new Date(dateString);
            return {
                year: date.getFullYear(),
                month: date.getMonth() + 1 // getMonth() restituisce 0-11, noi vogliamo 1-12
            };
        } catch (error) {
            console.error('Errore nell\'parsing della data:', error);
            return null;
        }
    },

    /**
     * ⭐ NUOVA FUNZIONE: Calcola il prossimo ID per un periodo specifico
     */
    async calculateNextIdForPeriod(year, month) {
        try {
            const data = await dataManager.getMonthData(year, month);
            if (data.length === 0) return 1;
            
            const maxId = Math.max(...data.map(c => c.id || 0));
            return maxId + 1;
        } catch (error) {
            console.error('Errore nel calcolo next ID:', error);
            return 1;
        }
    },

    /**
     * Salva il contatto (crea o modifica) con Firebase - VERSIONE CORRETTA per data
     */
    async saveContact(e) {
        e.preventDefault();
        
        if (!validator.validateForm(domManager.elements.contactForm)) {
            notifications.error('Controlla i campi evidenziati in rosso');
            return;
        }
        
        const contact = {
            commerciale: utilityFunctions.sanitizeInput(document.getElementById('commerciale').value),
            modalitaComm: utilityFunctions.sanitizeInput(document.getElementById('modalitaComm').value),
            nuovoCliente: document.getElementById('nuovoCliente').value === 'true',
            data: document.getElementById('data').value,
            cliente: utilityFunctions.sanitizeInput(document.getElementById('cliente').value.trim()),
            personaRif: utilityFunctions.sanitizeInput(document.getElementById('personaRif').value.trim()),
            luogo: utilityFunctions.sanitizeInput(document.getElementById('luogo').value.trim()),
            provincia: utilityFunctions.sanitizeInput(document.getElementById('provincia').value.trim()),
            tipo: document.getElementById('tipo').value,
            rifProgetto: utilityFunctions.sanitizeInput(document.getElementById('rifProgetto').value.trim()),
            commenti: utilityFunctions.sanitizeInput(document.getElementById('commenti').value.trim())
        };
        
        // ⭐ ESTRAI ANNO E MESE DALLA DATA DEL CONTATTO
        const contactPeriod = this.extractYearMonthFromDate(contact.data);
        if (!contactPeriod) {
            notifications.error('Data del contatto non valida');
            return;
        }
        
        console.log(`Contatto sarà salvato in: ${contactPeriod.month}/${contactPeriod.year}`);
        
        // UI Loading state
        const submitButton = domManager.elements.contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Salvando...';
        submitButton.disabled = true;
        
        try {
            let success = false;
            let isUpdate = false;
            
            if (currentEditId) {
                // ============================================
                // MODALITÀ MODIFICA
                // ============================================
                isUpdate = true;
                
                // ⭐ GESTIONE CAMBIO PERIODO IN MODIFICA
                // Trova il contatto originale per vedere se cambia periodo
                const originalContact = allContacts.find(c => c.id === currentEditId);
                if (!originalContact) {
                    throw new Error('Contatto da modificare non trovato');
                }
                
                const originalPeriod = this.extractYearMonthFromDate(originalContact.data);
                const newPeriod = contactPeriod;
                
                // Controlla se la data (e quindi il periodo) è cambiata
                const periodChanged = originalPeriod.year !== newPeriod.year || originalPeriod.month !== newPeriod.month;
                
                if (periodChanged) {
                    // ⭐ PERIODO CAMBIATO: Rimuovi dal vecchio periodo e aggiungi al nuovo
                    console.log(`Spostamento contatto da ${originalPeriod.month}/${originalPeriod.year} a ${newPeriod.month}/${newPeriod.year}`);
                    
                    // 1. Rimuovi dal periodo originale
                    success = await dataManager.removeContactFromPeriod(originalPeriod.year, originalPeriod.month, currentEditId);
                    if (!success) {
                        throw new Error('Errore nella rimozione dal periodo originale');
                    }
                    
                    // 2. Aggiungi al nuovo periodo
                    contact.id = await this.calculateNextIdForPeriod(newPeriod.year, newPeriod.month);
                    success = await dataManager.addContactToPeriod(newPeriod.year, newPeriod.month, contact);
                    if (!success) {
                        throw new Error('Errore nell\'aggiunta al nuovo periodo');
                    }
                    
                    notifications.success(`Contatto spostato a ${MONTHS[newPeriod.month-1]} ${newPeriod.year}!`);
                    
                } else {
                    // ⭐ STESSO PERIODO: Modifica normale
                    contact.id = currentEditId;
                    success = await dataManager.updateContactInPeriod(newPeriod.year, newPeriod.month, contact);
                    if (!success) {
                        throw new Error('Errore nella modifica del contatto');
                    }
                    
                    notifications.success('Contatto modificato con successo!');
                }
                
            } else {
                // ============================================
                // MODALITÀ CREAZIONE
                // ============================================
                isUpdate = false;
                
                // ⭐ CALCOLA ID PER IL PERIODO SPECIFICO DELLA DATA
                contact.id = await this.calculateNextIdForPeriod(contactPeriod.year, contactPeriod.month);
                
                // ⭐ SALVA NEL PERIODO CORRISPONDENTE ALLA DATA
                success = await dataManager.addContactToPeriod(contactPeriod.year, contactPeriod.month, contact);
                
                if (success) {
                    const monthName = MONTHS[contactPeriod.month - 1];
                    notifications.success(`Nuovo contatto aggiunto a ${monthName} ${contactPeriod.year}!`);
                } else {
                    throw new Error('Errore nel salvataggio del nuovo contatto');
                }
            }
            
            // ⭐ AGGIORNA UI SOLO SE SIAMO NEL PERIODO DEL CONTATTO
            const currentDisplayYear = parseInt(domManager.elements.yearSelect.value);
            const currentDisplayMonth = parseInt(domManager.elements.monthSelect.value);
            
            if (contactPeriod.year === currentDisplayYear && contactPeriod.month === currentDisplayMonth) {
                // Siamo visualizzando il periodo del contatto: aggiorna immediatamente
                await dataManager.loadData();
            } else {
                // Siamo in un altro periodo: mostra notifica informativa
                const monthName = MONTHS[contactPeriod.month - 1];
                notifications.info(`Per vedere il contatto, vai a ${monthName} ${contactPeriod.year}`);
            }
            
            this.closeModal();
            
        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            
            // Mostra messaggio di errore specifico
            if (error.message.includes('Firebase')) {
                notifications.error('Errore di connessione al database. Riprova.');
            } else if (error.message.includes('non trovato')) {
                notifications.error('Contatto non trovato. Ricarica la pagina.');
            } else {
                notifications.error(`Errore nel salvataggio: ${error.message}`);
            }
            
        } finally {
            // Ripristina UI
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    },

    /**
     * Elimina un contatto con Firebase - VERSIONE CORRETTA per data
     */
    async deleteContact(id) {
        const contact = allContacts.find(c => c.id === id);
        if (!contact) {
            notifications.error('Contatto non trovato');
            return;
        }
        
        const confirmed = await confirm.show({
            title: 'Elimina Contatto',
            message: `Sei sicuro di voler eliminare il contatto "${contact.cliente}"? Questa azione non può essere annullata.`,
            type: 'danger',
            confirmText: 'Elimina',
            cancelText: 'Annulla'
        });
        
        if (!confirmed) return;
        
        try {
            // ⭐ TROVA IL PERIODO DEL CONTATTO DALLA SUA DATA
            const contactPeriod = this.extractYearMonthFromDate(contact.data);
            if (!contactPeriod) {
                throw new Error('Data del contatto non valida');
            }
            
            // ⭐ RIMUOVI DAL PERIODO CORRETTO
            const success = await dataManager.removeContactFromPeriod(contactPeriod.year, contactPeriod.month, id);
            
            if (success) {
                // ⭐ AGGIORNA UI SOLO SE SIAMO NEL PERIODO DEL CONTATTO
                const currentDisplayYear = parseInt(domManager.elements.yearSelect.value);
                const currentDisplayMonth = parseInt(domManager.elements.monthSelect.value);
                
                if (contactPeriod.year === currentDisplayYear && contactPeriod.month === currentDisplayMonth) {
                    // Siamo visualizzando il periodo del contatto: aggiorna immediatamente
                    await dataManager.loadData();
                }
                
                notifications.success('Contatto eliminato con successo!');
            } else {
                throw new Error('Errore nel salvataggio dopo eliminazione');
            }
            
        } catch (error) {
            console.error('Errore nell\'eliminazione:', error);
            notifications.error('Errore nell\'eliminazione del contatto');
        }
    },

    /**
     * Apre il modal per creare/modificare un contatto
     */
    openModal(contact = null) {
        currentEditId = contact ? contact.id : null;
        hasUnsavedChanges = false;
        
        domManager.elements.modalTitle.textContent = contact ? 'Modifica Contatto' : 'Nuovo Contatto';
        
        // Reset errori
        domManager.elements.contactForm.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error');
            const errorElement = group.querySelector('.error-message');
            if (errorElement) errorElement.textContent = '';
        });
        
        if (contact) {
            // MODALITÀ MODIFICA: Compila form con dati esistenti
            const formElements = {
                commerciale: contact.commerciale || '',
                modalitaComm: contact.modalitaComm || '',
                nuovoCliente: String(contact.nuovoCliente),
                data: contact.data || '',
                cliente: contact.cliente || '',
                personaRif: contact.personaRif || '',
                luogo: contact.luogo || '',
                provincia: contact.provincia || '',
                tipo: contact.tipo || '',
                rifProgetto: contact.rifProgetto || '',
                commenti: contact.commenti || ''
            };
            
            Object.entries(formElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.value = value;
            });
        } else {
            // MODALITÀ NUOVO CONTATTO
            domManager.elements.contactForm.reset();
            
            // ⭐ NUOVA LOGICA: Imposta la data odierna
            const today = new Date();
            const todayString = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            
            const dataElement = document.getElementById('data');
            if (dataElement) {
                dataElement.value = todayString;
            }
            
            console.log(`📅 Data odierna impostata automaticamente: ${todayString}`);
        }
        
        domManager.elements.modal.style.display = 'block';
        
        // Focus primo input
        setTimeout(() => {
            const firstInput = domManager.elements.contactForm.querySelector('select, input');
            if (firstInput) firstInput.focus();
        }, 100);
    },

    /**
     * Chiude il modal con controllo modifiche non salvate
     */
    async handleCloseModal() {
        if (hasUnsavedChanges) {
            const confirmed = await confirm.show({
                title: 'Modifiche non salvate',
                message: 'Hai delle modifiche non salvate. Vuoi davvero chiudere senza salvare?',
                type: 'warning',
                confirmText: 'Chiudi senza salvare',
                cancelText: 'Continua modifica'
            });
            
            if (!confirmed) return;
        }
        
        this.closeModal();
    },

    /**
     * Chiude il modal
     */
    closeModal() {
        domManager.elements.modal.style.display = 'none';
        currentEditId = null;
        hasUnsavedChanges = false;
    },

    /**
     * Modifica un contatto esistente
     */
    editContact(id) {
        const contact = allContacts.find(c => c.id === id);
        if (contact) {
            this.openModal(contact);
        } else {
            notifications.error('Contatto non trovato');
        }
    },

    /**
     * Valida un singolo campo del form
     */
    validateSingleField(input) {
        const fieldName = input.id;
        const rules = [];

        if (['commerciale', 'modalitaComm', 'nuovoCliente', 'data', 'cliente', 'luogo', 'rifProgetto'].includes(fieldName)) {
            rules.push('required');
        }

        const maxLengths = {
            cliente: 100, personaRif: 100, luogo: 100, provincia: 50, rifProgetto: 500, commenti: 1000
        };

        if (maxLengths[fieldName]) {
            rules.push({type: 'maxLength', value: maxLengths[fieldName]});
        }

        return validator.validateField(input, rules);
    },

    /**
     * Rimuove errore dal campo se ha valore
     */
    clearFieldError(input) {
        const group = input.closest('.form-group');
        if (group && group.classList.contains('error') && input.value.trim()) {
            group.classList.remove('error');
            const errorElement = group.querySelector('.error-message');
            if (errorElement) errorElement.textContent = '';
        }
    }
};
