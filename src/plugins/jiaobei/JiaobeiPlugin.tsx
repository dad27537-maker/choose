import { useEffect, useRef, useState } from 'react'
import { CircleHelp, Dice5, Info, RotateCw, Sparkles } from 'lucide-react'
import * as THREE from 'three'
import type { Plugin, PluginComponentProps } from '../../types'
import './jiaobei.css'

type Face = 'yang' | 'yin'
type OutcomeId = 'sheng' | 'xiao' | 'yin'
type JiaobeiResult = { left: Face; right: Face; outcome: OutcomeId }

const outcomes: Record<OutcomeId, { label: string; subtitle: string; detail: string; tone: string }> = {
  sheng: { label: '圣杯', subtitle: '一阴一阳', detail: '民俗中常被视为较明确的允准，可以顺着这个方向再走一步。', tone: 'sheng' },
  xiao: { label: '笑杯', subtitle: '两面皆阳', detail: '像是在提醒你把问题再想清楚一些，或换一种更具体的问法。', tone: 'xiao' },
  yin: { label: '阴杯', subtitle: '两面皆阴', detail: '民俗中常被视为暂不允准，先停一停，等待更合适的时机。', tone: 'yin' },
}

function randomFace(): Face {
  const values = new Uint32Array(1)
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(values)[0] % 2 === 0 ? 'yang' : 'yin'
  return Math.random() > 0.5 ? 'yang' : 'yin'
}

function tossJiaobei(): JiaobeiResult {
  const left = randomFace()
  const right = randomFace()
  const outcome: OutcomeId = left !== right ? 'sheng' : left === 'yang' ? 'xiao' : 'yin'
  return { left, right, outcome }
}

/**
 * Build the two-piece crescent used by a traditional jiaobei.  It is a
 * curved lune (outer arc + concave inner arc), not a semicircle with a flat
 * diameter.  The front strip is domed so the yang face catches a broad
 * highlight; the reverse is flat for the yin face.
 */
function createConvexJiaobeiGeometry(radius = 0.76, depth = 0.22, bulge = 0.28) {
  const segments = 52
  const widthRings = 8
  const startAngle = (64 * Math.PI) / 180
  const sweep = (232 * Math.PI) / 180
  const control = { x: radius * 0.18, y: 0 }
  const top = { x: radius * Math.cos(startAngle), y: radius * Math.sin(startAngle) }
  const bottomAngle = startAngle + sweep
  const bottom = { x: radius * Math.cos(bottomAngle), y: radius * Math.sin(bottomAngle) }
  const outer: Array<{ x: number; y: number }> = []
  const inner: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const theta = startAngle + sweep * t
    outer.push({ x: radius * Math.cos(theta), y: radius * Math.sin(theta) })
    const inverse = 1 - t
    // A quadratic Bézier gives the inner boundary its deep, soft concave cut.
    inner.push({
      x: inverse * inverse * top.x + 2 * inverse * t * control.x + t * t * bottom.x,
      y: inverse * inverse * top.y + 2 * inverse * t * control.y + t * t * bottom.y,
    })
  }

  const positions: number[] = []
  const indices: number[] = []
  const addVertex = (x: number, y: number, z: number) => {
    positions.push(x, y, z)
    return positions.length / 3 - 1
  }
  const addTriangle = (a: number, b: number, c: number) => indices.push(a, b, c)

  const front: number[][] = []
  for (let i = 0; i <= segments; i += 1) {
    const row: number[] = []
    const tip = Math.sin((i / segments) * Math.PI)
    for (let ring = 0; ring <= widthRings; ring += 1) {
      const across = ring / widthRings
      const point = {
        x: outer[i].x * (1 - across) + inner[i].x * across,
        y: outer[i].y * (1 - across) + inner[i].y * across,
      }
      const dome = bulge * tip * Math.sin(across * Math.PI)
      row.push(addVertex(point.x, point.y, depth / 2 + dome))
    }
    front.push(row)
  }
  const frontStart = indices.length
  for (let i = 0; i < segments; i += 1) {
    for (let ring = 0; ring < widthRings; ring += 1) {
      const a = front[i][ring]
      const b = front[i + 1][ring]
      const c = front[i + 1][ring + 1]
      const d = front[i][ring + 1]
      addTriangle(a, b, c)
      addTriangle(a, c, d)
    }
  }
  const frontCount = indices.length - frontStart

  const back: number[][] = []
  for (let i = 0; i <= segments; i += 1) {
    const row: number[] = []
    for (let ring = 0; ring <= widthRings; ring += 1) {
      const across = ring / widthRings
      const point = {
        x: outer[i].x * (1 - across) + inner[i].x * across,
        y: outer[i].y * (1 - across) + inner[i].y * across,
      }
      row.push(addVertex(point.x, point.y, -depth / 2))
    }
    back.push(row)
  }
  const backStart = indices.length
  for (let i = 0; i < segments; i += 1) {
    for (let ring = 0; ring < widthRings; ring += 1) {
      const a = back[i][ring]
      const b = back[i][ring + 1]
      const c = back[i + 1][ring + 1]
      const d = back[i + 1][ring]
      addTriangle(a, b, c)
      addTriangle(a, c, d)
    }
  }
  const backCount = indices.length - backStart

  const sideStart = indices.length
  // Cap the outer and inner curved rims.  Their different normals create the
  // dark red edge visible in the reference image.
  for (let i = 0; i < segments; i += 1) {
    const outerFrontA = front[i][0]
    const outerFrontB = front[i + 1][0]
    const outerBackA = back[i][0]
    const outerBackB = back[i + 1][0]
    addTriangle(outerFrontA, outerBackA, outerBackB)
    addTriangle(outerFrontA, outerBackB, outerFrontB)

    const innerFrontA = front[i][widthRings]
    const innerFrontB = front[i + 1][widthRings]
    const innerBackA = back[i][widthRings]
    const innerBackB = back[i + 1][widthRings]
    addTriangle(innerFrontA, innerFrontB, innerBackB)
    addTriangle(innerFrontA, innerBackB, innerBackA)
  }
  const sideCount = indices.length - sideStart

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.addGroup(frontStart, frontCount, 0)
  geometry.addGroup(backStart, backCount, 2)
  geometry.addGroup(sideStart, sideCount, 1)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

type ThrowRequest = { id: number; result: JiaobeiResult }

type JiaobeiSceneProps = {
  rolling: boolean
  throwRequest: ThrowRequest | null
  canThrow: boolean
  onManualThrow: (result: JiaobeiResult) => void
  onNeedQuestion: () => void
  onSettled: (result: JiaobeiResult) => void
}

function JiaobeiScene({ rolling, throwRequest, canThrow, onManualThrow, onNeedQuestion, onSettled }: JiaobeiSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const canThrowRef = useRef(canThrow)
  const onManualThrowRef = useRef(onManualThrow)
  const onNeedQuestionRef = useRef(onNeedQuestion)
  const onSettledRef = useRef(onSettled)
  const startThrowRef = useRef<((result: JiaobeiResult, gesture?: THREE.Vector2) => void) | null>(null)
  canThrowRef.current = canThrow
  onManualThrowRef.current = onManualThrow
  onNeedQuestionRef.current = onNeedQuestion
  onSettledRef.current = onSettled

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    renderer.domElement.style.touchAction = 'none'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 1.65, 5.15)
    camera.lookAt(0, -0.18, 0)
    scene.add(new THREE.HemisphereLight(0xffeee0, 0x29080d, 2.35))
    const keyLight = new THREE.DirectionalLight(0xffdfc4, 4.8)
    keyLight.position.set(-3.4, 4.8, 4.4)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0xff3c52, 2.7, 8)
    rimLight.position.set(2.9, 1.35, 3)
    scene.add(rimLight)
    const fillLight = new THREE.PointLight(0xffb36b, 1.8, 7)
    fillLight.position.set(-2.2, -0.1, 2.5)
    scene.add(fillLight)

    const restingQuaternion = (face: Face, yaw: number) => {
      const turnOnGround = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
      const faceUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), face === 'yang' ? -Math.PI / 2 : Math.PI / 2)
      return turnOnGround.multiply(faceUp)
    }

    const geometry = createConvexJiaobeiGeometry()
    const convexMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc92127, roughness: 0.18, metalness: 0.02, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide })
    const edgeMaterial = new THREE.MeshPhysicalMaterial({ color: 0x701319, roughness: 0.3, metalness: 0.01, clearcoat: 0.82, clearcoatRoughness: 0.16, side: THREE.DoubleSide })
    const flatMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa91820, roughness: 0.36, metalness: 0.01, clearcoat: 0.68, clearcoatRoughness: 0.22, side: THREE.DoubleSide })
    const left = new THREE.Mesh(geometry, [convexMaterial, edgeMaterial, flatMaterial])
    const right = new THREE.Mesh(geometry, [convexMaterial, edgeMaterial, flatMaterial])
    left.position.set(-0.72, -0.46, 0)
    right.position.set(0.72, -0.2, 0.12)
    right.scale.x = -1
    left.quaternion.copy(restingQuaternion('yang', 0.05))
    right.quaternion.copy(restingQuaternion('yin', -0.62))
    scene.add(left, right)

    const shadowGeometry = new THREE.CircleGeometry(0.72, 48)
    const makeShadow = () => {
      const material = new THREE.MeshBasicMaterial({ color: 0x4b1117, transparent: true, opacity: 0.2, depthWrite: false })
      const shadow = new THREE.Mesh(shadowGeometry, material)
      shadow.rotation.x = -Math.PI / 2
      shadow.position.y = -0.595
      shadow.scale.set(1, 0.36, 1)
      scene.add(shadow)
      return shadow
    }
    const leftShadow = makeShadow()
    const rightShadow = makeShadow()

    type Body = {
      mesh: THREE.Mesh
      shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>
      velocity: THREE.Vector3
      angular: THREE.Vector3
      targetPosition: THREE.Vector3
      targetQuaternion: THREE.Quaternion
      bounces: number
      grounded: boolean
    }
    const bodies: Body[] = [
      { mesh: left, shadow: leftShadow, velocity: new THREE.Vector3(), angular: new THREE.Vector3(), targetPosition: left.position.clone(), targetQuaternion: left.quaternion.clone(), bounces: 0, grounded: true },
      { mesh: right, shadow: rightShadow, velocity: new THREE.Vector3(), angular: new THREE.Vector3(), targetPosition: right.position.clone(), targetQuaternion: right.quaternion.clone(), bounces: 0, grounded: true },
    ]

    type MotionMode = 'idle' | 'dragging' | 'flight' | 'settling'
    let mode: MotionMode = 'idle'
    let activeResult: JiaobeiResult | undefined
    let settleStarted = 0
    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)
    const restHeight = (face: Face) => face === 'yang' ? -0.46 : -0.2

    const prepareLanding = (now: number) => {
      if (!activeResult) return
      mode = 'settling'
      settleStarted = now
      const faces: Face[] = [activeResult.left, activeResult.right]
      bodies.forEach((body, index) => {
        const face = faces[index]
        const targetX = (index === 0 ? -0.72 : 0.72) + randomBetween(-0.08, 0.08)
        const targetZ = (index === 0 ? -0.03 : 0.12) + randomBetween(-0.08, 0.08)
        body.targetPosition.set(targetX, restHeight(face), targetZ)
        body.targetQuaternion.copy(restingQuaternion(face, index === 0 ? randomBetween(-0.16, 0.16) : randomBetween(-0.76, -0.48)))
      })
    }

    const startThrow = (nextResult: JiaobeiResult, gesture?: THREE.Vector2) => {
      if (mode === 'flight' || mode === 'settling') return
      activeResult = nextResult
      mode = 'flight'
      settleStarted = 0
      mount.classList.remove('is-dragging')
      const gestureX = THREE.MathUtils.clamp(gesture?.x ?? 0, -2.4, 2.4)
      const gestureY = THREE.MathUtils.clamp(gesture?.y ?? 0, -1.8, 3.2)
      const lift = THREE.MathUtils.clamp(2.45 + gestureY * 0.14, 2.25, 2.95)
      bodies.forEach((body, index) => {
        if (!gesture) body.mesh.position.set(index === 0 ? -0.68 : 0.68, -0.18 + index * 0.04, index === 0 ? -0.04 : 0.12)
        body.mesh.position.y = Math.max(body.mesh.position.y, -0.18)
        body.velocity.set(
          gestureX * 0.34 + (index === 0 ? -0.28 : 0.28) + randomBetween(-0.14, 0.14),
          lift + randomBetween(-0.12, 0.35),
          (index === 0 ? 0.42 : -0.38) + randomBetween(-0.28, 0.28),
        )
        body.angular.set(
          randomBetween(8.5, 12.5) * (index === 0 ? 1 : -1),
          randomBetween(7.5, 11.5) * (Math.random() > 0.5 ? 1 : -1),
          randomBetween(4.5, 7.8) * (index === 0 ? -1 : 1),
        )
        body.bounces = 0
        body.grounded = false
      })
    }
    startThrowRef.current = startThrow

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

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const worldPoint = new THREE.Vector3()
    const dragOrigin = new THREE.Vector3()
    const leftOrigin = new THREE.Vector3()
    const rightOrigin = new THREE.Vector3()
    const leftQuaternion = new THREE.Quaternion()
    const rightQuaternion = new THREE.Quaternion()
    let activePointer = -1
    let dragPlaneZ = 0
    let samples: Array<{ point: THREE.Vector3; time: number }> = []

    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
    }
    const pointOnDragPlane = (event: PointerEvent) => {
      setPointer(event)
      dragPlane.set(new THREE.Vector3(0, 0, 1), -dragPlaneZ)
      return raycaster.ray.intersectPlane(dragPlane, worldPoint) ? worldPoint.clone() : null
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (mode !== 'idle') return
      setPointer(event)
      const hit = raycaster.intersectObjects([left, right], false)[0]
      if (!hit) return
      if (!canThrowRef.current) {
        onNeedQuestionRef.current()
        return
      }
      activePointer = event.pointerId
      dragPlaneZ = hit.object.position.z
      const point = pointOnDragPlane(event)
      if (!point) return
      mode = 'dragging'
      dragOrigin.copy(point)
      leftOrigin.copy(left.position)
      rightOrigin.copy(right.position)
      leftQuaternion.copy(left.quaternion)
      rightQuaternion.copy(right.quaternion)
      samples = [{ point, time: performance.now() }]
      mount.classList.add('is-dragging')
      renderer.domElement.setPointerCapture(event.pointerId)
      event.preventDefault()
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (mode !== 'dragging' || event.pointerId !== activePointer) return
      const point = pointOnDragPlane(event)
      if (!point) return
      const deltaX = THREE.MathUtils.clamp(point.x - dragOrigin.x, -0.42, 0.42)
      const deltaY = THREE.MathUtils.clamp(point.y - dragOrigin.y, 0, 0.62)
      left.position.set(leftOrigin.x + deltaX, leftOrigin.y + deltaY, leftOrigin.z + 0.08 + deltaY * 0.08)
      right.position.set(rightOrigin.x + deltaX, rightOrigin.y + deltaY, rightOrigin.z + 0.08 + deltaY * 0.08)
      const dragTurn = new THREE.Quaternion().setFromEuler(new THREE.Euler(deltaY * 0.18, deltaX * 0.16, -deltaX * 0.12))
      left.quaternion.copy(leftQuaternion).multiply(dragTurn)
      right.quaternion.copy(rightQuaternion).multiply(dragTurn)
      const now = performance.now()
      samples.push({ point, time: now })
      samples = samples.filter(sample => now - sample.time <= 180)
      event.preventDefault()
    }
    const handlePointerRelease = (event: PointerEvent) => {
      if (mode !== 'dragging' || event.pointerId !== activePointer) return
      const now = performance.now()
      const point = pointOnDragPlane(event)
      if (point) samples.push({ point, time: now })
      const recent = samples.filter(sample => now - sample.time <= 160)
      const first = recent[0] ?? samples[0]
      const last = recent[recent.length - 1] ?? first
      const seconds = Math.max((last.time - first.time) / 1000, 0.04)
      const gesture = new THREE.Vector2((last.point.x - first.point.x) / seconds, (last.point.y - first.point.y) / seconds)
      activePointer = -1
      try { renderer.domElement.releasePointerCapture(event.pointerId) } catch { /* pointer already released */ }
      const nextResult = tossJiaobei()
      onManualThrowRef.current(nextResult)
      startThrow(nextResult, gesture)
      event.preventDefault()
    }
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointermove', handlePointerMove, { passive: false })
    renderer.domElement.addEventListener('pointerup', handlePointerRelease)
    renderer.domElement.addEventListener('pointercancel', handlePointerRelease)

    let frame = 0
    let previous = performance.now()
    const animate = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      if (mode === 'flight') {
        bodies.forEach(body => {
          if (body.grounded) return
          body.velocity.y -= 6.15 * delta
          body.mesh.position.addScaledVector(body.velocity, delta)
          body.mesh.rotation.x += body.angular.x * delta
          body.mesh.rotation.y += body.angular.y * delta
          body.mesh.rotation.z += body.angular.z * delta
          body.velocity.x *= Math.exp(-0.2 * delta)
          body.velocity.z *= Math.exp(-0.28 * delta)
          if (body.mesh.position.x < -1.08 || body.mesh.position.x > 1.08) {
            body.mesh.position.x = THREE.MathUtils.clamp(body.mesh.position.x, -1.08, 1.08)
            body.velocity.x *= -0.46
            body.angular.z *= -0.78
          }
          if (body.mesh.position.z < -0.34 || body.mesh.position.z > 0.44) {
            body.mesh.position.z = THREE.MathUtils.clamp(body.mesh.position.z, -0.34, 0.44)
            body.velocity.z *= -0.42
          }
          if (body.mesh.position.y > 0.52 && body.velocity.y > 0) {
            body.mesh.position.y = 0.52
            body.velocity.y *= -0.2
          }
          if (body.mesh.position.y <= -0.25) {
            const impact = Math.max(0, -body.velocity.y)
            body.mesh.position.y = -0.25
            if (impact > 0.58 && body.bounces < 3) {
              body.velocity.y = impact * Math.max(0.2, 0.36 - body.bounces * 0.055)
              body.velocity.x *= 0.68
              body.velocity.z *= 0.7
              body.angular.multiplyScalar(0.69)
              body.angular.z += randomBetween(-1.2, 1.2)
              body.bounces += 1
            } else {
              body.velocity.set(0, 0, 0)
              body.angular.set(0, 0, 0)
              body.grounded = true
            }
          }
        })
        if (bodies.every(body => body.grounded)) prepareLanding(now)
      } else if (mode === 'settling') {
        const elapsed = (now - settleStarted) / 1000
        const positionAlpha = 1 - Math.exp(-delta * 9.5)
        const rotationAlpha = 1 - Math.exp(-delta * 8.2)
        bodies.forEach(body => {
          body.mesh.position.lerp(body.targetPosition, positionAlpha)
          body.mesh.quaternion.slerp(body.targetQuaternion, rotationAlpha)
          body.mesh.position.y += Math.abs(Math.sin(elapsed * 17)) * Math.exp(-elapsed * 5.8) * 0.045
        })
        if (elapsed > 0.98 && activeResult) {
          bodies.forEach(body => {
            body.mesh.position.copy(body.targetPosition)
            body.mesh.quaternion.copy(body.targetQuaternion)
          })
          mode = 'idle'
          const completed = activeResult
          activeResult = undefined
          onSettledRef.current(completed)
        }
      }

      bodies.forEach(body => {
        const height = Math.max(0, body.mesh.position.y + 0.42)
        body.shadow.position.x = body.mesh.position.x
        body.shadow.position.z = body.mesh.position.z
        body.shadow.scale.set(1 + height * 0.18, 0.36 + height * 0.045, 1)
        body.shadow.material.opacity = 0.22 / (1 + height * 1.25)
      })
      rimLight.intensity += ((mode === 'flight' ? 3.8 : 2.7) - rimLight.intensity) * Math.min(1, delta * 5)
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      startThrowRef.current = null
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerup', handlePointerRelease)
      renderer.domElement.removeEventListener('pointercancel', handlePointerRelease)
      geometry.dispose()
      convexMaterial.dispose()
      edgeMaterial.dispose()
      flatMaterial.dispose()
      shadowGeometry.dispose()
      leftShadow.material.dispose()
      rightShadow.material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    if (throwRequest) startThrowRef.current?.(throwRequest.result)
  }, [throwRequest])

  return <div className={`jiaobei-webgl ${rolling ? 'is-rolling' : ''}`} ref={mountRef} />
}

function JiaobeiPair({ rolling, result, throwRequest, canThrow, onManualThrow, onNeedQuestion, onSettled }: {
  rolling: boolean
  result?: JiaobeiResult
  throwRequest: ThrowRequest | null
  canThrow: boolean
  onManualThrow: (result: JiaobeiResult) => void
  onNeedQuestion: () => void
  onSettled: (result: JiaobeiResult) => void
}) {
  return <div className={`jiaobei-stage ${rolling ? 'is-rolling' : ''}`} aria-label={rolling ? '筊杯正在投掷' : result ? `筊杯结果：${outcomes[result.outcome].label}` : '等待投掷筊杯'}>
    <JiaobeiScene rolling={rolling} throwRequest={throwRequest} canThrow={canThrow} onManualThrow={onManualThrow} onNeedQuestion={onNeedQuestion} onSettled={onSettled} />
  </div>
}

export function JiaobeiView(_: PluginComponentProps) {
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<JiaobeiResult>()
  const [throwRequest, setThrowRequest] = useState<ThrowRequest | null>(null)
  const [notice, setNotice] = useState('')

  const beginThrow = (_nextResult: JiaobeiResult, allowEmptyQuestion = false) => {
    const nextQuestion = question.trim()
    if ((!nextQuestion && !allowEmptyQuestion) || rolling) {
      if (!nextQuestion) setNotice('先写下你想询问的事情。')
      return false
    }
    setNotice(nextQuestion ? '' : '未填写问题，本次结果仅作互动演示。')
    setAsked(nextQuestion || '手动互动演示')
    setResult(undefined)
    setRolling(true)
    return true
  }

  const toss = () => {
    const nextResult = tossJiaobei()
    if (!beginThrow(nextResult)) return
    setThrowRequest(previous => ({ id: (previous?.id ?? 0) + 1, result: nextResult }))
  }

  const outcome = result ? outcomes[result.outcome] : undefined

  return <section className="jiaobei-page">
    <header className="conversation-header"><div className="conversation-title"><span className="app-avatar jiaobei-avatar">卜</span><div><strong>投掷筊杯</strong><span>民俗问事工具 · 本地运行</span></div></div><div className="header-actions"><span className="secure-pill"><span />离线可用</span><button className="quiet-button" onClick={toss} disabled={rolling || !question.trim()}><RotateCw size={15} />{rolling ? '投掷中' : '再投一次'}</button></div></header>

    <div className="jiaobei-layout"><main className="jiaobei-main-card"><div className="jiaobei-intro"><p className="eyebrow">JIAOBEI · DIVINATION</p><h1>把想问的事，<br /><em>交给一对筊杯。</em></h1><p>写下一个具体的问题，静下心来投掷。结果只作民俗参考，真正的答案仍然在你的选择里。</p></div><div className="jiaobei-question"><label htmlFor="jiaobei-question-input">你想询问什么？</label><textarea id="jiaobei-question-input" value={question} onChange={(event) => { setQuestion(event.target.value); setNotice('') }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); toss() } }} placeholder="例如：这周适合开始新的计划吗？" rows={3} /><div className="jiaobei-question-footer"><span>Enter 投掷 · Shift + Enter 换行</span><button className="jiaobei-toss-button" onClick={toss} disabled={rolling || !question.trim()}><Dice5 size={18} />{rolling ? '筊杯翻滚中…' : '投掷筊杯'}</button></div>{notice && <p className="jiaobei-notice" role="alert">{notice}</p>}</div></main>
      <aside className="jiaobei-result-card"><div className="jiaobei-result-heading"><div><p className="eyebrow">TOSS RESULT</p><h2>{rolling ? '正在投掷…' : outcome?.label ?? '等待投掷'}</h2></div><Sparkles size={18} /></div><JiaobeiPair rolling={rolling} result={result} throwRequest={throwRequest} canThrow={!rolling} onManualThrow={(nextResult) => beginThrow(nextResult, true)} onNeedQuestion={() => setNotice('先结束当前投掷，再拖动筊杯。')} onSettled={(nextResult) => { setResult(nextResult); setRolling(false) }} />{outcome ? <div className={`jiaobei-result-copy tone-${outcome.tone}`}><span className="jiaobei-result-subtitle">{outcome.subtitle}</span><strong>{outcome.label}</strong><p>{outcome.detail}</p><div className="jiaobei-asked"><CircleHelp size={14} /><span>{asked}</span></div></div> : <div className="jiaobei-empty"><Info size={20} /><p>先写下问题，再点击投掷，或直接拖住筊杯后松手抛出。</p><span>一阴一阳为圣杯<br />两面皆阳为笑杯<br />两面皆阴为阴杯</span></div>}<div className="jiaobei-disclaimer">筊杯结果为传统民俗文化体验，仅供参考，不替代现实中的判断与专业意见。</div></aside>
    </div>
  </section>
}

export const JiaobeiPlugin: Plugin = {
  id: 'divination.jiaobei',
  name: '投掷筊杯',
  description: '输入想询问的事情，投掷筊杯获取民俗参考。',
  icon: '卜',
  version: '1.0.0',
  apiVersion: '1',
  entryPoint: 'src/plugins/jiaobei/JiaobeiPlugin.tsx',
  capabilities: ['问题输入', '动画投掷', '圣杯笑杯阴杯'],
  accent: 'amber',
  component: JiaobeiView,
}
