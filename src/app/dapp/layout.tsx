import Link from 'next/link'
import type { ReactNode } from 'react'
import { WalletBar } from './WalletBar'

const nav = [
  { href: '/dapp/gallery', label: '갤러리' },
  { href: '/dapp/read', label: '조회' },
  { href: '/dapp/mint', label: '민팅' },
  { href: '/dapp/approve', label: '승인' },
  { href: '/dapp/transfer', label: '전송' },
  { href: '/dapp/interfaces', label: '인터페이스' },
] as const

export default function DappLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight">My NFT dApp</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                ERC-721 표준 기능 테스트
              </div>
            </div>
            <Link
              href="/"
              className="text-sm underline text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              홈으로
            </Link>
          </div>

          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <WalletBar />

        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  )
}

