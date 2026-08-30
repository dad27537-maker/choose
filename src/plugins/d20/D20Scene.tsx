import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getD20Skin, type D20SkinId } from './skins'

type D20SceneProps = { value?: number; rolling?: boolean; interactive?: boolean; onManualThrow?: () => void; skin?: D20SkinId }

type Face = { normal: THREE.Vector3; center: THREE.Vector3 }

function createNumberTexture(value: number, skin: ReturnType<typeof getD20Skin>) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) return null
  context.clearRect(0, 0, 128, 128)
  context.font = '700 56px "Arial Narrow", "Noto Sans SC", Arial, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = skin.labelShadow
  context.shadowBlur = 2
  context.shadowOffsetY = 2
  context.strokeStyle = skin.labelStroke
  context.lineWidth = 5
  context.strokeText(String(value), 64, 64)
  context.fillStyle = skin.labelFill
  context.fillText(String(value), 64, 64)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function faceData(geometry: THREE.BufferGeometry): Face[] {
  const positions = geometry.getAttribute('position')
  const faces: Face[] = []
  for (let index = 0; index < positions.count; index += 3) {
    const first = new THREE.Vector3().fromBufferAttribute(positions, index)
    const second = new THREE.Vector3().fromBufferAttribute(positions, index + 1)
    const third = new THREE.Vector3().fromBufferAttribute(positions, index + 2)
    // Keep the face centroid at its real radius. Normalizing it here would
    // push labels toward the vertices and make them look like floating HUDs.
    const center = first.clone().add(second).add(third).multiplyScalar(1 / 3)
    const normal = center.clone().normalize()
    // Ensure every label points outwards even if the geometry winding changes.
    if (normal.dot(center) < 0) normal.negate()
    faces.push({ center, normal })
  }
  return faces
}

export function D20Scene({ value, rolling = false, interactive = false, onManualThrow, skin = 'midnight' }: D20SceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rollingRef = useRef(rolling)
  const valueRef = useRef(value)
  const interactiveRef = useRef(interactive)
  const onManualThrowRef = useRef(onManualThrow)
  const skinRef = useRef(skin)
  const [fallback, setFallback] = useState(false)

  useEffect(() => { rollingRef.current = rolling }, [rolling])
  useEffect(() => { valueRef.current = value }, [value])
  interactiveRef.current = interactive
  onManualThrowRef.current = onManualThrow
  skinRef.current = skin

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || fallback) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    } catch {
      setFallback(true)
      return
    }

    const scene = new THREE.Scene()
    const skinConfig = getD20Skin(skinRef.current)
    const camera = new THREE.PerspectiveCamera(rollingRef.current ? 44 : 30, 1, 0.1, 100)
    camera.position.set(0, 1.25, 4.65)
    const dieOrigin = new THREE.Vector3(0, 0.12, 0)
    camera.lookAt(dieOrigin)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    mount.appendChild(renderer.domElement)

    const ambient = new THREE.HemisphereLight(skinConfig.id === 'nebula' ? 0xc9d6ff : 0x9ca9d8, skinConfig.id === 'nebula' ? 0x271345 : 0x080913, skinConfig.ambient)
    scene.add(ambient)
    const keyLight = new THREE.DirectionalLight(skinConfig.id === 'nebula' ? 0xfce0ff : 0xd9e4ff, skinConfig.keyLight)
    keyLight.position.set(-3, 4, 5)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(skinConfig.id === 'nebula' ? 0x57eaff : 0x8b77ee, skinConfig.rimLight, 8)
    rimLight.position.set(2.5, -1, 3)
    scene.add(rimLight)
    const criticalLight = new THREE.PointLight(0xfff0b0, 0, 7)
    criticalLight.position.set(0, 0.65, 2.2)
    scene.add(criticalLight)

    const rawGeometry = new THREE.IcosahedronGeometry(1.08, 0)
    const geometry = rawGeometry.index ? rawGeometry.toNonIndexed() : rawGeometry
    if (geometry !== rawGeometry) rawGeometry.dispose()
    const faces = faceData(geometry)
    if (skinConfig.id === 'nebula') {
      const colors: number[] = []
      const position = geometry.getAttribute('position')
      for (let index = 0; index < position.count; index += 1) {
        const vertex = new THREE.Vector3().fromBufferAttribute(position, index).normalize()
        const hue = (0.53 + (vertex.x * 0.07 + vertex.y * 0.1 + vertex.z * 0.05) + (Math.sin(vertex.x * 8 + vertex.z * 5) + 1) * 0.045) % 1
        const color = new THREE.Color().setHSL(hue, 0.68, 0.58 + vertex.y * 0.06)
        colors.push(color.r, color.g, color.b)
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    }
    const material = new THREE.MeshPhysicalMaterial({
      color: skinConfig.body,
      roughness: skinConfig.id === 'nebula' ? 0.24 : 0.3,
      metalness: skinConfig.id === 'nebula' ? 0.38 : 0.58,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
      transmission: 0.02,
      thickness: 0.2,
      transparent: true,
      opacity: 0.95,
      flatShading: true,
      vertexColors: skinConfig.id === 'nebula',
      emissive: skinConfig.emissive,
      emissiveIntensity: skinConfig.emissiveIntensity,
    })
    const die = new THREE.Mesh(geometry, material)
    die.rotation.set(-0.2, 0.45, -0.18)
    die.scale.setScalar(1.02)
    die.position.y = 0.12
    scene.add(die)

    let starGeometry: THREE.BufferGeometry | null = null
    let starMaterial: THREE.PointsMaterial | null = null
    let starField: THREE.Points | null = null
    if (skinConfig.starOpacity > 0) {
      const starPositions: number[] = []
      faces.forEach((face, faceIndex) => {
        const reference = Math.abs(face.normal.y) > 0.85 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
        const tangent = new THREE.Vector3().crossVectors(face.normal, reference).normalize()
        const bitangent = new THREE.Vector3().crossVectors(face.normal, tangent).normalize()
        const offsetA = new THREE.Vector2(-0.13 + (faceIndex % 3) * 0.025, 0.09 - (faceIndex % 2) * 0.035)
        const offsetB = new THREE.Vector2(0.12 - (faceIndex % 2) * 0.035, -0.1 + (faceIndex % 3) * 0.02)
        for (const offset of [offsetA, offsetB]) {
          const position = face.center.clone()
            .addScaledVector(tangent, offset.x)
            .addScaledVector(bitangent, offset.y)
            .addScaledVector(face.normal, 0.028)
          starPositions.push(position.x, position.y, position.z)
        }
      })
      starGeometry = new THREE.BufferGeometry()
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
      starMaterial = new THREE.PointsMaterial({ color: skinConfig.star, size: 0.046, sizeAttenuation: true, transparent: true, opacity: skinConfig.starOpacity, depthWrite: false, blending: THREE.AdditiveBlending })
      starField = new THREE.Points(starGeometry, starMaterial)
      die.add(starField)
    }

    const shadowGeometry = new THREE.CircleGeometry(0.95, 48)
    const shadowMaterial = new THREE.MeshBasicMaterial({ color: skinConfig.shadow, transparent: true, opacity: 0.2, depthWrite: false })
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(0, -1.08, 0)
    shadow.scale.set(1.3, 0.46, 1)
    scene.add(shadow)

    // Small gold motes reproduce the brief impact burst visible when the
    // reference die lands. They stay hidden until the landing transition.
    const particleMeshes: THREE.Mesh[] = []
    const particleDirections: THREE.Vector3[] = []
    const particleGroup = new THREE.Group()
    particleGroup.visible = false
    scene.add(particleGroup)
    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2
      const direction = new THREE.Vector3(
        Math.cos(angle) * (0.56 + (index % 3) * 0.08),
        0.18 + (index % 4) * 0.08,
        Math.sin(angle) * (0.56 + (index % 2) * 0.1),
      )
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + (index % 3) * 0.008, 6, 6),
        new THREE.MeshBasicMaterial({ color: index % 3 === 0 ? 0xf4dfaa : skinConfig.spark, transparent: true, opacity: 0, depthTest: false, depthWrite: false }),
      )
      particleGroup.add(particle)
      particleMeshes.push(particle)
      particleDirections.push(direction)
    }

    const edgeGeometry = new THREE.EdgesGeometry(geometry, 1)
    const edgeMaterial = new THREE.LineBasicMaterial({ color: skinConfig.edge, transparent: true, opacity: skinConfig.edgeOpacity })
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    edges.scale.setScalar(1.004)
    die.add(edges)

    const labelTextures: THREE.CanvasTexture[] = []
    const labelMeshes: THREE.Mesh[] = []
    faces.slice(0, 20).forEach((face, index) => {
      const texture = createNumberTexture(index + 1, skinConfig)
      if (!texture) return
      labelTextures.push(texture)
      // A plane is aligned with the actual triangular face. Unlike a HUD
      // sprite, the number rotates and foreshortens with the die surface.
      const label = new THREE.Mesh(
        // Keep the glyph large enough to read on a small die, while still
        // staying inside each triangular facet like the reference UI.
        new THREE.PlaneGeometry(0.62, 0.44),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.95, side: THREE.DoubleSide }),
      )
      label.position.copy(face.center).addScaledVector(face.normal, 0.014)
      label.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal)
      die.add(label)
      labelMeshes.push(label)
    })

    const target = new THREE.Quaternion()
    // Aim the result face toward the actual low-angle camera, so the number
    // settles on the die surface instead of drifting toward a front-only HUD.
    const cameraDirection = camera.position.clone().sub(dieOrigin).normalize()
    const updateTarget = () => {
      const selected = Math.min(Math.max((valueRef.current ?? 20) - 1, 0), faces.length - 1)
      target.setFromUnitVectors(faces[selected].normal, cameraDirection)
      // Apply the finishing twist in world space. Multiplying on the right
      // would interpret the camera axis in the die's local space and move the
      // selected face away from the center of the camera.
      target.premultiply(new THREE.Quaternion().setFromAxisAngle(cameraDirection, (selected % 5) * 0.35))
    }
    const updateSelectedLabel = (delta: number) => {
      const selected = Math.min(Math.max((valueRef.current ?? 20) - 1, 0), labelMeshes.length - 1)
      labelMeshes.forEach((label, index) => {
        const active = index === selected
        const desiredScale = active ? 1.16 : 1
        const nextScale = label.scale.x + (desiredScale - label.scale.x) * Math.min(1, delta * 10)
        label.scale.setScalar(nextScale)
        ;(label.material as THREE.MeshBasicMaterial).opacity = active ? 1 : 0.78
      })
    }
    updateTarget()
    // Show the default/result face immediately; the settling animation only
    // needs to run after a roll or when the value changes.
    die.quaternion.copy(target)

    let isDragging = false
    let userInteracting = false
    let lastPointerX = 0
    let lastPointerY = 0
    let pointerStartX = 0
    let pointerStartY = 0
    let pointerMoved = false
    const onPointerDown = (event: PointerEvent) => {
      if (!interactiveRef.current || rollingRef.current) return
      isDragging = true
      userInteracting = true
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      pointerStartX = event.clientX
      pointerStartY = event.clientY
      pointerMoved = false
      renderer.domElement.setPointerCapture?.(event.pointerId)
      renderer.domElement.style.cursor = 'grabbing'
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!interactiveRef.current || !isDragging || rollingRef.current) return
      const deltaX = event.clientX - lastPointerX
      const deltaY = event.clientY - lastPointerY
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      pointerMoved = pointerMoved || Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > 10
      die.rotation.y += deltaX * 0.012
      die.rotation.x += deltaY * 0.012
      die.rotation.z += deltaX * 0.004
    }
    const stopDragging = (event?: PointerEvent, throwOnRelease = true) => {
      if (!isDragging) return
      isDragging = false
      if (event) renderer.domElement.releasePointerCapture?.(event.pointerId)
      renderer.domElement.style.cursor = 'grab'
      if (throwOnRelease && pointerMoved && !rollingRef.current) onManualThrowRef.current?.()
      pointerMoved = false
    }
    const onPointerCancel = (event: PointerEvent) => stopDragging(event, false)
    const onWheel = (event: WheelEvent) => {
      if (!interactiveRef.current) return
      event.preventDefault()
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.0024, 3.25, 6.5)
      camera.lookAt(dieOrigin)
    }
    if (interactiveRef.current) {
      renderer.domElement.style.touchAction = 'none'
      renderer.domElement.style.cursor = 'grab'
      renderer.domElement.addEventListener('pointerdown', onPointerDown)
      renderer.domElement.addEventListener('pointermove', onPointerMove)
      renderer.domElement.addEventListener('pointerup', stopDragging)
      renderer.domElement.addEventListener('pointercancel', onPointerCancel)
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    }

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

    let frame = 0
    let wasRolling = rollingRef.current
    let rollStarted = rollingRef.current ? performance.now() : 0
    let landingStarted = 0
    let previous = performance.now()
    const animate = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      const desiredFov = rollingRef.current ? 44 : 30
      if (Math.abs(camera.fov - desiredFov) > 0.01) {
        camera.fov += (desiredFov - camera.fov) * Math.min(1, delta * 14)
        camera.updateProjectionMatrix()
      }
      if (rollingRef.current) {
        if (!wasRolling) {
          rollStarted = now
          landingStarted = 0
          particleGroup.visible = false
          userInteracting = false
        }
        wasRolling = true
        const rollProgress = Math.min((now - rollStarted) / 1250, 1)
        const flight = Math.sin(rollProgress * Math.PI)
        die.rotation.x += delta * 5.8
        die.rotation.y += delta * 7.1
        die.rotation.z += delta * 4.6
        // A short ballistic arc: launch above the panel, then fall back to
        // the same spot instead of spinning as a flat icon in place.
        die.position.x = Math.sin(rollProgress * Math.PI * 1.2) * 0.1
        die.position.y = 0.12 + flight * 0.56
        die.position.z = Math.cos(rollProgress * Math.PI) * 0.05
        die.scale.setScalar(1.02 + flight * 0.12)
        rimLight.intensity = 2.6 + flight * 1.25
        shadow.scale.x = 1.3 + flight * 0.52
        shadow.scale.y = 0.46 - flight * 0.14
        shadow.material.opacity = 0.2 - flight * 0.1
      } else {
        if (wasRolling) {
          wasRolling = false
          landingStarted = now
        }
        updateSelectedLabel(delta)
        if (!interactiveRef.current || !userInteracting) {
          updateTarget()
          die.quaternion.slerp(target, Math.min(1, delta * 5.4))
        }
        const landingProgress = landingStarted ? Math.min((now - landingStarted) / 720, 1) : 1
        const bounce = landingProgress < 1 ? Math.sin(landingProgress * Math.PI * 2.2) * 0.08 * (1 - landingProgress) : 0
        die.position.x += (0 - die.position.x) * Math.min(1, delta * 7)
        die.position.y = 0.12 + bounce
        die.position.z += (0 - die.position.z) * Math.min(1, delta * 7)
        const currentScale = die.scale.x
        const settledScale = currentScale + (1.02 - currentScale) * Math.min(1, delta * 6)
        die.scale.setScalar(settledScale)
        rimLight.intensity += (2.7 - rimLight.intensity) * Math.min(1, delta * 4)
        shadow.scale.x += (1.3 - shadow.scale.x) * Math.min(1, delta * 5)
        shadow.scale.y += (0.46 - shadow.scale.y) * Math.min(1, delta * 5)
        shadow.material.opacity += (0.2 - shadow.material.opacity) * Math.min(1, delta * 5)

        if (landingStarted) {
          const particleProgress = Math.min((now - landingStarted) / 540, 1)
          particleGroup.visible = particleProgress < 1
          particleMeshes.forEach((particle, index) => {
            const direction = particleDirections[index]
            particle.position.copy(die.position).addScaledVector(direction, 0.82 + particleProgress * (0.54 + (index % 3) * 0.12))
            particle.scale.setScalar(1.15 - particleProgress * 0.72)
            ;(particle.material as THREE.MeshBasicMaterial).opacity = (1 - particleProgress) * 0.85
          })
        }
      }
      if (starMaterial) {
        const shimmer = 0.72 + Math.sin(now * 0.004) * 0.17 + Math.sin(now * 0.009) * 0.08
        starMaterial.opacity = Math.max(0.34, shimmer * skinConfig.starOpacity)
        starMaterial.size = 0.04 + (Math.sin(now * 0.003) + 1) * 0.004
      }
      const criticalValue = valueRef.current
      if (criticalValue === 20 || criticalValue === 1) {
        criticalLight.color.setHex(criticalValue === 20 ? 0xffe9a3 : 0xff4e7a)
        const flicker = 0.68 + Math.sin(now * 0.038) * 0.2 + Math.sin(now * 0.087) * 0.12
        criticalLight.intensity = (rollingRef.current ? 1 : landingStarted ? Math.max(0, 1 - (now - landingStarted) / 780) : 0) * flicker * (criticalValue === 20 ? 8.2 : 7.4)
      } else {
        criticalLight.intensity = 0
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      if (interactiveRef.current) {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown)
        renderer.domElement.removeEventListener('pointermove', onPointerMove)
        renderer.domElement.removeEventListener('pointerup', stopDragging)
        renderer.domElement.removeEventListener('pointercancel', onPointerCancel)
        renderer.domElement.removeEventListener('wheel', onWheel)
      }
      observer?.disconnect()
      labelTextures.forEach((texture) => texture.dispose())
      labelMeshes.forEach((label) => {
        label.geometry.dispose()
        ;(label.material as THREE.Material).dispose()
      })
      particleMeshes.forEach((particle) => {
        particle.geometry.dispose()
        ;(particle.material as THREE.Material).dispose()
      })
      starGeometry?.dispose()
      starMaterial?.dispose()
      shadowGeometry.dispose()
      shadowMaterial.dispose()
      edgeGeometry.dispose()
      edgeMaterial.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [fallback])

  const criticalClass = value === 20 ? 'critical-success' : value === 1 ? 'critical-failure' : ''
  return <div className={`d20-webgl ${interactive ? 'is-interactive' : ''} ${criticalClass} ${rolling ? 'is-rolling' : ''}`} ref={mountRef} aria-label={value ? `D20 点数 ${value}` : '正在旋转的二十面骰子'}>{fallback && <div className="d20-fallback"><img src="/assets/d20-pink-gold.png" alt="深灰紫色二十面骰子" /><span>{rolling ? '·' : value ?? '20'}</span></div>}</div>
}
