import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Login successful!');
      } else {
        await register(email, password, nickname);
        toast.success('Registration successful!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold font-secondary uppercase tracking-tight text-white mb-2">
            {isLogin ? 'Access Terminal' : 'Register'}
          </h1>
          <p className="text-zinc-400 font-mono text-sm">CS 1.6 Server Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 border border-zinc-800 p-8">
          {!isLogin && (
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-secondary">
                Nickname
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  data-testid="input-nickname"
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                  placeholder="Enter your nickname"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-secondary">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-secondary">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="btn-submit-auth"
            className="w-full bg-primary hover:bg-primary/90 text-white font-secondary uppercase tracking-widest px-8 py-3 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              data-testid="btn-toggle-auth-mode"
              className="text-zinc-400 hover:text-primary text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>

          <div className="border-t border-zinc-800 pt-4 mt-4">
            <p className="text-xs text-zinc-500 font-mono">
              Demo Credentials:<br />
              Admin: admin@cs16server.com / admin123<br />
              User: demo@player.com / demo123
            </p>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link to="/" className="text-zinc-400 hover:text-primary text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};