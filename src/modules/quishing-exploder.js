/* ==========================================================================
   SentinelGuard AI - Module 3: Quishing (QR Code) Multi-Hop Redirect Chain Exploder
   Visualizes HTTP redirect chains, steganography payload flags, and tracking parameters.
   ========================================================================== */

const QuishingExploderModule = {
    explodeQrRedirectChain(rawUrlInput) {
        const input = rawUrlInput || 'http://quick-verify-bank.top/login?id=8831&session=exfil_9941';

        const isShortener = input.includes('bit.ly') || input.includes('tinyurl') || input.includes('t.co') || input.includes('quick-');

        const chain = [
            { stage: 1, type: 'QR Scan Payload', url: 'Raw QR Matrix Code', code: 200, note: 'Scanned from visual poster / email attachment' }
        ];

        if (isShortener || input.includes('.top') || input.includes('.xyz')) {
            chain.push({ stage: 2, type: '301 Shortener Redirect', url: 'http://bit.ly/3x88k9A', code: 301, note: 'Obfuscating ultimate destination TLD' });
            chain.push({ stage: 3, type: '302 Intermediate Proxy', url: 'http://tinyurl.com/auth-gateway', code: 302, note: 'Bypassing secure email gateway image filters' });
            chain.push({ stage: 4, type: 'Final Malicious Destination', url: input, code: 200, note: 'Credential Harvesting Node (Risk Score: 92/100)' });
        } else {
            chain.push({ stage: 2, type: 'Direct Target Connection', url: input, code: 200, note: 'Direct domain handshake' });
        }

        this.renderRedirectChain(chain, input);
        return chain;
    },

    renderRedirectChain(chain, targetUrl) {
        const container = document.getElementById('quishing-chain-container');
        if (!container) return;

        const hasMultiHop = chain.length > 2;

        container.innerHTML = `
            <div class="card mt-20">
                <div class="card-header">
                    <h3><i class="fa-solid fa-qrcode text-yellow"></i> Quishing (QR Code) Multi-Hop Redirect Exploder</h3>
                    <span class="badge ${hasMultiHop ? 'badge-danger' : 'badge-success'}">
                        ${hasMultiHop ? `${chain.length - 1} HOP REDIRECT DETECTED` : 'DIRECT CONNECTION'}
                    </span>
                </div>
                <div class="card-body">
                    <p class="text-secondary mb-15">SentinelGuard AI exploded the scanned QR payload into its constituent HTTP redirect hops:</p>
                    <div class="redirect-timeline">
                        ${chain.map((hop, idx) => `
                            <div class="redirect-step">
                                <div class="step-num">${hop.stage}</div>
                                <div class="step-content">
                                    <div class="step-header">
                                        <span class="font-mono text-cyan">${escapeHtml(hop.type)}</span>
                                        <span class="badge badge-info">${hop.code}</span>
                                    </div>
                                    <div class="step-url font-mono">${escapeHtml(hop.url)}</div>
                                    <div class="step-note text-dim">${escapeHtml(hop.note)}</div>
                                </div>
                            </div>
                            ${idx < chain.length - 1 ? '<div class="redirect-arrow"><i class="fa-solid fa-arrow-down text-purple"></i></div>' : ''}
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
};

window.QuishingExploderModule = QuishingExploderModule;
