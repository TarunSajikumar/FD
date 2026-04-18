css = r''':root {
  --bg: #070a14;
  --bg-soft: rgba(12, 17, 34, 0.88);
  --panel: rgba(12, 17, 34, 0.92);
  --panel-strong: rgba(18, 26, 44, 0.96);
  --surface: rgba(24, 34, 58, 0.92);
  --text: #f8fafc;
  --muted: #a8b1c4;
  --soft: #d6dce6;
  --accent: #ffb347;
  --accent-strong: #ff8c00;
  --border: rgba(255, 255, 255, 0.1);
  --shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
  --radius: 24px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

html {
  scroll-behavior: smooth;
  text-size-adjust: 100%;
  min-height: 100%;
}

body {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 15%, rgba(255, 144, 60, 0.14), transparent 24%),
              radial-gradient(circle at 85% 10%, rgba(255, 221, 146, 0.08), transparent 20%),
              linear-gradient(180deg, #05070f 0%, #0d1324 40%, #090b15 100%);
  background-attachment: fixed;
  color: var(--text);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Cpath d="M0 0h120v120H0z" fill="none"/%3E%3Cpath d="M0 1h120M0 21h120M0 41h120M0 61h120M0 81h120M0 101h120M1 0v120M21 0v120M41 0v120M61 0v120M81 0v120M101 0v120" stroke="rgba(255,255,255,0.02)"/%3E%3C/svg%3E');
  opacity: 0.16;
  pointer-events: none;
  z-index: 0;
}

body > * {
  position: relative;
  z-index: 1;
}

img, svg {
  max-width: 100%;
  display: block;
}

button,
input,
select,
textarea {
  font: inherit;
}

button,
a.button,
.btn,
.pay-intent-btn,
.order-action-btn,
.logout-btn,
.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  cursor: pointer;
  transition: transform 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

button:hover,
a.button:hover,
.btn:hover,
.pay-intent-btn:hover,
.order-action-btn:hover,
.logout-btn:hover,
.back-btn:hover {
  transform: translateY(-1px);
}

.btn.primary-btn,
a.button.primary-btn,
.pay-intent-btn,
.order-action-btn.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #0d1018;
  box-shadow: 0 18px 36px rgba(255, 140, 18, 0.28);
}

.btn.secondary-btn,
a.button.secondary-btn,
.logout-btn,
.back-btn,
.modal-btn-secondary,
.button.ghost-btn {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.btn.ghost-btn,
a.button.ghost-btn,
.btn.accent-smooth,
a.button.accent-smooth {
  background: rgba(255, 179, 71, 0.18);
  border: 1px solid rgba(255, 179, 71, 0.35);
  color: var(--text);
}

.card,
.glass-card,
.section-card,
.page-card,
.panel,
.container,
.auth-card,
.payment-card,
.pay-container,
.cart-card,
.order-card,
.menu-card,
.summary-panel,
.order-panel,
.payment-panel,
.amount-box,
.upi-box,
.info-box,
.order-details,
.menu-item,
.cart-item,
.order-block,
.pay-option {
  background: var(--panel);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.page-card,
.auth-card,
.password-modal,
.container,
.payment-card,
.pay-container,
.cart-card,
.order-card,
.menu-card,
.summary-panel,
.order-panel,
.payment-panel {
  width: min(100%, 1080px);
}

.page-card {
  margin: 96px auto;
  padding: 32px;
  max-width: 520px;
  text-align: center;
}

.page-card-centered {
  margin: 96px auto;
  max-width: 460px;
}

.page,
.page-wrap,
.container,
.dashboard-container {
  width: min(100%, 1160px);
  margin: 0 auto;
  padding: 24px;
}

.section-title,
.page-title,
.hero-title,
.order-id-label,
.pay-option-title,
.detail-label {
  color: var(--text);
  font-weight: 800;
}

.section-title,
.page-title {
  font-size: clamp(1.6rem, 2vw, 2.6rem);
  letter-spacing: 0.02em;
  margin-bottom: 14px;
}

.subtitle,
.page-subtitle,
.section-subtitle,
.order-meta,
.status-text,
.note,
.hint,
.small-text,
.pay-option-desc,
.detail-value {
  color: var(--muted);
}

.subtitle,
.page-subtitle {
  font-size: 0.95rem;
  line-height: 1.7;
  max-width: 720px;
  margin-bottom: 22px;
}

.badge,
.label-pill,
.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 179, 71, 0.16);
  color: #ffda97;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.form-group,
.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

label {
  color: var(--soft);
  font-size: 0.9rem;
}

input,
select,
textarea,
.password-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: var(--text);
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

input:focus,
select:focus,
textarea:focus,
.password-input:focus {
  border-color: rgba(255, 179, 71, 0.7);
  background: rgba(255,255,255,0.08);
  transform: translateY(-1px);
}

input::placeholder,
textarea::placeholder {
  color: rgba(255,255,255,0.55);
}

.grid-cols-2,
.grid-2,
.menu-grid,
.product-grid,
.order-grid,
.dashboard-grid {
  display: grid;
  gap: 20px;
}

.grid-cols-2,
.grid-2,
.menu-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 900px) {
  .grid-cols-2,
  .grid-2,
  .order-grid,
  .product-grid,
  .menu-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.user-bar {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 980px;
  width: calc(100% - 32px);
  background: linear-gradient(135deg, rgba(18, 24, 42, 0.92), rgba(14, 18, 32, 0.92));
  border-radius: 999px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 18px 40px rgba(0,0,0,0.28);
  backdrop-filter: blur(18px) saturate(140%);
  z-index: 200;
}

.user-bar .user-info,
.user-bar .user-actions,
.user-actions,
.header-actions,
.modal-buttons,
.button-row,
.pay-methods,
.copy-row,
.qty-controls,
.order-actions,
.dashboard-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(255,140,0,0.45), rgba(255,180,60,0.28));
  color: #f5e6d3;
  font-weight: 800;
  letter-spacing: 0.04em;
  border: 1px solid rgba(255,255,255,0.14);
}

.user-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.user-email {
  color: var(--muted);
  font-size: 0.82rem;
}

.logout-btn,
.back-btn,
.order-action-btn,
.pay-intent-btn,
.modal-btn {
  min-width: 120px;
  padding: 12px 16px;
  font-size: 0.88rem;
  text-transform: uppercase;
}

.back-btn {
  position: absolute;
  top: 18px;
  left: 18px;
  background: rgba(18, 24, 42, 0.82);
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
  box-shadow: 0 14px 30px rgba(0,0,0,0.24);
  z-index: 201;
}

.back-btn:hover {
  background: rgba(255,255,255,0.06);
}

.auth-card,
.password-modal,
.cart-card,
.order-card,
.menu-card,
.payment-card,
.container,
.summary-panel,
.order-panel,
.payment-panel,
.pay-container {
  padding: 24px;
}

.auth-card,
.password-modal,
.cart-card,
.order-card,
.menu-card,
.payment-card,
.container,
.summary-panel,
.order-panel,
.payment-panel,
.pay-container,
.info-box,
.order-details,
.amount-box,
.upi-box,
.menu-item,
.cart-item,
.order-block,
.pay-option {
  background: rgba(12, 17, 34, 0.92);
}

.auth-card,
.password-modal,
.cart-card,
.order-card,
.menu-card,
.payment-card,
.container,
.summary-panel,
.order-panel,
.payment-panel,
.pay-container {
  border-radius: 28px;
}

.auth-card,
.password-modal,
.cart-card,
.order-card,
.menu-card,
.payment-card,
.container,
.summary-panel,
.order-panel,
.payment-panel,
.pay-container,
.info-box,
.order-details,
.amount-box,
.upi-box,
.menu-item,
.cart-item,
.order-block,
.pay-option {
  border: 1px solid rgba(255,255,255,0.1);
}

.auth-card,
.password-modal {
  max-width: min(520px, calc(100% - 36px));
  margin: 0 auto;
}

.password-modal,
.auth-card {
  width: 100%;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(5, 9, 20, 0.75);
  backdrop-filter: blur(14px);
  z-index: 900;
}

.modal-overlay.active {
  display: flex;
}

.modal-buttons {
  justify-content: flex-end;
}

.header-left h1,
.page-title,
.section-title,
.hero-title,
.order-id-label,
.pay-option-title,
.detail-label {
  margin: 0;
}

.search-container {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 18px;
}

.search-bar i {
  color: var(--muted);
}

.search-bar input {
  flex: 1;
  background: transparent;
  border: 0;
  color: var(--text);
  min-width: 0;
}

.category-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 12px 4px;
}

.category-tab {
  flex-shrink: 0;
  padding: 10px 16px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  color: var(--muted);
  border: 1px solid rgba(255,255,255,0.08);
}

.category-tab.active {
  background: linear-gradient(135deg, rgba(255, 179, 71, 0.18), rgba(255, 140, 20, 0.2));
  color: #f7f2e9;
  border-color: rgba(255,179,71,0.35);
}

.menu-section,
.order-section,
.payment-section {
  margin-bottom: 26px;
}

.menu-item,
.cart-item,
.order-item,
.order-block,
.pay-option {
  display: grid;
  gap: 16px;
  position: relative;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
  border-radius: 24px;
  padding: 18px;
  background: rgba(255,255,255,0.04);
}

.menu-item:hover,
.cart-item:hover,
.order-block:hover,
.pay-option:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,0.08);
}

.menu-item {
  grid-template-columns: 110px 1fr;
  align-items: start;
}

.menu-item img,
.food-card img,
.upi-box .qr,
.order-item img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 18px;
}

.menu-item .item-info,
.food-card .card-content,
.cart-left,
.order-summary,
.order-item .item-info,
.pay-option-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-name,
.menu-item .item-name,
.food-card .card-title,
.order-id-label,
.pay-option-title,
.amount-row .label,
.detail-label {
  color: var(--text);
  font-weight: 700;
}

.item-desc,
.menu-item .item-meta,
.order-meta,
.pay-option-desc,
.detail-value,
.status-text {
  color: var(--muted);
}

.item-price,
.menu-item .price,
.amount-row .value,
.pay-option-title,
.detail-value {
  color: #ffd38d;
}

.qty-controls,
.copy-row,
.modal-buttons,
.button-row,
.pay-methods,
.order-actions,
.user-actions,
.dashboard-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.qty-btn,
.order-action-btn,
.btn,
.action-btn,
.pay-intent-btn,
.logout-btn,
.back-btn {
  padding: 12px 18px;
  border-radius: 999px;
  font-weight: 700;
}

.pay-option {
  align-items: center;
  justify-content: space-between;
}

.pay-option-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pay-option-left i {
  font-size: 1.6rem;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: #ffb347;
}

.pay-option-title {
  font-size: 1.05rem;
}

.pay-option-desc,
.small-text,
.order-meta,
.status-text {
  font-size: 0.92rem;
}

.amount-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px dashed rgba(255,179,71,0.35);
  padding-bottom: 14px;
  margin-bottom: 24px;
}

.amount-row .value {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 800;
  background: linear-gradient(135deg, #ffd57f, #ff9a26);
  -webkit-background-clip: text;
  color: transparent;
}

.amount-box,
.upi-box,
.info-box,
.order-details,
.payment-card,
.summary-panel {
  padding: 22px;
}

.info-box,
.order-details,
.amount-box,
.upi-box {
  background: rgba(255,255,255,0.05);
}

.order-actions {
  justify-content: flex-end;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--muted);
}

.detail-value {
  color: #ffe4aa;
  font-weight: 700;
}

.success-circle {
  width: 120px;
  height: 120px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin: 0 auto 24px;
  background: radial-gradient(circle at 30% 30%, #ffb850, #ff7e2b);
  box-shadow: 0 0 32px rgba(255,130,30,0.28);
}

.success-circle i {
  color: #120b0f;
  font-size: 3rem;
}

.hint,
.note,
.footer-note {
  font-size: 0.92rem;
  color: var(--muted);
}

.status-message {
  margin-top: 1rem;
  color: #fca5a5;
  font-size: 0.95rem;
  min-height: 1.2rem;
}

.page-with-header {
  padding-top: 92px;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  background: rgba(15, 21, 39, 0.92);
}

.dashboard-header,
.dashboard-subheader {
  border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.1);
}

.header-left h1 {
  font-size: clamp(1.6rem, 2vw, 2.4rem);
  color: var(--text);
  margin-bottom: 10px;
}

.header-left p,
.time-display,
.dashboard-action-label {
  color: var(--muted);
}

.time-display {
  display: flex;
  gap: 8px;
  align-items: center;
}

@media (max-width: 860px) {
  .user-bar,
  .page-card,
  .page-card-centered,
  .container,
  .auth-card,
  .payment-card,
  .cart-card,
  .dashboard-header {
    width: min(100%, calc(100% - 28px));
    margin: 0 auto;
  }

  .user-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .pay-option,
  .cart-item,
  .menu-item,
  .order-block,
  .amount-row,
  .header-row,
  .copy-row,
  .order-actions,
  .pay-methods,
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 720px) {
  .page-card,
  .page-card-centered,
  .container,
  .auth-card,
  .payment-card,
  .cart-card,
  .order-card,
  .menu-card,
  .payment-panel,
  .summary-panel,
  .amount-box,
  .upi-box,
  .info-box,
  .order-details,
  .dashboard-header {
    padding: 18px;
    border-radius: 20px;
  }

  .page-card {
    margin: 64px auto;
  }

  .user-bar {
    width: calc(100% - 20px);
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 16px;
  }

  .back-btn {
    top: 14px;
    left: 14px;
    padding: 10px 14px;
  }

  .section-title,
  .page-title,
  .header-left h1 {
    font-size: 1.8rem;
  }
}

@media (max-width: 520px) {
  .user-bar {
    padding: 12px 14px;
  }

  .category-tab,
  .btn,
  .back-btn,
  .logout-btn,
  .pay-intent-btn,
  .order-action-btn {
    width: 100%;
  }

  .user-avatar {
    width: 44px;
    height: 44px;
  }

  .menu-item,
  .cart-item,
  .order-block,
  .pay-option {
    padding: 16px;
  }

  .amount-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
'''
with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)
