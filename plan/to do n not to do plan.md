# Implementation Plan — SentinelGuard AI Edge-Grade Quality Upgrade

This plan addresses all guidelines and prohibitions outlined in `plan/gemini-code-1789859078723.md` (What TO Do) and `plan/gemini-code-1789859082291.md` (What NOT To Do / Anti-Slop Guide) to ascend SentinelGuard AI to a production-grade, hackathon-winning application.

---

## User Review Required

> [!IMPORTANT]
> **Key Enhancements Overview:**
> 1. **Accessibility & Accessibility Navigation:** Added a Screen Reader "Skip to content" link, high contrast light/dark mode switch, and keyboard shortcut search (`Ctrl+K`).
> 2. **Modern Web Comforts:** Added a real-time top scroll progress bar, floating "Back to Top" button, dynamic Cookie Consent Banner, and print-optimized `@media print` stylesheet.
> 3. **Site Helpers & Smart Utilities:** Added an expandable Cyber Security FAQ accordion, site-wide search modal, password/API key visibility eye toggle, and structured destructive action confirmation dialogs.
> 4. **Compliance & Analytics:** Implemented UTM parameter URL tracking logic and cookie consent state persistence.

---

## Proposed Changes

### Core Structure & Components

#### [MODIFY] [index.html](file:///d:/Armaan/TLN%20Hackathon/index.html)
- Add `<a href="#main-content" class="skip-to-content">Skip to Main Content</a>` right after `<body>`.
- Add `<div id="scroll-progress" class="scroll-progress-bar"></div>` at top.
- Add Theme Switcher Toggle button (`#theme-toggle-btn`) in the header navbar.
- Add Quick Search button (`#site-search-btn`) with key hint `Ctrl+K`.
- Add Quick Search Modal (`#search-modal`) for instant navigation and threat queries.
- Add "Last Updated" metadata timestamps on threat widgets (`Last Updated: September 20, 2026`).
- Add an expandable **Cyber Security FAQ Accordion** section in the UI.
- Add Password/Key Visibility toggle buttons (`#toggle-key-visibility`) on secret inputs.
- Add Destructive Action Confirmation Modal (`#modal-confirm-action`).
- Add Cookie Consent Banner (`#cookie-banner`) with Accept/Customize buttons.
- Add Floating "Back to Top" button (`#back-to-top`).

#### [MODIFY] [src/style.css](file:///d:/Armaan/TLN%20Hackathon/src/style.css)
- Add `.skip-to-content` focus states and screen reader utility styling.
- Add `#scroll-progress` top fixed bar styling.
- Add `[data-theme="light"]` color variable set (crisp high-contrast dark-on-light theme alternative).
- Add FAQ accordion styles (`.faq-accordion`, `.faq-item`, `.faq-header`, `.faq-body`).
- Add Cookie Consent banner fixed bottom layout with blur glassmorphism.
- Add Password toggle icon overlay styles inside form inputs.
- Add `@media print` stylesheet to strip navbars, background animations, and optimize print output.

#### [MODIFY] [src/app.js](file:///d:/Armaan/TLN%20Hackathon/src/app.js)
- Implement `initThemeToggle()` with `localStorage` persistence (`sentinel_theme`).
- Implement top scroll progress bar listener on `window.scroll`.
- Implement `initBackToTop()` with threshold visibility and smooth scrolling.
- Implement `initSiteSearch()` supporting `Ctrl+K` keyboard shortcut and live search filtering.
- Implement `toggleFaqAccordion()` logic for expanding/collapsing FAQ items.
- Implement `toggleSecretVisibility()` for API key and admin password inputs.
- Implement `confirmDestructiveAction()` replacing native `confirm()` popups with styled modals.
- Implement `initCookieBanner()` with user preference persistence (`sentinel_cookie_consent`).
- Implement `parseUtmParameters()` to extract and log `utm_source`, `utm_medium`, `utm_campaign` tracking data.

---

## Verification Plan

### Automated Verification
- Run `git status` and local dev server checks.
- Verify zero console errors or syntax regressions in JS/CSS.

### Manual Verification
- **Theme Toggle**: Test switching between Cyber Dark Mode and High-Contrast Light Mode; verify setting persists across page reloads.
- **Scroll Progress**: Scroll up and down the page; verify top green progress bar fills smoothly from 0% to 100%.
- **Search Modal (`Ctrl+K`)**: Press `Ctrl+K` or click search button; search for "HSTS", "Deepfake", "Domain", or "SOC"; test jumping to target sections.
- **FAQ Accordion**: Click FAQ items to ensure single/multi expand collapse works smoothly.
- **Cookie Banner**: Click "Accept All" or "Decline"; verify banner hides and state is saved in `localStorage`.
- **Back to Top**: Scroll down past 300px; verify "Back to Top" button appears and smoothly scrolls to top on click.
- **Print Preview**: Open browser print dialog (`Ctrl+P`); verify navbar/chat widget hidden and content formats cleanly.
