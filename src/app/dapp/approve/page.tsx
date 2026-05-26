'use client'

import { useMemo, useState } from 'react'
import { useConnection, useReadContract, useWriteContract } from 'wagmi'
import { contractABI, contractAddress } from '../../contract'
import { Card, Field, Input, Button, SecondaryButton } from '../../ui/kit'
import { asBigInt, shortenAddress, ZERO_ADDRESS } from '../../ui/utils'
import { useHydrated } from '../../ui/useHydrated'

export default function ApprovePage() {
  const { address } = useConnection()
  const mounted = useHydrated()
  const { writeContractAsync, isPending: isWriting } = useWriteContract()

  const [tokenIdQuery, setTokenIdQuery] = useState<string>('0')
  const tokenId = useMemo(() => asBigInt(tokenIdQuery) ?? BigInt(0), [tokenIdQuery])

  const approvedRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'getApproved',
    args: [tokenId],
    query: { enabled: tokenId >= BigInt(0) },
  })

  const [operator, setOperator] = useState<string>('')
  const isApprovedForAllRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'isApprovedForAll',
    args: [
      (address || ZERO_ADDRESS) as `0x${string}`,
      (operator.trim() || ZERO_ADDRESS) as `0x${string}`,
    ],
    query: { enabled: true },
  })

  const [approveTo, setApproveTo] = useState<string>('')
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  async function doApprove() {
    setError('')
    setStatus('')
    setTxHash(null)

    const to = approveTo.trim()
    if (!to) {
      setError('approve 받을 주소가 필요해요.')
      return
    }
    const hash = await writeContractAsync({
      abi: contractABI,
      address: contractAddress,
      functionName: 'approve',
      args: [to as `0x${string}`, tokenId],
    })
    setTxHash(hash)
    setStatus('approve 트랜잭션을 전송했어요.')
  }

  async function doSetApprovalForAll(approved: boolean) {
    setError('')
    setStatus('')
    setTxHash(null)
    const op = operator.trim()
    if (!op) {
      setError('operator 주소가 필요해요.')
      return
    }
    const hash = await writeContractAsync({
      abi: contractABI,
      address: contractAddress,
      functionName: 'setApprovalForAll',
      args: [op as `0x${string}`, approved],
    })
    setTxHash(hash)
    setStatus('setApprovalForAll 트랜잭션을 전송했어요.')
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="토큰 승인 조회 (읽기)">
        <div className="flex flex-col gap-3">
          <Field label="tokenId">
            <Input
              value={tokenIdQuery}
              onChange={(e) => setTokenIdQuery(e.target.value)}
              inputMode="numeric"
            />
          </Field>
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
      </Card>

      <Card title="approve / setApprovalForAll (쓰기)">
        <div className="flex flex-col gap-3">
          <Field label="approve(to) address">
            <Input
              value={approveTo}
              onChange={(e) => setApproveTo(e.target.value)}
              placeholder="0x..."
            />
          </Field>
          <div className="flex gap-2">
            <Button disabled={isWriting} onClick={doApprove}>
              approve(to, tokenId)
            </Button>
          </div>

          <div className="h-px bg-black/10 dark:bg-white/10" />

          <Field label="operator (setApprovalForAll / isApprovedForAll)">
            <Input
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="0x..."
            />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={isWriting} onClick={() => doSetApprovalForAll(true)}>
              setApprovalForAll(true)
            </Button>
            <SecondaryButton
              disabled={isWriting}
              onClick={() => doSetApprovalForAll(false)}
            >
              setApprovalForAll(false)
            </SecondaryButton>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-xs dark:bg-black/40">
            <div className="text-zinc-600 dark:text-zinc-400">
              isApprovedForAll(me, operator)
            </div>
            <div className="mt-1 font-mono">
              {isApprovedForAllRead.isError
                ? '에러'
                : String(isApprovedForAllRead.data ?? '—')}
            </div>
          </div>
        </div>
      </Card>

      {(status || error || txHash) && (
        <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm shadow-sm dark:border-white/10 dark:bg-zinc-950">
          {status ? <div className="text-zinc-700 dark:text-zinc-300">{status}</div> : null}
          {txHash ? (
            <div className="mt-2">
              txHash:{' '}
              <span className="break-all font-mono text-xs" title={txHash}>
                {shortenAddress(txHash, 10, 8)}
              </span>
            </div>
          ) : null}
          {error ? <div className="mt-2 text-red-500">{error}</div> : null}
          {!mounted ? null : null}
        </div>
      )}
    </div>
  )
}

