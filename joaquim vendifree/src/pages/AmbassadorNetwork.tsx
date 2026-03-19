import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, User, Award } from 'lucide-react';

interface Ambassador {
  id: string;
  name: string;
  socialMedia: string;
}

interface Discussion {
  id: string;
  authorName: string;
  text: string;
  createdAt: any;
}

export const AmbassadorNetwork = () => {
  const { t } = useTranslation();
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAmbassador, setIsAmbassador] = useState<boolean | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Check if current user is an approved ambassador
    const qMyAmb = query(collection(db, 'ambassadors'), where('userId', '==', auth.currentUser.uid), where('status', '==', 'approved'));
    const unsubscribeMyAmb = onSnapshot(qMyAmb, (snapshot) => {
      setIsAmbassador(!snapshot.empty);
    });

    // Fetch active ambassadors and discussions only if approved
    const qAmb = query(collection(db, 'ambassadors'), where('status', '==', 'approved'));
    const unsubscribeAmb = onSnapshot(qAmb, (snapshot) => {
      setAmbassadors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ambassador)));
    });

    const qDisc = query(collection(db, 'discussions'), orderBy('createdAt', 'desc'));
    const unsubscribeDisc = onSnapshot(qDisc, (snapshot) => {
      setDiscussions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discussion)));
    });

    return () => { unsubscribeMyAmb(); unsubscribeAmb(); unsubscribeDisc(); };
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'discussions'), {
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'Ambassador',
      text: newMessage,
      createdAt: serverTimestamp()
    });
    setNewMessage('');
  };

  if (isAmbassador === null) return <div className="text-center py-20 text-white">A carregar...</div>;
  if (!isAmbassador) return <div className="text-center py-20 text-white">Acesso restrito a embaixadores ativos.</div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-serif text-white mb-12">Rede de <span className="text-gold">Embaixadores</span></h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Active Ambassadors */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-serif text-white flex items-center gap-2"><Award className="text-gold" /> Embaixadores Ativos</h2>
          <div className="bg-[#111] rounded-2xl p-6 border border-gold/10 space-y-4">
            {ambassadors.map(amb => (
              <div key={amb.id} className="flex items-center gap-4 p-4 bg-black/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold"><User className="w-5 h-5" /></div>
                <div>
                  <div className="text-white font-medium">{amb.name}</div>
                  <div className="text-xs text-gray-500">{amb.socialMedia}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discussion Panel */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-serif text-white flex items-center gap-2"><MessageCircle className="text-gold" /> Painel de Ideias</h2>
          <div className="bg-[#111] rounded-2xl p-6 border border-gold/10 h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {discussions.map(d => (
                <div key={d.id} className="p-4 bg-black/50 rounded-xl border border-gold/5">
                  <div className="text-xs text-gold font-bold mb-1">{d.authorName}</div>
                  <div className="text-white">{d.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handlePost} className="flex gap-2">
              <input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Partilhe uma ideia de mercado..."
                className="flex-1 bg-black border border-gold/20 rounded-full px-6 py-3 text-white focus:outline-none focus:border-gold"
              />
              <button className="bg-gold text-black p-3 rounded-full"><Send className="w-5 h-5" /></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
