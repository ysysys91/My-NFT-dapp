'use client'

import { useMemo, useState } from 'react'
import { useAccount, useChainId, usePublicClient, useWriteContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { contractABI, contractAddress } from '../../contract'
import { Card, Field, Input, Button, SecondaryButton } from '../../ui/kit'
import { shortenAddress } from '../../ui/utils'
import { useHydrated } from '../../ui/useHydrated'

type PinataPinned = { ipfs: string; gateway: string; hash: string }
type PinataPinMetadataResponse = { image: PinataPinned; metadata: PinataPinned }

export default function MintPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { writeContractAsync, isPending: isWriting } = useWriteContract()
  const mounted = useHydrated()

  const isSepolia = chainId === sepolia.id

  const [mintTo, setMintTo] = useState<string>('')
  const [assetFile, setAssetFile] = useState<File | null>(null)
  const [metaName, setMetaName] = useState<string>('My NFT')
  const [metaDesc, setMetaDesc] = useState<string>('Minted from my dApp')
  const [lastTokenUri, setLastTokenUri] = useState<string>('')
  const [lastPinata, setLastPinata] = useState<{
    imageGateway?: string
    metadataGateway?: string
    metadataIpfs?: string
  } | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  const resolvedMintTo = useMemo(() => {
    const v = mintTo.trim()
    if (v) return v as `0x${string}`
    if (address) return address
    return undefined
  }, [mintTo, address])

  async function pinAndMint() {
    setError('')
    setStatus('')
    setTxHash(null)
    setLastPinata(null)
    setLastTokenUri('')

    if (!isConnected || !address) {
      setError('지갑을 먼저 연결해 주세요.')
      return
    }
    if (!isSepolia) {
      setError('Sepolia 네트워크로 전환해 주세요.')
      return
    }
    if (!resolvedMintTo) {
      setError('mint 받을 주소가 필요해요.')
      return
    }
    if (!assetFile) {
      setError('업로드할 이미지/파일을 선택해 주세요.')
      return
    }

    setStatus('1/3 Pinata에 파일 업로드 중...')
    const form = new FormData()
    form.append('file', assetFile)
    form.append('name', metaName)
    form.append('description', metaDesc)

    const res = await fetch('/api/pinata/pin-metadata', { method: 'POST', body: form })
    const json = (await res.json()) as
      | PinataPinMetadataResponse
      | { error?: string; detail?: string }
    if (!res.ok) {
      const msg =
        'error' in json && json.error
          ? `${String(json.error)}${json.detail ? `: ${String(json.detail)}` : ''}`
          : 'Pinata 업로드 실패'
      setError(msg)
      return
    }

    const metadataIpfs = String((json as any).metadata?.ipfs ?? '')
    const metadataGateway = String((json as any).metadata?.gateway ?? '')
    const imageGateway = String((json as any).image?.gateway ?? '')
    if (!metadataIpfs) {
      setError('Pinata 응답에서 metadata ipfs URI를 찾지 못했어요.')
      return
    }

    setLastPinata({ metadataIpfs, metadataGateway, imageGateway })
    setLastTokenUri(metadataIpfs)

    setStatus('2/3 컨트랙트 safeMint 트랜잭션 전송 중...')
    const hash = await writeContractAsync({
      abi: contractABI,
      address: contractAddress,
      functionName: 'safeMint',
      args: [resolvedMintTo, metadataIpfs],
    })
    setTxHash(hash)

    setStatus('3/3 트랜잭션이 확인될 때까지 잠시만 기다려 주세요(지갑에서 확인).')

    // 선택: 대기(원하면 나중에 UI로 옮겨도 됨)
    try {
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash })
      setStatus('완료! 갤러리에서 확인해 보세요.')
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="민팅 (Pinata 업로드 + safeMint)">
        <div className="flex flex-col gap-3">
          <Field label="mint to (비우면 내 지갑)">
            <Input
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
              placeholder={
                mounted ? (address ? shortenAddress(address) : '0x...') : '로딩...'
              }
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="metadata name">
              <Input value={metaName} onChange={(e) => setMetaName(e.target.value)} />
            </Field>
            <Field label="metadata description">
              <Input value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} />
            </Field>
          </div>
          <Field label="asset file (image 등)">
            <input
              type="file"
              onChange={(e) => setAssetFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black/85 dark:file:bg-white dark:file:text-black dark:hover:file:bg-white/85"
            />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={isWriting} onClick={pinAndMint}>
              {isWriting ? '전송 중...' : 'Pinata 업로드 + safeMint'}
            </Button>
            <SecondaryButton
              onClick={() => {
                setError('')
                setStatus('')
                setTxHash(null)
                setLastPinata(null)
                setLastTokenUri('')
              }}
            >
              상태 초기화
            </SecondaryButton>
          </div>

          {lastTokenUri ? (
            <div className="rounded-xl bg-zinc-50 p-3 text-xs dark:bg-black/40">
              <div className="text-zinc-600 dark:text-zinc-400">tokenURI로 넣은 값</div>
              <div className="mt-1 break-all font-mono">{lastTokenUri}</div>
            </div>
          ) : null}

          {lastPinata?.metadataGateway ? (
            <div className="rounded-xl bg-zinc-50 p-3 text-xs dark:bg-black/40">
              <div className="text-zinc-600 dark:text-zinc-400">Pinata gateway</div>
              <div className="mt-1 flex flex-col gap-1 break-all font-mono">
                <a
                  className="underline"
                  href={lastPinata.metadataGateway}
                  target="_blank"
                  rel="noreferrer"
                >
                  metadata: {lastPinata.metadataGateway}
                </a>
                {lastPinata.imageGateway ? (
                  <a
                    className="underline"
                    href={lastPinata.imageGateway}
                    target="_blank"
                    rel="noreferrer"
                  >
                    image: {lastPinata.imageGateway}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {lastPinata?.imageGateway ? (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-black">
              <div className="border-b border-black/10 px-3 py-2 text-xs font-medium text-zinc-600 dark:border-white/10 dark:text-zinc-400">
                NFT 이미지 미리보기
              </div>
              <img
                src={lastPinata.imageGateway}
                alt={metaName || 'NFT'}
                className="h-64 w-full object-contain bg-zinc-50 dark:bg-black"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}
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
          {!isSepolia ? (
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              네트워크 전환은 지갑(예: MetaMask)에서 Sepolia로 바꿔 주세요.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

