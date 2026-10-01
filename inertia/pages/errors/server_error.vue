<script setup lang="ts">
import { usePage } from '@inertiajs/vue3'
import DefaultLayout from '../../layouts/default.vue'
import { translate, type Locale } from '../../i18n/index.js'

const page = usePage<{ locale: Locale }>()
const t = (key: string) => translate(page.props.locale, key)
</script>

<template>
  <DefaultLayout>
    <h1>500</h1>
    <p>{{ t('core.error.server') }}</p>
    <a href="/" class="button">{{ t('core.back_home') }}</a>
  </DefaultLayout>
</template>
