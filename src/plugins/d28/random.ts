/**
 * Uniform secure roll in the inclusive range 1..20. Rejection sampling keeps
 * the small remainder of Uint32 values from biasing any face.
 */
export function rollD20(): number {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.getRandomValues) {
    const values = new Uint32Array(1)
    const limit = Math.floor(0x100000000 / 20) * 20
    do cryptoApi.getRandomValues(values)
    while (values[0] >= limit)
    return (values[0] % 20) + 1
  }
  return Math.floor(Math.random() * 20) + 1
}
