import { Shield } from 'lucide-react';

export const Rules = () => {
  const rules = [
    { title: 'No Cheating', description: 'Use of any cheats, hacks, or exploits will result in permanent ban.' },
    { title: 'No Toxic Behavior', description: 'Respect all players. No racism, harassment, or offensive language.' },
    { title: 'No Team Killing', description: 'Intentional team killing will result in temporary or permanent ban.' },
    { title: 'No Spam', description: 'Do not spam chat, voice, or radio commands.' },
    { title: 'No Advertising', description: 'Advertising other servers or websites is not allowed.' },
    { title: 'Fair Play', description: 'Play fairly and honestly. Camping and blocking are discouraged.' },
    { title: 'Admin Respect', description: 'Respect admin decisions. If you disagree, discuss privately.' },
    { title: 'English Language', description: 'Use English in global chat for better communication.' }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 text-center">
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter uppercase font-secondary text-white mb-4">
            SERVER RULES
          </h1>
          <p className="text-zinc-400">Follow these rules to ensure fair gameplay for everyone</p>
        </div>

        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div 
              key={index} 
              className="bg-zinc-900/50 border-l-2 border-primary p-6 hover:bg-zinc-900/70 transition-colors"
              data-testid={`rule-${index + 1}`}
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/20 border border-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold font-secondary text-primary">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-secondary text-white mb-2">{rule.title}</h3>
                  <p className="text-zinc-400">{rule.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-zinc-900/50 border border-zinc-800 p-8">
          <h2 className="text-2xl font-bold font-secondary text-white mb-4 uppercase">Ban Policy</h2>
          <div className="space-y-3 text-zinc-400">
            <p>• First offense (minor): Warning or temporary ban (1-7 days)</p>
            <p>• Second offense: Temporary ban (7-30 days)</p>
            <p>• Third offense: Permanent ban</p>
            <p>• Cheating: Permanent ban on first offense</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm font-mono">
            Rules are subject to change. Admins have final say in all situations.
          </p>
        </div>
      </div>
    </div>
  );
};