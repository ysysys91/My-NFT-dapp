'use client'

import Link from 'next/link'
import { usePublicClient, useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { contractABI, contractAddress } from '../../contract'
import { Card, Button } from '../../ui/kit'
import { ipfsToGateway, mapWithConcurrency, shortenAddress } from '../../ui/utils'

type GalleryItem = {
  tokenId: bigint
  owner: `0x${string}`
  tokenURI: string
  metadataUrl: string
  name: string
  description: string
  imageUrl: string
}

const GALLERY_LIMIT = 60

export default function GalleryPage() {
  const publicClient = usePublicClient()

  const totalSupplyRead = useReadContract({
    abi: contractABI,
    address: contractAddress,
    functionName: 'totalSupply',
    query: { enabled: true },
  })

  const nftGalleryQuery = useQuery({
    queryKey: ['nft-gallery', contractAddress, GALLERY_LIMIT],
    enabled: Boolean(publicClient),
    queryFn: async () => {
      if (!publicClient) return []

      const totalSupply = (await publicClient.readContract({
        abi: contractABI,
        address: contractAddress,
        functionName: 'totalSupply',
      })) as bigint

      if (totalSupply <= BigInt(0)) return []

      const take = BigInt(GALLERY_LIMIT)
      const start = totalSupply > take ? totalSupply - take : BigInt(0)

      const indices: bigint[] = []
      for (let i = start; i < totalSupply; i++) indices.push(i)

      const tokenIds = await mapWithConcurrency(indices, 6, async (i) => {
        return (await publicClient.readContract({
          abi: contractABI,
          address: contractAddress,
          functionName: 'tokenByIndex',
          args: [i],
        })) as bigint
      })

      const items = await mapWithConcurrency(tokenIds, 6, async (tokenId) => {
        const [owner, tokenURI] = await Promise.all([
          publicClient.readContract({
            abi: contractABI,
            address: contractAddress,
            functionName: 'ownerOf',
            args: [tokenId],
          }) as Promise<`0x${string}`>,
          publicClient.readContract({
            abi: contractABI,
            address: contractAddress,
            functionName: 'tokenURI',
            args: [tokenId],
          }) as Promise<string>,
        ])

        const metadataUrl = ipfsToGateway(tokenURI)
        let meta: any = null
        try {
          const res = await fetch(metadataUrl, { cache: 'no-store' })
          meta = await res.json()
        } catch {
          meta = null
        }

        const imageRaw = typeof meta?.image === 'string' ? meta.image : ''
        const imageUrl = imageRaw ? ipfsToGateway(imageRaw) : ''

        const item: GalleryItem = {
          tokenId,
          owner,
          tokenURI,
          metadataUrl,
          name: typeof meta?.name === 'string' ? meta.name : '',
          description: typeof meta?.description === 'string' ? meta.description : '',
          imageUrl,
        }
        return item
      })

      return items.sort((a, b) => (a.tokenId > b.tokenId ? -1 : 1))
    },
  })

  return (
    <Card title="NFT 갤러리 (최근 60개)">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            totalSupply:{' '}
            <span className="font-mono">
              {totalSupplyRead.isError ? '에러' : String(totalSupplyRead.data ?? '—')}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={nftGalleryQuery.isFetching}
              onClick={() => nftGalleryQuery.refetch()}
            >
              {nftGalleryQuery.isFetching ? '불러오는 중...' : '새로고침'}
            </Button>
          </div>
        </div>

        {nftGalleryQuery.isError ? (
          <div className="text-sm text-red-500">
            갤러리 로드 실패: {String(nftGalleryQuery.error)}
          </div>
        ) : null}

        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          {nftGalleryQuery.data
            ? `토큰 ${nftGalleryQuery.data.length}개`
            : '토큰 0개'}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(nftGalleryQuery.data ?? []).map((nft) => (
            <Link
              key={nft.tokenId.toString()}
              href={`/dapp/gallery/${nft.tokenId.toString()}`}
              className="block overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm outline-none ring-black/0 transition hover:border-black/20 hover:shadow-md focus-visible:ring-2 focus-visible:ring-black/30 dark:border-white/10 dark:bg-black dark:hover:border-white/25 dark:focus-visible:ring-white/30"
            >
              <div className="border-b border-black/10 px-3 py-2 text-xs font-semibold dark:border-white/10">
                tokenId #{nft.tokenId.toString()}
              </div>
              {nft.imageUrl ? (
                <img
                  src={nft.imageUrl}
                  alt={nft.name || `token #${nft.tokenId.toString()}`}
                  className="h-56 w-full object-contain bg-zinc-50 dark:bg-black"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center bg-zinc-50 text-xs text-zinc-500 dark:bg-black dark:text-zinc-400">
                  이미지 없음(또는 메타데이터 로드 실패)
                </div>
              )}
              <div className="flex flex-col gap-2 p-3 text-xs">
                <div className="font-medium">{nft.name || '이름 없음'}</div>
                {nft.description ? (
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {nft.description}
                  </div>
                ) : null}
                <div className="text-zinc-600 dark:text-zinc-400">
                  owner:{' '}
                  <span className="font-mono" title={nft.owner}>
                    {shortenAddress(nft.owner, 10, 8)}
                  </span>
                </div>
                <div className="text-zinc-500 dark:text-zinc-400">
                  클릭하여 상세보기
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  )
}

