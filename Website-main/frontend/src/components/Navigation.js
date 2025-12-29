import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, LogOut } from 'lucide-react';

export const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-secondary text-xl font-bold uppercase tracking-wider text-white">CS 1.6 SERVER</span>
          </Link>

          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              data-testid="nav-home"
              className={`font-secondary uppercase tracking-widest text-sm transition-colors ${
                isActive('/') ? 'text-primary' : 'text-zinc-400 hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/rules" 
              data-testid="nav-rules"
              className={`font-secondary uppercase tracking-widest text-sm transition-colors ${
                isActive('/rules') ? 'text-primary' : 'text-zinc-400 hover:text-primary'
              }`}
            >
              Rules
            </Link>
            <Link 
              to="/banlist" 
              data-testid="nav-banlist"
              className={`font-secondary uppercase tracking-widest text-sm transition-colors ${
                isActive('/banlist') ? 'text-primary' : 'text-zinc-400 hover:text-primary'
              }`}
            >
              Banlist
            </Link>
            <Link 
              to="/players" 
              data-testid="nav-players"
              className={`font-secondary uppercase tracking-widest text-sm transition-colors ${
                isActive('/players') ? 'text-primary' : 'text-zinc-400 hover:text-primary'
              }`}
            >
              Players
            </Link>
            <Link 
              to="/apply-admin" 
              data-testid="nav-apply-admin"
              className={`font-secondary uppercase tracking-widest text-sm transition-colors ${
                isActive('/apply-admin') ? 'text-primary' : 'text-zinc-400 hover:text-primary'
              }`}
            >
              Apply Admin
            </Link>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    data-testid="nav-admin-panel"
                    className={`font-secondary uppercase tracking-widest text-sm transition-colors ${
                      isActive('/admin') ? 'text-primary' : 'text-zinc-400 hover:text-primary'
                    }`}
                  >
                    Admin Panel
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-mono">{user.nickname}</span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    data-testid="btn-logout"
                    className="text-zinc-400 hover:text-primary transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                data-testid="nav-login"
                className="bg-primary hover:bg-primary/90 text-white font-secondary uppercase tracking-widest px-6 py-2 transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};