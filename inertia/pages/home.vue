<script setup lang="ts">
import { usePage } from '@inertiajs/vue3'
import DefaultLayout from '../layouts/default.vue'
import { translate, type Locale } from '../i18n/index.js'

const page = usePage<{ locale: Locale; user: { name: string } | null }>()
const t = (key: string, params?: Record<string, string | number>) =>
  translate(page.props.locale, key, params)
</script>

<template>
  <DefaultLayout>
    <h1 v-if="page.props.user">{{ t('core.welcome', { name: page.props.user.name }) }}</h1>
    <h1 v-else>{{ t('core.title') }}</h1>
    <p>{{ t('core.home.intro') }}</p>
    <a v-if="!page.props.user" href="/login" class="button">{{ t('core.login') }}</a>
  </DefaultLayout>
</template>
