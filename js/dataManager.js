/**
 * ============================================
 * DATA MANAGER - Gestione dati multi-periodo basata su data (CORRETTO)
 * ============================================
 */

const dataManager = {
  /**
   * Carica i dati dal Firebase per il periodo selezionato
   */
  async loadData() {
    const year = domManager.elements.yearSelect.value;
    const month = domManager.elements.monthSelect.value;

    try {
      console.log(`Caricamento dati da Firebase per ${month}/${year}...`);

      const data = await firebaseManager.loadContacts(year, month);

      allContacts = data.contacts || [];
      nextId = data.nextId || 1;

      console.log(`Dati caricati da Firebase: ${allContacts.length} contatti`);

      currentPage = 1;
      filterManager.applyAdvancedFilters();
      chartManager.updateCharts();
      trendManager.updateTrends();

      // IMPORTANTE: Aggiorna anche il display del periodo dopo il caricamento
      // per assicurarsi che gli stili siano applicati correttamente
      domManager.updatePeriod();

      // Mostra notifica solo se ci sono contatti
      if (allContacts.length > 0) {
        notifications.success(`Caricati ${allContacts.length} contatti per ${MONTHS[month-1]} ${year}`);
      } else {
        console.log(`Nessun contatto trovato per ${MONTHS[month-1]} ${year}`);
      }

    } catch (error) {
      console.error('Errore nel caricamento dei dati da Firebase:', error);
      notifications.error('Errore nel caricamento dei dati dal database Firebase');
      
      // NON fare fallback a localStorage - mantieni array vuoti
      allContacts = [];
      nextId = 1;
      currentPage = 1;
      filterManager.applyAdvancedFilters();
      chartManager.updateCharts();
      trendManager.updateTrends();
      
      // Aggiorna comunque il periodo per gli stili
      domManager.updatePeriod();
    }
  },

  /**
   * ⭐ NUOVA FUNZIONE: Aggiunge un contatto a un periodo specifico
   */
  async addContactToPeriod(year, month, contact) {
    try {
      console.log(`Aggiunta contatto al periodo ${month}/${year}:`, contact.cliente);
      
      // Carica i dati del periodo target
      const periodData = await firebaseManager.loadContacts(year, month);
      let periodContacts = periodData.contacts || [];
      
      // Aggiungi il nuovo contatto
      periodContacts.push(contact);
      
      // Salva il periodo aggiornato
      const success = await firebaseManager.saveContacts(year, month, periodContacts);
      
      if (success) {
        console.log(`Contatto aggiunto con successo al periodo ${month}/${year}`);
        return true;
      } else {
        console.error(`Errore nel salvataggio del periodo ${month}/${year}`);
        return false;
      }
      
    } catch (error) {
      console.error(`Errore nell'aggiunta contatto al periodo ${month}/${year}:`, error);
      return false;
    }
  },

  /**
   * ⭐ NUOVA FUNZIONE: Rimuove un contatto da un periodo specifico
   */
  async removeContactFromPeriod(year, month, contactId) {
    try {
      console.log(`Rimozione contatto ID ${contactId} dal periodo ${month}/${year}`);
      
      // Carica i dati del periodo target
      const periodData = await firebaseManager.loadContacts(year, month);
      let periodContacts = periodData.contacts || [];
      
      // Rimuovi il contatto
      const originalLength = periodContacts.length;
      periodContacts = periodContacts.filter(c => c.id !== contactId);
      
      if (periodContacts.length === originalLength) {
        console.warn(`Contatto ID ${contactId} non trovato nel periodo ${month}/${year}`);
        return false;
      }
      
      // Salva il periodo aggiornato
      const success = await firebaseManager.saveContacts(year, month, periodContacts);
      
      if (success) {
        console.log(`Contatto rimosso con successo dal periodo ${month}/${year}`);
        return true;
      } else {
        console.error(`Errore nel salvataggio del periodo ${month}/${year}`);
        return false;
      }
      
    } catch (error) {
      console.error(`Errore nella rimozione contatto dal periodo ${month}/${year}:`, error);
      return false;
    }
  },

  /**
   * ⭐ NUOVA FUNZIONE: Aggiorna un contatto in un periodo specifico
   */
  async updateContactInPeriod(year, month, updatedContact) {
    try {
      console.log(`Aggiornamento contatto ID ${updatedContact.id} nel periodo ${month}/${year}`);
      
      // Carica i dati del periodo target
      const periodData = await firebaseManager.loadContacts(year, month);
      let periodContacts = periodData.contacts || [];
      
      // Trova e aggiorna il contatto
      const contactIndex = periodContacts.findIndex(c => c.id === updatedContact.id);
      if (contactIndex === -1) {
        console.error(`Contatto ID ${updatedContact.id} non trovato nel periodo ${month}/${year}`);
        return false;
      }
      
      periodContacts[contactIndex] = updatedContact;
      
      // Salva il periodo aggiornato
      const success = await firebaseManager.saveContacts(year, month, periodContacts);
      
      if (success) {
        console.log(`Contatto aggiornato con successo nel periodo ${month}/${year}`);
        return true;
      } else {
        console.error(`Errore nel salvataggio del periodo ${month}/${year}`);
        return false;
      }
      
    } catch (error) {
      console.error(`Errore nell'aggiornamento contatto nel periodo ${month}/${year}:`, error);
      return false;
    }
  },

  /**
   * Salva i dati su Firebase (manteniamo per compatibilità)
   */
  async saveData() {
    const year = domManager.elements.yearSelect.value;
    const month = domManager.elements.monthSelect.value;

    try {
      console.log(`Tentativo di salvataggio su Firebase per ${month}/${year}...`);

      const success = await firebaseManager.saveContacts(year, month, allContacts);

      if (success) {
        console.log(`Salvataggio Firebase completato: ${allContacts.length} contatti`);
        return true;
      } else {
        console.error('Salvataggio Firebase fallito');
        notifications.error('Errore nel salvataggio su Firebase');
        return false;
      }

    } catch (error) {
      console.error('Errore nel salvataggio su Firebase:', error);
      notifications.error('Errore nel salvataggio dei dati');
      return false;
    }
  },

  /**
   * Aggiorna il periodo corrente e ricarica i dati
   */
  async updatePeriod() {
    // Prima aggiorna il display del periodo (per gli stili)
    domManager.updatePeriod();
    // Poi carica i dati
    await this.loadData();
  },

  /**
   * Imposta periodo specifico
   */
  async setPeriod(year, month) {
    if (domManager.elements.yearSelect) {
      domManager.elements.yearSelect.value = year;
    }

    if (domManager.elements.monthSelect) {
      domManager.elements.monthSelect.value = month;
    }

    // Aggiorna subito il display del periodo (stili)
    domManager.updatePeriod();
    
    // Poi carica i dati
    await this.loadData();
    
    notifications.success(`Periodo aggiornato: ${MONTHS[month - 1]} ${year}`);
  },

  /**
   * Naviga al mese precedente
   */
  async goToPreviousMonth() {
    const currentYear = parseInt(domManager.elements.yearSelect.value);
    const currentMonth = parseInt(domManager.elements.monthSelect.value);

    let newMonth = currentMonth - 1;
    let newYear = currentYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear = currentYear - 1;
    }

    await this.setPeriod(newYear, newMonth);
  },

  /**
   * Naviga al mese successivo
   */
  async goToNextMonth() {
    const currentYear = parseInt(domManager.elements.yearSelect.value);
    const currentMonth = parseInt(domManager.elements.monthSelect.value);

    let newMonth = currentMonth + 1;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear = currentYear + 1;
    }

    await this.setPeriod(newYear, newMonth);
  },

  /**
   * Va al periodo corrente (oggi)
   */
  async goToCurrentPeriod() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    await this.setPeriod(currentYear, currentMonth);
  },

  /**
   * Ottiene i dati per un mese specifico (per i trend) - SOLO da Firebase
   */
  async getMonthData(year, month) {
    try {
      const data = await firebaseManager.loadContacts(year, month);
      return data.contacts || [];
    } catch (error) {
      console.warn(`Errore nel caricamento dati Firebase per ${month}/${year}:`, error);
      return [];
    }
  },

  /**
   * ⭐ NUOVA FUNZIONE: Trova tutti i periodi con dati
   */
  async getAllPeriodsWithData() {
    const periodsWithData = [];
    const currentYear = new Date().getFullYear();
    
    try {
      // Controlla gli ultimi 3 anni per eventuali dati
      for (let year = currentYear - 2; year <= currentYear + 1; year++) {
        for (let month = 1; month <= 12; month++) {
          const data = await firebaseManager.loadContacts(year, month);
          if (data.contacts && data.contacts.length > 0) {
            periodsWithData.push({
              year,
              month,
              count: data.contacts.length,
              lastModified: data.lastModified
            });
          }
        }
      }
      
      return periodsWithData;
    } catch (error) {
      console.error('Errore nel recupero periodi con dati:', error);
      return [];
    }
  },

  /**
   * ⭐ NUOVA FUNZIONE: Migra un contatto da un periodo a un altro
   */
  async migrateContactBetweenPeriods(contactId, fromYear, fromMonth, toYear, toMonth) {
    try {
      console.log(`Migrazione contatto ${contactId} da ${fromMonth}/${fromYear} a ${toMonth}/${toYear}`);
      
      // 1. Carica il contatto dal periodo di origine
      const fromData = await firebaseManager.loadContacts(fromYear, fromMonth);
      const contact = fromData.contacts?.find(c => c.id === contactId);
      
      if (!contact) {
        throw new Error('Contatto non trovato nel periodo di origine');
      }
      
      // 2. Calcola nuovo ID per il periodo di destinazione
      const toData = await firebaseManager.loadContacts(toYear, toMonth);
      const toContacts = toData.contacts || [];
      const newId = toContacts.length > 0 ? Math.max(...toContacts.map(c => c.id || 0)) + 1 : 1;
      
      // 3. Aggiorna l'ID del contatto per il nuovo periodo
      const migratedContact = { ...contact, id: newId };
      
      // 4. Aggiungi al nuovo periodo
      const addSuccess = await this.addContactToPeriod(toYear, toMonth, migratedContact);
      if (!addSuccess) {
        throw new Error('Errore nell\'aggiunta al periodo di destinazione');
      }
      
      // 5. Rimuovi dal periodo originale
      const removeSuccess = await this.removeContactFromPeriod(fromYear, fromMonth, contactId);
      if (!removeSuccess) {
        // Rollback: rimuovi dal nuovo periodo
        await this.removeContactFromPeriod(toYear, toMonth, newId);
        throw new Error('Errore nella rimozione dal periodo originale');
      }
      
      console.log(`Contatto migrato con successo con nuovo ID: ${newId}`);
      return { success: true, newId };
      
    } catch (error) {
      console.error('Errore nella migrazione del contatto:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Esporta tutti i dati (solo da Firebase)
   */
  async exportAllData() {
    const allData = {};
    
    try {
      // Usa la nuova funzione per ottenere tutti i periodi con dati
      const periodsWithData = await this.getAllPeriodsWithData();
      
      for (const period of periodsWithData) {
        const data = await firebaseManager.loadContacts(period.year, period.month);
        allData[`${period.year}_${period.month}`] = {
          contacts: data.contacts,
          nextId: data.nextId,
          lastModified: data.lastModified,
          count: period.count
        };
      }
      
      return allData;
    } catch (error) {
      console.error('Errore nell\'esportazione dati:', error);
      return {};
    }
  },

  /**
   * Ottiene statistiche di utilizzo Firebase
   */
  async getStorageStats() {
    try {
      const periodsWithData = await this.getAllPeriodsWithData();
      const totalContacts = periodsWithData.reduce((sum, period) => sum + period.count, 0);
      
      return {
        totalContacts,
        totalPeriods: periodsWithData.length,
        source: 'Firebase',
        lastCheck: new Date().toISOString(),
        periodsDetail: periodsWithData
      };
    } catch (error) {
      console.error('Errore nel calcolo statistiche:', error);
      return {
        totalContacts: 0,
        totalPeriods: 0,
        source: 'Firebase (Error)',
        lastCheck: new Date().toISOString()
      };
    }
  },

  /**
   * ⭐ NUOVA FUNZIONE: Cerca contatti in tutti i periodi
   */
  async searchContactsGlobally(searchCriteria) {
    const results = [];
    
    try {
      const periodsWithData = await this.getAllPeriodsWithData();
      
      for (const period of periodsWithData) {
        const data = await firebaseManager.loadContacts(period.year, period.month);
        const contacts = data.contacts || [];
        
        const matchingContacts = contacts.filter(contact => {
          // Applica criteri di ricerca
          if (searchCriteria.cliente && !contact.cliente?.toLowerCase().includes(searchCriteria.cliente.toLowerCase())) {
            return false;
          }
          if (searchCriteria.commerciale && contact.commerciale !== searchCriteria.commerciale) {
            return false;
          }
          if (searchCriteria.provincia && !contact.provincia?.toLowerCase().includes(searchCriteria.provincia.toLowerCase())) {
            return false;
          }
          return true;
        });
        
        matchingContacts.forEach(contact => {
          results.push({
            ...contact,
            period: {
              year: period.year,
              month: period.month,
              monthName: MONTHS[period.month - 1]
            }
          });
        });
      }
      
      return results;
    } catch (error) {
      console.error('Errore nella ricerca globale:', error);
      return [];
    }
  },

  /**
   * ⭐ NUOVA FUNZIONE: Ottieni statistiche aggregate di tutti i periodi
   */
  async getGlobalStatistics() {
    try {
      const periodsWithData = await this.getAllPeriodsWithData();
      let totalContacts = 0;
      let totalNewClients = 0;
      let commercialStats = {};
      let monthlyTrend = [];
      
      for (const period of periodsWithData) {
        const data = await firebaseManager.loadContacts(period.year, period.month);
        const contacts = data.contacts || [];
        
        totalContacts += contacts.length;
        
        contacts.forEach(contact => {
          if (contact.nuovoCliente) {
            totalNewClients++;
          }
          
          const commercial = contact.commerciale || 'Non specificato';
          commercialStats[commercial] = (commercialStats[commercial] || 0) + 1;
        });
        
        monthlyTrend.push({
          year: period.year,
          month: period.month,
          monthName: MONTHS[period.month - 1],
          count: contacts.length,
          newClients: contacts.filter(c => c.nuovoCliente).length
        });
      }
      
      // Ordina trend per data
      monthlyTrend.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      
      return {
        totalContacts,
        totalNewClients,
        totalExistingClients: totalContacts - totalNewClients,
        newClientRate: totalContacts > 0 ? Math.round((totalNewClients / totalContacts) * 100) : 0,
        commercialStats,
        monthlyTrend,
        periodsCount: periodsWithData.length,
        dateRange: {
          from: monthlyTrend[0] || null,
          to: monthlyTrend[monthlyTrend.length - 1] || null
        }
      };
    } catch (error) {
      console.error('Errore nel calcolo statistiche globali:', error);
      return null;
    }
  }
};