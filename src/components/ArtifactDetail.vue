<template>
  <div class="artifact-detail-overlay" :class="{ visible: !!artifact }" @click.self="$emit('close')">
    <div class="artifact-detail">
      <button class="detail-close" @click="$emit('close')">×</button>
      
      <div class="detail-image">
        <div class="placeholder" v-if="!imageLoaded">🏺</div>
        <img v-else :src="artifact.image" :alt="artifact.name" @error="onImageError">
      </div>
      
      <div class="detail-content">
        <h2 class="detail-title">{{ artifact.name }}</h2>
        
        <div class="detail-meta">
          <div class="meta-item">
            <div class="meta-label">原产国</div>
            <div class="meta-value">{{ artifact.country }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">入藏年份</div>
            <div class="meta-value">{{ artifact.acquisitionYear }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">文物类别</div>
            <div class="meta-value">{{ artifact.category }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">入藏时间</div>
            <div class="meta-value">{{ artifact.acquisitionDate }}</div>
          </div>
        </div>
        
        <p class="detail-description">{{ artifact.description || '暂无详细描述' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  artifact: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const imageLoaded = ref(false)

watch(() => props.artifact, (newVal) => {
  if (newVal) {
    imageLoaded.value = false
  }
})

function onImageError() {
  imageLoaded.value = false
}
</script>
