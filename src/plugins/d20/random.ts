export const rollD20 = (): number => {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.getRandomValues) {
    const values = new Uint32Array(1)
    cryptoApi.getRandomValues(values)
    const limit = Math.floor(0x100000000 / 20) * 20
    if (values[0] < limit) return (values[0] % 20) + 1
    return rollD20()
  }
  return Math.floor(Math.random() * 20) + 1
}
