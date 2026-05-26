'use client'

import { useMemo, useState } from 'react'
import { useConnection, useWriteContract } from 'wagmi'
import { contractABI, contractAddress } from '../../contract'
import { Card, Field, Input, Button, SecondaryButton } from '../../ui/kit'
import { asBigInt, shortenAddress } from '../../ui/utils'
import { useHydrated } from '../../ui/useHydrated'

export default function TransferPage() {
  const { address } = useConnection()
  const mounted = useHydrated()
  const { writeContractAsync, isPending: isWriting } = useWriteContract()

  const [tokenIdQuery, setTokenIdQuery] = useState<string>('0')
  const tokenId = useMemo(() => asBigInt(tokenIdQuery) ?? BigInt(0), [tokenIdQuery])

  const [transferTo, setTransferTo] = useState<string>('')
  const [transferFrom, setTransferFrom] = useState<string>('')

  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  async function doTransfer(kind: 'transferFrom' | 'safeTransferFrom') {
    setError('')
    setStatus('')
    setTxHash(null)

    const to = transferTo.trim()
    const from = (transferFrom.trim() || address || '').trim()
    if (!from || !to || tokenId < BigInt(0)) {
      setError('from/to 주소와 tokenId가 필요해요.')
      return
    }

    const args = [from as `0x${string}`, to as `0x${string}`, tokenId] as const
    const hash =
      kind === 'transferFrom'
        ? await writeContractAsync({
            abi: contractABI,
            address: contractAddress,
            functionName: 'transferFrom',
            args,
          })
        : await writeContractAsync({
            abi: contractABI,
            address: contractAddress,
            functionName: 'safeTransferFrom',
            args,
          })

    setTxHash(hash)
    setStatus(`${kind} 트랜잭션을 전송했어요.`)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="전송 (transferFrom / safeTransferFrom)">
        <div className="flex flex-col gap-3">
          <Field label="tokenId">
            <Input
              value={tokenIdQuery}
              onChange={(e) => setTokenIdQuery(e.target.value)}
              inputMode="numeric"
            />
          </Field>

          <Field label="from (비우면 내 지갑)">
            <Input
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value)}
              placeholder={
                mounted ? (address ? shortenAddress(address) : '0x...') : '로딩...'
              }
            />
          </Field>
          <Field label="to">
            <Input
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="0x..."
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={isWriting} onClick={() => doTransfer('transferFrom')}>
              transferFrom(from, to, tokenId)
            </Button>
            <SecondaryButton
              disabled={isWriting}
              onClick={() => doTransfer('safeTransferFrom')}
            >
              safeTransferFrom(from, to, tokenId)
            </SecondaryButton>
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
        </div>
      )}
    </div>
  )
}

