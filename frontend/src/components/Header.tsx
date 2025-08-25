import { Link, useLocation } from 'react-router-dom'
import { Search, Upload, BarChart3, Settings, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Domain Lookup', href: '/lookup', icon: Search },
  { name: 'Upload CSV', href: '/upload', icon: Upload },
  // Admin is accessible via direct URL /admin but not shown in navigation
]

export function Header() {
  const location = useLocation()
  const { user, logout, isAuthenticated, usageStats } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    // If trying to access protected routes and not authenticated, redirect to auth
    if (!isAuthenticated && (href === '/lookup' || href === '/upload' || href === '/admin')) {
      e.preventDefault()
      window.location.href = '/auth'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Backlink Price Finder</span>
            </Link>
          </div>
          
          <nav className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const isProtected = item.href === '/lookup' || item.href === '/upload' || item.href === '/admin'
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } ${isProtected && !isAuthenticated ? 'relative' : ''}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {isProtected && !isAuthenticated && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Login Required</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {/* Usage Display */}
              {usageStats && (
                <div className="text-sm text-gray-600">
                  {usageStats.plan_type === 'unlimited' ? (
                    <span className="text-green-600 font-medium">Unlimited</span>
                  ) : (
                    <span className={usageStats.searches_remaining <= 1 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {usageStats.searches_remaining} searches left
                    </span>
                  )}
                </div>
              )}

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <span className="text-gray-700 font-medium">
                    {user?.full_name || user?.username || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{user?.full_name || 'User'}</div>
                      <div className="text-gray-500">{user?.email}</div>
                      {usageStats && (
                        <div className="text-xs text-gray-400 mt-1">
                          {usageStats.plan_type === 'unlimited' ? 'Unlimited Plan' : `${usageStats.plan_type} Plan`}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex space-x-4">
              <Link
                to="/auth"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
