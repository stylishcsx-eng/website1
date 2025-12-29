import { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ApplyAdmin = () => {
  const [formData, setFormData] = useState({
    nickname: '',
    steamid: '',
    age: '',
    experience: '',
    reason: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/admin-applications`, {
        ...formData,
        age: parseInt(formData.age)
      });
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CheckCircle className="w-24 h-24 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold font-secondary uppercase text-white mb-4">
            APPLICATION SUBMITTED
          </h1>
          <p className="text-zinc-400 mb-8">
            Thank you for applying! Your application will be reviewed by our admin team. You will be notified via email about the status.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            data-testid="btn-submit-another"
            className="bg-primary hover:bg-primary/90 text-white font-secondary uppercase tracking-widest px-8 py-3 transition-all"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter uppercase font-secondary text-white mb-4">
            APPLY FOR ADMIN
          </h1>
          <p className="text-zinc-400">Join our admin team and help maintain fair gameplay</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 border border-zinc-800 p-8">
          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-secondary">
              Nickname *
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              data-testid="input-nickname"
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors"
              placeholder="Your in-game nickname"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-secondary">
              SteamID *
            </label>
            <input
              type="text"
              name="steamid"
              value={formData.steamid}
              onChange={handleChange}
              data-testid="input-steamid"
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors"
              placeholder="STEAM_0:0:123456"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-secondary">
              Age *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              data-testid="input-age"
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors"
              placeholder="18"
              min="16"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-secondary">
              Experience *
            </label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              data-testid="textarea-experience"
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors h-24"
              placeholder="Describe your CS 1.6 experience and any previous admin experience..."
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-secondary">
              Why do you want to be admin? *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              data-testid="textarea-reason"
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary px-4 py-3 text-white font-mono text-sm outline-none transition-colors h-32"
              placeholder="Explain why you want to become an admin on our server..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="btn-submit-application"
            className="w-full bg-primary hover:bg-primary/90 text-white font-secondary uppercase tracking-widest px-8 py-3 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'Submitting...' : 'Submit Application'}</span>
          </button>

          <div className="border-t border-zinc-800 pt-4 mt-4">
            <p className="text-xs text-zinc-500">
              * All fields are required. Applications are reviewed by the admin team and you will be contacted via your registered email.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};