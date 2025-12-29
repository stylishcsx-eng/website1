import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Ban, FileText, Check, X, Trash2, Shield, RefreshCw } from 'lucide-react';
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
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-10 h-10 text-primary" />
              <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white" data-testid="page-title">
                ADMIN PANEL
              </h1>
            </div>
            <p className="text-muted-foreground">Server administration and management</p>
          </div>
          <button
            onClick={fetchData}
            data-testid="btn-refresh"
            className="flex items-center space-x-2 px-4 py-2 border border-white/20 text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-heading uppercase text-sm tracking-widest hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('applications')}
            data-testid="tab-applications"
            className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
              activeTab === 'applications'
                ? 'text-primary border-primary bg-primary/10'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            data-testid="tab-users"
            className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
              activeTab === 'users'
                ? 'text-primary border-primary bg-primary/10'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('bans')}
            data-testid="tab-bans"
            className={`px-6 py-4 font-heading uppercase tracking-wider text-sm transition-all border-b-2 ${
              activeTab === 'bans'
                ? 'text-primary border-primary bg-primary/10'
                : 'text-muted-foreground border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Ban className="w-4 h-4 inline mr-2" />
            Bans
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-primary font-heading text-xl uppercase tracking-widest">LOADING...</div>
          </div>
        ) : (
          <div>
            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center py-16 bg-card/50 border border-white/10">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-heading uppercase">No applications found</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div 
                      key={app.id} 
                      className="bg-card/50 border border-white/10 p-6 hover:border-primary/30 transition-colors"
                      data-testid="application-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-heading text-xl font-bold text-white">{app.nickname}</h3>
                          <p className="font-mono text-xs text-muted-foreground mt-1">{app.steamid}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-heading uppercase tracking-wider ${
                          app.status === 'pending' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/50' :
                          app.status === 'approved' ? 'bg-green-900/30 text-green-500 border border-green-500/50' :
                          'bg-red-900/30 text-red-500 border border-red-500/50'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase mb-1">Age</p>
                          <p className="text-white">{app.age} years</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase mb-1">Submitted</p>
                          <p className="text-white font-mono text-xs">
                            {format(new Date(app.submitted_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Experience</p>
                        <p className="text-foreground text-sm bg-muted/30 p-3">{app.experience}</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground uppercase mb-2">Reason for Applying</p>
                        <p className="text-foreground text-sm bg-muted/30 p-3">{app.reason}</p>
                      </div>

                      {app.status === 'pending' && (
                        <div className="flex space-x-3 pt-4 border-t border-white/10">
                          <button
                            onClick={() => handleApplicationStatus(app.id, 'approved')}
                            data-testid="btn-approve-application"
                            className="flex items-center space-x-2 bg-green-900/30 hover:bg-green-900/50 text-green-500 border border-green-500/50 px-4 py-2 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span className="font-heading uppercase text-sm">Approve</span>
                          </button>
                          <button
                            onClick={() => handleApplicationStatus(app.id, 'rejected')}
                            data-testid="btn-reject-application"
                            className="flex items-center space-x-2 bg-red-900/30 hover:bg-red-900/50 text-red-500 border border-red-500/50 px-4 py-2 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span className="font-heading uppercase text-sm">Reject</span>
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
              <div className="bg-card/50 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="users-table">
                    <thead className="bg-muted/50 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Nickname</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">SteamID</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors" data-testid="user-row">
                          <td className="px-6 py-4 font-heading font-bold text-white">{user.nickname}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{user.email}</td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{user.steamid || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-heading uppercase ${
                              user.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/50' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
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
              <div className="bg-card/50 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="bans-table">
                    <thead className="bg-muted/50 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Player</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">SteamID</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-left font-heading text-xs text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bans.map((ban) => (
                        <tr key={ban.id} className="hover:bg-white/5 transition-colors" data-testid="ban-row-admin">
                          <td className="px-6 py-4 font-heading font-bold text-white">{ban.player_nickname}</td>
                          <td className="px-6 py-4 font-mono text-xs text-primary">{ban.steamid}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{ban.reason}</td>
                          <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{ban.duration}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteBan(ban.id)}
                              data-testid="btn-delete-ban"
                              className="text-red-500 hover:text-red-400 hover:bg-red-900/20 p-2 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bans.length === 0 && (
                  <div className="text-center py-16">
                    <Ban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-heading uppercase">No bans found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
