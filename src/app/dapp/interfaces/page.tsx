'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { contractABI, contractAddress } from '../../contract'
import { Card, Field, Input, SecondaryButton } from '../../ui/kit'

export default function InterfacesPage() {
  const [interfaceId, setInterfaceId] = useState<string>('0x80ac58cd')

  const supportsInterfaceRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'supportsInterface',
    args: [(interfaceId.trim() || '0x00000000') as `0x${string}`],
    query: { enabled: true },
  })

  return (
    <Card title="ERC-165 supportsInterface (표준 지원 여부)">
      <div className="flex flex-col gap-3">
        <Field label="interfaceId (bytes4 hex, 예: 0x80ac58cd)">
          <Input
            value={interfaceId}
            onChange={(e) => setInterfaceId(e.target.value)}
            placeholder="0x80ac58cd"
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={() => setInterfaceId('0x01ffc9a7')}>
            ERC165 (0x01ffc9a7)
          </SecondaryButton>
          <SecondaryButton onClick={() => setInterfaceId('0x80ac58cd')}>
            ERC721 (0x80ac58cd)
          </SecondaryButton>
          <SecondaryButton onClick={() => setInterfaceId('0x5b5e139f')}>
            ERC721Metadata (0x5b5e139f)
          </SecondaryButton>
          <SecondaryButton onClick={() => setInterfaceId('0x780e9d63')}>
            ERC721Enumerable (0x780e9d63)
          </SecondaryButton>
        </div>

        <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            supportsInterface(interfaceId)
          </div>
          <div className="mt-1 font-semibold">
            {supportsInterfaceRead.isError
              ? '에러'
              : String(supportsInterfaceRead.data ?? '—')}
          </div>
        </div>
      </div>
    </Card>
  )
}

