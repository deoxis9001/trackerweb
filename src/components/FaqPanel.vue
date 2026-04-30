<script setup>
import { useStateStore } from '../stores/stateStore'
import { useLocale } from '../composables/useLocale'

const store = useStateStore()
const { t } = useLocale()

const CONNECTOR_URL  = `${import.meta.env.BASE_URL}bizhawk_tracker.lua`
const REPO_URL       = 'https://github.com/deoxis9001/trackerweb'
const RELEASES_URL   = 'https://github.com/deoxis9001/trackerweb/releases/latest'
</script>

<template>
  <div class="faq-panel">
    <div class="panel-header">
      <span>{{ t('faq.title') }}</span>
      <button class="close-btn" @click="store.showFaq = false">✕</button>
    </div>
    <div class="faq-content">

      <section class="faq-section">
        <h4>{{ t('faq.links_title') }}</h4>
        <div class="btn-row">
          <a :href="RELEASES_URL" target="_blank" rel="noopener" class="dl-btn">⬇ {{ t('faq.latest_release') }}</a>
          <a :href="REPO_URL"     target="_blank" rel="noopener" class="link-btn">{{ t('faq.repo_link') }}</a>
        </div>
      </section>

      <section class="faq-section">
        <h4>{{ t('faq.bizhawk_title') }}</h4>
        <p>{{ t('faq.bizhawk_desc') }}</p>
        <a :href="CONNECTOR_URL" download class="dl-btn">⬇ {{ t('faq.connector_download') }}</a>
      </section>

      <section class="faq-section">
        <h4>{{ t('faq.ap_title') }}</h4>
        <p>{{ t('faq.ap_desc') }}</p>
      </section>

    </div>
  </div>
</template>

<style scoped>
.faq-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-dark);
  border-radius: 6px;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  background: var(--bg-dark);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-gold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1;
}
.close-btn:hover { color: var(--text); background: var(--bg-card); }
.faq-content {
  padding: 12px 14px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.faq-section h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-gold);
  letter-spacing: 0.03em;
}
.faq-section p {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.55;
}
.btn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dl-btn {
  display: inline-block;
  background: var(--accent-soft);
  color: var(--text);
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 12px;
  text-decoration: none;
}
.dl-btn:hover { filter: brightness(1.2); }
.link-btn {
  display: inline-block;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 12px;
  text-decoration: none;
}
.link-btn:hover { color: var(--text); border-color: var(--accent); }
</style>
