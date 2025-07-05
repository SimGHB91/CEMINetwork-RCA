/**
 * ====
 * CHART MANAGER - VERSIONE CORRETTA (Stop Loading Infinito)
 * ====
 */

const chartManager = {
    charts: {
        clientType: null,
        commercial: null,
        geographic: null,
        modality: null,
        conversion: null,
        weekly: null,
        topClients: null,
        trend: null
    },

    /**
     * ✅ AGGIORNA TUTTI I GRAFICI - SENZA LOADING INFINITO
     */
    async updateCharts() {
        console.log('🔄 Aggiornamento dashboard senza loading infinito...');
        
        try {
            // ❌ RIMUOVI: NON mostrare loading che causa rotellina infinita
            // this.showAllLoading(); 
            
            // Aggiorna grafici in parallelo
            await Promise.all([
                this.updateClientTypeChart(),
                this.updateCommercialChart(),
                this.updateGeographicChart(),
                this.updateModalityChart(),
                this.updateConversionChart(),
                this.updateWeeklyChart(),
                this.updateTopClientsChart(),
                this.updateTrendChart()
            ]);
            
            console.log('✅ Dashboard aggiornata senza problemi di loading');
            
        } catch (error) {
            console.error('❌ Errore aggiornamento grafici:', error);
            notifications.error('Errore nell\'aggiornamento della dashboard');
        }
    },

    /**
     * 📊 GRAFICO DISTRIBUZIONE TIPI CLIENTE
     */
    updateClientTypeChart() {
        const ctx = document.getElementById('clientTypeChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('clientType');
        
        const newClients = allContacts.filter(c => c.nuovoCliente).length;
        const existingClients = allContacts.length - newClients;
        
        this.charts.clientType = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Nuovi Clienti', 'Clienti Esistenti'],
                datasets: [{
                    data: [newClients, existingClients],
                    backgroundColor: ['#27ae60', '#3498db'],
                    borderWidth: 3,
                    borderColor: '#fff',
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1200
                }
            }
        });
    },

    /**
     * 👥 GRAFICO PERFORMANCE COMMERCIALI
     */
    updateCommercialChart() {
        const ctx = document.getElementById('commercialChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('commercial');
        
        const commercialCounts = {};
        allContacts.forEach(contact => {
            const comm = contact.commerciale || 'Non specificato';
            commercialCounts[comm] = (commercialCounts[comm] || 0) + 1;
        });
        
        const sortedData = Object.entries(commercialCounts)
            .sort(([,a], [,b]) => b - a);
        
        const labels = sortedData.map(([name]) => name);
        const data = sortedData.map(([,count]) => count);
        const colors = this.generateGradientColors(labels.length);
        
        this.charts.commercial = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numero Contatti',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (context) => `Commerciale: ${context[0].label}`,
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `Contatti: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            font: { size: 10 }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutBounce'
                }
            }
        });
    },

    /**
     * 📍 GRAFICO DISTRIBUZIONE GEOGRAFICA
     */
    updateGeographicChart() {
        const ctx = document.getElementById('geographicChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('geographic');
        
        const locationCounts = {};
        allContacts.forEach(contact => {
            const location = contact.provincia || contact.luogo || 'Non specificato';
            locationCounts[location] = (locationCounts[location] || 0) + 1;
        });
        
        const sortedLocations = Object.entries(locationCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);
        
        this.charts.geographic = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedLocations.map(([loc]) => loc),
                datasets: [{
                    label: 'Contatti per Località',
                    data: sortedLocations.map(([,count]) => count),
                    backgroundColor: '#e74c3c',
                    borderColor: '#c0392b',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    },

    /**
     * 📞 GRAFICO MODALITÀ COMUNICAZIONE
     */
    updateModalityChart() {
        const ctx = document.getElementById('modalityChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('modality');
        
        const modalityCounts = {};
        allContacts.forEach(contact => {
            const mod = contact.modalitaComm || 'Non specificato';
            modalityCounts[mod] = (modalityCounts[mod] || 0) + 1;
        });
        
        // ⭐ NUOVA PALETTE COLORI DISTINGUIBILI
        // Palette ottimizzata per massima distinguibilità
        const distinctColors = [
            '#e74c3c',  // Rosso brillante
            '#3498db',  // Blu brillante  
            '#f39c12',  // Arancione
            '#27ae60',  // Verde
            '#9b59b6',  // Viola
            '#e67e22',  // Arancione scuro
            '#1abc9c',  // Turchese
            '#34495e',  // Grigio scuro
            '#f1c40f',  // Giallo
            '#e91e63',  // Rosa
            '#00bcd4',  // Ciano
            '#ff5722',  // Rosso-arancione
            '#795548',  // Marrone
            '#607d8b',  // Blu grigio
            '#4caf50',  // Verde chiaro
            '#ff9800',  // Ambra
            '#673ab7',  // Viola scuro
            '#009688',  // Verde acqua
            '#ffeb3b',  // Giallo lime
            '#8bc34a'   // Verde lime
        ];
        
        const modalityEntries = Object.entries(modalityCounts);
        
        // ⭐ ASSICURA COLORI DISTINGUIBILI: cicla la palette se necessario
        const backgroundColors = modalityEntries.map((_, index) => 
            distinctColors[index % distinctColors.length]
        );
        
        this.charts.modality = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: modalityEntries.map(([modality]) => modality),
                datasets: [{
                    data: modalityEntries.map(([, count]) => count),
                    backgroundColor: backgroundColors,
                    borderWidth: 3,
                    borderColor: '#ffffff', // Bordo bianco per separare le fette
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    // ⭐ RIMUOVI COMPLETAMENTE LA LEGENDA
                    legend: {
                        display: false
                    },
                    tooltip: {
                        // ⭐ TOOLTIP MIGLIORATO per compensare mancanza legenda
                        callbacks: {
                            title: (context) => {
                                return `Modalità: ${context[0].label}`;
                            },
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `Contatti: ${context.raw} (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: true, // Mostra il colore nel tooltip
                        usePointStyle: true
                    }
                },
                // ⭐ ANIMAZIONE MIGLIORATA
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                // ⭐ HOVER EFFECTS MIGLIORATI
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                },
                // ⭐ ANGOLO DI ROTAZIONE per estetica migliore
                rotation: -90, // Inizia dalla parte superiore
                // ⭐ SPACING TRA LE FETTE per migliore separazione visiva
                cutout: '0%', // Mantieni come pie chart (non donut)
                spacing: 2 // Piccolo spazio tra le fette
            }
        });
    },

    // ⭐ FUNZIONE UTILITY: Genera colori distinguibili automaticamente
    generateDistinctColors(count) {
        const baseColors = [
            '#e74c3c', '#3498db', '#f39c12', '#27ae60', '#9b59b6', 
            '#e67e22', '#1abc9c', '#34495e', '#f1c40f', '#e91e63',
            '#00bcd4', '#ff5722', '#795548', '#607d8b', '#4caf50',
            '#ff9800', '#673ab7', '#009688', '#ffeb3b', '#8bc34a'
        ];
        
        // Se servono più colori di quelli base, genera variazioni
        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }
        
        const colors = [...baseColors];
        
        // Genera colori aggiuntivi variando luminosità
        for (let i = baseColors.length; i < count; i++) {
            const baseIndex = i % baseColors.length;
            const baseColor = baseColors[baseIndex];
            
            // Crea variazione più chiara o più scura
            const variation = this.adjustColorBrightness(baseColor, i % 2 === 0 ? 0.3 : -0.3);
            colors.push(variation);
        }
        
        return colors;
    },

    // ⭐ UTILITY: Aggiusta luminosità colore
    adjustColorBrightness(hex, percent) {
        // Rimuovi # se presente
        hex = hex.replace('#', '');
        
        // Converti in RGB
        const num = parseInt(hex, 16);
        const r = (num >> 16) + Math.round(255 * percent);
        const g = (num >> 8 & 0x00FF) + Math.round(255 * percent);
        const b = (num & 0x0000FF) + Math.round(255 * percent);
        
        // Assicura valori nel range 0-255
        const newR = Math.max(0, Math.min(255, r));
        const newG = Math.max(0, Math.min(255, g));
        const newB = Math.max(0, Math.min(255, b));
        
        return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')}`;
    },

    /**
     * 🎯 GRAFICO TASSO CONVERSIONE
     */
    updateConversionChart() {
        const ctx = document.getElementById('conversionChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('conversion');
        
        const commercialStats = {};
        allContacts.forEach(contact => {
            const comm = contact.commerciale || 'Non specificato';
            if (!commercialStats[comm]) {
                commercialStats[comm] = { total: 0, newClients: 0 };
            }
            commercialStats[comm].total++;
            if (contact.nuovoCliente) {
                commercialStats[comm].newClients++;
            }
        });
        
        const labels = Object.keys(commercialStats);
        const totalData = labels.map(comm => commercialStats[comm].total);
        const conversionData = labels.map(comm => 
            commercialStats[comm].total > 0 
                ? (commercialStats[comm].newClients / commercialStats[comm].total * 100).toFixed(1)
                : 0
        );
        
        this.charts.conversion = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Contatti Totali',
                        data: totalData,
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: '#3498db',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: '% Nuovi Clienti',
                        data: conversionData,
                        type: 'line',
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        yAxisID: 'y1',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { font: { size: 11 } }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: { display: true, text: 'Contatti' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: '% Conversione' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    },

    /**
     * 📅 GRAFICO ATTIVITÀ SETTIMANALE
     */
    updateWeeklyChart() {
        const ctx = document.getElementById('weeklyChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('weekly');
        
        const weekDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const weekCounts = new Array(7).fill(0);
        
        allContacts.forEach(contact => {
            if (contact.data) {
                const date = new Date(contact.data);
                const dayOfWeek = date.getDay();
                weekCounts[dayOfWeek]++;
            }
        });
        
        this.charts.weekly = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: weekDays,
                datasets: [{
                    label: 'Attività per Giorno',
                    data: weekCounts,
                    backgroundColor: 'rgba(26, 188, 156, 0.2)',
                    borderColor: '#1abc9c',
                    borderWidth: 2,
                    pointBackgroundColor: '#1abc9c',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    },

    /**
     * 🏆 GRAFICO TOP 10 CLIENTI
     */
    updateTopClientsChart() {
        const ctx = document.getElementById('topClientsChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('topClients');
        
        const clientCounts = {};
        allContacts.forEach(contact => {
            const client = contact.cliente || 'Non specificato';
            clientCounts[client] = (clientCounts[client] || 0) + 1;
        });
        
        const topClients = Object.entries(clientCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        if (topClients.length === 0) {
            this.createErrorChart('topClients', ctx);
            return;
        }
        
        // ⭐ PALETTE COERENTE CON GLI ALTRI GRAFICI
        // Usa i colori corporate: blu principale + gradazione tonale
        const podiumColors = topClients.map((_, index) => {
            if (index === 0) return '#2c3e50'; // Primo: grigio scuro corporate (più importante)
            if (index === 1) return '#34495e'; // Secondo: grigio medio
            if (index === 2) return '#3498db'; // Terzo: blu principale
            // Dal 4° in poi: gradazione del blu (come altri grafici)
            const intensity = Math.max(0.3, 1 - (index - 3) * 0.1);
            return `rgba(52, 152, 219, ${intensity})`;
        });
        
        // ⭐ BORDI SOBRI MA DISTINTI
        const borderColors = topClients.map((_, index) => {
            if (index === 0) return '#1a252f'; // Primo: più scuro
            if (index === 1) return '#2c3e50'; // Secondo: scuro
            if (index === 2) return '#2980b9'; // Terzo: blu scuro
            return 'rgba(52, 152, 219, 0.8)';
        });
        
        // ⭐ SPESSORI BORDI: sottolineano il podio senza esagerare
        const borderWidths = topClients.map((_, index) => {
            if (index === 0) return 3; // Primo: più spesso
            if (index === 1) return 2; // Secondo: medio
            if (index === 2) return 2; // Terzo: medio
            return 1; // Altri: standard
        });
        
        this.charts.topClients = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topClients.map(([client], index) => {
                    // ⭐ INDICATORI POSIZIONE SOBRI (solo numeri + simbolo discreto)
                    let position;
                    if (index === 0) position = '1° ★'; // Stella discreta per il primo
                    else if (index === 1) position = '2°';
                    else if (index === 2) position = '3°';
                    else position = `${index + 1}°`;
                    
                    // ⭐ NOME CLIENTE formattato per leggibilità
                    const shortName = client.length > 10 ? client.substring(0, 10) + '...' : client;
                    return `${position}\n${shortName}`;
                }),
                datasets: [{
                    label: 'Contatti',
                    data: topClients.map(([,count]) => count),
                    backgroundColor: podiumColors,
                    borderColor: borderColors,
                    borderWidth: borderWidths,
                    // ⭐ BORDI ARROTONDATI ELEGANTI (meno pronunciati)
                    borderRadius: {
                        topLeft: 6,
                        topRight: 6,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    borderSkipped: false,
                    // ⭐ HOVER EFFECT SOBRIO
                    hoverBackgroundColor: podiumColors.map((color, index) => {
                        // Schiarisci leggermente al hover
                        if (index < 3) {
                            return color === '#2c3e50' ? '#34495e' : 
                                color === '#34495e' ? '#3498db' :
                                color === '#3498db' ? '#5dade2' : color;
                        }
                        return color.replace(/[\d.]+\)$/, '0.9)'); // Aumenta opacità
                    }),
                    hoverBorderWidth: borderWidths.map(width => width + 1),
                    hoverBorderColor: borderColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: false 
                    },
                    tooltip: {
                        // ⭐ TOOLTIP CORPORATE STYLE (come gli altri grafici)
                        backgroundColor: 'rgba(44, 62, 80, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3498db',
                        borderWidth: 0,
                        cornerRadius: 6,
                        displayColors: false,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        callbacks: {
                            title: (context) => {
                                const rank = context[0].dataIndex + 1;
                                const [client] = topClients[context[0].dataIndex];
                                return `${rank}° posto - ${client}`;
                            },
                            label: (context) => {
                                const count = context.raw;
                                const total = topClients.reduce((sum, [,c]) => sum + c, 0);
                                const percentage = Math.round((count / total) * 100);
                                return `Contatti: ${count} (${percentage}% del totale)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: { 
                                size: 10, 
                                weight: '500'  // Peso medio, non bold
                            },
                            color: '#2c3e50', // Colore corporate coerente
                            maxRotation: 0
                        },
                        grid: { 
                            display: false 
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            stepSize: 1,
                            font: { 
                                size: 11,
                                weight: '500'
                            },
                            color: '#2c3e50',
                            callback: function(value) {
                                return value; // Solo numeri, senza "contatti"
                            }
                        },
                        grid: { 
                            color: 'rgba(52, 152, 219, 0.1)', // Griglia discreta blu
                            drawBorder: false,
                            lineWidth: 1
                        },
                        title: {
                            display: true,
                            text: 'Totale contatti effettuati',
                            font: {
                                size: 12,
                                
                            },
                            color: '#2c3e50'
                        }
                    }
                },
                // ⭐ ANIMAZIONE ELEGANTE E DISCRETA
                animation: {
                    duration: 1200, // Più veloce, meno "show-off"
                    easing: 'easeOutQuart', // Smooth ma non bouncy
                    delay: (context) => {
                        // ⭐ CRESCITA PODIO: 1°, 2°, 3°, poi gli altri
                        const rank = context.dataIndex + 1;
                        if (rank === 1) return 400; // Primo
                        if (rank === 2) return 200; // Secondo
                        if (rank === 3) return 300; // Terzo
                        return (context.dataIndex - 3) * 100 + 500; // Altri
                    }
                },
                // ⭐ INTERAZIONI DISCRETE
                onHover: (event, activeElements) => {
                    event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                },
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const [client] = topClients[index];
                        // Possibile filtro per cliente (da implementare se necessario)
                        console.log(`Selected client: ${client}`);
                        // chartInteractionManager.filterByClient(client);
                    }
                }
            }
        });
        
        // ⭐ INDICATORE SOTTILE PER IL PRIMO POSTO (opzionale)
        setTimeout(() => {
            this.addDiscreteChampionIndicator();
        }, 2000);
    },

    /**
     * ⭐ INDICATORE DISCRETO PER IL CAMPIONE (opzionale - molto sobrio)
     */
    addDiscreteChampionIndicator() {
        const canvas = document.getElementById('topClientsChart');
        if (!canvas) return;
        
        const container = canvas.closest('.chart-card');
        if (container && !container.querySelector('.top-client-badge')) {
            // Badge MOLTO discreto
            const badge = document.createElement('div');
            badge.className = 'top-client-badge';
            badge.innerHTML = '★';
            badge.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: #2c3e50;
                color: #ffffff;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                opacity: 0.7;
                transition: opacity 0.3s ease;
                z-index: 5;
            `;
            
            container.style.position = 'relative';
            container.appendChild(badge);
            
            // Hover effect discreto
            container.addEventListener('mouseenter', () => {
                badge.style.opacity = '1';
            });
            
            container.addEventListener('mouseleave', () => {
                badge.style.opacity = '0.7';
            });
            
            // Rimuovi dopo 8 secondi
            setTimeout(() => {
                if (badge.parentNode) {
                    badge.style.transition = 'opacity 1s ease';
                    badge.style.opacity = '0';
                    setTimeout(() => badge.remove(), 1000);
                }
            }, 8000);
        }
    },

    /**
     * 📈 GRAFICO TREND MENSILE
     */
    async updateTrendChart() {
        const ctx = document.getElementById('trendChart')?.getContext('2d');
        if (!ctx) return;
        
        this.destroyChart('trend');
        
        const currentYear = parseInt(domManager.elements.yearSelect.value);
        const currentMonth = parseInt(domManager.elements.monthSelect.value);
        const trendData = [];
        const labels = [];
        
        try {
            for (let i = 11; i >= 0; i--) {
                let month = currentMonth - i;
                let year = currentYear;
                
                while (month <= 0) {
                    month += 12;
                    year -= 1;
                }
                
                const contacts = await dataManager.getMonthData(year, month);
                labels.push(`${MONTHS[month - 1].substring(0, 3)} ${year}`);
                trendData.push(contacts.length);
            }
            
            this.charts.trend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Contatti Mensili',
                        data: trendData,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#3498db',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Errore trend chart:', error);
            this.createErrorChart('trend', ctx);
        }
    },

    /**
     * 🔄 UTILITY FUNCTIONS
     */
    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            this.charts[chartName] = null;
        }
    },

    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.destroyChart(chartName);
        });
    },

    generateGradientColors(count) {
        const colors = [
            '#e74c3c', '#3498db', '#f39c12', '#27ae60', 
            '#9b59b6', '#e67e22', '#1abc9c', '#34495e'
        ];
        return colors.slice(0, count);
    },

    createErrorChart(chartName, ctx) {
        this.charts[chartName] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Errore'],
                datasets: [{
                    label: 'Errore caricamento',
                    data: [0],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    /**
     * 📊 EXPORT GRAFICI
     */
    async exportChartsAsImages() {
        const charts = [
            { chart: this.charts.clientType, name: 'distribuzione_clienti' },
            { chart: this.charts.commercial, name: 'performance_commerciali' },
            { chart: this.charts.geographic, name: 'distribuzione_geografica' },
            { chart: this.charts.modality, name: 'modalita_comunicazione' },
            { chart: this.charts.conversion, name: 'tasso_conversione' },
            { chart: this.charts.weekly, name: 'attivita_settimanale' },
            { chart: this.charts.topClients, name: 'top_clienti' },
            { chart: this.charts.trend, name: 'trend_mensile' }
        ];

        charts.forEach(({ chart, name }) => {
            if (chart) {
                const canvas = chart.canvas;
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `${name}_${new Date().toISOString().split('T')[0]}.png`;
                link.click();
            }
        });

        notifications.success('Tutti i grafici esportati come immagini!');
    }
};