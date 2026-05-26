'use client'

import { useMemo, useState } from 'react'
import { useConnection, useReadContract } from 'wagmi'
import { contractABI, contractAddress } from '../../contract'
import { Card, Field, Input } from '../../ui/kit'
import { asBigInt, shortenAddress, ZERO_ADDRESS } from '../../ui/utils'
import { useHydrated } from '../../ui/useHydrated'

export default function EnumerablePage() {
  const { address } = useConnection()
  const mounted = useHydrated()

  const totalSupplyRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'totalSupply',
    query: { enabled: true },
  })

  const [globalIndexInput, setGlobalIndexInput] = useState<string>('0')
  const globalIndex = useMemo(
    () => asBigInt(globalIndexInput) ?? BigInt(0),
    [globalIndexInput],
  )

  const tokenByIndexRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'tokenByIndex',
    args: [globalIndex],
    query: { enabled: globalIndex >= BigInt(0) },
  })

  const [enumerableOwner, setEnumerableOwner] = useState<string>('')
  const [ownerIndexInput, setOwnerIndexInput] = useState<string>('0')
  const ownerIndex = useMemo(
    () => asBigInt(ownerIndexInput) ?? BigInt(0),
    [ownerIndexInput],
  )

  const tokenOfOwnerByIndexRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'tokenOfOwnerByIndex',
    args: [
      (enumerableOwner.trim() || address || ZERO_ADDRESS) as `0x${string}`,
      ownerIndex,
    ],
    query: { enabled: ownerIndex >= BigInt(0) },
  })

  return (
    <Card title="ERC721Enumerable (읽기)">
      <div className="flex flex-col gap-3">
        <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            totalSupply()
          </div>
          <div className="mt-1 font-semibold">
            {totalSupplyRead.isError ? '에러' : String(totalSupplyRead.data ?? '—')}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Field label="index (tokenByIndex)">
              <Input
                value={globalIndexInput}
                onChange={(e) => setGlobalIndexInput(e.target.value)}
                inputMode="numeric"
                placeholder="0"
              />
            </Field>
            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                tokenByIndex(index)
              </div>
              <div className="mt-1 font-mono text-xs break-all">
                {tokenByIndexRead.isError
                  ? '에러/범위초과'
                  : String(tokenByIndexRead.data ?? '—')}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Field label="owner (비우면 내 지갑)">
              <Input
                value={enumerableOwner}
                onChange={(e) => setEnumerableOwner(e.target.value)}
                placeholder={
                  mounted ? (address ? shortenAddress(address) : '0x...') : '로딩...'
                }
              />
            </Field>
            <Field label="index (tokenOfOwnerByIndex)">
              <Input
                value={ownerIndexInput}
                onChange={(e) => setOwnerIndexInput(e.target.value)}
                inputMode="numeric"
                placeholder="0"
              />
            </Field>
            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                tokenOfOwnerByIndex(owner, index)
              </div>
              <div className="mt-1 font-mono text-xs break-all">
                {tokenOfOwnerByIndexRead.isError
                  ? '에러/범위초과'
                  : String(tokenOfOwnerByIndexRead.data ?? '—')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

