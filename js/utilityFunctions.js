/**
 * ============================================
 * UTILITY FUNCTIONS - Funzioni di utilità
 * ============================================
 */

const utilityFunctions = {
    /**
     * Debounce function per limitare chiamate frequenti
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Formatta una data per la visualizzazione
     */
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('it-IT');
        } catch (error) {
            return dateString;
        }
    },

    /**
     * Formatta una data per i calcoli
     */
    parseDate(dateString) {
        if (!dateString) return null;
        try {
            return new Date(dateString);
        } catch (error) {
            return null;
        }
    },

    /**
     * Sanitizza input per prevenire XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.replace(/[<>]/g, '');
    },

    /**
     * Escape HTML per sicurezza
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Valida email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Valida numero di telefono
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Genera ID univoco
     */
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Copia testo negli appunti
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            notifications.success('Testo copiato negli appunti!');
            return true;
        } catch (error) {
            // Fallback per browser più vecchi
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                notifications.success('Testo copiato negli appunti!');
                return true;
            } catch (fallbackError) {
                notifications.error('Impossibile copiare il testo');
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    },

    /**
     * Formatta numeri con separatori
     */
    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('it-IT', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    },

    /**
     * Calcola differenza tra date in giorni
     */
    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    },

    /**
     * Converte dimensione file in formato leggibile
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Ordina array di oggetti per campo
     */
    sortBy(array, field, direction = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /**
     * Raggruppa array per campo
     */
    groupBy(array, field) {
        return array.reduce((groups, item) => {
            const key = item[field] || 'Non specificato';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    },

    /**
     * Filtra array rimuovendo duplicati
     */
    unique(array) {
        return [...new Set(array)];
    },

    /**
     * Capitalizza prima lettera
     */
    capitalize(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },

    /**
     * Tronca testo con ellipsis
     */
    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Rimuove accenti e caratteri speciali
     */
    normalizeText(text) {
        if (!text) return '';
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    /**
     * Confronta stringhe ignorando case e accenti
     */
    compareStrings(str1, str2) {
        const normalize = (str) => this.normalizeText(str).toLowerCase();
        return normalize(str1) === normalize(str2);
    },

    /**
     * Calcola hash semplice di una stringa
     */
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash);
    },

    /**
     * Crea slug da testo
     */
    createSlug(text) {
        return this.normalizeText(text)
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    },

    /**
     * Valida codice fiscale italiano (semplificato)
     */
    isValidCodiceFiscale(cf) {
        if (!cf || cf.length !== 16) return false;
        
        const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
        return cfRegex.test(cf.toUpperCase());
    },

    /**
     * Valida partita IVA italiana
     */
    isValidPartitaIVA(piva) {
        if (!piva || piva.length !== 11) return false;
        
        // Rimuovi spazi e caratteri non numerici
        piva = piva.replace(/[^0-9]/g, '');
        
        if (piva.length !== 11) return false;
        
        // Algoritmo di validazione PI italiana
        let sum = 0;
        for (let i = 0; i < 10; i++) {
            let digit = parseInt(piva[i]);
            if (i % 2 === 1) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(piva[10]);
    },

    /**
     * Ottiene coordinate da indirizzo (mock)
     */
    async getCoordinatesFromAddress(address) {
        // In un'implementazione reale, useresti un servizio di geocoding
        // Per ora ritorna coordinate fittizie
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    lat: 45.4642 + (Math.random() - 0.5) * 0.1,
                    lng: 9.1900 + (Math.random() - 0.5) * 0.1,
                    address: address
                });
            }, 500);
        });
    },

    /**
     * Calcola distanza tra due punti geografici
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raggio della Terra in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return Math.round(distance * 100) / 100; // Arrotonda a 2 decimali
    },

    /**
     * Converte gradi in radianti
     */
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    },

    /**
     * Rileva se è dispositivo mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Rileva se è in modalità offline
     */
    isOffline() {
        return !navigator.onLine;
    },

    /**
     * Ottiene informazioni sulla connessione
     */
    getConnectionInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    },

    /**
     * Crea un timer con callback
     */
    createTimer(duration, callback, interval = 1000) {
        let remaining = duration;
        
        const timer = setInterval(() => {
            remaining -= interval;
            callback(remaining);
            
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, interval);
        
        return timer;
    },

    /**
     * Ritarda l'esecuzione di una funzione
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Retry di una funzione con backoff
     */
    async retry(fn, maxAttempts = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await this.delay(delay);
            }
        }
    },

    /**
     * Converte oggetto in query string
     */
    objectToQueryString(obj) {
        return Object.keys(obj)
            .filter(key => obj[key] !== null && obj[key] !== undefined && obj[key] !== '')
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
            .join('&');
    },

    /**
     * Converte query string in oggetto
     */
    queryStringToObject(queryString) {
        const params = new URLSearchParams(queryString);
        const obj = {};
        
        for (const [key, value] of params) {
            obj[key] = value;
        }
        
        return obj;
    },

    /**
     * Crea elementi DOM con attributi
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },

    /**
     * Animazione smooth scroll
     */
    smoothScrollTo(element, duration = 500) {
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        requestAnimationFrame(animation);
    },

    /**
     * Funzione di easing per animazioni
     */
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },

    /**
     * Ottiene dimensioni viewport
     */
    getViewportSize() {
        return {
            width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    },

    /**
     * Controlla se elemento è visibile nel viewport
     */
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        const viewport = this.getViewportSize();
        
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= viewport.height &&
            rect.right <= viewport.width
        );
    },

    /**
     * Converte colore hex in RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Converte RGB in hex
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * Genera colore casuale
     */
    randomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    },

    /**
     * Calcola luminanza di un colore
     */
    getLuminance(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 0;
        
        const { r, g, b } = rgb;
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    },

    /**
     * Controlla se il colore è scuro
     */
    isDarkColor(hex) {
        return this.getLuminance(hex) < 0.5;
    },

    /**
     * Esegue codice quando DOM è pronto
     */
    onDOMReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    },

    /**
     * Crea observer per intersection
     */
    createIntersectionObserver(callback, options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observerOptions = { ...defaultOptions, ...options };
        
        return new IntersectionObserver(callback, observerOptions);
    },

    /**
     * Pulisce listeners e observers
     */
    cleanup() {
        // Rimuovi tutti i timer attivi
        for (let i = 1; i < 99999; i++) {
            window.clearTimeout(i);
            window.clearInterval(i);
        }
        
        // Revoca URL objects
        if (window.URL && window.URL.revokeObjectURL) {
            // Non possiamo revocare tutti gli URL, ma possiamo tenere traccia di quelli creati
        }
    }
};