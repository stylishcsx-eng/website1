import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Shield, Server, Users, Ban, FileText, UserPlus, LogIn, LogOut, Home, Crosshair } from 'lucide-react';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin, isAuthenticated } = useAuth();

  const navLinks = [
    { path: '/', label: 'HOME', icon: Home },
    { path: '/server-status', label: 'SERVER', icon: Server },
    { path: '/rankings', label: 'RANKINGS', icon: Crosshair },
    { path: '/banlist', label: 'BANLIST', icon: Ban },
    { path: '/rules', label: 'RULES', icon: FileText },
    { path: '/apply-admin', label: 'APPLY', icon: UserPlus },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group" data-testid="nav-logo">
            <div className="w-10 h-10 bg-primary/20 border border-primary flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="hidden sm:block">
              <span className="font-heading text-xl font-bold uppercase tracking-wider text-white">shadowzm</span>
              <span className="text-xs text-muted-foreground block -mt-1">Zombie reverse</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                data-testid={`nav-${label.toLowerCase()}`}
                className={`px-4 py-2 font-heading text-sm uppercase tracking-widest transition-all border-b-2 ${
                  isActive(path)
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-white hover:border-white/20'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    data-testid="nav-admin-panel"
                    className="flex items-center space-x-2 px-4 py-2 bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-white transition-all font-heading text-sm uppercase tracking-widest"
                  >
                    <Shield className="w-4 h-4" />
                    <span>ADMIN</span>
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">{user?.nickname}</span>
                  <button
                    onClick={logout}
                    data-testid="nav-logout"
                    className="flex items-center space-x-1 px-3 py-2 text-muted-foreground hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  data-testid="nav-login"
                  className="px-4 py-2 text-muted-foreground hover:text-white transition-colors font-heading text-sm uppercase tracking-widest"
                >
                  LOGIN
                </Link>
                <Link
                  to="/register"
                  data-testid="nav-register"
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/90 transition-colors font-heading text-sm uppercase tracking-widest"
                >
                  REGISTER
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-white"
            data-testid="nav-mobile-toggle"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-white/5 py-4">
            <div className="flex flex-col space-y-2">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 font-heading text-sm uppercase tracking-widest transition-colors ${
                    isActive(path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              <div className="border-t border-white/5 pt-4 mt-2">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-primary font-heading text-sm uppercase tracking-widest"
                      >
                        <Shield className="w-5 h-5" />
                        <span>ADMIN PANEL</span>
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:text-white font-heading text-sm uppercase tracking-widest w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>LOGOUT ({user?.nickname})</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:text-white font-heading text-sm uppercase tracking-widest"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>LOGIN</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-primary font-heading text-sm uppercase tracking-widest"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>REGISTER</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
