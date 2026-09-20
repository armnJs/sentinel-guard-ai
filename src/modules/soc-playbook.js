/* ==========================================================================
   SentinelGuard AI - Module 1: 1-Click SOC Remediation Playbook Generator
   Auto-generates Suricata/Snort IDS rules, YARA signatures, PowerShell endpoint cleanup scripts, and SOAR webhooks.
   ========================================================================== */

const SocPlaybookModule = {
    currentScanData: null,

    init(scanData) {
        this.currentScanData = scanData || {
            input: 'paypa1-secure-auth.com',
            domain: 'paypa1-secure-auth.com',
            riskScore: 88,
            ip: '185.220.101.44'
        };
        this.renderPlaybook('suricata');
    },

    generateSuricataRule(domain, ip) {
        const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        return `# SentinelGuard AI Auto-Generated Suricata/Snort IDS Signature
# Target Domain: ${cleanDomain} | Risk Score: High Threat
alert http $HOME_NET any -> $EXTERNAL_NET any (msg:"SENTINELGUARD_IDS_PHISH: Suspicious Connection to Phishing Domain ${cleanDomain}"; flow:to_server,established; content:"${cleanDomain}"; http_header; classtype:trojan-activity; sid:9002026; rev:1;)
alert ip $HOME_NET any -> ${ip || '185.220.101.44'} any (msg:"SENTINELGUARD_IDS_IP: Blocked Traffic to Malicious C2 Node ${ip || '185.220.101.44'}"; sid:9002027; rev:1;)`;
    },

    generateYaraRule(domain) {
        const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        return `// SentinelGuard AI Auto-Generated YARA Indicator Rule
// Target Domain: ${cleanDomain}
rule SentinelGuard_Phish_Payload_${Date.now()} {
    meta:
        description = "Detects credential harvesting templates for ${cleanDomain}"
        author = "SentinelGuard AI SOC Engine"
        date = "${new Date().toISOString().split('T')[0]}"
        threat_level = "CRITICAL"

    strings:
        $domain = "${cleanDomain}" ascii wide nocase
        $phish_pattern1 = "login_form_submit" ascii wide
        $phish_pattern2 = "verify_m365_credentials" ascii wide

    condition:
        $domain and ($phish_pattern1 or $phish_pattern2)
}`;
    },

    generatePowerShellScript(domain, ip) {
        const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        return `# SentinelGuard AI Automated Endpoint Remediation Script (PowerShell)
# Executed by Incident Response SOC Analyst

Write-Host "🛡️ Initiating Emergency Endpoint Remediation for ${cleanDomain}..." -ForegroundColor Cyan

# 1. Flush DNS Client Cache
Clear-DnsClientCache
Write-Host "✅ DNS Cache Flushed." -ForegroundColor Green

# 2. Add Host Sinkhole Block Rule
$HostFile = "$env:SystemRoot\System32\drivers\etc\hosts"
Add-Content -Path $HostFile -Value "0.0.0.0   ${cleanDomain}" -Force
Add-Content -Path $HostFile -Value "0.0.0.0   ${ip || '185.220.101.44'}" -Force
Write-Host "✅ DNS Sinkhole Rule Written to Hosts File." -ForegroundColor Green

# 3. Terminate Insecure Browser OAuth Processes
Get-Process | Where-Object { $_.ProcessName -match "chrome|msedge|firefox" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✅ Terminated Active OAuth Browser Sessions." -ForegroundColor Green

Write-Host "🎉 Endpoint Remediation Completed Successfully." -ForegroundColor Cyan`;
    },

    generateSoarWebhook(domain, riskScore, ip) {
        const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        return JSON.stringify({
            event_id: `EVT-SG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            severity: riskScore > 75 ? "CRITICAL" : "HIGH",
            threat_intelligence: {
                target_url: domain,
                extracted_domain: cleanDomain,
                ip_address: ip || "185.220.101.44",
                risk_score: riskScore,
                detection_engine: "SentinelGuard Multi-Vector AI Engine v2.4"
            },
            automated_action: {
                dns_sinkhole: "ENFORCED",
                firewall_rule: "DROP",
                user_session_revoke: "REQUIRED"
            }
        }, null, 2);
    },

    renderPlaybook(type) {
        const domain = this.currentScanData?.input || 'paypa1-secure-auth.com';
        const riskScore = this.currentScanData?.riskScore || 88;
        const ip = this.currentScanData?.ip || '185.220.101.44';

        const codeContainer = document.getElementById('playbook-code-box');
        if (!codeContainer) return;

        let output = '';
        if (type === 'suricata') output = this.generateSuricataRule(domain, ip);
        else if (type === 'yara') output = this.generateYaraRule(domain);
        else if (type === 'powershell') output = this.generatePowerShellScript(domain, ip);
        else if (type === 'soar') output = this.generateSoarWebhook(domain, riskScore, ip);

        codeContainer.innerText = output;

        // Update active tab buttons
        document.querySelectorAll('.playbook-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    },

    copyCurrentPlaybook() {
        const codeContainer = document.getElementById('playbook-code-box');
        if (codeContainer) {
            navigator.clipboard.writeText(codeContainer.innerText);
            if (typeof showToast === 'function') {
                showToast('Remediation playbook code copied to clipboard!', 'success');
            }
        }
    }
};

window.SocPlaybookModule = SocPlaybookModule;
