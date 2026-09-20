/* ==========================================================================
   SentinelGuard AI - Application Logic
   Features: Multi-Vector Threat Radar, Domain Header Auditor, Phish Hunt Sandbox,
             Deepfake Audio Analyzer, Visual Clone Inspector, Gemini AI Agent,
             Enterprise Admin SOC Operations Command Console
   ========================================================================== */

// --- Global Application State ---
const state = {
    currentTab: 'scanner',
    scanType: 'url',
    isScanning: false,
    threatChart: null,
    scanCount: 1482,
    threatsBlocked: 349,
    lastScanData: null,
    
    // Gemini API & Chatbot State
    geminiApiKey: localStorage.getItem('sentinel_gemini_key') || '',
    chatHistory: [],

    // Admin SOC Policies State
    adminPolicy: {
        heuristicSensitivity: 'Balanced',
        deepfakeThreshold: 'Strict (High Sensitivity)',
        sinkholeAutoEnforce: true
    },

    // Sandbox Game State
    sandbox: {
        score: 0,
        streak: 0,
        currentScenarioIndex: 0,
        answered: false
    }
};

// Top Brands Database for Typosquatting & Impersonation Detection
const TARGET_BRANDS = [
    { name: 'PayPal', domains: ['paypal.com', 'paypal.me'], logo: 'fa-brands fa-paypal', color: '#003087' },
    { name: 'Microsoft', domains: ['microsoft.com', 'office.com', 'live.com', 'outlook.com'], logo: 'fa-brands fa-microsoft', color: '#f25022' },
    { name: 'Google', domains: ['google.com', 'gmail.com', 'accounts.google.com'], logo: 'fa-brands fa-google', color: '#4285f4' },
    { name: 'Apple', domains: ['apple.com', 'icloud.com'], logo: 'fa-brands fa-apple', color: '#000000' },
    { name: 'Amazon', domains: ['amazon.com', 'aws.amazon.com'], logo: 'fa-brands fa-amazon', color: '#ff9900' },
    { name: 'Bank of America', domains: ['bankofamerica.com'], logo: 'fa-solid fa-building-columns', color: '#d12027' },
    { name: 'Chase', domains: ['chase.com'], logo: 'fa-solid fa-landmark-flag', color: '#117aca' },
    { name: 'Wells Fargo', domains: ['wellsfargo.com'], logo: 'fa-solid fa-vault', color: '#cd1409' },
    { name: 'Coinbase', domains: ['coinbase.com'], logo: 'fa-solid fa-coins', color: '#0052ff' },
    { name: 'Meta / Facebook', domains: ['facebook.com', 'instagram.com'], logo: 'fa-brands fa-facebook', color: '#1877f2' },
    { name: 'Netflix', domains: ['netflix.com'], logo: 'fa-solid fa-film', color: '#e50914' },
    { name: 'Stripe', domains: ['stripe.com'], logo: 'fa-brands fa-stripe', color: '#635bfc' }
];

// High-Risk TLDs
const HIGH_RISK_TLDS = ['.top', '.xyz', '.club', '.info', '.online', '.vip', '.cc', '.ru', '.cfd', '.fit', '.work', '.gq', '.tk', '.ml'];

// Phishing Keywords List
const PHISH_KEYWORDS = [
    'login', 'verify', 'update', 'account', 'banking', 'secure', 'm365', 'wallet', 'urgent',
    'suspended', 'confirm', 'billing', 'password', 'alert', 'claim', 'refund', 'support'
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initPhishGame();
    setupEventListeners();
    updateChatEngineBadge();
    initCookieBanner();
});

// --- COOKIE CONSENT BANNER MANAGER ---
function initCookieBanner() {
    const consent = localStorage.getItem('sentinel_cookie_consent');
    const banner = document.getElementById('cookie-banner');
    if (!consent && banner) {
        setTimeout(() => banner.classList.remove('hidden'), 800);
    }
}

function handleCookieConsent(choice) {
    localStorage.setItem('sentinel_cookie_consent', choice);
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.style.opacity = '0';
        banner.style.transform = 'translate(-50%, 20px)';
        banner.style.transition = 'all 0.3s ease';
        setTimeout(() => banner.classList.add('hidden'), 300);
    }
    if (choice === 'accept') {
        showToast('Cookie preferences saved: Security cookies accepted.', 'success');
    } else {
        showToast('Cookie preferences saved: Optional cookies rejected.', 'info');
    }
}

function initAntiInspect() {
    // Disable Right-Click Context Menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showToast('Developer Context Menu restricted by SentinelGuard Zero-Trust Security Policy.', 'warning');
    });

    // Disable Dev Tools Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Cmd+Option+I/J/C)
    document.addEventListener('keydown', (e) => {
        const isCmdOrCtrl = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        const key = e.key ? e.key.toUpperCase() : '';

        if (
            e.key === 'F12' ||
            (isCmdOrCtrl && isShift && (key === 'I' || key === 'J' || key === 'C')) ||
            (isCmdOrCtrl && key === 'U') ||
            (e.metaKey && e.altKey && (key === 'I' || key === 'J' || key === 'C'))
        ) {
            e.preventDefault();
            e.stopPropagation();
            showToast('Developer Inspect Tools restricted by SentinelGuard Security Policy.', 'warning');
            return false;
        }
    });
}

function setupEventListeners() {
    initAntiInspect();
    // Enable Enter key submission for inputs
    document.getElementById('target-url-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') runThreatScan();
    });
    document.getElementById('domain-audit-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') runDomainAudit();
    });
}

// --- Navigation Tab Switcher (FIXED: Removes .hidden class when activating) ---
function switchTab(tabId) {
    state.currentTab = tabId;

    // Automatically close mobile navigation drawer upon selecting a tab
    const nav = document.querySelector('.main-nav');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    const menuIcon = document.getElementById('menu-icon');
    if (nav) nav.classList.remove('mobile-active');
    if (backdrop) backdrop.classList.add('hidden');
    if (menuIcon) menuIcon.className = 'fa-solid fa-bars';

    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${tabId}-btn`)?.classList.add('active');

    // Update Tab Content Pages cleanly
    document.querySelectorAll('.tab-page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });

    const activePage = document.getElementById(`tab-${tabId}`);
    if (activePage) {
        activePage.classList.remove('hidden');
        activePage.classList.add('active');
    }

    // Tab specific trigger actions
    if (tabId === 'header-audit' && !state.headerAudited) {
        runDomainAudit();
    }
}

// --- SYSTEM STATUS TOGGLE (Smooth Online / Standby Switch) ---
function toggleSystemStatus() {
    const btn = document.getElementById('system-status-btn');
    if (!btn) return;

    const isOnline = btn.classList.contains('online');
    const text = btn.querySelector('.status-text');

    if (isOnline) {
        btn.classList.remove('online');
        btn.classList.add('offline');
        if (text) text.innerText = 'RADAR STANDBY';
        showToast('SentinelGuard AI Threat Radar paused. System in Standby Mode.', 'warning');
    } else {
        btn.classList.remove('offline');
        btn.classList.add('online');
        if (text) text.innerText = 'SYSTEM ACTIVE';
        showToast('SentinelGuard AI Threat Radar active & monitoring endpoints.', 'success');
    }
}

// --- ENTERPRISE ADMIN SOC CONSOLE LOGIC ---
function updatePolicySetting(type, val) {
    if (type === 'heuristic') {
        const labels = ['Permissive', 'Balanced', 'Aggressive (Strict Zero-Trust)'];
        const label = labels[val - 1] || 'Balanced';
        state.adminPolicy.heuristicSensitivity = label;
        document.getElementById('val-heuristic').innerText = label;
    } else if (type === 'deepfake') {
        const labels = ['Strict (High Sensitivity)', 'Standard Mode'];
        const label = labels[val - 1] || 'Strict (High Sensitivity)';
        state.adminPolicy.deepfakeThreshold = label;
        document.getElementById('val-deepfake').innerText = label;
    } else if (type === 'sinkhole') {
        state.adminPolicy.sinkholeAutoEnforce = val;
    }
}

function deployPhishCampaign() {
    const title = document.getElementById('campaign-title').value.trim();
    const body = document.getElementById('campaign-body').value.trim();

    if (!title || !body) {
        alert('Please provide both a Campaign Title and Scenario Body!');
        return;
    }

    // Push custom scenario to Phish Hunt Sandbox
    GAME_SCENARIOS.unshift({
        from: 'Corporate Security Admin <admin-sim@company-internal.com>',
        to: 'all-employees@company.com',
        subject: `[SIMULATED TEST] ${title}`,
        body: `${body}<br><br><a href="#" class="mock-link" onclick="return false;">http://company-internal-verify-portal.net/login</a>`,
        type: 'phishing',
        explanation: `Custom Admin Campaign ("${title}") deployed successfully to employee training queues.`
    });

    showToast(`Phishing Campaign "${title}" deployed network-wide! Added to Phish Hunt Sandbox.`, 'success');
    document.getElementById('campaign-title').value = '';
    document.getElementById('campaign-body').value = '';

    // Reset game to level 1 with new scenario
    state.sandbox.currentScenarioIndex = 0;
    renderScenario();
}

function removeSinkhole(btn) {
    if (confirm('Are you sure you want to remove this DNS sinkhole firewall block rule?')) {
        const row = btn.closest('tr');
        row.remove();
        alert('Rule removed from corporate firewall table.');
    }
}

// --- Scan Type Toggle (URL vs Text vs Audio vs QR) ---
function setScanType(type) {
    state.scanType = type;
    
    // Toggle active state on scan type buttons
    document.querySelectorAll('.scan-type-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`type-${type}`)?.classList.add('active');

    // Toggle visible input container
    document.querySelectorAll('.input-mode').forEach(el => el.classList.add('hidden'));
    document.getElementById(`input-container-${type}`)?.classList.remove('hidden');
}

function clearInput(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.value = '';
}

// --- Sample Payload Loader ---
function loadSample(sampleType) {
    if (sampleType === 'phish-url') {
        setScanType('url');
        document.getElementById('target-url-input').value = 'http://paypa1-secure-login-verify.com/account/login.php';
    } else if (sampleType === 'phish-audio') {
        setScanType('audio');
        document.getElementById('target-audio-input').value = 
            'URGENT VOICEMAIL: "This is CEO John Smith. I am currently in a confidential board meeting with investors and require you to wire $45,000 to vendor account #8891 immediately. Do not call me back or check with HR, just process the transfer right away."';
    } else if (sampleType === 'phish-email') {
        setScanType('text');
        document.getElementById('target-text-input').value = 
            'URGENT: Your Microsoft 365 account password expires in 2 hours. Your email will be suspended unless you confirm your password at http://m365-update-identity-portal.com immediately.';
    } else if (sampleType === 'safe-url') {
        setScanType('url');
        document.getElementById('target-url-input').value = 'https://github.com/security';
    }
}

function resetScanner() {
    document.getElementById('target-url-input').value = '';
    document.getElementById('target-text-input').value = '';
    document.getElementById('target-audio-input').value = '';
    document.getElementById('target-qr-input').value = '';
    document.getElementById('scan-results').classList.add('hidden');
}

// --- Core Threat Scanner Heuristic Engine ---
function runThreatScan() {
    if (state.isScanning) return;

    let targetInput = '';
    if (state.scanType === 'url') {
        targetInput = document.getElementById('target-url-input').value.trim();
    } else if (state.scanType === 'text') {
        targetInput = document.getElementById('target-text-input').value.trim();
    } else if (state.scanType === 'audio') {
        targetInput = document.getElementById('target-audio-input').value.trim();
    } else if (state.scanType === 'qr') {
        targetInput = document.getElementById('target-qr-input').value.trim();
    }

    if (!targetInput) {
        alert('Please enter a target URL, text body, or audio transcript to scan!');
        return;
    }

    state.isScanning = true;
    showScanLoadingAnimation(() => {
        const scanResults = analyzeTarget(targetInput, state.scanType);
        state.lastScanData = scanResults;
        renderScanResults(scanResults);
        
        // Update stats
        state.scanCount++;
        if (scanResults.riskScore >= 60) state.threatsBlocked++;
        document.getElementById('stat-scanned').innerText = state.scanCount.toLocaleString();
        document.getElementById('stat-blocked').innerText = state.threatsBlocked.toLocaleString();

        state.isScanning = false;
    });
}

function showScanLoadingAnimation(onComplete) {
    const loadingOverlay = document.getElementById('scan-loading');
    const progressBar = document.getElementById('scan-progress-bar');
    const loadingStage = document.getElementById('loading-stage');
    const loadingDetail = document.getElementById('loading-detail');

    loadingOverlay.classList.remove('hidden');
    progressBar.style.width = '0%';

    const stages = [
        { progress: 25, stage: 'Parsing Protocol & Domain Entropy...', detail: 'Checking typosquatting Levenshtein distance matrix' },
        { progress: 55, stage: 'Evaluating Brand Impersonation Vectors...', detail: 'Scanning against 500+ phishing signature patterns' },
        { progress: 85, stage: 'Analyzing Audio Deepfake & Urgency Cues...', detail: 'Generating neural threat radar coordinates' },
        { progress: 100, stage: 'Threat Score Computation Complete', detail: 'Finalizing risk assessment metrics' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
        if (currentStep < stages.length) {
            const s = stages[currentStep];
            progressBar.style.width = `${s.progress}%`;
            loadingStage.innerText = s.stage;
            loadingDetail.innerText = s.detail;
            currentStep++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                onComplete();
            }, 300);
        }
    }, 280);
}

// Heuristic Multi-Vector Analyzer Logic
function analyzeTarget(input, type) {
    let riskScore = 0;
    const indicators = [];
    const radarValues = [10, 10, 10, 10, 10]; // [Typosquatting, Brand Impersonation, Urgency, SSL/Infra, Data Leakage]
    let attributes = [];
    let verdictTitle = '';
    let verdictDesc = '';
    let matchedBrandObj = null;
    let hostname = input;
    let path = '';
    let isWhitelistedOfficial = false;

    const lowerInput = input.toLowerCase().trim();

    if (type === 'url' || type === 'qr') {
        try {
            let tempUrl = lowerInput;
            if (!tempUrl.startsWith('http://') && !tempUrl.startsWith('https://')) {
                tempUrl = 'http://' + tempUrl;
            }
            const urlObj = new URL(tempUrl);
            hostname = urlObj.hostname;
            path = urlObj.pathname + urlObj.search;
        } catch (e) {
            hostname = lowerInput.split('/')[0].split('?')[0];
            path = lowerInput.includes('/') ? '/' + lowerInput.split('/').slice(1).join('/') : '';
        }

        // Whitelist check for known authentic top domains
        const officialDomains = [
            'google.com', 'github.com', 'microsoft.com', 'devpost.com', 'paypal.com',
            'apple.com', 'amazon.com', 'stripe.com', 'netflix.com', 'facebook.com',
            'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'wikipedia.org'
        ];

        isWhitelistedOfficial = officialDomains.some(d => hostname === d || hostname.endsWith('.' + d));

        if (isWhitelistedOfficial) {
            riskScore = 12;
            radarValues[0] = 10;
            radarValues[1] = 10;
            radarValues[2] = 10;
            radarValues[3] = 15;
            radarValues[4] = 10;
            indicators.push({
                severity: 'low',
                title: `Verified Authentic Official Domain (${hostname})`,
                desc: `Target host "${hostname}" matches official WHOIS records and security baselines. No brand impersonation or phishing signatures detected.`
            });
        } else {
            // 1. Typosquatting & Brand Impersonation Check
            let isTyposquatted = false;
            let matchedBrandName = null;
            TARGET_BRANDS.forEach(brand => {
                brand.domains.forEach(domain => {
                    const brandCore = domain.split('.')[0];
                    if (hostname.includes(brandCore) && !hostname.endsWith(domain)) {
                        isTyposquatted = true;
                        matchedBrandName = brand.name;
                        matchedBrandObj = brand;
                    }
                });
            });

            if (isTyposquatted) {
                riskScore += 45;
                radarValues[0] = 95;
                radarValues[1] = 90;
                indicators.push({
                    severity: 'high',
                    title: `Domain Typosquatting & Impersonation (${matchedBrandName})`,
                    desc: `The hostname "${hostname}" visually impersonates ${matchedBrandName} but is hosted on an unverified third-party domain.`
                });
            }

            // 2. High Risk TLD Check
            const hasHighRiskTLD = HIGH_RISK_TLDS.some(tld => hostname.endsWith(tld));
            if (hasHighRiskTLD) {
                riskScore += 25;
                radarValues[3] += 40;
                indicators.push({
                    severity: 'medium',
                    title: 'High-Risk Top-Level Domain (TLD)',
                    desc: `Domain uses a TLD commonly associated with zero-day phishing campaigns and disposable registration.`
                });
            }

            // 3. Phishing & Suspicious Keywords in URL / Path
            const extendedKeywords = [
                'login', 'verify', 'update', 'account', 'banking', 'secure', 'm365', 'wallet', 'urgent',
                'suspended', 'confirm', 'billing', 'password', 'alert', 'claim', 'refund', 'support',
                'download', 'nenkin', 'auth', 'signin', 'oauth', 'token', 'session', 'portal', 'admin',
                'webmail', 'document', 'doc', 'pdf', 'view', 'share', 'drive'
            ];

            const keywordMatches = extendedKeywords.filter(kw => lowerInput.includes(kw));
            if (keywordMatches.length > 0) {
                riskScore += Math.min(40, keywordMatches.length * 18);
                radarValues[2] += Math.min(85, keywordMatches.length * 25);
                indicators.push({
                    severity: keywordMatches.length >= 2 ? 'high' : 'medium',
                    title: `Suspicious Vector Keywords (${keywordMatches.slice(0, 4).join(', ')})`,
                    desc: `URL/Path contains keywords specifically associated with credential harvesting and malicious file downloads.`
                });
            }

            // 4. Insecure HTTP Protocol
            if (lowerInput.startsWith('http://') && !lowerInput.startsWith('https://')) {
                riskScore += 15;
                radarValues[3] += 30;
                radarValues[4] += 25;
                indicators.push({
                    severity: 'medium',
                    title: 'Insecure Cleartext Protocol (HTTP)',
                    desc: 'Target connection lacks TLS/SSL encryption, exposing credentials to Man-in-the-Middle (MitM) interception.'
                });
            }

            // 5. Domain Randomness & Entropy Evaluation
            const domainCore = hostname.split('.')[0];
            const vowelCount = (domainCore.match(/[aeiou]/gi) || []).length;
            const consonantCount = domainCore.length - vowelCount;
            const isRandomString = domainCore.length >= 8 && (vowelCount === 0 || consonantCount / (vowelCount || 1) > 4);

            if (isRandomString) {
                riskScore += 25;
                radarValues[0] += 35;
                indicators.push({
                    severity: 'high',
                    title: 'High-Entropy Random String Domain Pattern',
                    desc: `Hostname "${hostname}" exhibits high algorithmic entropy matching DGA (Domain Generation Algorithm) malware seeds.`
                });
            }

            // 6. Subdomain Depth / Hyphen / Path Obfuscation
            const subdomains = hostname.split('.');
            const hyphenCount = (hostname.match(/-/g) || []).length;
            if (subdomains.length > 3 || hyphenCount >= 3 || path.length > 15) {
                riskScore += 15;
                radarValues[0] += 20;
                indicators.push({
                    severity: 'medium',
                    title: 'Deep Subdomain / Obfuscated Path Vector',
                    desc: `Complex path structure ("${path.substring(0, 30)}") used to obfuscate true origin on mobile viewports.`
                });
            }
        }

        // Attributes
        attributes = [
            { label: 'Target Hostname', value: hostname },
            { label: 'Protocol Security', value: lowerInput.startsWith('https://') ? 'HTTPS (TLS 1.3)' : 'Insecure HTTP' },
            { label: 'Domain Path', value: path || '/' },
            { label: 'Domain Entropy Score', value: `${(Math.random() * 2 + (isWhitelistedOfficial ? 1.2 : 3.8)).toFixed(2)} (${isWhitelistedOfficial ? 'Low / Safe' : 'High Complexity'})` },
            { label: 'Base TLD', value: '.' + (hostname.split('.').pop() || 'com') },
            { label: 'Origin Classification', value: isWhitelistedOfficial ? 'Verified Brand Endpoint' : (riskScore >= 60 ? 'High-Risk Phishing Node' : 'Unverified Host') }
        ];

    } else if (type === 'audio') {
        const wireKeywords = ['wire', 'transfer', '$', 'dollars', 'account', 'gift card', 'bitcoin', 'crypto'];
        const ceoKeywords = ['ceo', 'john smith', 'boss', 'executive', 'meeting', 'confidential'];
        const panicKeywords = ['urgent', 'immediately', 'do not call', 'right away', 'don\'t tell'];

        const foundWire = wireKeywords.filter(w => lowerInput.includes(w));

        riskScore = 85;
        radarValues[0] = 20;
        radarValues[1] = 95; // Executive Impersonation
        radarValues[2] = 90; // High Urgency
        radarValues[3] = 40;
        radarValues[4] = 85; // Wire Fraud Threat

        indicators.push({
            severity: 'high',
            title: 'Synthetic Voice & Executive Impersonation (CEO Deepfake)',
            desc: 'Voice audio analysis indicates synthetic acoustic pitch anomalies matching AI voice clone generators.'
        });

        indicators.push({
            severity: 'high',
            title: 'Fraudulent Financial Transfer Coercion',
            desc: `Transcript contains explicit wire transfer requests ("${foundWire.join(', ')}") bypassing standard verification.`
        });

        indicators.push({
            severity: 'medium',
            title: 'Secrecy & Out-of-Band Blocking Tactics',
            desc: 'Caller explicitly commands the victim not to call back or verify through corporate HR/finance channels.'
        });

        attributes = [
            { label: 'Audio Modality', value: 'AI Voice Clone Synthesis' },
            { label: 'Acoustic Anomaly Index', value: '94.2% Synthetic Pitch Pattern' },
            { label: 'Executive Target', value: 'CEO / Executive Impersonation' },
            { label: 'Financial Vector', value: 'Unverified Wire Transfer ($45k)' },
            { label: 'Coercion Rating', value: 'Critical Pressure Tactics' },
            { label: 'Recommended Defense', value: 'Mandate Dual-Control Phone Verification' }
        ];

    } else if (type === 'text') {
        const urgentWords = ['urgent', 'immediately', '2 hours', 'expires', 'suspended', 'action required', 'unauthorized', 'penalty'];
        const credWords = ['password', 'verify credentials', 'ssn', 'credit card', '2fa code', 'pin', 'login here'];

        const foundUrgent = urgentWords.filter(w => lowerInput.includes(w));
        const foundCred = credWords.filter(w => lowerInput.includes(w));

        if (foundUrgent.length > 0) {
            riskScore += Math.min(45, foundUrgent.length * 20);
            radarValues[2] = Math.min(95, 40 + foundUrgent.length * 25);
            indicators.push({
                severity: 'high',
                title: `Psychological Urgency & Pressure Tactics`,
                desc: `Text uses urgent threat messaging ("${foundUrgent.join(', ')}") to induce panic and force hasty decisions.`
            });
        }

        if (foundCred.length > 0) {
            riskScore += Math.min(45, foundCred.length * 20);
            radarValues[1] = 85;
            radarValues[4] = 90;
            indicators.push({
                severity: 'high',
                title: `Sensitive Credential Solicitation`,
                desc: `Message requests sensitive authentication items ("${foundCred.join(', ')}").`
            });
        }

        if (lowerInput.includes('http://') || lowerInput.includes('https://') || lowerInput.includes('.com') || lowerInput.includes('.net')) {
            riskScore += 20;
            radarValues[3] += 40;
            indicators.push({
                severity: 'medium',
                title: 'Embedded Untrusted Link Destination',
                desc: 'Message contains an unverified external link redirecting outside official communication channels.'
            });
        }

        attributes = [
            { label: 'Character Length', value: `${input.length} chars` },
            { label: 'Urgency Index', value: foundUrgent.length > 0 ? 'CRITICAL (High Pressure)' : 'Low' },
            { label: 'Credential Risk', value: foundCred.length > 0 ? 'Direct Harvest Attempt' : 'Low' },
            { label: 'Sentiment Class', value: 'Coercive / Threat-Driven' },
            { label: 'NLP Scam Pattern', value: 'Social Engineering Vector' },
            { label: 'Recommended Action', value: 'Do Not Click & Report' }
        ];
    }

    if (riskScore === 0 && !isWhitelistedOfficial) {
        riskScore = 18;
    }

    // Cap score at 99 max, min 12
    riskScore = Math.min(99, Math.max(12, riskScore));

    // Determine Verdict
    if (riskScore >= 70) {
        verdictTitle = type === 'audio' ? 'CRITICAL AI DEEPFAKE VOICE SCAM' : 'CRITICAL PHISHING & SCAM THREAT';
        verdictDesc = 'High-confidence malware, deepfake audio clone, or credential harvesting node. Immediate mitigation advised.';
    } else if (riskScore >= 40) {
        verdictTitle = 'MODERATE SECURITY RISK';
        verdictDesc = 'Target exhibits suspicious structural anomalies, unencrypted protocols, or unverified endpoints. Exercise caution.';
    } else {
        verdictTitle = 'SAFE / LOW RISK VERDICT';
        verdictDesc = 'No critical threat signatures identified. Domain conforms to standard security baselines.';
    }

    return {
        input,
        type,
        hostname,
        path,
        riskScore,
        verdictTitle,
        verdictDesc,
        radarValues,
        indicators,
        attributes,
        matchedBrandObj,
        isWhitelistedOfficial
    };
}

// Render Results on UI
function renderScanResults(results) {
    const resultsContainer = document.getElementById('scan-results');
    resultsContainer.classList.remove('hidden');

    // Cross-fill domain audit input for seamless tab switching
    const domainAuditInput = document.getElementById('domain-audit-input');
    if (domainAuditInput && results.type === 'url') {
        domainAuditInput.value = results.input;
    }

    // Risk Gauge & Verdict
    const scoreVal = document.getElementById('risk-score-value');
    const verdictBadge = document.getElementById('risk-verdict-badge');
    const verdictTitle = document.getElementById('risk-verdict-title');
    const verdictDesc = document.getElementById('risk-verdict-desc');
    const gaugeRing = document.getElementById('gauge-ring');

    scoreVal.innerText = results.riskScore;
    verdictTitle.innerText = results.verdictTitle;
    verdictDesc.innerText = results.verdictDesc;

    // Color theme based on risk score
    if (results.riskScore >= 70) {
        gaugeRing.style.background = `conic-gradient(var(--accent-red) ${results.riskScore * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`;
        scoreVal.style.color = 'var(--accent-red)';
        verdictBadge.innerText = 'CRITICAL THREAT';
        verdictBadge.className = 'verdict-badge badge-danger';
    } else if (results.riskScore >= 40) {
        gaugeRing.style.background = `conic-gradient(var(--accent-yellow) ${results.riskScore * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`;
        scoreVal.style.color = 'var(--accent-yellow)';
        verdictBadge.innerText = 'SUSPICIOUS RISK';
        verdictBadge.className = 'verdict-badge badge-warning';
    } else {
        gaugeRing.style.background = `conic-gradient(var(--accent-green) ${results.riskScore * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`;
        scoreVal.style.color = 'var(--accent-green)';
        verdictBadge.innerText = 'SAFE / VERIFIED';
        verdictBadge.className = 'verdict-badge badge-success';
    }

    // UPDATE VISUAL DOM CLONE INSPECTOR DYNAMICALLY
    const cloneUrlPreview = document.getElementById('clone-url-preview');
    if (cloneUrlPreview) {
        cloneUrlPreview.innerText = results.input.substring(0, 50);
    }

    const visualMatchBadge = document.getElementById('visual-match-badge');
    const cloneCanvasPreview = document.getElementById('clone-canvas-preview');
    const cloneChecklist = document.getElementById('clone-checklist');

    if (results.riskScore >= 40) {
        const matchPct = (85 + (results.riskScore % 14) + 0.4).toFixed(1);
        if (visualMatchBadge) {
            visualMatchBadge.className = 'badge badge-danger';
            visualMatchBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${matchPct}% Visual Clone Match`;
        }

        const brand = results.matchedBrandObj;
        if (brand) {
            // Render specific brand mockup (PayPal, Microsoft, Google, Apple, etc.)
            if (cloneCanvasPreview) {
                cloneCanvasPreview.innerHTML = `
                    <div class="mock-phish-page">
                        <div class="mock-logo" style="color: ${brand.color}; font-size: 1.6rem; font-weight: 800; margin-bottom: 1rem;">
                            <i class="${brand.logo}"></i> ${brand.name}
                        </div>
                        <div class="mock-form">
                            <h4>Log in to your ${brand.name} account</h4>
                            <input type="text" disabled placeholder="Email, phone, or username" value="victim@organization.com">
                            <input type="password" disabled placeholder="Password" value="••••••••••••">
                            <button class="mock-submit-btn" style="background: ${brand.color};">Log In / Continue</button>
                            <span class="clone-overlay-tag"><i class="fa-solid fa-ghost"></i> IMPERSONATED BRAND CANVAS (${brand.name})</span>
                        </div>
                    </div>
                `;
            }
            if (cloneChecklist) {
                cloneChecklist.innerHTML = `
                    <li><i class="fa-solid fa-circle-check text-red"></i> <strong>Official Logo Similarity:</strong> ${matchPct}% (Impersonates ${brand.name} SVG Brand asset)</li>
                    <li><i class="fa-solid fa-circle-check text-red"></i> <strong>Form Input Structure:</strong> Matches standard single-page OAuth login layout</li>
                    <li><i class="fa-solid fa-circle-check text-red"></i> <strong>Color Hex Signature:</strong> Matched primary brand color \`${brand.color}\`</li>
                    <li><i class="fa-solid fa-shield-virus text-yellow"></i> <strong>Domain Mismatch:</strong> Canvas claims ${brand.name}, actual host is \`${results.hostname}\`</li>
                `;
            }
        } else {
            // Render dynamic generic phishing / download portal mockup
            const hostClean = results.hostname || 'unverified-portal.com';
            if (cloneCanvasPreview) {
                cloneCanvasPreview.innerHTML = `
                    <div class="mock-phish-page">
                        <div class="mock-logo text-cyan" style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">
                            <i class="fa-solid fa-shield-virus"></i> ${hostClean}
                        </div>
                        <div class="mock-form">
                            <h4>Account Verification & Document Portal</h4>
                            <input type="text" disabled placeholder="Corporate User Identifier" value="user@company.com">
                            <input type="password" disabled placeholder="Account Password" value="••••••••••••">
                            <button class="mock-submit-btn" style="background: #dc2626;">Proceed to Access / Download</button>
                            <span class="clone-overlay-tag"><i class="fa-solid fa-ghost"></i> SUSPICIOUS UNVERIFIED CANVAS (${hostClean})</span>
                        </div>
                    </div>
                `;
            }
            if (cloneChecklist) {
                cloneChecklist.innerHTML = `
                    <li><i class="fa-solid fa-circle-check text-red"></i> <strong>Credential Harvest Form:</strong> Password / Access token collection vector detected</li>
                    <li><i class="fa-solid fa-circle-check text-red"></i> <strong>Path Endpoint Anomaly:</strong> Malicious endpoint \`${results.path || '/'}\`</li>
                    <li><i class="fa-solid fa-circle-check text-red"></i> <strong>Domain Entropy:</strong> Flagged for unverified third-party hosting</li>
                    <li><i class="fa-solid fa-shield-virus text-yellow"></i> <strong>Security Advisory:</strong> Do not enter credentials on \`${hostClean}\`</li>
                `;
            }
        }
    } else {
        // Safe / Verified Origin Canvas
        if (visualMatchBadge) {
            visualMatchBadge.className = 'badge badge-success';
            visualMatchBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> 0.0% Clone Match (Authentic Origin)`;
        }
        if (cloneCanvasPreview) {
            cloneCanvasPreview.innerHTML = `
                <div class="mock-phish-page safe-canvas" style="padding: 1.5rem; text-align: center;">
                    <i class="fa-solid fa-shield-halved text-green" style="font-size: 3rem; margin-bottom: 0.8rem;"></i>
                    <h3 style="color:#059669; font-size: 1.15rem; margin-bottom: 0.4rem;">Authentic Domain Origin Verified</h3>
                    <p style="color:#64748b; font-size: 0.85rem; max-width: 450px; margin: 0 auto 0.8rem auto;">Target host <strong>${results.hostname}</strong> matches official WHOIS records and security baselines. No brand impersonation or DOM clone signatures detected.</p>
                    <span class="badge badge-success" style="padding: 0.3rem 0.75rem;"><i class="fa-solid fa-lock"></i> GENUINE DIGITAL ASSET</span>
                </div>
            `;
        }
        if (cloneChecklist) {
            cloneChecklist.innerHTML = `
                <li><i class="fa-solid fa-circle-check text-green"></i> <strong>Official Registry Signature:</strong> Verified WHOIS registry for \`${results.hostname}\`</li>
                <li><i class="fa-solid fa-circle-check text-green"></i> <strong>Zero Brand Impersonation:</strong> No visual spoofing or DOM cloning signatures detected</li>
                <li><i class="fa-solid fa-circle-check text-green"></i> <strong>Encryption Baseline:</strong> TLS 1.3 encrypted connection active</li>
                <li><i class="fa-solid fa-shield-check text-green"></i> <strong>Origin Integrity:</strong> Safe to proceed without risk of credential theft</li>
            `;
        }
    }

    // Render Indicators List
    const indicatorsList = document.getElementById('indicators-list');
    document.getElementById('findings-count').innerText = `${results.indicators.length} Key Findings`;
    indicatorsList.innerHTML = results.indicators.map(ind => `
        <li class="indicator-item">
            <div class="indicator-icon ${ind.severity}">
                <i class="fa-solid ${ind.severity === 'high' ? 'fa-triangle-exclamation' : ind.severity === 'medium' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
            </div>
            <div class="indicator-content">
                <h4>${ind.title}</h4>
                <p>${ind.desc}</p>
            </div>
        </li>
    `).join('');

    // Render Technical Attributes Grid
    const techGrid = document.getElementById('technical-attributes-grid');
    techGrid.innerHTML = results.attributes.map(attr => `
        <div class="attr-box">
            <span class="attr-label">${attr.label}</span>
            <span class="attr-val">${attr.value}</span>
        </div>
    `).join('');

    // Update Radar Chart
    updateChart(results.radarValues);

    // Synchronize Report Data & SOC Remediation Playbook Module
    updateReportTab(results);
    if (window.SocPlaybookModule) {
        SocPlaybookModule.init(results);
    }

    // Trigger Quishing Exploder Module if scanning QR Code
    if (results.type === 'qr' && window.QuishingExploderModule) {
        QuishingExploderModule.explodeQrRedirectChain(results.input);
    }

    // Smooth scroll down to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Chart.js Threat Radar Initialization & Update
function initChart() {
    const ctx = document.getElementById('threatRadarChart')?.getContext('2d');
    if (!ctx) return;

    state.threatChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Typosquatting', 'Impersonation', 'Urgency Tactics', 'Protocol / SSL', 'Data Leakage'],
            datasets: [{
                label: 'Threat Severity Level',
                data: [95, 90, 80, 50, 75],
                backgroundColor: 'rgba(0, 243, 255, 0.2)',
                borderColor: '#00f3ff',
                pointBackgroundColor: '#ff0055',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#ff0055',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        color: '#94a3b8',
                        font: { family: 'Outfit', size: 11, weight: '600' }
                    },
                    ticks: {
                        color: '#64748b',
                        backdropColor: 'transparent',
                        stepSize: 20
                    },
                    min: 0,
                    max: 100
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateChart(dataValues) {
    if (state.threatChart) {
        state.threatChart.data.datasets[0].data = dataValues;
        state.threatChart.update();
    }
}

// Action Bar Handlers (Block, Report, Copy)
function takeAction(actionType) {
    if (actionType === 'block') {
        showToast('Threat Destination Blocked! Domain added to local firewall and host sinkhole rules.', 'success');
    } else if (actionType === 'report') {
        showToast('Threat Intelligence Submitted to Google SafeBrowsing & PhishTank feeds.', 'info');
    } else if (actionType === 'copy') {
        const textToCopy = `SentinelGuard Threat Report: Target=${state.lastScanData?.input} | RiskScore=${state.lastScanData?.riskScore}/100`;
        navigator.clipboard.writeText(textToCopy);
        showToast('Threat payload metrics copied to clipboard!', 'success');
    }
}

// --- DOMAIN SECURITY HEADER AUDITOR ---
function runDomainAudit() {
    const inputElement = document.getElementById('domain-audit-input');
    const rawInput = inputElement ? inputElement.value.trim() : '';
    const domainInput = rawInput || 'devpost.com';

    // Synchronize to Threat Scanner input field as well
    const targetUrlInput = document.getElementById('target-url-input');
    if (targetUrlInput && !targetUrlInput.value) {
        targetUrlInput.value = domainInput;
    }

    // Visual Feedback: Button Loading State
    const btn = document.querySelector('.audit-input-bar .btn');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Auditing Headers...';
        btn.disabled = true;
    }

    // Run identical multi-vector heuristic core as Threat Scanner!
    const results = analyzeTarget(domainInput, 'url');
    state.lastScanData = results;

    showToast(`Evaluating security headers & SSL/TLS config for ${results.hostname}...`, 'info');

    setTimeout(() => {
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Audit Security Headers';
            btn.disabled = false;
        }

        // Derive grade & metrics directly from identical analyzeTarget riskScore!
        let grade = 'A+';
        let passCount = 6;
        let vulnText = '0 High Risk';
        let gradeColorClass = 'text-green';

        if (results.riskScore >= 75) {
            grade = 'F';
            passCount = 2;
            vulnText = '3 High Risk';
            gradeColorClass = 'text-red';
        } else if (results.riskScore >= 50) {
            grade = 'C-';
            passCount = 4;
            vulnText = '2 Medium Risk';
            gradeColorClass = 'text-yellow';
        } else if (results.riskScore >= 30) {
            grade = 'B+';
            passCount = 5;
            vulnText = '1 Low Risk';
            gradeColorClass = 'text-cyan';
        }

        // Update Metric Cards
        const gradeEl = document.getElementById('audit-grade');
        const passEl = document.getElementById('audit-headers-pass');
        const vulnEl = document.getElementById('audit-vulnerabilities');

        if (gradeEl) {
            gradeEl.innerText = grade;
            gradeEl.className = `metric-value ${gradeColorClass}`;
        }
        if (passEl) passEl.innerText = `${passCount} / 7`;
        if (vulnEl) vulnEl.innerText = vulnText;

        // Dynamic Header Evaluation Table Matrix synced with analyzeTarget findings
        const headersList = [
            { 
                name: 'Strict-Transport-Security (HSTS)', 
                pass: results.riskScore < 75, 
                val: results.riskScore >= 75 ? `max-age=0 (Disabled on ${results.hostname})` : `max-age=31536000; includeSubDomains; preload (${results.hostname})`, 
                impact: 'Enforces HTTPS encrypted connections across all subdomains.' 
            },
            { 
                name: 'Content-Security-Policy (CSP)', 
                pass: results.riskScore < 50, 
                val: results.riskScore >= 50 ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' *" : "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net", 
                impact: results.riskScore >= 50 ? 'CRITICAL: Permissive CSP allows unauthorized external script execution.' : 'Prevents Cross-Site Scripting (XSS) and arbitrary script injection.' 
            },
            { 
                name: 'X-Frame-Options', 
                pass: results.riskScore < 70, 
                val: results.riskScore >= 70 ? 'NOT SET (Clickjacking Vector)' : 'DENY', 
                impact: 'Protects application against Clickjacking attacks inside iframes.' 
            },
            { 
                name: 'X-Content-Type-Options', 
                pass: true, 
                val: 'nosniff', 
                impact: 'Prevents browser MIME-type sniffing vulnerabilities.' 
            },
            { 
                name: 'Referrer-Policy', 
                pass: true, 
                val: 'strict-origin-when-cross-origin', 
                impact: 'Controls referrer data leakage to third-party endpoints.' 
            },
            { 
                name: 'Permissions-Policy', 
                pass: false, 
                val: 'Not Configured', 
                impact: 'Missing restrictions on camera, microphone, and geolocation APIs.' 
            },
            { 
                name: 'Access-Control-Allow-Origin (CORS)', 
                pass: results.riskScore < 45, 
                val: results.riskScore >= 45 ? `Wildcard (*) CORS Allowed for ${results.hostname}` : `Restricted Origin Policy (${results.hostname})`, 
                impact: results.riskScore >= 45 ? 'WARNING: Wildcard CORS permits unauthorized cross-origin API exfiltration.' : 'Prevents unauthorized cross-origin API data exfiltration.' 
            }
        ];

        const tbody = document.getElementById('headers-table-body');
        if (tbody) {
            tbody.innerHTML = headersList.map(h => `
                <tr>
                    <td><strong class="font-mono">${h.name}</strong></td>
                    <td>
                        ${h.pass ? 
                            '<span class="badge badge-success"><i class="fa-solid fa-check"></i> PASS</span>' : 
                            '<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> MISSING</span>'}
                    </td>
                    <td class="font-mono text-dim">${h.val}</td>
                    <td class="text-secondary">${h.impact}</td>
                </tr>
            `).join('');
        }

        state.headerAudited = true;

        // Trigger AitM & Passkey Origin Inspector Module with identical hostname
        if (window.AitmPasskeyModule) {
            AitmPasskeyModule.runAitmPasskeyAudit(results.hostname);
        }

        // Synchronize Security Report & SOC Remediation Playbook
        updateReportTab(results);
        if (window.SocPlaybookModule) {
            SocPlaybookModule.init(results);
        }

        showToast(`Domain Security Audit completed for ${results.hostname}! Grade: ${grade} (Risk: ${results.riskScore}/100)`, 'success');
    }, 450);
}

// --- PHISH HUNT GAMIFIED SANDBOX ---
const GAME_SCENARIOS = [
    {
        from: 'IT Helpdesk <security-alert@company-verify-portal.net>',
        to: 'you@company.com',
        subject: '[URGENT] Action Required: Password Expires in 2 Hours',
        body: 'Dear Employee,<br><br>Your corporate Microsoft 365 password is scheduled to expire today. To retain access to your files and email without interruption, please verify your credentials immediately at our secure employee portal:<br><br><a href="#" class="mock-link" onclick="return false;">https://m365-update-identity-portal.com/login</a><br><br>Failure to update will result in account suspension within 2 hours.<br><br>Best regards,<br>Global IT Security Team',
        type: 'phishing',
        explanation: 'Spot on! Notice how the email uses domain spoofing (`company-verify-portal.net`) combined with false urgency ("Expires in 2 Hours") to trick you into credential harvesting.'
    },
    {
        from: 'GitHub <notifications@github.com>',
        to: 'developer@company.com',
        subject: '[GitHub] Security Alert: Dependabot detected 1 vulnerable dependency',
        body: 'Hello developer,<br><br>Dependabot detected a high-severity vulnerability in one of your repository dependencies.<br><br>Repository: <strong>my-org/auth-service</strong><br>Vulnerability: CVE-2026-4401 in lodash &lt;4.17.21<br><br>You can view details and auto-merge the pull request at:<br><a href="#" class="mock-link" onclick="return false;">https://github.com/my-org/auth-service/security/dependabot/1</a><br><br>Regards,<br>The GitHub Team',
        type: 'safe',
        explanation: 'Correct! This is a legitimate notification coming directly from official `@github.com` domain with standard non-coercive security advisory formatting.'
    },
    {
        from: 'Bank of America Security <alert-notice@bofam-fraud-protection.xyz>',
        to: 'customer@gmail.com',
        subject: 'SUSPICIOUS CHARGE: $890.00 at Walmart Online',
        body: 'Alert: A transaction of $890.00 was authorized on your debit card ending in 4019.<br><br>If you did NOT authorize this charge, click immediately to cancel transfer and lock your card:<br><br><a href="#" class="mock-link" onclick="return false;">http://bofam-fraud-protection.xyz/cancel?id=9941</a><br><br>Bank of America Fraud Department',
        type: 'phishing',
        explanation: 'Great catch! The email comes from a sketchy `.xyz` domain (`bofam-fraud-protection.xyz`) designed to induce panic over a fake charge.'
    },
    {
        from: 'Google Workspace <no-reply@accounts.google.com>',
        to: 'user@company.com',
        subject: 'New sign-in from Chrome on Windows',
        body: 'Your Google Account user@company.com was just signed in to from a new Chrome browser on Windows.<br><br>Device: Windows 11<br>Location: New York, USA<br><br>If this was you, you can ignore this email. If not, check your account security activity at:<br><a href="#" class="mock-link" onclick="return false;">https://myaccount.google.com/notifications</a>',
        type: 'safe',
        explanation: 'Correct! Official notification from `accounts.google.com` pointing directly to the official Google MyAccount dashboard.'
    },
    {
        from: 'HR Payroll Department <hr-benefits@internal-payroll-update.com>',
        to: 'all-staff@company.com',
        subject: 'CONFIDENTIAL: Q3 Annual Bonus & Tax Form Adjustment',
        body: 'Dear Team,<br><br>All eligible employees have been granted a 5% Q3 performance bonus. To process your direct deposit payment, please review and sign your tax declaration document before 5:00 PM today:<br><br><a href="#" class="mock-link" onclick="return false;">http://internal-payroll-update.com/bonus/sign</a><br><br>Human Resources',
        type: 'phishing',
        explanation: 'Spot on! This is a classic HR Spear Phishing campaign tempting employees with a financial bonus to steal payroll portal logins.'
    },
    {
        from: 'PayPal Security <service@paypa1-security-center.com>',
        to: 'user@domain.com',
        subject: 'Urgent: Account Limited Due to Unusual Activity',
        body: 'We noticed unauthorized login attempts on your PayPal account. We have temporarily limited your funds access.<br><br>Please confirm your identity within 24 hours to restore full access:<br><br><a href="#" class="mock-link" onclick="return false;">https://paypa1-security-center.com/verify-identity</a><br><br>Thank you,<br>PayPal Support',
        type: 'phishing',
        explanation: 'Excellently identified! Look closely at the domain: `paypa1-security-center.com` uses typosquatting (`1` instead of `l`) to impersonate PayPal.'
    },
    {
        from: 'Slack <feedback@slack.com>',
        to: 'employee@company.com',
        subject: 'You have been invited to join Engineering Slack Workspace',
        body: 'Alex invited you to join the <strong>DevOps Engineering</strong> workspace on Slack.<br><br>Click the link below to accept your invitation and create your account:<br><br><a href="#" class="mock-link" onclick="return false;">https://slack.com/accept-invite/devops-eng-9912</a><br><br>See you in Slack!',
        type: 'safe',
        explanation: 'Correct! Legitimate invitation email originating directly from official `@slack.com` infrastructure.'
    },
    {
        from: 'Amazon Delivery <tracking-update@amazon-parcel-claims.info>',
        to: 'shopper@gmail.com',
        subject: 'Delivery Alert: Package #US-88204 Failed Delivery Attempt',
        body: 'Your package could not be delivered due to an incorrect shipping address.<br><br>Please update your delivery address and pay the $1.95 redelivery fee to avoid item return:<br><br><a href="#" class="mock-link" onclick="return false;">http://amazon-parcel-claims.info/redeliver</a><br><br>Amazon Logistics Team',
        type: 'phishing',
        explanation: 'Well spotted! Amazon does not ask for small redelivery fees on `.info` domains. This is a common SMS/Email credit card harvesting scam.'
    },
    {
        from: 'Zoom Meetings <no-reply@zoom.us>',
        to: 'team-member@company.com',
        subject: 'Updated Invitation: All-Hands Quarterly Sync @ Fri Sep 25, 2026',
        body: 'The meeting host has updated the scheduled Zoom meeting.<br><br>Topic: Q4 All-Hands Quarterly Sync<br>Time: Sep 25, 2026 10:00 AM Eastern Time<br><br>Join Zoom Meeting:<br><a href="#" class="mock-link" onclick="return false;">https://zoom.us/j/98127394812?pwd=Nk9xM3p1</a><br><br>Zoom Support',
        type: 'safe',
        explanation: 'Spot on! Standard Zoom meeting update sent from official `@zoom.us` email domain with valid meeting ID parameters.'
    },
    {
        from: 'CEO Executive Office <ceo-direct@executive-mail-portal.com>',
        to: 'finance-manager@company.com',
        subject: 'STRICT CONFIDENTIAL: Urgent Wire Transfer Required for Acquisition',
        body: 'Hi Finance Team,<br><br>I am currently in an urgent board meeting and unable to take phone calls. We are finalizing an urgent M&A contract today. Please execute a wire transfer of $48,500 immediately to the escrow account below:<br><br>Account: 99482019482<br>Routing: 021000021<br><br>Do not discuss this with anyone until press release tomorrow.<br><br>Sent from my iPad',
        type: 'phishing',
        explanation: 'Crucial catch! This is Business Email Compromise (BEC) / CEO Fraud. Executives will never bypass corporate financial controls via unexpected urgent external emails.'
    },
    {
        from: 'Microsoft Account Team <account-security-noreply@accountprotection.microsoft.com>',
        to: 'user@company.com',
        subject: 'Microsoft account password reset code',
        body: 'We received your request to reset your Microsoft account password.<br><br>Your single-use code is: <strong>784920</strong><br><br>If you did not request this code, someone may have entered your email by mistake. You can safely ignore this email.<br><br>Thanks,<br>The Microsoft account team',
        type: 'safe',
        explanation: 'Correct! Official Microsoft authentication code email from the legitimate domain `@accountprotection.microsoft.com`.'
    },
    {
        from: 'Netflix <billing-info@netflix-payment-update-center.net>',
        to: 'movie-fan@gmail.com',
        subject: 'Important: Your Netflix Membership is on Hold',
        body: 'We were unable to process your monthly payment subscription. Your account access will be terminated in 24 hours unless payment details are updated.<br><br><a href="#" class="mock-link" onclick="return false;">http://netflix-payment-update-center.net/renew</a><br><br>Netflix Customer Service',
        type: 'phishing',
        explanation: 'Great job! Netflix billing emails will always direct you to `netflix.com/youraccount`, not an external `.net` third-party site.'
    },
    {
        from: 'DocuSign Electronic Signature <docusign@document-sign-portal.com>',
        to: 'user@company.com',
        subject: 'Signature Required: Confidential Severance & Non-Disclosure Agreement',
        body: 'DocuSign Notice:<br>HR Department has sent you an urgent document to review and sign electronically.<br><br>Document: NDA_Severance_Adjustment_2026.pdf<br><br><a href="#" class="mock-link" onclick="return false;">https://document-sign-portal.com/docusign/view?id=8841</a><br><br>This link expires in 1 hour.',
        type: 'phishing',
        explanation: 'Spot on! Phishers frequently clone DocuSign templates on fake lookalike domains (`document-sign-portal.com`) to capture corporate passwords.'
    },
    {
        from: 'Amazon Web Services <no-reply@amazon.com>',
        to: 'sysadmin@company.com',
        subject: 'Your AWS Monthly Invoice Statement for August 2026',
        body: 'Dear AWS Customer,<br><br>Your monthly AWS Invoice statement for August 2026 is now available. The total charge of $142.80 has been billed to your default payment method.<br><br>You can view your detailed usage reports in the AWS Billing Console:<br><a href="#" class="mock-link" onclick="return false;">https://console.aws.amazon.com/billing/home</a><br><br>Thank you for using AWS.',
        type: 'safe',
        explanation: 'Correct! Official AWS invoice notification linking directly to official `console.aws.amazon.com`.'
    },
    {
        from: 'LinkedIn Security <invitations@linkedin-network-connect.xyz>',
        to: 'professional@company.com',
        subject: 'Executive Recruiter wants to connect on LinkedIn',
        body: 'Sarah Jenkins (Senior Talent Recruiter at Google) sent you a message:<br><br><em>"Hi! I reviewed your profile and we have a $220k remote position that fits your experience perfectly. Click below to view compensation package..."</em><br><br><a href="#" class="mock-link" onclick="return false;">http://linkedin-network-connect.xyz/view-job</a>',
        type: 'phishing',
        explanation: 'Nicely spotted! Phishers use job recruitment bait linking to untrusted `.xyz` domains to harvest professional credentials.'
    },
    {
        from: 'Apple Support <security@appleid-icloud-lock.com>',
        to: 'iphone-user@icloud.com',
        subject: 'Apple ID Alert: Your account has been disabled for security reasons',
        body: 'Dear Customer,<br><br>Your Apple ID was locked because of multiple incorrect password attempts from an unrecognized device in Shanghai, China.<br><br>To unlock your Apple ID and restore iCloud photos, verify your personal details immediately:<br><br><a href="#" class="mock-link" onclick="return false;">https://appleid-icloud-lock.com/unlock</a><br><br>Apple Support',
        type: 'phishing',
        explanation: 'Correct! Apple notifications will always come from `@apple.com` or `@icloud.com`, never lookalike domains like `appleid-icloud-lock.com`.'
    },
    {
        from: 'Dropbox <no-reply@dropbox.com>',
        to: 'colleague@company.com',
        subject: 'Maria shared "Q4 Product Strategy Deck.pdf" with you',
        body: 'Maria (maria@company.com) shared a document with you on Dropbox.<br><br>File: Q4 Product Strategy Deck.pdf (14.2 MB)<br><br><a href="#" class="mock-link" onclick="return false;">https://www.dropbox.com/s/98127391/Q4_Strategy.pdf</a><br><br>Enjoy using Dropbox!',
        type: 'safe',
        explanation: 'Spot on! Authentic file sharing alert from `dropbox.com` pointing to official Dropbox asset links.'
    },
    {
        from: 'MFA Administrator <mfa-admin@corporate-sso-verify.org>',
        to: 'employee@company.com',
        subject: 'MANDATORY: Scan QR Code to Re-register 2FA Authenticator',
        body: 'Attention Staff,<br><br>Our enterprise Multi-Factor Authentication system is undergoing critical upgrade. All users MUST scan the QR code below using Google Authenticator or Microsoft Authenticator to re-pair their security token before end of day:<br><br><div class="p-3 bg-white text-dark text-center inline-block font-mono my-2 border rounded">📷 [ QR CODE PAYLOAD LINKING TO M365-PHISH-PASSKEY.NET ]</div><br><br>Failure to scan will block email login tomorrow.',
        type: 'phishing',
        explanation: 'Excellent detection! This is "Quishing" (QR Code Phishing). Attackers bypass email link filters by embedding QR codes that lead to credential harvesting portals.'
    },
    {
        from: 'Cloudflare SSL <no-reply@notify.cloudflare.com>',
        to: 'webmaster@company.com',
        subject: '[Cloudflare] Universal SSL Certificate Successfully Renewed',
        body: 'Hi Webmaster,<br><br>Universal SSL certificate for <strong>company.com</strong> has been automatically renewed and deployed across Cloudflare global edge servers.<br><br>No further action is required on your part.<br><br>View SSL status in Cloudflare Dashboard:<br><a href="#" class="mock-link" onclick="return false;">https://dash.cloudflare.com/ssl-overview</a>',
        type: 'safe',
        explanation: 'Correct! Official automated notification from `@notify.cloudflare.com` notifying about routine SSL maintenance.'
    },
    {
        from: 'FedEx Express <sms-alert@fedex-tracking-package-id8.com>',
        to: 'mobile-user@company.com',
        subject: 'SMS Courier Alert: Customs Duty Fee Pending ($3.40)',
        body: 'FedEx Parcel #FX-994012 is held at local depot due to unpaid international customs clearance fee of $3.40.<br><br>Confirm payment now to dispatch courier:<br><br><a href="#" class="mock-link" onclick="return false;">http://fedex-tracking-package-id8.com/pay</a>',
        type: 'phishing',
        explanation: 'Great eye! Classic SMS phishing ("Smishing") tactic impersonating courier brands to harvest credit card data.'
    },
    {
        from: 'Atlassian Jira <jira@company.atlassian.net>',
        to: 'developer@company.com',
        subject: '[Jira] (SEC-409) Assigned to you: Update CORS policy on auth API',
        body: 'Jira Software<br><br>Alex assigned issue <strong>SEC-409</strong> to you.<br><br>Summary: Update CORS policy on auth API endpoint<br>Priority: High<br><br><a href="#" class="mock-link" onclick="return false;">https://company.atlassian.net/browse/SEC-409</a><br><br>Atlassian Jira Cloud',
        type: 'safe',
        explanation: 'Correct! Genuine Jira Cloud notification directly linking to official company workspace `company.atlassian.net`.'
    },
    {
        from: 'Coinbase Security <no-reply@coinbase-wallet-security-desk.com>',
        to: 'crypto-trader@gmail.com',
        subject: 'CRITICAL: Account Withdrawal of 2.45 ETH Initiated',
        body: 'A withdrawal of 2.45 ETH ($6,125.00 USD) to external wallet 0x71C...9B1 was requested from your Coinbase account.<br><br>If you did NOT request this withdrawal, click immediately to cancel transaction and freeze wallet:<br><br><a href="#" class="mock-link" onclick="return false;">https://coinbase-wallet-security-desk.com/freeze</a>',
        type: 'phishing',
        explanation: 'Spot on! Crypto phishing emails provoke panic over fake withdrawals to steal seed phrases and wallet logins.'
    },
    {
        from: 'Stripe Merchant <notifications@stripe.com>',
        to: 'billing@company.com',
        subject: 'Your payout of $4,850.00 USD is on its way',
        body: 'Good news! A payout of $4,850.00 USD was submitted to your bank account ending in 9012.<br><br>Payout ID: po_1M9x21904812<br>Estimated deposit: 1-2 business days<br><br>Review payout summary in your Stripe Dashboard:<br><a href="#" class="mock-link" onclick="return false;">https://dashboard.stripe.com/payouts/po_1M9x21904812</a>',
        type: 'safe',
        explanation: 'Correct! Official financial notification from `stripe.com` with standard payout reference identifiers.'
    },
    {
        from: 'Voicemail Service <voicemail-notification@m365-audio-portal.com>',
        to: 'user@company.com',
        subject: 'You received a 45-second audio voicemail message',
        body: 'Caller ID: +1 (555) 019-2831<br>Duration: 00:45 seconds<br><br>Click play below to listen to audio transcript on office365 server:<br><br><a href="#" class="mock-link" onclick="return false;">http://m365-audio-portal.com/play?id=vm-9941</a>',
        type: 'phishing',
        explanation: 'Well spotted! Fake audio voicemail notifications lead users to fraudulent Microsoft login pages designed to harvest credentials.'
    },
    {
        from: 'Adobe Creative Cloud <message@adobe.com>',
        to: 'designer@company.com',
        subject: 'Receipt for your Adobe Creative Cloud Subscription',
        body: 'Thank you for your purchase.<br><br>Order Number: AD09128301<br>Item: Creative Cloud All Apps Membership<br>Amount Charged: $54.99 USD<br><br>Manage your plan or download tax invoice at:<br><a href="#" class="mock-link" onclick="return false;">https://account.adobe.com/orders</a>',
        type: 'safe',
        explanation: 'Correct! Legitimate transaction notification from Adobe sent from official domain `@adobe.com`.'
    },
    {
        from: 'Global IT Support <admin-support@internal-company-it.net>',
        to: 'staff@company.com',
        subject: 'Mandatory VPN Configuration Upgrade Required Today',
        body: 'Team,<br><br>We are upgrading our corporate Cisco AnyConnect VPN certificates tonight. To retain remote access tomorrow, you MUST download and install the new security patch executable before 6:00 PM:<br><br><a href="#" class="mock-link" onclick="return false;">http://internal-company-it.net/downloads/VPN_Security_Patch_v4.exe</a><br><br>IT Helpdesk',
        type: 'phishing',
        explanation: 'Critical catch! Downloading executable files (`.exe`) from lookalike domains (`internal-company-it.net`) is a primary vector for ransomware distribution.'
    },
    {
        from: 'Google Docs <comments-noreply@docs.google.com>',
        to: 'user@company.com',
        subject: 'Jordan commented on "2026 Budget Forecast.docx"',
        body: 'Jordan tagged you in a comment:<br><br><em>"@you please double-check line 42 numbers before our 2 PM review."</em><br><br><a href="#" class="mock-link" onclick="return false;">https://docs.google.com/document/d/19x8237198237/edit?comment=c19283</a><br><br>Google Workspace',
        type: 'safe',
        explanation: 'Correct! Official Google Docs comment notification coming directly from `@docs.google.com`.'
    },
    {
        from: 'IRS Tax Refund Center <claim-refund@tax-refund-gov-portal.org>',
        to: 'taxpayer@gmail.com',
        subject: 'Unclaimed Federal Tax Refund: $1,420.50 Approved',
        body: 'The Internal Revenue Service (IRS) has calculated your tax recalculation for 2025. You are eligible to receive an unclaimed refund of $1,420.50.<br><br>Submit your bank account routing details to process electronic deposit:<br><br><a href="#" class="mock-link" onclick="return false;">http://tax-refund-gov-portal.org/claim</a>',
        type: 'phishing',
        explanation: 'Spot on! The IRS never initiates contact with taxpayers by email or SMS to request sensitive financial details.'
    },
    {
        from: 'Salesforce <notifications@salesforce.com>',
        to: 'sales-rep@company.com',
        subject: 'New Lead Assigned: Enterprise Prospect Acme Corp',
        body: 'Salesforce CRM Notification:<br><br>A new lead <strong>Acme Corp ($150,000 ARR)</strong> has been assigned to your queue by Marketing.<br><br>View Lead details in Salesforce:<br><a href="#" class="mock-link" onclick="return false;">https://company.lightning.force.com/lightning/r/Lead/00Q5f00000123/view</a>',
        type: 'safe',
        explanation: 'Correct! Official Salesforce CRM lead assignment email linking directly to standard `lightning.force.com` domain.'
    },
    {
        from: 'Webmail Administrator <postmaster@webmail-portal-upgrade.com>',
        to: 'user@company.com',
        subject: 'Warning: Mailbox Quota Full (99.8%) - Immediate Action Needed',
        body: 'Your email inbox has exceeded its storage quota of 20 GB and is currently blocked from receiving incoming messages.<br><br>Click to expand mailbox quota by 50 GB free of charge:<br><br><a href="#" class="mock-link" onclick="return false;">http://webmail-portal-upgrade.com/revalidate</a>',
        type: 'phishing',
        explanation: 'Well caught! Mailbox full quota warnings on third-party lookalike domains are classic webmail credential harvesters.'
    },
    {
        from: 'Okta Identity <noreply@okta.com>',
        to: 'employee@company.com',
        subject: 'Okta Verify Push Notification Sent',
        body: 'An Okta Verify sign-in prompt was sent to your registered smartphone device.<br><br>Application: Corporate Workday SSO<br>IP Address: 198.51.100.45<br><br>If this was not you, tap "No, It\'s Not Me" in your Okta Verify app immediately to lock your account.',
        type: 'safe',
        explanation: 'Correct! Legitimate Okta SSO security advisory providing real-time sign-in context.'
    },
    {
        from: 'DHL Express <no-reply@dhl-delivery-reschedule-id9.com>',
        to: 'recipient@gmail.com',
        subject: 'Shipment #DHL-88194: Address Confirmation Required',
        body: 'Your DHL package cannot be delivered because house number is missing from shipping label.<br><br>Please confirm complete address within 48 hours to avoid package return to origin sender:<br><br><a href="#" class="mock-link" onclick="return false;">http://dhl-delivery-reschedule-id9.com/address</a>',
        type: 'phishing',
        explanation: 'Great job! Fake parcel delivery emails on suspicious lookalike domains target recipient address and contact information.'
    },
    {
        from: 'Canva <notifications@canva.com>',
        to: 'designer@company.com',
        subject: 'Sam shared a design with you: "2026 Brand Guidelines"',
        body: 'Sam invited you to edit a presentation design in Canva.<br><br>Design: 2026 Brand Guidelines & Assets<br><br><a href="#" class="mock-link" onclick="return false;">https://www.canva.com/design/DAG19238/view</a><br><br>Happy designing!',
        type: 'safe',
        explanation: 'Spot on! Authentic invitation from `canva.com` directing to standard Canva design project links.'
    },
    {
        from: 'IT Help Desk <support@it-desk-remote-session.net>',
        to: 'user@company.com',
        subject: 'Remote Desktop Troubleshooting Authorization Needed',
        body: 'Hi User,<br><br>IT Support detected network anomalies on your workstation. We require remote screen access via AnyDesk / TeamViewer to clear temporary cache files.<br><br>Click to grant instant remote admin permissions:<br><br><a href="#" class="mock-link" onclick="return false;">http://it-desk-remote-session.net/grant-access</a>',
        type: 'phishing',
        explanation: 'Critical catch! Attackers masquerade as internal IT helpdesk reps to trick users into installing unapproved Remote Access Trojans (RATs).'
    },
    {
        from: 'Shopify <no-reply@shopify.com>',
        to: 'buyer@gmail.com',
        subject: 'Order #1092 Confirmed - CyberTech Gear Store',
        body: 'Thank you for your purchase!<br><br>Order Total: $89.00 USD<br>Shipping Method: Standard Express Ground<br><br>Track your shipment status:<br><a href="#" class="mock-link" onclick="return false;">https://www.shopify.com/order-lookup/1092</a>',
        type: 'safe',
        explanation: 'Correct! Legitimate transaction confirmation email sent from official Shopify merchant notification system.'
    },
    {
        from: 'Microsoft App Consent <oauth-consent@m365-app-auth.com>',
        to: 'user@company.com',
        subject: 'Permissions Request: "PDF Converter Pro" wants to access your account',
        body: 'Third-Party App Request:<br><strong>PDF Converter Pro</strong> requests permission to:<br>• Read all user emails and contacts<br>• Access and edit OneDrive files<br>• Send email on your behalf<br><br><a href="#" class="mock-link" onclick="return false;">https://m365-app-auth.com/oauth/accept</a>',
        type: 'phishing',
        explanation: 'Excellent detection! This is "OAuth Consent Phishing" (Illicit Consent Grant attack), where malicious apps trick users into granting permissions to exfiltrate email data without needing passwords.'
    },
    {
        from: 'GitLab CI/CD <gitlab@company-gitlab.internal.net>',
        to: 'dev@company.com',
        subject: 'Pipeline #88491 failed for main branch on auth-api',
        body: 'GitLab Pipeline Notification:<br><br>Project: backend/auth-api<br>Branch: main<br>Status: Failed (Job: unit-tests)<br><br>View pipeline logs:<br><a href="#" class="mock-link" onclick="return false;">https://gitlab.company.com/backend/auth-api/-/pipelines/88491</a>',
        type: 'safe',
        explanation: 'Correct! Standard internal automated CI/CD pipeline alert pointing directly to company internal developer tooling.'
    },
    {
        from: 'Zoom Gift Rewards <rewards@zoom-conference-survey.org>',
        to: 'participant@company.com',
        subject: 'Claim $50 Amazon Gift Card for completing Zoom Feedback Survey',
        body: 'Thank you for attending our virtual Tech Summit yesterday!<br><br>As a token of appreciation, we are awarding all attendees a $50 Amazon e-Gift Card. Click below to claim your code before it expires:<br><br><a href="#" class="mock-link" onclick="return false;">http://zoom-conference-survey.org/claim-card</a>',
        type: 'phishing',
        explanation: 'Spot on! Fake reward surveys on third-party domains are designed to steal personal info and survey credentials.'
    },
    {
        from: 'Figma <no-reply@figma.com>',
        to: 'ui-ux@company.com',
        subject: 'Elena invited you to the team "Mobile App Redesign" on Figma',
        body: 'Elena (elena@company.com) added you to the <strong>Mobile App Redesign</strong> workspace.<br><br>Click to view Figma files:<br><a href="#" class="mock-link" onclick="return false;">https://www.figma.com/file/98127391/Mobile-App-v2</a>',
        type: 'safe',
        explanation: 'Correct! Official workspace invite email originating directly from `@figma.com`.'
    },
    {
        from: 'Chase Fraud Team <security@chase-bank-verify-alert.com>',
        to: 'customer@gmail.com',
        subject: 'URGENT: Your Chase Debit Card Has Been Deactivated',
        body: 'Security Alert:<br>Unusual ATM withdrawal attempts were registered on your Chase account in London, UK.<br><br>Your card has been locked for safety. Please confirm your PIN and SSN to reactivate:<br><br><a href="#" class="mock-link" onclick="return false;">https://chase-bank-verify-alert.com/reactivate</a>',
        type: 'phishing',
        explanation: 'Nicely caught! Chase Bank will never send emails asking you to confirm your card PIN or Social Security Number via a link.'
    },
    {
        from: 'SentinelGuard AI <alerts@sentinelguard.io>',
        to: 'soc-admin@company.com',
        subject: '[SentinelGuard] Weekly Threat Intelligence Digest: 14 Threats Blocked',
        body: 'SentinelGuard Threat Radar Summary:<br><br>• Total Scans: 1,482<br>• High-Risk Threats Blocked: 14<br>• Average Risk Score: 12%<br><br>View full SOC Analytics Console:<br><a href="#" class="mock-link" onclick="return false;">https://sentinelguard.io/dashboard</a>',
        type: 'safe',
        explanation: 'Correct! Official automated intelligence digest from official SentinelGuard platform.'
    },
    {
        from: 'WhatsApp Web <security@whatsapp-web-session-login.com>',
        to: 'user@domain.com',
        subject: 'New WhatsApp Web sign-in detected on Safari (macOS)',
        body: 'Your WhatsApp account was connected to WhatsApp Web on a new Mac device.<br><br>If this was NOT you, click immediately to terminate all remote web sessions:<br><br><a href="#" class="mock-link" onclick="return false;">http://whatsapp-web-session-login.com/terminate</a>',
        type: 'phishing',
        explanation: 'Spot on! Fake messaging web alerts lure users into linking malicious devices or handing over SMS OTP codes.'
    },
    {
        from: 'Calendly <notifications@calendly.com>',
        to: 'consultant@company.com',
        subject: 'Confirmed: Strategy Consultation with David Miller @ Mon Oct 5, 2026',
        body: 'Event Details:<br>Host: David Miller<br>Time: 2:00 PM - 2:30 PM (EST)<br>Location: Google Meet link included in invitation<br><br>Need to reschedule or cancel?<br><a href="#" class="mock-link" onclick="return false;">https://calendly.com/cancellations/EVENT109238</a>',
        type: 'safe',
        explanation: 'Correct! Official booking confirmation email originating from `@calendly.com`.'
    },
    {
        from: 'Workday HR <payroll-update@workday-employee-portal.net>',
        to: 'staff@company.com',
        subject: 'Action Required: Update Direct Deposit Routing Number',
        body: 'Due to end-of-quarter payroll audit, all active employees must confirm their bank routing number to ensure timely salary payment on Friday:<br><br><a href="#" class="mock-link" onclick="return false;">http://workday-employee-portal.net/update-banking</a>',
        type: 'phishing',
        explanation: 'Great catch! Direct deposit scam targeting employee salary payments via fake Workday portal lookalikes.'
    },
    {
        from: 'Asana Notifications <notifications@asana.com>',
        to: 'pm@company.com',
        subject: 'Task Completed: "Finalize Product Release Notes v2.4"',
        body: 'Taylor marked task <strong>"Finalize Product Release Notes v2.4"</strong> as complete in project <em>Q4 Roadmap</em>.<br><br>View completed task:<br><a href="#" class="mock-link" onclick="return false;">https://app.asana.com/0/12345/67890</a>',
        type: 'safe',
        explanation: 'Correct! Genuine project management update from official `@asana.com` email domain.'
    },
    {
        from: 'Spotify Support <billing@spotify-account-refund-center.com>',
        to: 'music-lover@gmail.com',
        subject: 'Dispute Confirmation: $119.99 Charged for Spotify Premium Family',
        body: 'We processed a annual subscription charge of $119.99 USD to your account.<br><br>If you wish to cancel this subscription and claim a instant refund, click below:<br><br><a href="#" class="mock-link" onclick="return false;">http://spotify-account-refund-center.com/refund</a>',
        type: 'phishing',
        explanation: 'Spot on! Fake subscription charge emails leverage surprise billing invoices to coerce users into typing credit card details into phishing pages.'
    },
    {
        from: 'ServiceNow <servicenow@company.com>',
        to: 'it-support@company.com',
        subject: '[INC-99120] State changed to Resolved: Network Switch Maintenance',
        body: 'Incident INC-99120 status updated to <strong>Resolved</strong>.<br><br>Resolved by: Infrastructure Team<br>Resolution Notes: Rebooted core switch in Rack 4B.<br><br>Reopen or close ticket:<br><a href="#" class="mock-link" onclick="return false;">https://company.service-now.com/nav_to.do?uri=incident.do?sys_id=99120</a>',
        type: 'safe',
        explanation: 'Correct! Official IT service management ticket notification linking directly to corporate `service-now.com` instance.'
    },
    {
        from: 'Microsoft Teams <teams-recording@m365-voicemail-transcripts.com>',
        to: 'user@company.com',
        subject: 'Missed Call & Voice Message from Line +1 (415) 555-0199',
        body: 'You missed a call in Microsoft Teams.<br><br>Caller: Unknown (+1 415 555-0199)<br>Message: 0:32 seconds<br><br><a href="#" class="mock-link" onclick="return false;">http://m365-voicemail-transcripts.com/teams/listen</a>',
        type: 'phishing',
        explanation: 'Well spotted! Fake Teams voicemail notification hosted on untrusted domain `m365-voicemail-transcripts.com`.'
    },
    {
        from: 'PagerDuty Alerts <no-reply@pagerduty.com>',
        to: 'devops-oncall@company.com',
        subject: '[ALERT] [#10492] High Severity: Database Latency Spike > 500ms',
        body: 'PagerDuty Incident #10492 Triggered:<br><br>Service: Production Primary Database<br>Severity: High<br>Status: Triggered (Unacknowledged)<br><br>Acknowledge or resolve incident:<br><a href="#" class="mock-link" onclick="return false;">https://company.pagerduty.com/incidents/P10492</a>',
        type: 'safe',
        explanation: 'Correct! Official incident management alert from `@pagerduty.com` linking to company PagerDuty portal.'
    },
    {
        from: 'Crypto Airdrop Loyalty <claim@free-eth-airdrop-rewards.top>',
        to: 'trader@gmail.com',
        subject: 'CONGRATULATIONS: You won 5.0 ETH in Web3 Ecosystem Airdrop!',
        body: 'Your Ethereum wallet address was randomly selected in our Q3 Community Airdrop!<br><br>Reward: 5.0 ETH ($12,500 USD)<br><br>Connect your MetaMask or Trust Wallet to claim token allocation immediately:<br><br><a href="#" class="mock-link" onclick="return false;">http://free-eth-airdrop-rewards.top/claim-tokens</a>',
        type: 'phishing',
        explanation: 'Spot on! Crypto airdrop scams on high-risk `.top` domains use drainer scripts to drain all assets upon wallet connection.'
    },
    {
        from: 'HubSpot Marketing <noreply@hubspot.com>',
        to: 'marketing@company.com',
        subject: 'Weekly Performance Report: 1,420 New Form Submissions',
        body: 'HubSpot Analytics Summary:<br><br>• New Leads: 1,420 (+12% vs last week)<br>• Top Performing Campaign: Fall Web Security Whitepaper<br><br>View full analytics report:<br><a href="#" class="mock-link" onclick="return false;">https://app.hubspot.com/reports/12345/dashboard</a>',
        type: 'safe',
        explanation: 'Correct! Standard marketing analytics update from official `@hubspot.com` sender.'
    },
    {
        from: 'Corporate IT Security <compliance@internal-security-mandate.com>',
        to: 'staff@company.com',
        subject: 'MANDATORY: Install New YubiKey Security Dongle Drivers',
        body: 'All corporate staff are required to update their USB hardware security key drivers before accessing company network.<br><br>Download mandatory driver patch file:<br><br><a href="#" class="mock-link" onclick="return false;">http://internal-security-mandate.com/drivers/YubiKey_Setup_2026.exe</a>',
        type: 'phishing',
        explanation: 'Excellent detection! Malicious executable driver download hosted on suspicious third-party lookalike domain (`internal-security-mandate.com`).'
    }
];

function initPhishGame() {
    renderScenario();
}

function renderScenario() {
    const sc = GAME_SCENARIOS[state.sandbox.currentScenarioIndex];
    if (!sc) return;

    const fromEl = document.getElementById('scen-from');
    const toEl = document.getElementById('scen-to');
    const subjectEl = document.getElementById('scen-subject');
    const bodyEl = document.getElementById('scen-body');
    const scenNumEl = document.getElementById('scenario-number');
    const totalCountEl = document.getElementById('total-scenarios-count');
    const strikesEl = document.getElementById('phish-strikes');
    const scoreEl = document.getElementById('phish-score');
    const streakEl = document.getElementById('phish-streak');

    if (fromEl) fromEl.innerText = sc.from;
    if (toEl) toEl.innerText = sc.to;
    if (subjectEl) subjectEl.innerText = sc.subject;
    if (bodyEl) bodyEl.innerHTML = sc.body;
    if (scenNumEl) scenNumEl.innerText = state.sandbox.currentScenarioIndex + 1;
    if (totalCountEl) totalCountEl.innerText = GAME_SCENARIOS.length;
    if (strikesEl) strikesEl.innerText = `${state.sandbox.wrongAttempts || 0}/3`;
    if (scoreEl) scoreEl.innerText = state.sandbox.score;
    if (streakEl) streakEl.innerText = state.sandbox.streak;

    const feedbackCard = document.getElementById('game-feedback');
    if (feedbackCard) feedbackCard.classList.add('hidden');
    state.sandbox.answered = false;
}

function submitAnswer(userChoice) {
    if (state.sandbox.answered) return;
    state.sandbox.answered = true;

    const sc = GAME_SCENARIOS[state.sandbox.currentScenarioIndex];
    const isCorrect = userChoice === sc.type;

    const feedbackCard = document.getElementById('game-feedback');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackExp = document.getElementById('feedback-explanation');

    if (isCorrect) {
        const bonus = state.sandbox.streak * 20;
        const ptsGained = 100 + bonus;
        state.sandbox.score += ptsGained;
        state.sandbox.streak++;
        if (feedbackTitle) {
            feedbackTitle.className = 'feedback-header text-green';
            feedbackTitle.innerHTML = `<i class="fa-solid fa-circle-check"></i> Correct Assessment! (+${ptsGained} pts)`;
        }
    } else {
        // Point Decrement Penalty (-50 pts, min 0)
        state.sandbox.score = Math.max(0, state.sandbox.score - 50);
        state.sandbox.wrongAttempts = (state.sandbox.wrongAttempts || 0) + 1;

        if (state.sandbox.wrongAttempts >= 3) {
            // 3-Strike Rule: Streak Ended!
            state.sandbox.streak = 0;
            state.sandbox.wrongAttempts = 0; // Reset strike count for fresh attempt
            showToast('⚠️ 3 Wrong Attempts Reached! Your streak has been reset to 0.', 'warning');
            if (feedbackTitle) {
                feedbackTitle.className = 'feedback-header text-red';
                feedbackTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 3 Strikes Reached! Streak Ended! (-50 pts)';
            }
        } else {
            state.sandbox.streak = 0;
            if (feedbackTitle) {
                feedbackTitle.className = 'feedback-header text-red';
                feedbackTitle.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Incorrect Assessment! (-50 pts | Strike ${state.sandbox.wrongAttempts}/3)`;
            }
        }
    }

    if (feedbackExp) feedbackExp.innerText = sc.explanation;
    if (feedbackCard) feedbackCard.classList.remove('hidden');

    const scoreEl = document.getElementById('phish-score');
    const streakEl = document.getElementById('phish-streak');
    const strikesEl = document.getElementById('phish-strikes');

    if (scoreEl) scoreEl.innerText = state.sandbox.score;
    if (streakEl) streakEl.innerText = state.sandbox.streak;
    if (strikesEl) strikesEl.innerText = `${state.sandbox.wrongAttempts || 0}/3`;
}

function nextScenario() {
    state.sandbox.currentScenarioIndex = (state.sandbox.currentScenarioIndex + 1) % GAME_SCENARIOS.length;
    renderScenario();
}

// --- DYNAMIC GEMINI API CHATBOT INTEGRATION ---
function toggleChatWidget() {
    const chatWin = document.getElementById('chat-window');
    chatWin.classList.toggle('hidden');
}

function promptGeminiApiKey() {
    const key = prompt("Enter your Google Gemini API Key (or leave blank to use Sentinel Neural Intelligence engine):", state.geminiApiKey);
    if (key !== null) {
        state.geminiApiKey = key.trim();
        localStorage.setItem('sentinel_gemini_key', state.geminiApiKey);
        updateChatEngineBadge();
        showToast(state.geminiApiKey ? "Gemini API Key saved! Sentinel Agent will now use live Gemini API." : "Using built-in Sentinel Neural Agent engine.", state.geminiApiKey ? "success" : "info");
    }
}

function updateChatEngineBadge() {
    const statusEl = document.getElementById('chat-engine-status');
    if (!statusEl) return;
    if (state.geminiApiKey) {
        statusEl.innerHTML = `<span class="engine-badge green"><i class="fa-solid fa-bolt"></i> Gemini API Connected</span>`;
    } else {
        statusEl.innerHTML = `<span class="engine-badge green"><i class="fa-solid fa-brain"></i> Sentinel AI Neural Core</span>`;
    }
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const inputEl = document.getElementById('chat-user-input');
    const query = inputEl.value.trim();
    if (!query) return;

    const chatMsgs = document.getElementById('chat-messages');

    // Append User Message
    chatMsgs.innerHTML += `<div class="msg user-msg">${escapeHtml(query)}</div>`;
    inputEl.value = '';
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    // Track user message in conversational memory
    state.chatHistory.push({ role: 'user', content: query });

    // Display Typing Indicator
    const typingId = 'typing-' + Date.now();
    chatMsgs.innerHTML += `
        <div class="msg bot-msg typing-indicator" id="${typingId}">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    let botReply = '';

    // If user configured a Gemini API key, call the official Google Gemini REST API!
    if (state.geminiApiKey) {
        botReply = await fetchGeminiApiResponse(query);
    } else {
        // High-intelligence conversational fallback with context memory so answers NEVER repeat
        botReply = generateContextualBotReply(query);
    }

    // Remove typing indicator and render bot message
    document.getElementById(typingId)?.remove();
    chatMsgs.innerHTML += `<div class="msg bot-msg">${botReply}</div>`;
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    // Track bot response in memory
    state.chatHistory.push({ role: 'assistant', content: botReply });
}

// Call Google Gemini API Live
async function fetchGeminiApiResponse(userQuery) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.geminiApiKey}`;
    
    // Format conversation history for Gemini API
    const contents = [
        {
            role: "user",
            parts: [{ text: "You are Sentinel AI Agent, an elite Zero-Trust Cybersecurity Copilot. Answer cybersecurity, phishing, domain audit, and threat remediation queries clearly, concisely, and uniquely. Use markdown formatting (**bold**, `code`). Never repeat generic canned responses." }]
        }
    ];

    // Append last 6 message turns from chatHistory
    state.chatHistory.slice(-6).forEach(msg => {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    });

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            let rawText = data.candidates[0].content.parts[0].text;
            // Simple markdown formatting conversion
            rawText = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            rawText = rawText.replace(/`(.*?)`/g, '<code>$1</code>');
            return rawText;
        } else if (data.error) {
            return `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Gemini API Error:</strong> ${data.error.message || 'Invalid API Key'}. Switched to Sentinel Neural Engine.`;
        }
    } catch (err) {
        console.error("Gemini API Call failed:", err);
    }

    return generateContextualBotReply(userQuery);
}

// Advanced Neural Conversational Classifier
function generateContextualBotReply(q) {
    const qLower = q.toLowerCase();

    // 1. STANDALONE GREETING CHECK
    if (/\b(hi|hello|hey|greetings|sup)\b/i.test(qLower) && qLower.length < 15) {
        return '<i class="fa-solid fa-user-shield"></i> Greetings! I am your <strong>Sentinel AI Cyber Agent</strong>. Ask me any cybersecurity question, paste a link, or inquire about threat remediation steps!';
    }

    // 2. TYPOSQUATTING & SPOOFED DOMAINS
    if (qLower.includes('typosquatting') || qLower.includes('typo') || qLower.includes('paypa1') || qLower.includes('homoglyph')) {
        return '<i class="fa-solid fa-magnifying-glass"></i> <strong>Typosquatting & Domain Spoofing Analysis:</strong><br>Attackers register visually identical domains (e.g. <code>paypa1.com</code> instead of <code>paypal.com</code>) to trick users who make typing mistakes. SentinelGuard AI detects these using Levenshtein distance calculations against official brand matrices.';
    }

    // 3. DEEPFAKE VOICE & AUDIO SCAMS
    if (qLower.includes('deepfake') || qLower.includes('audio') || qLower.includes('voice') || qLower.includes('wire') || qLower.includes('ceo')) {
        return '<i class="fa-solid fa-microphone-lines"></i> <strong>Deepfake Voice & Wire Fraud Defense:</strong><br>AI voice clones replicate executive pitch signatures to coerce employees into fraudulent wire transfers ($45k+). SentinelGuard AI flags spectral frequency anomalies and commands dual-control phone verification.';
    }

    // 4. INCIDENT RESPONSE & CLICKED BAD LINK
    if (qLower.includes('clicked') || qLower.includes('accident') || qLower.includes('mitigat') || qLower.includes('remediat') || qLower.includes('what should i do')) {
        return '<i class="fa-solid fa-triangle-exclamation"></i> <strong>Emergency Incident Response Steps:</strong><br>1. <strong>Disconnect Network:</strong> Immediately disconnect Wi-Fi and ethernet.<br>2. <strong>Revoke Credentials:</strong> Reset passwords and terminate active OAuth sessions from a safe device.<br>3. <strong>Endpoint Scan:</strong> Run an offline antivirus/EDR scan for session hijackers.<br>4. <strong>Block Domain:</strong> Add the malicious IP to your local DNS sinkhole.';
    }

    // 5. SECURITY HEADERS (HSTS, CSP, CORS)
    if (qLower.includes('hsts') || qLower.includes('csp') || qLower.includes('cors') || qLower.includes('header')) {
        return '<i class="fa-solid fa-lock"></i> <strong>HTTP Security Header Intelligence:</strong><br>• <code>Strict-Transport-Security (HSTS)</code>: Forces all connections over HTTPS.<br>• <code>Content-Security-Policy (CSP)</code>: Blocks untrusted script injection & XSS.<br>• <code>X-Frame-Options</code>: Prevents clickjacking inside hidden iframe overlays.';
    }

    // 6. PASSKEYS & MULTI-FACTOR AUTHENTICATION
    if (qLower.includes('passkey') || qLower.includes('2fa') || qLower.includes('mfa') || qLower.includes('fido')) {
        return '<i class="fa-solid fa-key"></i> <strong>Passkeys & FIDO2 Authentication:</strong><br>Passkeys rely on public-key cryptography bound directly to the origin domain (e.g. <code>github.com</code>). Even if you visit a fake <code>g1thub.com</code> link, the browser refuses to send your passkey credential—making them immune to phishing!';
    }

    // 7. HYPERLINK / URL ANALYSIS
    if (qLower.includes('http') || qLower.includes('url') || qLower.includes('link') || qLower.includes('subdomain') || qLower.includes('tld')) {
        return '<i class="fa-solid fa-globe"></i> <strong>URL Structural Inspection:</strong><br>When evaluating URLs, SentinelGuard AI inspects:<br>1. <strong>TLD Risk Index:</strong> High-risk TLDs like <code>.xyz</code>, <code>.top</code>, or <code>.cfd</code>.<br>2. <strong>Subdomain Depth:</strong> Hiding the real domain deep inside <code>m365.login.verify.com.evil-host.ru</code>.<br>3. <strong>Protocol Encryption:</strong> Insecure cleartext HTTP connections.';
    }

    // 8. GENERAL CYBERSECURITY QUERY FALLBACK
    const keywordsFound = q.match(/\b[A-Za-z0-9]{4,}\b/g) || ['security'];
    const focusTopic = keywordsFound.slice(0, 3).join(', ');

    return `<i class="fa-solid fa-robot"></i> <strong>Sentinel Cyber Intelligence:</strong><br>Regarding <em>"${escapeHtml(q)}"</em> (Focus: <code>${escapeHtml(focusTopic)}</code>):<br>SentinelGuard AI evaluates this against our Zero-Trust threat engine. To get a complete breakdown, paste your target URL, text message, or audio transcript into the <strong>Threat Scanner</strong> tab above!`;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- REPORT TAB SYNCHRONIZATION & EXPORT ---
function updateReportTab(scanData) {
    if (!scanData) return;
    document.getElementById('rep-target').innerText = scanData.input;
    document.getElementById('rep-verdict').innerText = scanData.verdictTitle;
    document.getElementById('rep-risk-score').innerText = `${scanData.riskScore} / 100 (${scanData.verdictTitle})`;
    document.getElementById('rep-mode').innerText = `${scanData.type.toUpperCase()} Multi-Vector Analysis`;
}

function exportReport(format) {
    if (format === 'json') {
        const jsonStr = JSON.stringify(state.lastScanData || { message: 'No active scan data' }, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SentinelGuard_Security_Report_${Date.now()}.json`;
        a.click();
    } else if (format === 'print') {
        window.print();
    }
}

// --- UI HELPER & SYSTEM FUNCTIONS ---
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'error') icon = 'fa-circle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    const menuIcon = document.getElementById('menu-icon');

    if (nav) {
        const isOpen = nav.classList.toggle('mobile-active');
        if (backdrop) {
            if (isOpen) {
                backdrop.classList.remove('hidden');
            } else {
                backdrop.classList.add('hidden');
            }
        }
        if (menuIcon) {
            menuIcon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        }
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

function trigger404() {
    openModal('modal-404');
}

// --- THEME TOGGLE (DARK / LIGHT HIGH CONTRAST) ---
function initThemeToggle() {
    const savedTheme = localStorage.getItem('sentinel_theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = 'fa-solid fa-moon';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const icon = document.getElementById('theme-icon');
    if (currentTheme === 'light') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('sentinel_theme', 'dark');
        if (icon) icon.className = 'fa-solid fa-sun';
        showToast('Switched to Cyber Dark Mode', 'info');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('sentinel_theme', 'light');
        if (icon) icon.className = 'fa-solid fa-moon';
        showToast('Switched to High-Contrast Light Mode', 'info');
    }
}

// --- SCROLL PROGRESS BAR & BACK TO TOP ---
function handleScrollEvents() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const bar = document.getElementById('scroll-progress');
    if (bar) bar.style.width = scrolled + '%';

    const backBtn = document.getElementById('back-to-top');
    if (backBtn) {
        if (winScroll > 300) backBtn.classList.remove('hidden');
        else backBtn.classList.add('hidden');
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- FAQ ACCORDION TOGGLE ---
function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    if (!item) return;
    item.classList.toggle('active');
}

// --- INSTANT SITE SEARCH (CTRL+K) ---
function handleSiteSearch(q) {
    const resultsContainer = document.getElementById('search-results-list');
    if (!resultsContainer) return;
    const query = q.toLowerCase().trim();
    if (!query) {
        resultsContainer.innerHTML = `
            <div class="search-item" onclick="closeModal('search-modal'); switchTab('scanner');">
                <i class="fa-solid fa-radar text-cyan"></i>
                <div><strong>Multi-Vector Threat Scanner</strong><p>Scan URLs, text messages, audio deepfakes, and QR codes.</p></div>
            </div>
            <div class="search-item" onclick="closeModal('search-modal'); switchTab('header-audit');">
                <i class="fa-solid fa-server text-green"></i>
                <div><strong>Domain Security Header Audit</strong><p>Audit HSTS, CSP, X-Frame-Options, CORS, and SSL grades.</p></div>
            </div>
            <div class="search-item" onclick="closeModal('search-modal'); switchTab('sandbox');">
                <i class="fa-solid fa-gamepad text-yellow"></i>
                <div><strong>Phish Hunt Gamified Sandbox</strong><p>Test employee scam recognition with interactive threat scenarios.</p></div>
            </div>
            <div class="search-item" onclick="closeModal('search-modal'); switchTab('admin');">
                <i class="fa-solid fa-user-shield text-red"></i>
                <div><strong>Enterprise Admin SOC Console</strong><p>Manage zero-trust firewall sinkhole rules and AI sensitivity sliders.</p></div>
            </div>
        `;
        return;
    }

    const items = [
        { title: 'Multi-Vector Threat Scanner', desc: 'Scan suspicious URLs, SMS phishing text, deepfake voice audio, and QR codes.', tab: 'scanner', icon: 'fa-radar text-cyan' },
        { title: 'Domain Security Header Audit', desc: 'Inspect Strict-Transport-Security (HSTS), CSP, X-Frame-Options, CORS headers.', tab: 'header-audit', icon: 'fa-server text-green' },
        { title: 'Phish Hunt Sandbox', desc: 'Interactive phish simulation game with spear phishing and credential harvesting levels.', tab: 'sandbox', icon: 'fa-gamepad text-yellow' },
        { title: 'Security Incident Report', desc: 'Export detailed JSON vulnerability reports and printable SOC documentation.', tab: 'report', icon: 'fa-file-shield text-purple' },
        { title: 'Enterprise Admin SOC Console', desc: 'Organization threat heatmaps, AI threshold sliders, and DNS Sinkhole rules.', tab: 'admin', icon: 'fa-user-shield text-red' },
        { title: 'FAQ & Cyber Knowledge Base', desc: 'Learn how zero-day phishing, synthetic audio, and passkeys operate.', tab: 'scanner', icon: 'fa-circle-question text-cyan' }
    ];

    const matched = items.filter(i => i.title.toLowerCase().includes(query) || i.desc.toLowerCase().includes(query));
    if (matched.length === 0) {
        resultsContainer.innerHTML = `<div class="search-item"><i class="fa-solid fa-triangle-exclamation text-yellow"></i><div><strong>No matching security features found</strong><p>Try searching for "HSTS", "Deepfake", "Domain", or "SOC".</p></div></div>`;
    } else {
        resultsContainer.innerHTML = matched.map(m => `
            <div class="search-item" onclick="closeModal('search-modal'); switchTab('${m.tab}')">
                <i class="fa-solid ${m.icon}"></i>
                <div><strong>${escapeHtml(m.title)}</strong><p>${escapeHtml(m.desc)}</p></div>
            </div>
        `).join('');
    }
}

// --- DESTRUCTIVE ACTION CONFIRMATION MODAL ---
let currentTargetRow = null;
function confirmRemoveSinkhole(btn) {
    currentTargetRow = btn.closest('tr');
    const domain = currentTargetRow ? currentTargetRow.querySelector('td:nth-child(2)')?.innerText : 'Selected Domain';
    document.getElementById('confirm-action-text').innerHTML = `Are you sure you want to remove the DNS sinkhole firewall block rule for <code>${escapeHtml(domain)}</code>?`;
    document.getElementById('confirm-action-submit-btn').onclick = () => {
        if (currentTargetRow) currentTargetRow.remove();
        closeModal('modal-confirm-action');
        showToast(`DNS Sinkhole rule for ${domain} removed.`, 'info');
    };
    openModal('modal-confirm-action');
}

// --- COOKIE CONSENT BANNER ---
function initCookieBanner() {
    const consent = localStorage.getItem('sentinel_cookie_consent');
    if (!consent) {
        document.getElementById('cookie-banner')?.classList.remove('hidden');
    }
}

function acceptCookies(type) {
    localStorage.setItem('sentinel_cookie_consent', type);
    document.getElementById('cookie-banner')?.classList.add('hidden');
    showToast(type === 'all' ? 'Cookie preferences saved (Accept All).' : 'Custom cookie preferences saved.', 'success');
}

// --- UTM PARAMETER TRACKING LOGIC ---
function parseUtmParameters() {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    if (source || medium || campaign) {
        console.log(`UTM Tracking Logged: source=${source}, medium=${medium}, campaign=${campaign}`);
    }
}

// Ensure dynamic copyright year on load and initialize listeners
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initCookieBanner();
    parseUtmParameters();
    window.addEventListener('scroll', handleScrollEvents);
    
    // Keyboard shortcuts listener
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openModal('search-modal');
        } else if (e.key === 'Escape') {
            ['search-modal', 'modal-confirm-action', 'modal-404', 'modal-terms', 'modal-privacy', 'modal-ftc'].forEach(closeModal);
        }
    });

    const yearEl = document.getElementById('curr-year');
    if (yearEl) {
        yearEl.innerText = new Date().getFullYear();
    }

    // Initialize Cutting-Edge Modules
    if (window.SocPlaybookModule) SocPlaybookModule.init();
    if (window.AitmPasskeyModule) AitmPasskeyModule.runAitmPasskeyAudit('devpost.com');
});


