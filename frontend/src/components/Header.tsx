import { Link, useLocation } from 'react-router-dom'
import { Search, Upload, BarChart3, Settings, LogOut, User, ChevronDown, Star, CreditCard, Shield, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Domain Lookup', href: '/lookup', icon: Search },
  // Admin is accessible via direct URL /admin but not shown in navigation
]

export function Header() {
  const location = useLocation()
  const { user, logout, isAuthenticated, usageStats } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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
    if (!isAuthenticated && (href === '/lookup' || href === '/admin')) {
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
              <img src="/Favicon.png" alt="Backlink Price Checker" className="w-8 h-8" />
              <span className="text-xl font-semibold text-gray-900 hidden sm:block">Backlink Price Checker</span>
              <span className="text-lg font-semibold text-gray-900 sm:hidden">BPC</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const isProtected = item.href === '/lookup' || item.href === '/admin'
              
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
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-2">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2 md:space-x-4">
                {/* Upgrade Button for Free Users - Hide on mobile */}
                {usageStats && usageStats.plan_type === 'free' && (
                  <Link
                    to="/pricing"
                    className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all items-center space-x-1 shadow-sm"
                  >
                    <Star className="w-4 h-4" />
                    <span>Upgrade</span>
                  </Link>
                )}

                {/* Usage Display - Hide on mobile */}
                {usageStats && (
                  <div className="hidden lg:block text-sm text-gray-600">
                    {usageStats.plan_type === 'unlimited' ? (
                      <span className="text-green-600 font-medium">Unlimited Searches</span>
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
                  <div className="absolute right-0 mt-2 min-w-48 max-w-80 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium truncate">{user?.full_name || 'User'}</div>
                      <div className="text-gray-500 break-words">{user?.email}</div>
                      {usageStats && (
                        <div className="text-xs text-gray-400 mt-1">
                          {usageStats.plan_type === 'unlimited' ? 'Unlimited Plan' : `${usageStats.plan_type} Plan`}
                        </div>
                      )}
                    </div>
                    
                    {/* Billing link for unlimited users */}
                    {usageStats && usageStats.plan_type === 'unlimited' && (
                      <Link
                        to="/billing"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Billing</span>
                      </Link>
                    )}
                    
                    {/* Upgrade link for free users */}
                    {usageStats && usageStats.plan_type === 'free' && (
                      <Link
                        to="/pricing"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                      >
                        <Star className="w-4 h-4" />
                        <span>Upgrade Plan</span>
                      </Link>
                    )}
                    
                    {/* Admin menu items */}
                    {user?.is_admin && (
                      <>
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin</span>
                        </Link>
                        <Link
                          to="/upload"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload</span>
                        </Link>
                      </>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-primary-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                const isProtected = item.href === '/lookup' || item.href === '/admin'
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={(e) => {
                      handleNavClick(item.href, e)
                      setShowMobileMenu(false)
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    } ${isProtected && !isAuthenticated ? 'relative' : ''}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              {/* Mobile-only items for authenticated users */}
              {isAuthenticated && (
                <>
                  {/* Show upgrade in mobile menu for free users */}
                  {usageStats && usageStats.plan_type === 'free' && (
                    <Link
                      to="/pricing"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
                    >
                      <Star className="w-5 h-5" />
                      <span>Upgrade Plan</span>
                    </Link>
                  )}
                  
                  {/* Admin menu items for mobile */}
                  {user?.is_admin && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      >
                        <Shield className="w-5 h-5" />
                        <span>Admin</span>
                      </Link>
                      <Link
                        to="/upload"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Upload</span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
