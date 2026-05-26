'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useReadContract } from 'wagmi'
import { contractABI, contractAddress } from '../../../contract'
import { Card } from '../../../ui/kit'
import { ipfsToGateway, parseIpfsUri, shortenAddress } from '../../../ui/utils'

export default function NftDetailPage() {
  const params = useParams()
  const tokenIdParam = typeof params.tokenId === 'string' ? params.tokenId : ''

  const tokenId = useMemo(() => {
    try {
      const n = BigInt(tokenIdParam.trim() || '0')
      return n >= BigInt(0) ? n : null
    } catch {
      return null
    }
  }, [tokenIdParam])

  const ownerOfRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'ownerOf',
    args: tokenId !== null ? [tokenId] : undefined,
    query: { enabled: tokenId !== null },
  })

  const tokenURIRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'tokenURI',
    args: tokenId !== null ? [tokenId] : undefined,
    query: { enabled: tokenId !== null },
  })

  const approvedRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'getApproved',
    args: tokenId !== null ? [tokenId] : undefined,
    query: { enabled: tokenId !== null },
  })

  const tokenURI =
    typeof tokenURIRead.data === 'string' ? tokenURIRead.data : ''

  const metadataQuery = useQuery({
    queryKey: ['nft-metadata', contractAddress, tokenId?.toString(), tokenURI],
    enabled: Boolean(tokenURI),
    queryFn: async () => {
      const url = ipfsToGateway(tokenURI)
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`metadata fetch failed: ${res.status}`)
      return res.json() as Promise<Record<string, unknown>>
    },
  })

  const imageRaw =
    metadataQuery.data &&
    typeof metadataQuery.data.image === 'string'
      ? metadataQuery.data.image
      : ''

  const name =
    metadataQuery.data &&
    typeof metadataQuery.data.name === 'string'
      ? metadataQuery.data.name
      : ''

  const description =
    metadataQuery.data &&
    typeof metadataQuery.data.description === 'string'
      ? metadataQuery.data.description
      : ''

  const tokenIpfs = parseIpfsUri(tokenURI)
  const imageIpfs = parseIpfsUri(imageRaw)

  if (tokenId === null) {
    return (
      <Card title="NFT 상세">
        <p className="text-sm text-red-500">잘못된 tokenId입니다.</p>
        <Link className="mt-4 inline-block text-sm underline" href="/dapp/gallery">
          갤러리로 돌아가기
        </Link>
      </Card>
    )
  }

  const chainLoading = ownerOfRead.isPending || tokenURIRead.isPending
  const chainError = ownerOfRead.isError || tokenURIRead.isError

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dapp/gallery"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
        >
          ← 갤러리
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          Token #{tokenId.toString()}
        </h1>
      </div>

      {chainLoading ? (
        <Card title="로딩">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            온체인 데이터를 불러오는 중…
          </p>
        </Card>
      ) : null}

      {chainError ? (
        <Card title="오류">
          <p className="text-sm text-red-500">
            이 tokenId의 NFT가 없거나 조회에 실패했습니다.
          </p>
        </Card>
      ) : null}

      {!chainLoading && !chainError ? (
        <>
          <Card title="소유 / 승인">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  ownerOf
                </div>
                <div className="mt-1 break-all font-mono text-xs">
                  {ownerOfRead.data ? (
                    <span title={ownerOfRead.data}>{ownerOfRead.data}</span>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-black/40">
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  getApproved
                </div>
                <div className="mt-1 break-all font-mono text-xs">
                  {approvedRead.isError ? (
                    '에러'
                  ) : approvedRead.data ? (
                    <span title={approvedRead.data}>
                      {shortenAddress(String(approvedRead.data), 12, 10)}
                    </span>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card title="미디어">
            {imageRaw ? (
              <img
                src={ipfsToGateway(imageRaw)}
                alt={name || `token #${tokenId.toString()}`}
                className="max-h-[420px] w-full rounded-xl border border-black/10 object-contain bg-zinc-50 dark:border-white/10 dark:bg-black"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="rounded-xl border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/15">
                {metadataQuery.isPending
                  ? '메타데이터 로딩 중…'
                  : '이미지 없음'}
              </div>
            )}
          </Card>

          {(name || description) && (
            <Card title="메타데이터">
              {name ? (
                <div className="text-lg font-semibold">{name}</div>
              ) : null}
              {description ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {description}
                </p>
              ) : null}
            </Card>
          )}

          <Card title="tokenURI · IPFS">
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  컨트랙트 tokenURI (원본)
                </div>
                <pre className="mt-1 whitespace-pre-wrap break-all rounded-xl bg-zinc-50 p-3 font-mono text-xs dark:bg-black/40">
                  {tokenURI || '—'}
                </pre>
                {tokenIpfs ? (
                  <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <div>
                      IPFS CID:{' '}
                      <span className="break-all font-mono text-zinc-900 dark:text-zinc-100">
                        {tokenIpfs.cid}
                      </span>
                    </div>
                    {tokenIpfs.pathAfterCid ? (
                      <div>
                        경로:{' '}
                        <span className="break-all font-mono">
                          {tokenIpfs.pathAfterCid}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : tokenURI ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    ipfs:// 형식이 아닙니다 (HTTP 등).
                  </p>
                ) : null}
                {tokenURI ? (
                  <a
                    className="mt-2 inline-block text-sm underline"
                    href={ipfsToGateway(tokenURI)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    게이트웨이에서 열기 (Pinata)
                  </a>
                ) : null}
              </div>

              {imageRaw ? (
                <div className="border-t border-black/10 pt-4 dark:border-white/10">
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    메타데이터 image 필드 (원본)
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap break-all rounded-xl bg-zinc-50 p-3 font-mono text-xs dark:bg-black/40">
                    {imageRaw}
                  </pre>
                  {imageIpfs ? (
                    <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      <div>
                        IPFS CID:{' '}
                        <span className="break-all font-mono text-zinc-900 dark:text-zinc-100">
                          {imageIpfs.cid}
                        </span>
                      </div>
                      {imageIpfs.pathAfterCid ? (
                        <div>
                          경로:{' '}
                          <span className="break-all font-mono">
                            {imageIpfs.pathAfterCid}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">
                      ipfs:// 형식이 아닙니다.
                    </p>
                  )}
                  <a
                    className="mt-2 inline-block text-sm underline"
                    href={ipfsToGateway(imageRaw)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    이미지 게이트웨이에서 열기
                  </a>
                </div>
              ) : null}

              {metadataQuery.isError ? (
                <p className="text-xs text-red-500">
                  메타데이터 로드 실패: {String(metadataQuery.error)}
                </p>
              ) : null}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
