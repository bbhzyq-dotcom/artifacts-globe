import earthFlyLine from 'earth-flyline'
import worldMapData from '../data/world.json'

export default class GlobeView {
  constructor(options) {
    this.dom = options.dom
    this.onPointClick = options.onPointClick || (() => {})
    this.chart = null
    this.currentPoints = []
    this.currentViewMode = 'animation'
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        earthFlyLine.registerMap('world', worldMapData)
        
        this.chart = earthFlyLine.init({
          dom: this.dom,
          map: 'world',
          config: {
            R: 100,
            earth: {
              color: '#13162c'
            },
            mapStyle: {
              areaColor: '#2e3564',
              lineColor: '#4a5fc9'
            },
            spriteStyle: {
              color: '#c9a227',
              show: true
            },
            scatterStyle: {
              color: '#c9a227',
              size: 3
            },
            bgStyle: {
              color: '#0a0a1a',
              opacity: 1
            }
          },
          autoRotate: true,
          rotateSpeed: 0.005
        })

        this.chart.on('click', (event, params) => {
          if (params && params.userData) {
            this.onPointClick(params.userData)
          }
        })

        resolve()
      } catch (e) {
        console.error('GlobeView init error:', e)
        reject(e)
      }
    })
  }

  updatePoints(artifacts) {
    if (!this.chart) return
    
    this.chart.remove('point', 'removeAll')
    this.currentPoints = artifacts
    
    if (artifacts.length === 0) return

    const pointData = artifacts.map(artifact => ({
      id: artifact.id,
      lon: artifact.longitude,
      lat: artifact.latitude,
      ...artifact
    }))

    this.chart.addData('point', pointData)
  }

  focusOnLocation(lat, lon) {
    if (!this.chart) return
  }

  setViewMode(mode) {
    this.currentViewMode = mode
    
    if (!this.chart) return
    
    switch (mode) {
      case 'flat':
        this.chart.remove('point', 'removeAll')
        break
      case 'standing':
      case 'particles':
      case 'animation':
        this.updatePoints(this.currentPoints)
        break
    }
  }

  addFlyLine(from, to, style = {}) {
    if (!this.chart) return

    this.chart.addData('flyLine', [{
      from: {
        id: 'london',
        lon: from.lon,
        lat: from.lat
      },
      to: {
        id: to.id || `${to.lon}-${to.lat}`,
        lon: to.lon,
        lat: to.lat
      },
      style: {
        flyLineStyle: {
          color: style.color || '#e63946',
          duration: style.duration || 2000
        },
        pathStyle: {
          color: style.color || '#e63946'
        }
      }
    }])
  }

  clearFlyLines() {
    if (!this.chart) return
    this.chart.remove('flyLine', 'removeAll')
  }

  destroy() {
    if (this.chart) {
      this.chart.destory()
      this.chart = null
    }
  }
}
