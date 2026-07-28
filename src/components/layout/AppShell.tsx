import type { ReactNode } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
  showNav?: boolean
  showHeader?: boolean
  title?: string
}

export function AppShell({ children, showNav = true, showHeader = true, title }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-hope-light safe-top">
      {showHeader && <Header title={title} />}

      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
