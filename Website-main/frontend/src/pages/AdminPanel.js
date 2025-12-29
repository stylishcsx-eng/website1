import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Ban, FileText, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'applications') {
        const response = await axios.get(`${API}/admin-applications`);
        setApplications(response.data);
      } else if (activeTab === 'users') {
        const response = await axios.get(`${API}/admin/users`);
        setUsers(response.data);
      } else if (activeTab === 'bans') {
        const response = await axios.get(`${API}/bans`);
        setBans(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatus = async (appId, status) => {
    try {
      await axios.patch(`${API}/admin-applications/${appId}`, { status });
      toast.success(`Application ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update application');
    }
  };

  const handleDeleteBan = async (banId) => {
    if (!window.confirm('Are you sure you want to remove this ban?')) return;
    
    try {
      await axios.delete(`${API}/bans/${banId}`);
      toast.success('Ban removed successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove ban');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter uppercase font-secondary text-white mb-4">
            ADMIN PANEL
          </h1>
          <p className="text-zinc-400">Server administration and management</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('applications')}
            data-testid="tab-applications"
            className={`px-6 py-3 font-secondary uppercase tracking-wider text-sm transition-colors ${
              activeTab === 'applications'
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Applications
          </button>
          <button
            onClick={() => setActiveTab('users')}
            data-testid="tab-users"
            className={`px-6 py-3 font-secondary uppercase tracking-wider text-sm transition-colors ${
              activeTab === 'users'
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('bans')}
            data-testid="tab-bans"
            className={`px-6 py-3 font-secondary uppercase tracking-wider text-sm transition-colors ${
              activeTab === 'bans'
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Ban className="w-4 h-4 inline mr-2" />
            Bans
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-primary font-secondary text-xl uppercase tracking-widest">Loading...</div>
          </div>
        ) : (
          <div>
            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 p-8">
                    <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400">No applications found</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div 
                      key={app.id} 
                      className="bg-zinc-900/50 border border-zinc-800 p-6"
                      data-testid="application-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold font-secondary text-white">{app.nickname}</h3>
                          <p className="text-xs font-mono text-zinc-500 mt-1">{app.steamid}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-xs font-secondary uppercase tracking-wider ${
                            app.status === 'pending' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/50' :
                            app.status === 'approved' ? 'bg-green-900/30 text-green-500 border border-green-500/50' :
                            'bg-red-900/30 text-red-500 border border-red-500/50'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-zinc-500 uppercase mb-1">Age</p>
                          <p className="text-white">{app.age} years old</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 uppercase mb-1">Submitted</p>
                          <p className="text-white font-mono text-sm">
                            {format(new Date(app.submitted_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs text-zinc-500 uppercase mb-2">Experience</p>
                        <p className="text-zinc-300 text-sm">{app.experience}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs text-zinc-500 uppercase mb-2">Reason</p>
                        <p className="text-zinc-300 text-sm">{app.reason}</p>
                      </div>
                      {app.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApplicationStatus(app.id, 'approved')}
                            data-testid="btn-approve-application"
                            className="flex items-center space-x-2 bg-green-900/30 hover:bg-green-900/50 text-green-500 border border-green-500/50 px-4 py-2 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-secondary uppercase">Approve</span>
                          </button>
                          <button
                            onClick={() => handleApplicationStatus(app.id, 'rejected')}
                            data-testid="btn-reject-application"
                            className="flex items-center space-x-2 bg-red-900/30 hover:bg-red-900/50 text-red-500 border border-red-500/50 px-4 py-2 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span className="text-sm font-secondary uppercase">Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-zinc-900/50 border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-950/80 border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Nickname</th>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">SteamID</th>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-zinc-950/50 transition-colors" data-testid="user-row">
                          <td className="px-6 py-4 font-mono text-sm text-white">{user.nickname}</td>
                          <td className="px-6 py-4 text-sm text-zinc-300">{user.email}</td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-500">{user.steamid || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-secondary uppercase ${
                              user.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/50' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                            {format(new Date(user.created_at), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bans Tab */}
            {activeTab === 'bans' && (
              <div className="bg-zinc-900/50 border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-950/80 border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Player</th>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">SteamID</th>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-secondary text-zinc-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {bans.map((ban) => (
                        <tr key={ban.id} className="hover:bg-zinc-950/50 transition-colors" data-testid="ban-row-admin">
                          <td className="px-6 py-4 font-mono text-sm text-white">{ban.player_nickname}</td>
                          <td className="px-6 py-4 font-mono text-xs text-primary">{ban.steamid}</td>
                          <td className="px-6 py-4 text-sm text-zinc-300">{ban.reason}</td>
                          <td className="px-6 py-4 font-mono text-sm text-zinc-400">{ban.duration}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteBan(ban.id)}
                              data-testid="btn-delete-ban"
                              className="text-red-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};