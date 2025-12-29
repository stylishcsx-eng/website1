import '@/App.css';
import '@/index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Banlist } from './pages/Banlist';
import { Players, PlayerProfile } from './pages/Players';
import { Rules } from './pages/Rules';
import { ApplyAdmin } from './pages/ApplyAdmin';
import { AdminPanel } from './pages/AdminPanel';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App min-h-screen bg-background">
          <Navigation />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/banlist" element={<Banlist />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:steamid" element={<PlayerProfile />} />
            <Route path="/apply-admin" element={<ApplyAdmin />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster position="top-right" theme="dark" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;