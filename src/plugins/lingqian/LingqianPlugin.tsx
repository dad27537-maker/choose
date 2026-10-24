import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, ChevronRight, CircleHelp, Clock3, Copy, Feather, Hand, History, RotateCw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import * as THREE from 'three'
import type { Plugin, PluginComponentProps } from '../../types'
import { readStorage, writeStorage } from '../../storage'
import { LINGQIAN_HISTORY_KEY, type LingqianHistoryItem } from '../../activity'
import { hexagrams, linesFor, trigramImages, type FortuneTempo, type FortuneTone, type Hexagram } from './hexagrams'
import './lingqian.css'

const HISTORY_CHANGE_EVENT = 'plugin-deck:history-change'

type TopicId = 'general' | 'career' | 'relationship' | 'money' | 'study' | 'wellbeing'
type HistoryChange = { type: 'delete'; id: string } | { type: 'clear' }

const toneMeta: Record<FortuneTone, { label: string; direction: string }> = {
  great: { label: '上上签', direction: '卦势支持主动把握，但仍要按本卦所示的方法落地。' },
  good: { label: '上签', direction: '方向偏向可行，成败关键在于是否真正做到本卦的要求。' },
  balanced: { label: '平签', direction: '此卦不作简单吉凶判断，现实条件与应对方式会改变结果。' },
  caution: { label: '慎签', direction: '此刻宜先处理本卦指出的风险，再决定是否继续推进。' },
}

const tempoMeta: Record<FortuneTempo, { label: string; text: string }> = {
  now: { label: '宜行动', text: '时机已经出现。先做一个能在 24 小时内启动的动作，再以现实反馈决定下一步。' },
  steady: { label: '宜渐进', text: '把时间看作助力。以一到三个小周期推进，每个周期只校正一个关键变量。' },
  wait: { label: '宜观望', text: '暂缓不可逆的决定。先等一条关键信息、一个可靠支持，或自己的状态恢复。' },
  change: { label: '宜转化', text: '旧方式已接近临界点。为变化设定切换节点、退出条件与一个可回退的备案。' },
}

const topicMeta: Record<TopicId, { label: string; lens: string }> = {
  general: { label: '综合问事', lens: '可控因素、外部条件与选择顺序' },
  career: { label: '事业工作', lens: '职责、资源、合作关系与推进窗口' },
  relationship: { label: '感情关系', lens: '真实回应、相互边界与长期承诺' },
  money: { label: '金钱财务', lens: '本金安全、现金流、收益来源与退出条件' },
  study: { label: '学业成长', lens: '方法、反馈、基本功与持续积累' },
  wellbeing: { label: '身心状态', lens: '节律、恢复、压力来源与支持系统' },
}

const sampleQuestions = ['现在适合推进新计划吗？', '这段关系值得继续投入吗？', '我应该怎样面对眼前的变化？']

const trigramNature = {
  '乾': { image: '天', quality: '刚健', movement: '主动建立方向与原则' },
  '兑': { image: '泽', quality: '悦纳', movement: '通过交流、回应与联结打开局面' },
  '离': { image: '火', quality: '明辨', movement: '看清依附关系并使事物显现' },
  '震': { image: '雷', quality: '发动', movement: '用第一步行动打破停滞' },
  '巽': { image: '风', quality: '渗入', movement: '以持续而柔和的方式产生影响' },
  '坎': { image: '水', quality: '历险', movement: '识别风险并守住可信的路径' },
  '艮': { image: '山', quality: '止定', movement: '建立边界并在应停处停下' },
  '坤': { image: '地', quality: '承载', movement: '接纳现实、整合资源并稳固基础' },
} as const

function randomInt(max: number) {
  const cryptoObject = globalThis.crypto
  if (!cryptoObject?.getRandomValues) return Math.floor(Math.random() * max)
  const range = 0x100000000
  const limit = range - (range % max)
  const values = new Uint32Array(1)
  do cryptoObject.getRandomValues(values)
  while (values[0] >= limit)
  return values[0] % max
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${randomInt(1_000_000)}`
}

function hexagramFor(number: number) {
  return hexagrams[number - 1] ?? hexagrams[0]
}

function topicFor(question: string): TopicId {
  const rules: Array<[TopicId, RegExp]> = [
    ['relationship', /感情|恋爱|爱情|婚姻|复合|对方|男朋友|女朋友|关系/],
    ['money', /钱|财|投资|股|基金|生意|买房|卖房|收入|贷款/],
    ['career', /工作|事业|职场|项目|跳槽|创业|公司|合作|面试/],
    ['study', /学业|考试|学习|留学|申请|论文|升学|课程/],
    ['wellbeing', /健康|身体|情绪|睡眠|焦虑|抑郁|压力|病/],
  ]
  return rules.find(([, pattern]) => pattern.test(question))?.[0] ?? 'general'
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function HexagramMark({ hexagram, compact = false }: { hexagram: Hexagram; compact?: boolean }) {
  const lines = [...linesFor(hexagram)].reverse()
  return <div className={`hexagram-mark ${compact ? 'is-compact' : ''}`} aria-label={`${hexagram.fullName}，上${trigramImages[hexagram.upper]}下${trigramImages[hexagram.lower]}`}>
    {lines.map((yang, index) => <span className={yang ? 'yang' : 'yin'} key={`${yang}-${index}`}>{yang ? <i /> : <><i /><i /></>}</span>)}
  </div>
}

type FortuneSceneProps = {
  shaking: boolean
  selectedNumber?: number
  canDraw: boolean
  onDraw: () => void
  onNeedQuestion: () => void
  onHoldingChange: (holding: boolean) => void
}

function FortuneTubeScene({ shaking, selectedNumber, canDraw, onDraw, onNeedQuestion, onHoldingChange }: FortuneSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const startMotionRef = useRef<((number: number) => void) | null>(null)
  const canDrawRef = useRef(canDraw)
  const onDrawRef = useRef(onDraw)
  const onNeedQuestionRef = useRef(onNeedQuestion)
  const onHoldingChangeRef = useRef(onHoldingChange)
  canDrawRef.current = canDraw
  onDrawRef.current = onDraw
  onNeedQuestionRef.current = onNeedQuestion
  onHoldingChangeRef.current = onHoldingChange

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.96
    renderer.domElement.style.touchAction = 'none'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50)
    camera.position.set(0, 2.42, 5.85)
    camera.lookAt(0, 0.05, 0)
    scene.add(new THREE.HemisphereLight(0xffe6be, 0x260805, 2.2))
    const key = new THREE.DirectionalLight(0xffd294, 4.7)
    key.position.set(-3.2, 5.3, 4.2)
    scene.add(key)
    const rimLight = new THREE.PointLight(0xe54b2f, 5.2, 8)
    rimLight.position.set(2.8, 1.3, 2.6)
    scene.add(rimLight)
    const interiorLight = new THREE.PointLight(0xffb45d, 2.2, 4)
    interiorLight.position.set(-0.8, 2.1, 0.2)
    scene.add(interiorLight)

    const assembly = new THREE.Group()
    assembly.position.y = -0.05
    scene.add(assembly)

    const outerMaterial = new THREE.MeshPhysicalMaterial({ color: 0x7f2018, roughness: 0.31, metalness: 0.03, clearcoat: 0.82, clearcoatRoughness: 0.18, side: THREE.DoubleSide })
    const innerMaterial = new THREE.MeshStandardMaterial({ color: 0x3c0b08, roughness: 0.72, side: THREE.BackSide })
    const goldMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc28b3d, roughness: 0.27, metalness: 0.58, clearcoat: 0.55 })
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x230604, roughness: 1, side: THREE.DoubleSide })
    const woodMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd3a064, roughness: 0.6, metalness: 0, clearcoat: 0.12 })
    const tipMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9d281f, roughness: 0.39, clearcoat: 0.55 })

    const outerGeometry = new THREE.CylinderGeometry(1.13, 0.97, 2.3, 64, 1, true)
    const innerGeometry = new THREE.CylinderGeometry(1.045, 0.9, 2.15, 64, 1, true)
    const bottomGeometry = new THREE.CylinderGeometry(0.98, 0.92, 0.13, 64)
    const mouthGeometry = new THREE.CircleGeometry(1.04, 64)
    const rimGeometry = new THREE.TorusGeometry(1.14, 0.085, 16, 64)
    const footGeometry = new THREE.TorusGeometry(0.96, 0.045, 10, 64)
    const stickGeometry = new THREE.BoxGeometry(0.052, 2.8, 0.052)
    const tipGeometry = new THREE.BoxGeometry(0.06, 0.31, 0.06)

    const outer = new THREE.Mesh(outerGeometry, outerMaterial)
    const inner = new THREE.Mesh(innerGeometry, innerMaterial)
    const bottom = new THREE.Mesh(bottomGeometry, outerMaterial)
    bottom.position.y = -1.16
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial)
    mouth.rotation.x = -Math.PI / 2
    mouth.position.y = 1.075
    const rim = new THREE.Mesh(rimGeometry, goldMaterial)
    rim.rotation.x = Math.PI / 2
    rim.position.y = 1.15
    const foot = new THREE.Mesh(footGeometry, goldMaterial)
    foot.rotation.x = Math.PI / 2
    foot.position.y = -1.12
    assembly.add(inner, mouth)

    type StickBody = { group: THREE.Group; basePosition: THREE.Vector3; baseRotation: THREE.Euler; phase: number }
    const sticks: StickBody[] = []
    for (let index = 0; index < 64; index += 1) {
      const angle = index * 2.399963229728653
      const radius = 0.76 * Math.sqrt((index + 0.6) / 64)
      const group = new THREE.Group()
      const body = new THREE.Mesh(stickGeometry, woodMaterial)
      const tip = new THREE.Mesh(tipGeometry, tipMaterial)
      tip.position.y = 1.245
      group.add(body, tip)
      const basePosition = new THREE.Vector3(Math.cos(angle) * radius, 0.25 + ((index * 11) % 9 - 4) * 0.012, Math.sin(angle) * radius)
      const baseRotation = new THREE.Euler(Math.sin(index * 1.7) * 0.048, 0, Math.cos(index * 1.23) * 0.068)
      group.position.copy(basePosition)
      group.rotation.copy(baseRotation)
      sticks.push({ group, basePosition, baseRotation, phase: (index * 0.61803398875) % 1 })
      assembly.add(group)
    }
    // The opaque wall is added after the sticks; the depth buffer, not DOM
    // layering, hides every lower shaft physically inside the cylinder.
    assembly.add(outer, bottom, rim, foot)

    const makeSealTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const context = canvas.getContext('2d')
      if (context) {
        context.clearRect(0, 0, 1024, 1024)
        context.strokeStyle = '#e2b969'
        context.lineWidth = 28
        context.beginPath()
        context.arc(512, 512, 410, 0, Math.PI * 2)
        context.stroke()
        context.strokeStyle = 'rgba(226,185,105,.52)'
        context.lineWidth = 8
        context.beginPath()
        context.arc(512, 512, 338, 0, Math.PI * 2)
        context.stroke()
        context.fillStyle = '#f1d38a'
        context.font = 'bold 456px "Microsoft YaHei", serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText('易', 512, 540)
      }
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.generateMipmaps = false
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      return texture
    }
    const sealTexture = makeSealTexture()
    const sealMaterial = new THREE.MeshBasicMaterial({ map: sealTexture, transparent: true, depthWrite: false })
    const sealGeometry = new THREE.PlaneGeometry(0.78, 0.78)
    const seal = new THREE.Mesh(sealGeometry, sealMaterial)
    // Keep the seal just in front of the curved wall so the full character
    // remains readable instead of being depth-occluded by the tube.
    seal.position.set(0, -0.12, 1.19)
    assembly.add(seal)

    const shadowGeometry = new THREE.CircleGeometry(1.52, 64)
    const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x090100, transparent: true, opacity: 0.48, depthWrite: false })
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    shadow.rotation.x = -Math.PI / 2
    shadow.scale.y = 0.38
    shadow.position.set(0, -1.23, 0.15)
    scene.add(shadow)

    let activeIndex = -1
    let motionStarted = 0
    let mode: 'idle' | 'dragging' | 'shaking' | 'landed' = 'idle'
    let labelMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | undefined
    let labelTexture: THREE.CanvasTexture | undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const clearLabel = () => {
      if (labelMesh) {
        labelMesh.parent?.remove(labelMesh)
        labelMesh.geometry.dispose()
        labelMesh.material.dispose()
        labelMesh = undefined
      }
      labelTexture?.dispose()
      labelTexture = undefined
    }
    const resetActiveStick = () => {
      if (activeIndex >= 0) {
        const body = sticks[activeIndex]
        body.group.position.copy(body.basePosition)
        body.group.rotation.copy(body.baseRotation)
        body.group.scale.set(1, 1, 1)
      }
      clearLabel()
      activeIndex = -1
    }
    const attachNumberLabel = (number: number, body: StickBody) => {
      const canvas = document.createElement('canvas')
      canvas.width = 480
      canvas.height = 1600
      const context = canvas.getContext('2d')
      if (context) {
        context.fillStyle = '#8f2119'
        context.fillRect(14, 14, 452, 1572)
        context.strokeStyle = '#e7c47b'
        context.lineWidth = 12
        context.strokeRect(24, 24, 432, 1552)
        context.fillStyle = '#ffe2a2'
        context.font = `bold ${String(number).length > 1 ? 300 : 330}px "Microsoft YaHei", serif`
        context.textAlign = 'center'
        context.fillText(String(number), 240, 660)
        context.font = 'bold 220px "Microsoft YaHei", serif'
        context.fillText('签', 240, 1030)
      }
      labelTexture = new THREE.CanvasTexture(canvas)
      labelTexture.colorSpace = THREE.SRGBColorSpace
      labelTexture.generateMipmaps = false
      labelTexture.minFilter = THREE.LinearFilter
      labelTexture.magFilter = THREE.LinearFilter
      const material = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide })
      labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.72), material)
      labelMesh.position.set(0, 0.5, 0.034)
      body.group.add(labelMesh)
    }

    const startMotion = (number: number) => {
      resetActiveStick()
      activeIndex = Math.max(0, Math.min(63, number - 1))
      const selected = sticks[activeIndex]
      selected.group.position.copy(selected.basePosition)
      selected.group.rotation.set(0, 0, 0)
      // A pulled stick is displayed as a complete, readable object in front
      // of the tube rather than a thin half-hidden shaft inside the rim.
      selected.group.scale.set(1.45, 0.78, 1.45)
      attachNumberLabel(number, selected)
      motionStarted = performance.now()
      mode = 'shaking'
    }
    startMotionRef.current = startMotion

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(mount)

    let activePointer = -1
    let pointerStartX = 0
    let pointerStartY = 0
    let pointerStarted = 0
    let pointerDistance = 0
    const pointerDown = (event: PointerEvent) => {
      if (mode === 'shaking') return
      activePointer = event.pointerId
      pointerStartX = event.clientX
      pointerStartY = event.clientY
      pointerStarted = performance.now()
      pointerDistance = 0
      mode = 'dragging'
      renderer.domElement.setPointerCapture(event.pointerId)
      mount.classList.add('is-grabbing')
      onHoldingChangeRef.current(true)
    }
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointer || mode !== 'dragging') return
      const dx = event.clientX - pointerStartX
      const dy = event.clientY - pointerStartY
      pointerDistance = Math.max(pointerDistance, Math.hypot(dx, dy))
      assembly.rotation.z = THREE.MathUtils.clamp(dx / 260, -0.23, 0.23)
      assembly.rotation.x = THREE.MathUtils.clamp(-dy / 420, -0.11, 0.11)
      assembly.position.x = THREE.MathUtils.clamp(dx / 900, -0.12, 0.12)
    }
    const pointerUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return
      const heldFor = performance.now() - pointerStarted
      activePointer = -1
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId)
      mount.classList.remove('is-grabbing')
      onHoldingChangeRef.current(false)
      mode = activeIndex >= 0 ? 'landed' : 'idle'
      if (pointerDistance > 22 || heldFor > 360) (canDrawRef.current ? onDrawRef.current : onNeedQuestionRef.current)()
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    renderer.domElement.addEventListener('pointercancel', pointerUp)

    const timer = new THREE.Timer()
    timer.connect(document)
    let animationFrame = 0
    const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
    const smoothstep = (value: number) => {
      const clamped = THREE.MathUtils.clamp(value, 0, 1)
      return clamped * clamped * (3 - 2 * clamped)
    }
    const render = (timestamp?: number) => {
      animationFrame = window.requestAnimationFrame(render)
      timer.update(timestamp)
      const now = performance.now()
      const idleTime = timer.getElapsed()

      if (mode === 'shaking') {
        const duration = reducedMotion ? 420 : 1750
        const progress = THREE.MathUtils.clamp((now - motionStarted) / duration, 0, 1)
        const startEnvelope = Math.min(1, progress / 0.08)
        const endEnvelope = 1 - smoothstep((progress - 0.58) / 0.26)
        const envelope = startEnvelope * endEnvelope
        assembly.rotation.z = Math.sin(progress * 92) * 0.17 * envelope + Math.sin(progress * 37) * 0.035 * envelope
        assembly.rotation.x = Math.cos(progress * 67) * 0.055 * envelope
        assembly.position.x = Math.sin(progress * 83) * 0.075 * envelope
        assembly.position.y = -0.05 + Math.abs(Math.sin(progress * 49)) * 0.045 * envelope

        sticks.forEach((body, index) => {
          const lag = Math.sin(progress * 88 + body.phase * Math.PI * 2)
          const bounce = Math.abs(Math.sin(progress * 72 + body.phase * 8))
          body.group.position.x = body.basePosition.x - assembly.rotation.z * body.basePosition.y * 0.16 + lag * 0.012 * envelope
          body.group.position.y = body.basePosition.y + bounce * (0.035 + body.phase * 0.025) * envelope
          body.group.position.z = body.basePosition.z + Math.cos(progress * 73 + body.phase * 7) * 0.012 * envelope
          body.group.rotation.x = body.baseRotation.x - assembly.rotation.x * 0.32
          body.group.rotation.z = body.baseRotation.z - assembly.rotation.z * 0.34 + lag * 0.012 * envelope
          if (index !== activeIndex || progress <= 0.48) return
          const flight = THREE.MathUtils.clamp((progress - 0.48) / 0.52, 0, 1)
          if (flight < 0.6) {
            const rise = easeOutCubic(flight / 0.6)
            // Bring the chosen stick straight up through the mouth, then
            // move it toward the camera's optical center. Keeping the final
            // x/z inside this central safe zone avoids clipping through the
            // card edge on narrow viewports.
            body.group.position.x = THREE.MathUtils.lerp(body.basePosition.x, 0, rise)
            body.group.position.y = THREE.MathUtils.lerp(body.basePosition.y, 0.28, rise)
            body.group.position.z = THREE.MathUtils.lerp(body.basePosition.z, 1.55, rise)
            body.group.rotation.set(0, 0, THREE.MathUtils.lerp(0, 0.025, rise))
          } else {
            const land = smoothstep((flight - 0.6) / 0.4)
            body.group.position.x = THREE.MathUtils.lerp(0, 0, land)
            body.group.position.y = THREE.MathUtils.lerp(0.28, 0.28, land)
            body.group.position.z = THREE.MathUtils.lerp(1.55, 1.55, land)
            body.group.rotation.set(0, 0, THREE.MathUtils.lerp(0.025, 0.025, land))
          }
        })

        if (progress >= 1) {
          mode = 'landed'
          assembly.rotation.set(0, 0, 0)
          assembly.position.set(0, -0.05, 0)
          sticks.forEach((body, index) => {
            if (index === activeIndex) return
            body.group.position.copy(body.basePosition)
            body.group.rotation.copy(body.baseRotation)
          })
          const selected = sticks[activeIndex]
          selected.group.position.set(0, 0.28, 1.55)
          selected.group.rotation.set(0, 0, 0.025)
        }
      } else if (mode !== 'dragging') {
        assembly.rotation.x *= 0.86
        assembly.rotation.z *= 0.86
        assembly.position.x *= 0.86
        assembly.position.y = THREE.MathUtils.lerp(assembly.position.y, -0.05 + Math.sin(idleTime * 1.25) * 0.006, 0.08)
      }

      shadow.scale.x = 1 + Math.abs(assembly.rotation.z) * 0.4
      renderer.render(scene, camera)
    }
    render()

    return () => {
      startMotionRef.current = null
      window.cancelAnimationFrame(animationFrame)
      observer?.disconnect()
      renderer.domElement.removeEventListener('pointerdown', pointerDown)
      renderer.domElement.removeEventListener('pointermove', pointerMove)
      renderer.domElement.removeEventListener('pointerup', pointerUp)
      renderer.domElement.removeEventListener('pointercancel', pointerUp)
      clearLabel()
      timer.dispose()
      sealTexture.dispose()
      ;[outerGeometry, innerGeometry, bottomGeometry, mouthGeometry, rimGeometry, footGeometry, stickGeometry, tipGeometry, sealGeometry, shadowGeometry].forEach((geometry) => geometry.dispose())
      ;[outerMaterial, innerMaterial, goldMaterial, mouthMaterial, woodMaterial, tipMaterial, sealMaterial, shadowMaterial].forEach((material) => material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    if (shaking && selectedNumber) startMotionRef.current?.(selectedNumber)
  }, [shaking, selectedNumber])

  return <div
    className={`fortune-three ${shaking ? 'is-shaking' : ''}`}
    ref={mountRef}
    role="button"
    tabIndex={shaking ? -1 : 0}
    aria-disabled={shaking}
    aria-label="三维签筒，按住摇动后松手抽签"
    onKeyDown={(event) => { if (!shaking && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); (canDraw ? onDraw : onNeedQuestion)() } }}
  />
}

function FortuneTube({ shaking, selectedNumber, canDraw, onDraw, onNeedQuestion }: Omit<FortuneSceneProps, 'onHoldingChange'>) {
  const [holding, setHolding] = useState(false)
  return <div className={`fortune-stage fortune-stage-3d ${shaking ? 'is-shaking' : ''} ${holding ? 'is-holding' : ''}`}>
    <div className="fortune-aura" />
    <FortuneTubeScene shaking={shaking} selectedNumber={selectedNumber} canDraw={canDraw} onDraw={onDraw} onNeedQuestion={onNeedQuestion} onHoldingChange={setHolding} />
    {selectedNumber && !shaking && <div className="fortune-selected-caption"><span>第 {selectedNumber} 签</span>已落定</div>}
    <div className="fortune-gesture-hint"><Hand size={14} /><span>{shaking ? '筒身倾转 · 群签碰撞 · 一签跃出' : holding ? '继续摇动，松手起签' : '按住真实摇筒 · 松手起签'}</span></div>
  </div>
}

function structureReading(hexagram: Hexagram) {
  const upper = trigramNature[hexagram.upper]
  const lower = trigramNature[hexagram.lower]
  if (hexagram.upper === hexagram.lower) {
    return `内外皆为${upper.image}，取“${upper.quality}”之性。${hexagram.fullName}强调从内在动机到外在做法都要一致：${upper.movement}。`
  }
  return `外卦为${upper.image}，主${upper.quality}，表示局势如何向外展开；内卦为${lower.image}，主${lower.quality}，表示你当下的内在基础。二者相遇成${hexagram.fullName}：外在要${upper.movement}，内在则要${lower.movement}。`
}

function questionReading(hexagram: Hexagram, topic: (typeof topicMeta)[TopicId], tone: (typeof toneMeta)[FortuneTone]) {
  return `放到${topic.label}的“${topic.lens}”上，本卦把判断轴放在「${hexagram.keywords.join('、')}」。${tone.direction}先确认“${hexagram.keywords[0]}”是否已成为现实条件，再决定怎样运用“${hexagram.keywords[1]}”，最终落到“${hexagram.keywords[2]}”。`
}

function timingReading(hexagram: Hexagram, tempo: (typeof tempoMeta)[FortuneTempo]) {
  return `${tempo.text}对${hexagram.fullName}而言，窗口是否真正打开，要看现实中是否同时出现「${hexagram.keywords[0]}」与「${hexagram.keywords[1]}」；若只出现其一，仍应保留余地。`
}

function verificationReading(hexagram: Hexagram) {
  const prefix: Record<FortuneTone, string> = {
    great: '若接下来连续出现正向回应，',
    good: '若现实反馈逐步稳定，',
    balanced: '若支持与阻力仍然并存，',
    caution: '只有当主要风险明显下降，',
  }
  return `${prefix[hexagram.tone]}并且你能用具体事实说明「${hexagram.keywords[0]}」正在形成，才算与本卦同向。反之，应先回到这条提醒：${hexagram.warning}`
}

function reflectionPrompt(hexagram: Hexagram, question: string) {
  return `回到“${question}”：在「${hexagram.keywords.join('、')}」三项中，哪一项现在最缺席，却最可能改变事情的走向？`
}

function Reading({ result, hexagram, onCopy, copied }: { result: LingqianHistoryItem; hexagram: Hexagram; onCopy: () => void; copied: boolean }) {
  const topic = topicMeta[topicFor(result.question)]
  const tone = toneMeta[hexagram.tone]
  const tempo = tempoMeta[hexagram.tempo]
  const symbol = String.fromCodePoint(0x4dc0 + hexagram.number - 1)
  return <div className={`reading-content tone-${hexagram.tone}`}>
    <div className="reading-topline"><span>{topic.label} · 第 {hexagram.number} 签</span><button onClick={onCopy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? '已复制' : '复制解卦'}</button></div>
    <div className="reading-hero">
      <div className="reading-symbol" aria-hidden="true">{symbol}</div>
      <HexagramMark hexagram={hexagram} />
      <div className="reading-title"><span>{tone.label}</span><h2>{hexagram.fullName}</h2><p>上{trigramImages[hexagram.upper]} · 下{trigramImages[hexagram.lower]} · {hexagram.keywords.join(' · ')}</p></div>
    </div>
    <div className="reading-question"><CircleHelp size={15} /><div><span>你所问之事</span><p>{result.question}</p></div></div>
    <section className="reading-overview"><div className="reading-section-heading"><BookOpen size={16} /><span>本卦主旨</span></div><strong>{hexagram.fullName} · {hexagram.keywords.join(' · ')}</strong><p>{hexagram.meaning}</p><div className="reading-direction">{tone.direction}</div></section>
    <div className="reading-detail-grid">
      <section><span className="reading-index">01</span><div><strong>卦象结构 · 上{trigramImages[hexagram.upper]}下{trigramImages[hexagram.lower]}</strong><p>{structureReading(hexagram)}</p></div></section>
      <section><span className="reading-index">02</span><div><strong>对应所问 · {topic.label}</strong><p>{questionReading(hexagram, topic, tone)}</p></div></section>
      <section><span className="reading-index">03</span><div><strong>行动方法 · {hexagram.keywords[1]}</strong><p>{hexagram.action}</p></div></section>
      <section><span className="reading-index">04</span><div><strong>时机判断 · {tempo.label}</strong><p>{timingReading(hexagram, tempo)}</p></div></section>
      <section><span className="reading-index">05</span><div><strong>本卦避忌</strong><p>{hexagram.warning}</p></div></section>
      <section><span className="reading-index">06</span><div><strong>现实核验信号</strong><p>{verificationReading(hexagram)}</p></div></section>
    </div>
    <div className="reading-reflection"><Feather size={17} /><div><span>本卦留给你的一问</span><p>{reflectionPrompt(hexagram, result.question)}</p></div></div>
    <p className="reading-disclaimer">卦签是传统文化中的自省工具，解读仅供灵感参考，不代替医疗、法律、财务或其他专业意见。</p>
  </div>
}

export function LingqianView({ onActivity, newSessionToken }: PluginComponentProps) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<LingqianHistoryItem>()
  const [history, setHistory] = useState<LingqianHistoryItem[]>(() => readStorage(LINGQIAN_HISTORY_KEY, []))
  const [shaking, setShaking] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<number>()
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)
  const historyRef = useRef(history)
  historyRef.current = history
  const selectedHexagram = useMemo(() => result ? hexagramFor(result.number) : undefined, [result])

  useEffect(() => writeStorage(LINGQIAN_HISTORY_KEY, history), [history])
  useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current) }, [])
  useEffect(() => {
    if (!newSessionToken) return
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setQuestion('')
    setResult(undefined)
    setSelectedNumber(undefined)
    setShaking(false)
    setNotice('')
  }, [newSessionToken])
  useEffect(() => {
    const handleHistoryChange = (event: Event) => {
      const detail = (event as CustomEvent<HistoryChange>).detail
      if (!detail) return
      if (detail.type === 'clear') {
        setHistory([])
        setResult(undefined)
      } else {
        setHistory((items) => items.filter((item) => item.id !== detail.id))
        if (result?.id === detail.id) setResult(undefined)
      }
    }
    window.addEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange)
    return () => window.removeEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange)
  }, [result?.id])

  const draw = () => {
    const asked = question.trim()
    if (!asked || shaking) {
      if (!asked) setNotice('先写下你真正想问的事。')
      return
    }
    const number = randomInt(64) + 1
    setNotice('')
    setCopied(false)
    setResult(undefined)
    setSelectedNumber(number)
    setShaking(true)
    timeoutRef.current = window.setTimeout(() => {
      const next = { id: makeId(), question: asked, number, at: new Date().toISOString() }
      const nextHistory = [next, ...historyRef.current].slice(0, 24)
      historyRef.current = nextHistory
      writeStorage(LINGQIAN_HISTORY_KEY, nextHistory)
      setResult(next)
      setHistory(nextHistory)
      setShaking(false)
      onActivity?.()
    }, 1750)
  }

  const openHistory = (item: LingqianHistoryItem) => {
    if (shaking) return
    setQuestion(item.question)
    setResult(item)
    setSelectedNumber(item.number)
    setCopied(false)
  }

  const clearHistory = () => {
    if (!history.length || !window.confirm('确定清空所有问卦记录吗？')) return
    writeStorage(LINGQIAN_HISTORY_KEY, [])
    setHistory([])
    setResult(undefined)
    onActivity?.()
  }

  const copyReading = async () => {
    if (!result || !selectedHexagram) return
    const topic = topicMeta[topicFor(result.question)]
    const tone = toneMeta[selectedHexagram.tone]
    const tempo = tempoMeta[selectedHexagram.tempo]
    const text = [
      `所问：${result.question}`,
      `签卦：第 ${selectedHexagram.number} 签 · ${selectedHexagram.fullName}（${tone.label}）`,
      `本卦主旨：${selectedHexagram.meaning}`,
      `卦象结构：${structureReading(selectedHexagram)}`,
      `所问判断：${questionReading(selectedHexagram, topic, tone)}`,
      `行动建议：${selectedHexagram.action}`,
      `时机判断：${timingReading(selectedHexagram, tempo)}`,
      `本卦避忌：${selectedHexagram.warning}`,
      `现实核验：${verificationReading(selectedHexagram)}`,
      `自问：${reflectionPrompt(selectedHexagram, result.question)}`,
      '仅作传统文化与自省参考。',
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setNotice('当前环境无法访问剪贴板。')
    }
  }

  return <section className="lingqian-page">
    <header className="conversation-header"><div className="conversation-title"><span className="app-avatar lingqian-avatar">易</span><div><strong>灵签问卦</strong><span>六十四卦签 · 互动签筒</span></div></div><div className="header-actions"><span className="secure-pill"><span />安全随机</span><button className="quiet-button" onClick={() => { setQuestion(''); setResult(undefined); setSelectedNumber(undefined); setNotice('') }} disabled={shaking}><RotateCw size={15} />新问事</button></div></header>

    <div className="lingqian-layout">
      <main className="lingqian-ritual-card">
        <div className="lingqian-intro"><p className="eyebrow">ICHING · SIXTY-FOUR LOTS</p><h1>一事一问，<br /><em>摇筒见心。</em></h1><p>写下具体的事，静心摇动签筒。六十四支卦签，会为你照见当下的重点。</p></div>
        <div className="lingqian-question"><label htmlFor="lingqian-question-input">你想问什么？</label><textarea id="lingqian-question-input" value={question} maxLength={180} onChange={(event) => { setQuestion(event.target.value); setNotice('') }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); draw() } }} placeholder="尽量聚焦一件事，例如：现在适合推进这个计划吗？" rows={3} /><div className="question-meta"><span>Enter 抽签 · Shift + Enter 换行</span><span>{question.length}/180</span></div><div className="question-examples">{sampleQuestions.map((sample) => <button key={sample} onClick={() => { setQuestion(sample); setNotice('') }}>{sample}</button>)}</div>{notice && <p className="lingqian-notice" role="alert">{notice}</p>}</div>
        <FortuneTube shaking={shaking} selectedNumber={selectedNumber} canDraw={Boolean(question.trim()) && !shaking} onDraw={draw} onNeedQuestion={() => setNotice('先写下你真正想问的事。')} />
        <button className="draw-lot-button" onClick={draw} disabled={shaking || !question.trim()}><Sparkles size={17} />{shaking ? '摇筒问卦中…' : result ? '再抽一签' : '静心摇筒'}</button>
      </main>

      <aside className="lingqian-reading-card" aria-live="polite">
        {result && selectedHexagram ? <Reading result={result} hexagram={selectedHexagram} onCopy={copyReading} copied={copied} /> : <div className={`reading-empty ${shaking ? 'is-waiting' : ''}`}><div className="empty-oracle"><span>易</span><i /></div><p>{shaking ? '心定则签定' : '等待一支卦签'}</p><span>{shaking ? '签筒正在从六十四卦中为你落下一签。' : '写下问题后，可以按住签筒摇动，或点击“静心摇筒”。'}</span><div className="empty-principles"><span><ShieldCheck size={14} />本地保存</span><span><Sparkles size={14} />六十四卦</span><span><BookOpen size={14} />五维解读</span></div></div>}
      </aside>
    </div>

    <section className="lingqian-history"><div className="history-heading"><div><History size={16} /><div><strong>近期问卦</strong><span>只保存在当前设备</span></div></div>{history.length > 0 && <button onClick={clearHistory}><Trash2 size={14} />清空</button>}</div>{history.length ? <div className="lingqian-history-list">{history.slice(0, 6).map((item) => { const hexagram = hexagramFor(item.number); return <button key={item.id} className={result?.id === item.id ? 'active' : ''} onClick={() => openHistory(item)}><HexagramMark hexagram={hexagram} compact /><span><strong>{hexagram.fullName} · 第{item.number}签</strong><small>{item.question}</small></span><time><Clock3 size={11} />{formatTime(item.at)}</time><ChevronRight size={15} /></button> })}</div> : <p className="history-empty">你的卦签会出现在这里。</p>}</section>
  </section>
}

export const LingqianPlugin: Plugin = {
  id: 'divination.lingqian',
  name: '灵签问卦',
  description: '输入所问之事，互动摇筒抽取六十四卦签并获得详细解读。',
  icon: '易',
  version: '1.1.0',
  apiVersion: '1',
  entryPoint: 'src/plugins/lingqian/LingqianPlugin.tsx',
  capabilities: ['3D 真实签筒', '六十四卦', '逐卦详解', '本地历史'],
  accent: 'amber',
  component: LingqianView,
}
