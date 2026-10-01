<script setup lang="ts">
import { computed } from 'vue'
import { router, usePage } from '@inertiajs/vue3'
import { translate, type Locale } from '../i18n/index.js'

const page = usePage<{
  locale: Locale
  user: { steamId: string; name: string; avatarUrl: string | null } | null
  menu: { labelKey: string; href: string }[]
  flash: { error?: string; success?: string }
}>()
const t = (key: string, params?: Record<string, string | number>) =>
  translate(page.props.locale, key, params)
const flashError = computed(() => (page.props.flash.error ? t(page.props.flash.error) : null))
const flashSuccess = computed(() => (page.props.flash.success ? t(page.props.flash.success) : null))

function switchLocale(locale: Locale) {
  router.post('/locale', { locale }, { preserveScroll: true })
}

function logout() {
  router.post('/logout')
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <a href="/" class="brand">{{ t('core.title') }}</a>
      <nav class="menu">
        <a v-for="entry in page.props.menu" :key="entry.href" :href="entry.href">{{
          t(entry.labelKey)
        }}</a>
      </nav>
      <div class="account">
        <button
          type="button"
          :aria-pressed="page.props.locale === 'en'"
          :aria-label="t('core.language')"
          @click="switchLocale('en')"
        >
          EN
        </button>
        <button
          type="button"
          :aria-pressed="page.props.locale === 'fr'"
          :aria-label="t('core.language')"
          @click="switchLocale('fr')"
        >
          FR
        </button>
        <template v-if="page.props.user">
          <img
            v-if="page.props.user.avatarUrl"
            :src="page.props.user.avatarUrl"
            alt=""
            class="avatar"
          />
          <span>{{ page.props.user.name }}</span>
          <button type="button" @click="logout">{{ t('core.logout') }}</button>
        </template>
        <a v-else href="/login" class="button">{{ t('core.login') }}</a>
      </div>
    </header>
    <p v-if="flashError" class="alert" role="alert">{{ flashError }}</p>
    <p v-if="flashSuccess" class="notice" role="status">{{ flashSuccess }}</p>
    <main class="content"><slot /></main>
  </div>
</template>
