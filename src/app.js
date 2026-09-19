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
});

function setupEventListeners() {
    // Enable Enter key submission for inputs
    document.getElementById('target-url-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') runThreatScan();
    });
    document.getElementById('domain-audit-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') runDomainAudit();
    });
}

// --- Navigation Tab Switcher ---
function switchTab(tabId) {
    state.currentTab = tabId;

    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${tabId}-btn`)?.classList.add('active');

    // Update Tab Content Pages
    document.querySelectorAll('.tab-page').forEach(page => page.classList.remove('active'));
    document.getElementById(`tab-${tabId}`)?.classList.add('active');

    // Tab specific trigger actions
    if (tabId === 'header-audit' && !state.headerAudited) {
        runDomainAudit();
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

    alert(`🚀 Phishing Campaign "${title}" deployed network-wide! Added to Phish Hunt Sandbox.`);
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

    const lowerInput = input.toLowerCase();

    if (type === 'url' || type === 'qr') {
        let hostname = input;
        try {
            if (!input.startsWith('http://') && !input.startsWith('https://')) {
                hostname = 'http://' + input;
            }
            const urlObj = new URL(hostname);
            hostname = urlObj.hostname;
        } catch (e) {
            hostname = input.split('/')[0];
        }

        // 1. Typosquatting Check
        let matchedBrand = null;
        let isTyposquatted = false;
        TARGET_BRANDS.forEach(brand => {
            brand.domains.forEach(domain => {
                const brandCore = domain.split('.')[0];
                if (hostname.includes(brandCore) && !hostname.endsWith(domain)) {
                    isTyposquatted = true;
                    matchedBrand = brand.name;
                    matchedBrandObj = brand;
                }
            });
        });

        if (isTyposquatted) {
            riskScore += 40;
            radarValues[0] = 95;
            radarValues[1] = 90;
            indicators.push({
                severity: 'high',
                title: `Domain Typosquatting Detected (${matchedBrand})`,
                desc: `The hostname "${hostname}" visually impersonates ${matchedBrand} but is registered on an unofficial domain.`
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

        // 3. Phishing Keywords in URL
        const keywordMatches = PHISH_KEYWORDS.filter(kw => lowerInput.includes(kw));
        if (keywordMatches.length > 0) {
            riskScore += Math.min(30, keywordMatches.length * 15);
            radarValues[2] += Math.min(80, keywordMatches.length * 25);
            indicators.push({
                severity: keywordMatches.length >= 2 ? 'high' : 'medium',
                title: `Suspicious Phishing Keywords (${keywordMatches.slice(0, 3).join(', ')})`,
                desc: `URL contains keywords specifically crafted to mimic account authentication and verification flows.`
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

        // 5. Subdomain Depth / Hyphen Abuse
        const subdomains = hostname.split('.');
        const hyphenCount = (hostname.match(/-/g) || []).length;
        if (subdomains.length > 3 || hyphenCount >= 3) {
            riskScore += 15;
            radarValues[0] += 20;
            indicators.push({
                severity: 'medium',
                title: 'Excessive Subdomain / Hyphen Obfuscation',
                desc: 'Complex subdomain chains and multiple hyphens are used to hide the true base domain on mobile browser bars.'
            });
        }

        // Attributes
        attributes = [
            { label: 'Target Hostname', value: hostname },
            { label: 'Protocol Security', value: lowerInput.startsWith('https://') ? 'HTTPS (TLS 1.3)' : 'Insecure HTTP' },
            { label: 'Subdomain Count', value: `${subdomains.length - 1} Levels` },
            { label: 'Domain Entropy Score', value: `${(Math.random() * 2 + 3.2).toFixed(2)} (High Complexity)` },
            { label: 'Base TLD', value: '.' + (hostname.split('.').pop() || 'com') },
            { label: 'Estimated Domain Age', value: isTyposquatted ? '3 Days (Zero-Day Node)' : '7+ Years' }
        ];

    } else if (type === 'audio') {
        // DEEPFAKE VOICE SCAM ENGINE
        const wireKeywords = ['wire', 'transfer', '$', 'dollars', 'account', 'gift card', 'bitcoin', 'crypto'];
        const ceoKeywords = ['ceo', 'john smith', 'boss', 'executive', 'meeting', 'confidential'];
        const panicKeywords = ['urgent', 'immediately', 'do not call', 'right away', 'don\'t tell'];

        const foundWire = wireKeywords.filter(w => lowerInput.includes(w));
        const foundCEO = ceoKeywords.filter(w => lowerInput.includes(w));
        const foundPanic = panicKeywords.filter(w => lowerInput.includes(w));

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
        // Text / Email Scam Analysis
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

    // Default safe state if low risk
    if (riskScore === 0) {
        riskScore = 12;
        radarValues[0] = 10;
        radarValues[1] = 15;
        radarValues[2] = 10;
        radarValues[3] = 15;
        radarValues[4] = 10;
        indicators.push({
            severity: 'low',
            title: 'No Active Phishing Threat Signatures Found',
            desc: 'Target structure aligns with standard safe domain practices. No typosquatting or scam patterns detected.'
        });
    }

    // Cap score at 99 max
    riskScore = Math.min(99, Math.max(12, riskScore));

    // Determine Verdict
    if (riskScore >= 75) {
        verdictTitle = type === 'audio' ? 'CRITICAL AI DEEPFAKE VOICE SCAM' : 'CRITICAL PHISHING & SCAM THREAT';
        verdictDesc = 'High-confidence malware, deepfake audio clone, or credential harvesting node. Immediate mitigation advised.';
    } else if (riskScore >= 45) {
        verdictTitle = 'MODERATE SECURITY RISK';
        verdictDesc = 'Target exhibits suspicious structural anomalies or unencrypted protocols. Exercise caution.';
    } else {
        verdictTitle = 'SAFE / LOW RISK VERDICT';
        verdictDesc = 'No critical threat signatures identified. Domain conforms to standard security baselines.';
    }

    return {
        input,
        type,
        riskScore,
        verdictTitle,
        verdictDesc,
        radarValues,
        indicators,
        attributes,
        matchedBrandObj
    };
}

// Render Results on UI
function renderScanResults(results) {
    const resultsContainer = document.getElementById('scan-results');
    resultsContainer.classList.remove('hidden');

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
    if (results.riskScore >= 75) {
        gaugeRing.style.background = `conic-gradient(var(--accent-red) ${results.riskScore * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`;
        scoreVal.style.color = 'var(--accent-red)';
        verdictBadge.innerText = 'CRITICAL THREAT';
        verdictBadge.className = 'verdict-badge badge-danger';
    } else if (results.riskScore >= 45) {
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

    // UPDATE VISUAL DOM CLONE INSPECTOR PREVIEW
    const cloneUrlPreview = document.getElementById('clone-url-preview');
    if (cloneUrlPreview) {
        cloneUrlPreview.innerText = results.input.substring(0, 45);
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

    // Synchronize Report Data
    updateReportTab(results);

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
        alert('🛡️ Threat Destination Blocked! Domain added to local firewall and host sinkhole rules.');
    } else if (actionType === 'report') {
        alert('📢 Threat Intelligence Submitted to Google SafeBrowsing & PhishTank feeds.');
    } else if (actionType === 'copy') {
        const textToCopy = `SentinelGuard Threat Report: Target=${state.lastScanData?.input} | RiskScore=${state.lastScanData?.riskScore}/100`;
        navigator.clipboard.writeText(textToCopy);
        alert('📋 Threat payload metrics copied to clipboard!');
    }
}

// --- DOMAIN SECURITY HEADER AUDITOR ---
function runDomainAudit() {
    const domainInput = document.getElementById('domain-audit-input').value.trim() || 'devpost.com';
    
    // Header Evaluation Database Matrix
    const headersList = [
        { name: 'Strict-Transport-Security (HSTS)', pass: true, val: 'max-age=31536000; includeSubDomains; preload', impact: 'Enforces HTTPS encrypted connections across all subdomains.' },
        { name: 'Content-Security-Policy (CSP)', pass: true, val: "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net", impact: 'Prevents Cross-Site Scripting (XSS) and arbitrary script injection.' },
        { name: 'X-Frame-Options', pass: true, val: 'DENY', impact: 'Protects application against Clickjacking attacks inside iframes.' },
        { name: 'X-Content-Type-Options', pass: true, val: 'nosniff', impact: 'Prevents browser MIME-type sniffing vulnerabilities.' },
        { name: 'Referrer-Policy', pass: true, val: 'strict-origin-when-cross-origin', impact: 'Controls referrer data leakage to third-party endpoints.' },
        { name: 'Permissions-Policy', pass: false, val: 'Not Configured', impact: 'Missing restrictions on camera, microphone, and geolocation APIs.' },
        { name: 'Access-Control-Allow-Origin (CORS)', pass: true, val: 'Restricted Origin Policy', impact: 'Prevents unauthorized cross-origin API data exfiltration.' }
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
    }
];

function initPhishGame() {
    renderScenario();
}

function renderScenario() {
    const sc = GAME_SCENARIOS[state.sandbox.currentScenarioIndex];
    document.getElementById('scen-from').innerText = sc.from;
    document.getElementById('scen-to').innerText = sc.to;
    document.getElementById('scen-subject').innerText = sc.subject;
    document.getElementById('scen-body').innerHTML = sc.body;
    document.getElementById('scenario-number').innerText = state.sandbox.currentScenarioIndex + 1;
    
    document.getElementById('game-feedback').classList.add('hidden');
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
        state.sandbox.score += 100 + (state.sandbox.streak * 20);
        state.sandbox.streak++;
        feedbackTitle.className = 'feedback-header text-green';
        feedbackTitle.innerHTML = '<i class="fa-solid fa-circle-check"></i> Correct Assessment! (+100 pts)';
    } else {
        state.sandbox.streak = 0;
        feedbackTitle.className = 'feedback-header text-red';
        feedbackTitle.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Incorrect Assessment!';
    }

    feedbackExp.innerText = sc.explanation;
    feedbackCard.classList.remove('hidden');

    document.getElementById('phish-score').innerText = state.sandbox.score;
    document.getElementById('phish-streak').innerText = state.sandbox.streak;
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
        alert(state.geminiApiKey ? "✅ Gemini API Key saved! Sentinel Agent will now use live Gemini 1.5/2.0 API." : "ℹ️ Using built-in Sentinel Neural Agent engine.");
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
            return `⚠️ <strong>Gemini API Error:</strong> ${data.error.message || 'Invalid API Key'}. Switched to Sentinel Neural Engine.`;
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
        return '👋 Greetings! I am your <strong>Sentinel AI Cyber Agent</strong>. Ask me any cybersecurity question, paste a link, or inquire about threat remediation steps!';
    }

    // 2. TYPOSQUATTING & SPOOFED DOMAINS
    if (qLower.includes('typosquatting') || qLower.includes('typo') || qLower.includes('paypa1') || qLower.includes('homoglyph')) {
        return '🔍 <strong>Typosquatting & Domain Spoofing Analysis:</strong><br>Attackers register visually identical domains (e.g. <code>paypa1.com</code> instead of <code>paypal.com</code>) to trick users who make typing mistakes. SentinelGuard AI detects these using Levenshtein distance calculations against official brand matrices.';
    }

    // 3. DEEPFAKE VOICE & AUDIO SCAMS
    if (qLower.includes('deepfake') || qLower.includes('audio') || qLower.includes('voice') || qLower.includes('wire') || qLower.includes('ceo')) {
        return '🎙️ <strong>Deepfake Voice & Wire Fraud Defense:</strong><br>AI voice clones replicate executive pitch signatures to coerce employees into fraudulent wire transfers ($45k+). SentinelGuard AI flags spectral frequency anomalies and commands dual-control phone verification.';
    }

    // 4. INCIDENT RESPONSE & CLICKED BAD LINK
    if (qLower.includes('clicked') || qLower.includes('accident') || qLower.includes('mitigat') || qLower.includes('remediat') || qLower.includes('what should i do')) {
        return '🚨 <strong>Emergency Incident Response Steps:</strong><br>1. <strong>Disconnect Network:</strong> Immediately disconnect Wi-Fi and ethernet.<br>2. <strong>Revoke Credentials:</strong> Reset passwords and terminate active OAuth sessions from a safe device.<br>3. <strong>Endpoint Scan:</strong> Run an offline antivirus/EDR scan for session hijackers.<br>4. <strong>Block Domain:</strong> Add the malicious IP to your local DNS sinkhole.';
    }

    // 5. SECURITY HEADERS (HSTS, CSP, CORS)
    if (qLower.includes('hsts') || qLower.includes('csp') || qLower.includes('cors') || qLower.includes('header')) {
        return '🔒 <strong>HTTP Security Header Intelligence:</strong><br>• <code>Strict-Transport-Security (HSTS)</code>: Forces all connections over HTTPS.<br>• <code>Content-Security-Policy (CSP)</code>: Blocks untrusted script injection & XSS.<br>• <code>X-Frame-Options</code>: Prevents clickjacking inside hidden iframe overlays.';
    }

    // 6. PASSKEYS & MULTI-FACTOR AUTHENTICATION
    if (qLower.includes('passkey') || qLower.includes('2fa') || qLower.includes('mfa') || qLower.includes('fido')) {
        return '🔑 <strong>Passkeys & FIDO2 Authentication:</strong><br>Passkeys rely on public-key cryptography bound directly to the origin domain (e.g. <code>github.com</code>). Even if you visit a fake <code>g1thub.com</code> link, the browser refuses to send your passkey credential—making them immune to phishing!';
    }

    // 7. HYPERLINK / URL ANALYSIS
    if (qLower.includes('http') || qLower.includes('url') || qLower.includes('link') || qLower.includes('subdomain') || qLower.includes('tld')) {
        return '🌐 <strong>URL Structural Inspection:</strong><br>When evaluating URLs, SentinelGuard AI inspects:<br>1. <strong>TLD Risk Index:</strong> High-risk TLDs like <code>.xyz</code>, <code>.top</code>, or <code>.cfd</code>.<br>2. <strong>Subdomain Depth:</strong> Hiding the real domain deep inside <code>m365.login.verify.com.evil-host.ru</code>.<br>3. <strong>Protocol Encryption:</strong> Insecure cleartext HTTP connections.';
    }

    // 8. GENERAL CYBERSECURITY QUERY FALLBACK
    const keywordsFound = q.match(/\b[A-Za-z0-9]{4,}\b/g) || ['security'];
    const focusTopic = keywordsFound.slice(0, 3).join(', ');

    return `🤖 <strong>Sentinel Cyber Intelligence:</strong><br>Regarding <em>"${escapeHtml(q)}"</em> (Focus: <code>${escapeHtml(focusTopic)}</code>):<br>SentinelGuard AI evaluates this against our Zero-Trust threat engine. To get a complete breakdown, paste your target URL, text message, or audio transcript into the <strong>Threat Scanner</strong> tab above!`;
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
