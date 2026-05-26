export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const

export function asBigInt(value: string) {
  const v = value.trim()
  if (!v) return undefined
  try {
    return BigInt(v)
  } catch {
    return undefined
  }
}

export function shortenAddress(
  value: string | undefined | null,
  head = 6,
  tail = 4,
) {
  if (!value) return '—'
  const v = value.trim()
  if (v.length <= head + tail + 3) return v
  return `${v.slice(0, head)}…${v.slice(-tail)}`
}

export function ipfsToGateway(uri: string) {
  const v = uri.trim()
  if (v.startsWith('ipfs://')) {
    const rest = v.slice('ipfs://'.length)
    return `https://gateway.pinata.cloud/ipfs/${rest}`
  }
  return v
}

/** ipfs://CID/path 형태에서 원본 URI와 CID(첫 세그먼트)를 분리 */
export function parseIpfsUri(uri: string): {
  raw: string
  cid: string
  pathAfterCid: string
} | null {
  const v = uri.trim()
  if (!v.startsWith('ipfs://')) return null
  const rest = v.slice('ipfs://'.length).replace(/^\/+/, '')
  if (!rest) return null
  const slash = rest.indexOf('/')
  const cid = slash === -1 ? rest : rest.slice(0, slash)
  const pathAfterCid = slash === -1 ? '' : rest.slice(slash + 1)
  return { raw: `ipfs://${rest}`, cid, pathAfterCid }
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, idx: number) => Promise<R>,
) {
  const out: R[] = new Array(items.length)
  let next = 0

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length)) },
    async () => {
      while (true) {
        const idx = next++
        if (idx >= items.length) return
        out[idx] = await fn(items[idx]!, idx)
      }
    },
  )

  await Promise.all(workers)
  return out
}

