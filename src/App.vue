<template>
  <div class="app-container">
    <div class="loading-overlay" :class="{ hidden: isLoaded }">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载文物数据...</div>
    </div>

    <header class="header">
      <h1>如果文物都回家</h1>
      <div class="header-stats">
        <div class="stat-item">
          <div class="stat-value">{{ totalArtifacts }}</div>
          <div class="stat-label">文物总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ countryCount }}</div>
          <div class="stat-label">来源国家</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ displayedCount }}</div>
          <div class="stat-label">当前展示</div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <div class="sidebar-title">国家列表</div>
          <input 
            type="text" 
            class="country-search" 
            placeholder="搜索国家..."
            v-model="searchQuery"
          >
        </div>
        <div class="country-list">
          <div 
            v-for="country in filteredCountries" 
            :key="country.code"
            class="country-item"
            :class="{ active: selectedCountry === country.code }"
            @click="selectCountry(country.code)"
          >
            <span class="country-name">{{ country.name }}</span>
            <span class="country-count">{{ country.count }}</span>
          </div>
        </div>
        <div v-if="selectedCountry && selectedArtifacts.length > 0" class="artifact-list">
          <div class="sidebar-title" style="padding: 16px 16px 8px;">{{ getCountryName(selectedCountry) }} 文物</div>
          <div 
            v-for="artifact in selectedArtifacts" 
            :key="artifact.id"
            class="artifact-item"
            @click="showArtifactDetail(artifact)"
          >
            <div class="artifact-thumbnail">
              <div class="placeholder" v-if="!artifact.imageLoaded">🏺</div>
              <img v-else :src="artifact.image" :alt="artifact.name" @error="onImageError(artifact)">
            </div>
            <div class="artifact-info">
              <div class="artifact-name">{{ artifact.name }}</div>
              <div class="artifact-meta">{{ artifact.acquisitionYear }} | {{ artifact.category }}</div>
            </div>
          </div>
        </div>
      </aside>

      <button class="toggle-sidebar" @click="sidebarCollapsed = !sidebarCollapsed">
        {{ sidebarCollapsed ? '→' : '←' }}
      </button>

      <div class="globe-container">
        <div ref="globeRef" class="globe-wrapper"></div>
        
        <div class="view-switcher">
          <button 
            v-for="view in views" 
            :key="view.id"
            class="view-btn"
            :class="{ active: currentView === view.id }"
            @click="switchView(view.id)"
          >
            {{ view.label }}
          </button>
        </div>
      </div>
    </main>

    <div class="bottom-panel">
      <div class="timeline-container">
        <span class="timeline-label">{{ currentYear }}</span>
        <input 
          type="range" 
          class="timeline-slider"
          :min="minYear"
          :max="maxYear"
          :value="currentYear"
          @input="onTimelineChange"
        >
        <span class="timeline-label">{{ maxYear }}</span>
      </div>
      <div class="playback-controls">
        <button class="control-btn" @click="togglePlay" :class="{ active: isPlaying }">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <button class="control-btn" @click="resetTimeline">⏮</button>
        <div class="progress-info">
          已归位 <span>{{ displayedCount }}</span> / <span>{{ totalArtifacts }}</span> 件
        </div>
      </div>
    </div>

    <ArtifactDetail 
      v-if="currentArtifact"
      :artifact="currentArtifact"
      @close="currentArtifact = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import GlobeView from './components/GlobeView.js'
import ArtifactDetail from './components/ArtifactDetail.vue'
import artifactsData from './data/artifacts.json'

const globeRef = ref(null)
const isLoaded = ref(false)
const sidebarCollapsed = ref(false)
const searchQuery = ref('')
const selectedCountry = ref(null)
const currentArtifact = ref(null)
const currentYear = ref(1750)
const isPlaying = ref(false)
const currentView = ref('animation')

const views = [
  { id: 'flat', label: 'Flat' },
  { id: 'standing', label: 'Standing' },
  { id: 'particles', label: 'Particles' },
  { id: 'animation', label: 'Animation' }
]

let globeInstance = null
let animationTimer = null

const artifacts = ref([])
const displayedArtifacts = ref([])

const totalArtifacts = computed(() => artifacts.value.length)
const countryCount = computed(() => {
  const countries = new Set(artifacts.value.map(a => a.countryCode))
  return countries.size
})
const displayedCount = computed(() => displayedArtifacts.value.length)

const minYear = computed(() => {
  if (artifacts.value.length === 0) return 1750
  return Math.min(...artifacts.value.map(a => a.acquisitionYear))
})

const maxYear = computed(() => {
  if (artifacts.value.length === 0) return 2025
  return Math.max(...artifacts.value.map(a => a.acquisitionYear))
})

const countries = computed(() => {
  const countryMap = new Map()
  artifacts.value.forEach(artifact => {
    if (countryMap.has(artifact.countryCode)) {
      countryMap.get(artifact.countryCode).count++
    } else {
      countryMap.set(artifact.countryCode, {
        code: artifact.countryCode,
        name: artifact.country,
        count: 1
      })
    }
  })
  return Array.from(countryMap.values()).sort((a, b) => b.count - a.count)
})

const filteredCountries = computed(() => {
  if (!searchQuery.value) return countries.value
  const query = searchQuery.value.toLowerCase()
  return countries.value.filter(c => 
    c.name.toLowerCase().includes(query) ||
    c.code.toLowerCase().includes(query)
  )
})

const selectedArtifacts = computed(() => {
  if (!selectedCountry.value) return []
  return artifacts.value.filter(a => a.countryCode === selectedCountry.value)
})

function getCountryName(code) {
  const country = countries.value.find(c => c.code === code)
  return country ? country.name : code
}

function selectCountry(code) {
  if (selectedCountry.value === code) {
    selectedCountry.value = null
  } else {
    selectedCountry.value = code
    currentYear.value = minYear.value
    updateDisplayedArtifacts()
  }
  
  if (globeInstance) {
    if (code) {
      const artifact = artifacts.value.find(a => a.countryCode === code)
      if (artifact) {
        globeInstance.focusOnLocation(artifact.latitude, artifact.longitude)
      }
    }
  }
}

function showArtifactDetail(artifact) {
  currentArtifact.value = artifact
}

function onImageError(artifact) {
  artifact.imageLoaded = false
}

function onTimelineChange(e) {
  currentYear.value = parseInt(e.target.value)
  updateDisplayedArtifacts()
}

function updateDisplayedArtifacts() {
  if (currentView.value === 'animation') {
    displayedArtifacts.value = artifacts.value.filter(a => 
      a.acquisitionYear <= currentYear.value &&
      (!selectedCountry.value || a.countryCode === selectedCountry.value)
    )
  } else {
    displayedArtifacts.value = selectedCountry.value 
      ? selectedArtifacts.value 
      : artifacts.value
  }
  
  if (globeInstance) {
    globeInstance.updatePoints(displayedArtifacts.value)
  }
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startAnimation()
  } else {
    stopAnimation()
  }
}

function startAnimation() {
  if (animationTimer) return
  
  animationTimer = setInterval(() => {
    if (currentYear.value >= maxYear.value) {
      currentYear.value = minYear.value
    } else {
      currentYear.value += 1
    }
    updateDisplayedArtifacts()
  }, 100)
}

function stopAnimation() {
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
}

function resetTimeline() {
  stopAnimation()
  isPlaying.value = false
  currentYear.value = minYear.value
  updateDisplayedArtifacts()
}

function switchView(viewId) {
  currentView.value = viewId
  if (viewId !== 'animation') {
    stopAnimation()
    isPlaying.value = false
  }
  updateDisplayedArtifacts()
  
  if (globeInstance) {
    globeInstance.setViewMode(viewId)
  }
}

onMounted(async () => {
  artifacts.value = artifactsData.map((a, i) => ({
    ...a,
    id: a.id || `artifact-${i}`,
    imageLoaded: false
  }))
  
  displayedArtifacts.value = [...artifacts.value]
  currentYear.value = minYear.value
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (globeRef.value) {
    globeInstance = new GlobeView({
      dom: globeRef.value,
      onPointClick: (artifact) => {
        currentArtifact.value = artifact
      }
    })
    
    try {
      await globeInstance.init()
      globeInstance.updatePoints(displayedArtifacts.value)
    } catch (e) {
      console.error('Failed to initialize globe:', e)
    }
  }
  
  isLoaded.value = true
})

onUnmounted(() => {
  stopAnimation()
  if (globeInstance) {
    globeInstance.destroy()
  }
})

watch(displayedArtifacts, (newVal) => {
  if (globeInstance) {
    globeInstance.updatePoints(newVal)
  }
})
</script>
