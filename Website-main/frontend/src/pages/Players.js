import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Target, Clock, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API}/players`);
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to fetch players', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPlaytime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter uppercase font-secondary text-white mb-4">
            PLAYER RANKINGS
          </h1>
          <p className="text-zinc-400">Top players on CS 1.6 Server</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-primary font-secondary text-xl uppercase tracking-widest">Loading...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {players.map((player) => (
              <Link
                key={player.id}
                to={`/players/${player.steamid}`}
                data-testid={`player-card-${player.steamid}`}
                className="block bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 p-6 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-primary/20 border-2 border-primary flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <span className="text-2xl font-bold font-secondary text-primary">#{player.rank}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-secondary text-white group-hover:text-primary transition-colors">
                        {player.nickname}
                      </h3>
                      <p className="text-xs font-mono text-zinc-500 mt-1">{player.steamid}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-8">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Trophy className="w-4 h-4 text-zinc-500" />
                        <p className="text-xs text-zinc-500 uppercase">Level</p>
                      </div>
                      <p className="text-2xl font-mono font-bold text-white">{player.level}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-zinc-500" />
                        <p className="text-xs text-zinc-500 uppercase">K/D</p>
                      </div>
                      <p className="text-2xl font-mono font-bold text-primary">{player.kd_ratio.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Target className="w-4 h-4 text-zinc-500" />
                        <p className="text-xs text-zinc-500 uppercase">Kills</p>
                      </div>
                      <p className="text-2xl font-mono font-bold text-white">{player.kills.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <p className="text-xs text-zinc-500 uppercase">Playtime</p>
                      </div>
                      <p className="text-lg font-mono font-bold text-white">{formatPlaytime(player.playtime)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PlayerProfile = () => {
  const { steamid } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayer();
  }, [steamid]);

  const fetchPlayer = async () => {
    try {
      const response = await axios.get(`${API}/players/${steamid}`);
      setPlayer(response.data);
    } catch (error) {
      console.error('Failed to fetch player', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPlaytime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ${minutes % 60} minutes`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-secondary text-2xl uppercase tracking-widest">Loading...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-zinc-400 text-xl mb-4">Player not found</p>
          <Link to="/players" className="text-primary hover:text-primary/80">Back to Rankings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link to="/players" className="text-primary hover:text-primary/80 text-sm mb-4 inline-block">
            ← Back to Rankings
          </Link>
          <div className="flex items-center space-x-6 mb-4">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary flex items-center justify-center">
              <span className="text-4xl font-bold font-secondary text-primary">#{player.rank}</span>
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tighter uppercase font-secondary text-white">
                {player.nickname}
              </h1>
              <p className="text-zinc-400 font-mono mt-2">{player.steamid}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border-l-2 border-primary p-6">
            <Trophy className="w-8 h-8 text-primary mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Level</p>
            <p className="text-4xl font-bold font-mono text-white">{player.level}</p>
          </div>

          <div className="bg-zinc-900/50 border-l-2 border-primary p-6">
            <TrendingUp className="w-8 h-8 text-primary mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">K/D Ratio</p>
            <p className="text-4xl font-bold font-mono text-primary">{player.kd_ratio.toFixed(2)}</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6">
            <Target className="w-8 h-8 text-zinc-400 mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Kills</p>
            <p className="text-4xl font-bold font-mono text-white">{player.kills.toLocaleString()}</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6">
            <Target className="w-8 h-8 text-zinc-400 mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Deaths</p>
            <p className="text-4xl font-bold font-mono text-white">{player.deaths.toLocaleString()}</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:col-span-2">
            <Clock className="w-8 h-8 text-zinc-400 mb-4" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Playtime</p>
            <p className="text-4xl font-bold font-mono text-white">{formatPlaytime(player.playtime)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};