/* ==========================================================================
   SentinelGuard AI - Module 4: Enterprise DNS-over-HTTPS (DoH) Exporter
   One-click blocklist exporter for Pi-hole, Cloudflare Teams, NextDNS, and Cisco Umbrella.
   ========================================================================== */

const DohExporterModule = {
    getBlockedDomains() {
        return [
            'paypa1-secure-auth.com',
            'm365-update-portal.xyz',
            'bofam-fraud-protection.xyz',
            'g1thub-security-update.top',
            'company-internal-verify-portal.net'
        ];
    },

    exportBlocklist(format) {
        const domains = this.getBlockedDomains();
        let content = '';
        let filename = '';
        let mimeType = 'text/plain';

        if (format === 'pihole') {
            content = `# SentinelGuard AI Auto-Generated Pi-hole / Hosts Blocklist\n# Exported: ${new Date().toISOString()}\n`;
            domains.forEach(d => content += `0.0.0.0 ${d}\n`);
            filename = `sentinelguard_pihole_blocklist_${Date.now()}.txt`;
        } else if (format === 'cloudflare') {
            const cfPayload = {
                name: "SentinelGuard AI Zero-Trust DoH Policy",
                description: "Auto-generated threat sinkhole list from SentinelGuard AI SOC Console",
                rules: domains.map(d => ({
                    action: "block",
                    expression: `dns.fqdn eq "${d}"`
                }))
            };
            content = JSON.stringify(cfPayload, null, 2);
            filename = `sentinelguard_cloudflare_teams_${Date.now()}.json`;
            mimeType = 'application/json';
        } else if (format === 'nextdns') {
            content = `# NextDNS Domain Blocklist Export\n`;
            domains.forEach(d => content += `${d}\n`);
            filename = `sentinelguard_nextdns_${Date.now()}.txt`;
        } else if (format === 'cisco') {
            content = `; Cisco Umbrella / BIND9 Zone Sinkhole Export\n`;
            domains.forEach(d => {
                content += `zone "${d}" { type master; file "/etc/bind/db.blocked"; };\n`;
            });
            filename = `sentinelguard_cisco_umbrella_${Date.now()}.conf`;
        }

        this.triggerDownload(content, filename, mimeType);
        if (typeof showToast === 'function') {
            showToast(`Exported ${domains.length} threat domains in ${format.toUpperCase()} format!`, 'success');
        }
    },

    triggerDownload(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};

window.DohExporterModule = DohExporterModule;
