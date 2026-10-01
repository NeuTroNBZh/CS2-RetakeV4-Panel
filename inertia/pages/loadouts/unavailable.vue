<script setup lang="ts">
import { usePage } from '@inertiajs/vue3'
import DefaultLayout from '../../layouts/default.vue'
import { translate, type Locale } from '../../i18n/index.js'

const page = usePage<{ locale: Locale }>()
</script>

<template>
  <DefaultLayout>
    <h1>{{ translate(page.props.locale, 'loadouts.title') }}</h1>
    <p class="alert" role="alert">{{ translate(page.props.locale, 'loadouts.unavailable') }}</p>
  </DefaultLayout>
</template>
