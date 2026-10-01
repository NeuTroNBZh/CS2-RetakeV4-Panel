<script setup lang="ts">
import { ref } from 'vue'
import { router, usePage } from '@inertiajs/vue3'
import DefaultLayout from '../../layouts/default.vue'
import WeaponCard from '../../components/weapon_card.vue'
import { translate, type Locale } from '../../i18n/index.js'

type Team = 'T' | 'CT'
type Slot = 'primary' | 'secondary'
type SlotView = {
  choices: { id: string; label: string; category: string }[]
  selected: string | null
  defaultId: string | null
}
type RoundTypeView = { name: string; primary: SlotView; secondary: SlotView }

const props = defineProps<{
  view: {
    status: 'ok' | 'missing' | 'unsupported' | 'invalid'
    formatVersion: number | null
    awp: Record<Team, { offered: boolean; optIn: boolean }>
    teams: Record<Team, RoundTypeView[]>
  }
}>()
const page = usePage<{ locale: Locale }>()
const t = (key: string, params?: Record<string, string | number>) =>
  translate(page.props.locale, key, params)
const team = ref<Team>('CT')
const slots: Slot[] = ['primary', 'secondary']

const post = (url: string, data: Record<string, string | number | boolean>) =>
  router.post(url, data, { preserveScroll: true })
const choose = (roundType: string, slot: Slot, weapon: string) =>
  post('/loadouts/weapon', { team: team.value, roundType, slot, weapon })
const reset = (roundType: string) => post('/loadouts/reset', { team: team.value, roundType })
const toggleAwp = () =>
  post('/loadouts/awp', { team: team.value, optIn: !props.view.awp[team.value].optIn })
const isShown = (slot: SlotView, id: string) => (slot.selected ?? slot.defaultId) === id
</script>

<template>
  <DefaultLayout>
    <h1>{{ t('loadouts.title') }}</h1>

    <p v-if="props.view.status === 'missing'" class="alert">{{ t('loadouts.catalog.missing') }}</p>
    <p v-else-if="props.view.status === 'unsupported'" class="alert">
      {{ t('loadouts.catalog.unsupported', { version: props.view.formatVersion ?? '?' }) }}
    </p>
    <p v-else-if="props.view.status === 'invalid'" class="alert">
      {{ t('loadouts.catalog.invalid') }}
    </p>

    <template v-else>
      <div class="tabs" role="tablist">
        <button
          v-for="side in ['T', 'CT'] as const"
          :key="side"
          type="button"
          role="tab"
          :aria-selected="team === side"
          @click="team = side"
        >
          {{ t(`loadouts.team.${side}`) }}
        </button>
      </div>

      <label v-if="props.view.awp[team].offered" class="awp-toggle">
        <input type="checkbox" :checked="props.view.awp[team].optIn" @change="toggleAwp" />
        {{ t('loadouts.awp') }}
        <small>{{ t('loadouts.awp.help') }}</small>
      </label>

      <p v-if="props.view.teams[team].length === 0">{{ t('loadouts.no_choice') }}</p>
      <section v-for="roundType in props.view.teams[team]" :key="roundType.name" class="round-type">
        <header>
          <h2>{{ roundType.name }}</h2>
          <button type="button" class="link" @click="reset(roundType.name)">
            {{ t('loadouts.reset') }}
          </button>
        </header>
        <div v-for="slot in slots" :key="slot">
          <template v-if="roundType[slot].choices.length > 1">
            <h3>{{ t(`loadouts.${slot}`) }}</h3>
            <div class="weapon-grid">
              <WeaponCard
                v-for="choice in roundType[slot].choices"
                :key="choice.id"
                :label="choice.label"
                :category="choice.category"
                :selected="isShown(roundType[slot], choice.id)"
                :is-default="roundType[slot].defaultId === choice.id"
                :default-label="t('loadouts.default')"
                @choose="choose(roundType.name, slot, choice.id)"
              />
            </div>
          </template>
        </div>
      </section>
    </template>
  </DefaultLayout>
</template>
