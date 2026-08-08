import { NavLink } from 'react-router-dom'
import { Home, BookOpen, BookMarked, PenLine, Settings, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/',          icon: Home,       label: 'Home'      },
  { to: '/moed',      icon: BookOpen,   label: 'Moed'      },
  { to: '/watches',   icon: Clock,      label: 'Watches'   },
  { to: '/journal',   icon: PenLine,    label: 'Journal'   },
  { to: '/favorites', icon: BookMarked, label: 'Saved'     },
  { to: '/settings',  icon: Settings,   label: 'Settings'  },
]

export function BottomNav() {
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-white border-t border-gray-100 safe-bottom',
      'flex items-center justify-around px-2 pt-1',
    )}
    style={{ boxShadow: '0 -1px 12px rgba(0,0,0,0.06)' }}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[48px]',
              isActive ? 'text-hope-blue' : 'text-gray-400 hover:text-gray-600',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-gold-500" />
              )}
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn(
                'text-[10px] font-heading font-medium',
                isActive && 'font-semibold text-hope-blue',
              )}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
