<template>
  <div class="changelog-wrap">
    <div class="changelog-inner">
      <h1 class="changelog-title">Changelog</h1>

      <section v-for="entry in changelog" :key="entry.date" class="changelog-day">
        <h2 class="day-date">{{ entry.date }}</h2>
        <ul class="commit-list">
          <li v-for="commit in entry.commits" :key="commit.title" class="commit-item">
            <span :class="['commit-tag', commit.type]">{{ commit.type }}</span>
            <span class="commit-title">{{ commit.title }}</span>
            <ul v-if="commit.details?.length" class="commit-details">
              <li v-for="d in commit.details" :key="d">{{ d }}</li>
            </ul>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import changelog from '../metadata/changelog.json'
</script>

<style scoped>
.changelog-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
  background: var(--bg-dark);
}

.changelog-inner {
  max-width: 760px;
  margin: 0 auto;
}

.changelog-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-gold);
  margin: 0 0 24px;
  letter-spacing: 0.04em;
}

.changelog-day {
  margin-bottom: 28px;
}

.day-date {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border);
}

.commit-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.commit-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
}

.commit-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}
.commit-tag.feat   { background: #1a4a1a; color: #6de06d; }
.commit-tag.fix    { background: #4a2020; color: #f08080; }
.commit-tag.ci     { background: #1a2a4a; color: #80a8f0; }
.commit-tag.chore  { background: #2a2a2a; color: #aaaaaa; }
.commit-tag.init   { background: #3a2a0a; color: var(--accent-gold); }
.commit-tag.other  { background: #2a2020; color: #c0a080; }

.commit-title {
  color: var(--text);
  line-height: 1.4;
}

.commit-details {
  width: 100%;
  margin: 4px 0 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.commit-details li {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}
</style>
