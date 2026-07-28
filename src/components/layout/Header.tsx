import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className={cn(
      'sticky top-0 z-40 bg-hope-blue text-white px-4 py-3',
      'flex items-center justify-between',
    )}>
      {/* Left: back button or logo */}
      <div className="w-10">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Center: title or wordmark */}
      <div className="flex-1 text-center">
        {title ? (
          <h1 className="font-heading font-semibold text-base">{title}</h1>
        ) : (
          <span className="font-heading font-bold text-xl tracking-wide text-gradient-gold">
            8Hope
          </span>
        )}
      </div>

      {/* Right: reserved for future actions */}
      <div className="w-10" />
    </header>
  )
}
