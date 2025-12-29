import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Users, Shield, Ban, Server, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, serverRes, playersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/server-status`),
        axios.get(`${API}/rankings/top?limit=5`)
      ]);
      setStats(statsRes.data);
      setServerStatus(serverRes.data);
      setTopPlayers(playersRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-secondary text-2xl uppercase tracking-widest">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1737363642262-8866f0903a1f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxjb3VudGVyJTIwc3RyaWtlJTIwc29sZGllciUyMHRhY3RpY2FsfGVufDB8fHx8MTc2Njk1ODkwMnww&ixlib=rb-4.1.0&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter uppercase font-secondary text-white mb-4">
            CS 1.6 ELITE SERVER
          </h1>
          <p className="text-xl text-zinc-400 font-mono">82.22.174.126:27016</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Server Status */}
        <div className="mb-12">
          <div className="bg-zinc-900/50 border-l-2 border-primary p-8 backdrop-blur-sm" data-testid="server-status-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Server className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold font-secondary uppercase tracking-tight text-white">SERVER STATUS</h2>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${serverStatus?.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-mono text-zinc-400 uppercase">
                  {serverStatus?.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Current Map</p>
                <p className="text-2xl font-mono text-primary font-semibold" data-testid="current-map">{serverStatus?.current_map}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Players Online</p>
                <p className="text-2xl font-mono text-white font-semibold" data-testid="players-online">
                  {serverStatus?.players_online} / {serverStatus?.max_players}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Server IP</p>
                <p className="text-lg font-mono text-zinc-400" data-testid="server-ip">{serverStatus?.server_ip}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="group relative overflow-hidden border border-zinc-800 bg-zinc-950/50 p-6 hover:border-primary/50 transition-colors">
            <Users className="w-8 h-8 text-primary mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Users</p>
            <p className="text-3xl font-bold font-mono text-white" data-testid="stat-total-users">{stats?.total_users || 0}</p>
          </div>
          <div className="group relative overflow-hidden border border-zinc-800 bg-zinc-950/50 p-6 hover:border-primary/50 transition-colors">
            <Activity className="w-8 h-8 text-primary mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Players</p>
            <p className="text-3xl font-bold font-mono text-white" data-testid="stat-total-players">{stats?.total_players || 0}</p>
          </div>
          <div className="group relative overflow-hidden border border-zinc-800 bg-zinc-950/50 p-6 hover:border-primary/50 transition-colors">
            <Ban className="w-8 h-8 text-primary mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Bans</p>
            <p className="text-3xl font-bold font-mono text-white" data-testid="stat-total-bans">{stats?.total_bans || 0}</p>
          </div>
          <div className="group relative overflow-hidden border border-zinc-800 bg-zinc-950/50 p-6 hover:border-primary/50 transition-colors">
            <TrendingUp className="w-8 h-8 text-primary mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Online Now</p>
            <p className="text-3xl font-bold font-mono text-white" data-testid="stat-online-players">{stats?.online_players || 0}</p>
          </div>
        </div>

        {/* Top Players */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold font-secondary uppercase tracking-tight text-white">TOP PLAYERS</h2>
            <Link 
              to="/players" 
              data-testid="view-all-players-link"
              className="text-primary hover:text-primary/80 font-secondary uppercase text-sm tracking-widest transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {topPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 hover:border-primary/30 transition-colors"
                data-testid={`top-player-${index + 1}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/20 border border-primary flex items-center justify-center">
                    <span className="text-xl font-bold font-secondary text-primary">#{player.rank}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white font-secondary text-lg">{player.nickname}</p>
                    <p className="text-xs font-mono text-zinc-500">{player.steamid}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase">K/D</p>
                    <p className="font-mono text-lg font-semibold text-primary">{player.kd_ratio.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase">Kills</p>
                    <p className="font-mono text-lg font-semibold text-white">{player.kills.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase">Level</p>
                    <p className="font-mono text-lg font-semibold text-white">{player.level}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};