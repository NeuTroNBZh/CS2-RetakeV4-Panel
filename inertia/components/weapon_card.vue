<script setup lang="ts">
defineProps<{ label: string; category: string; selected: boolean; isDefault: boolean; defaultLabel: string }>()
defineEmits<{ choose: [] }>()
</script>

<template>
  <button type="button" class="weapon-card" :class="{ selected }" :aria-pressed="selected" @click="$emit('choose')">
    <img :src="`/weapons/${category}.svg`" alt="" width="64" height="32" />
    <span class="weapon-name">{{ label }}</span>
    <span v-if="isDefault" class="weapon-default">{{ defaultLabel }}</span>
  </button>
</template>
