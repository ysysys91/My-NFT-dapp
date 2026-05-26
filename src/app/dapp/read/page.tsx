'use client'

import { useMemo, useState } from 'react'
import { useConnection, useReadContract } from 'wagmi'
import { contractABI, contractAddress } from '../../contract'
import { Card, Field, Input } from '../../ui/kit'
import { asBigInt, shortenAddress, ZERO_ADDRESS } from '../../ui/utils'
import { useHydrated } from '../../ui/useHydrated'

export default function ReadPage() {
  const { address } = useConnection()
  const mounted = useHydrated()

  const nameRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'name',
    query: { enabled: true },
  })
  const symbolRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'symbol',
    query: { enabled: true },
  })
  const ownerRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'owner',
    query: { enabled: true },
  })

  const [balanceOwner, setBalanceOwner] = useState<string>('')
  const balanceOfRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'balanceOf',
    args: [
      (balanceOwner.trim() || address || ZERO_ADDRESS) as `0x${string}`,
    ],
    query: { enabled: true },
  })

  const [tokenIdQuery, setTokenIdQuery] = useState<string>('0')
  const tokenIdBigInt = useMemo(() => asBigInt(tokenIdQuery) ?? BigInt(0), [tokenIdQuery])

  const ownerOfRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'ownerOf',
    args: [tokenIdBigInt],
    query: { enabled: tokenIdBigInt >= BigInt(0) },
  })
  const tokenURIRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'tokenURI',
    args: [tokenIdBigInt],
    query: { enabled: tokenIdBigInt >= BigInt(0) },
  })
  const approvedRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'getApproved',
    args: [tokenIdBigInt],
    query: { enabled: tokenIdBigInt >= BigInt(0) },
  })

  return (
    <div className="flex flex-col gap-6">
      <Card title="컨트랙트 기본 정보 (읽기)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">name()</div>
            <div className="mt-1 font-semibold">{String(nameRead.data ?? '') || '—'}</div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">symbol()</div>
            <div className="mt-1 font-semibold">{String(symbolRead.data ?? '') || '—'}</div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">owner()</div>
            <div className="mt-1 font-mono text-xs">
              {ownerRead.data ? (
                <span title={String(ownerRead.data ?? '')}>
                  {shortenAddress(String(ownerRead.data ?? ''), 10, 8)}
                </span>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="balanceOf (읽기)">
        <div className="flex flex-col gap-3">
          <Field label="owner address (비우면 내 지갑)">
            <Input
              value={balanceOwner}
              onChange={(e) => setBalanceOwner(e.target.value)}
              placeholder={
                mounted ? (address ? shortenAddress(address) : '0x...') : '로딩...'
              }
            />
          </Field>
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              balanceOf(owner)
            </div>
            <div className="mt-1 font-semibold">
              {balanceOfRead.isError ? '에러' : String(balanceOfRead.data ?? '—')}
            </div>
          </div>
        </div>
      </Card>

      <Card title="tokenId 조회 (ownerOf / tokenURI / approvals)">
        <div className="flex flex-col gap-3">
          <Field label="tokenId">
            <Input
              value={tokenIdQuery}
              onChange={(e) => setTokenIdQuery(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                ownerOf(tokenId)
              </div>
              <div className="mt-1 break-all font-mono text-xs">
                {ownerOfRead.isError ? (
                  '에러/존재X'
                ) : ownerOfRead.data ? (
                  <span title={String(ownerOfRead.data ?? '')}>
                    {shortenAddress(String(ownerOfRead.data ?? ''), 10, 8)}
                  </span>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                tokenURI(tokenId)
              </div>
              <div className="mt-1 break-all font-mono text-xs">
                {tokenURIRead.isError ? '에러/존재X' : String(tokenURIRead.data ?? '—')}
              </div>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                getApproved(tokenId)
              </div>
              <div className="mt-1 break-all font-mono text-xs">
                {approvedRead.isError ? (
                  '에러'
                ) : approvedRead.data ? (
                  <span title={String(approvedRead.data ?? '')}>
                    {shortenAddress(String(approvedRead.data ?? ''), 10, 8)}
                  </span>
                ) : (
                  '—'
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

