import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Ban } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Banlist = () => {
  const [bans, setBans] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBans();
  }, [search]);

  const fetchBans = async () => {
    try {
      const response = await axios.get(`${API}/bans`, {
        params: { search: search || undefined }
      });
      setBans(response.data);
    } catch (error) {
      console.error('Failed to fetch bans', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter uppercase font-secondary text-white mb-4">
            BANLIST
          </h1>
          <p className="text-zinc-400">Banned players from CS 1.6 Server</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-bans"
              placeholder="Search by nickname or SteamID..."
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary pl-12 pr-4 py-3 text-white font-mono text-sm outline-none transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-primary font-secondary text-xl uppercase tracking-widest">Loading...</div>
          </div>
        ) : bans.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 p-8">
            <Ban className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">No bans found</p>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="banlist-table">
                <thead className="bg-zinc-950/80 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">SteamID</th>
                    <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">IP</th>
                    <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {bans.map((ban) => (
                    <tr key={ban.id} className="hover:bg-zinc-950/50 transition-colors" data-testid="ban-row">
                      <td className="px-6 py-4 font-mono text-sm text-white">{ban.player_nickname}</td>
                      <td className="px-6 py-4 font-mono text-xs text-primary">{ban.steamid}</td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{ban.ip}</td>
                      <td className="px-6 py-4 text-sm text-zinc-300">{ban.reason}</td>
                      <td className="px-6 py-4 font-mono text-sm text-zinc-400">{ban.admin_name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-zinc-400">{ban.duration}</td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                        {format(new Date(ban.ban_date), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};