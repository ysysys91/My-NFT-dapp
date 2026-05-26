'use client'

import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { Button, SecondaryButton } from '../ui/kit'
import { shortenAddress } from '../ui/utils'

export function WalletBar() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending: isConnecting, error: connectError } =
    useConnect()
  const { disconnect } = useDisconnect()

  const isSepolia = chainId === sepolia.id
  const connector = connectors?.[0]

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div>
            <span className="text-zinc-600 dark:text-zinc-400">네트워크:</span>{' '}
            <span className={!isSepolia ? 'text-red-500' : ''}>
              chainId={chainId} (권장: Sepolia {sepolia.id})
            </span>
          </div>
          <div>
            <span className="text-zinc-600 dark:text-zinc-400">지갑:</span>{' '}
            <span className="font-mono" title={address ?? ''}>
              {isConnected && address ? shortenAddress(address) : '연결 안됨'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <Button
              disabled={!connector || isConnecting}
              onClick={() => connector && connect({ connector })}
            >
              {isConnecting ? '연결 중...' : '지갑 연결'}
            </Button>
          ) : (
            <SecondaryButton onClick={() => disconnect()}>연결 해제</SecondaryButton>
          )}
        </div>
      </div>

      {connectError ? (
        <div className="mt-2 text-xs text-red-500">{connectError.message}</div>
      ) : null}
      {!isSepolia ? (
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          네트워크 전환은 지갑(예: MetaMask)에서 Sepolia로 바꿔 주세요.
        </div>
      ) : null}
    </div>
  )
}

