import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User as FirebaseUser, updateProfile } from 'firebase/auth';
import { Camera, Save, Loader2 } from 'lucide-react';

export const Profile = ({ user }: { user: FirebaseUser | null }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    phoneNumber: '',
    bio: '',
    photoURL: user?.photoURL || ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfileData(prev => ({ ...prev, ...docSnap.data() }));
      }
    };
    fetchProfile();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setProfileData(prev => ({ ...prev, photoURL: URL.createObjectURL(e.target.files![0]) }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let newPhotoURL = profileData.photoURL;

      if (imageFile) {
        const storageRef = ref(storage, `profiles/${user.uid}/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName: profileData.displayName,
        photoURL: newPhotoURL
      });

      await setDoc(doc(db, 'users', user.uid), {
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        bio: profileData.bio,
        photoURL: newPhotoURL,
        updatedAt: new Date()
      }, { merge: true });

      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center py-20 text-poly-coral">Acesso Negado</div>;

  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <h1 className="text-4xl font-serif text-poly-sand mb-8">O Meu Perfil</h1>
      
      <form onSubmit={handleSave} className="bg-poly-dark-light p-10 rounded-[3rem] border border-poly-coral/20 space-y-8">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-poly-ocean/30">
              {profileData.photoURL ? (
                <img src={profileData.photoURL} alt="Profile" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-poly-dark flex items-center justify-center text-poly-sand/50 text-4xl">
                  {profileData.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-poly-ocean text-poly-dark p-3 rounded-full cursor-pointer hover:bg-poly-sand transition-all shadow-lg">
              <Camera className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          <p className="text-poly-sand/60 text-sm">{user.email}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-poly-coral mb-2">Nome de Exibição</label>
            <input 
              type="text" 
              className="w-full bg-poly-dark border-b border-poly-coral/30 py-4 outline-none text-poly-sand focus:border-poly-coral transition-all"
              value={profileData.displayName}
              onChange={e => setProfileData({...profileData, displayName: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-poly-coral mb-2">Telemóvel</label>
            <input 
              type="tel" 
              className="w-full bg-poly-dark border-b border-poly-coral/30 py-4 outline-none text-poly-sand focus:border-poly-coral transition-all"
              value={profileData.phoneNumber}
              onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
              placeholder="+351 900 000 000"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-poly-coral mb-2">Biografia</label>
            <textarea 
              className="w-full bg-poly-dark border-b border-poly-coral/30 py-4 outline-none text-poly-sand focus:border-poly-coral transition-all h-32 resize-none"
              value={profileData.bio}
              onChange={e => setProfileData({...profileData, bio: e.target.value})}
              placeholder="Fale um pouco sobre si..."
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-poly-ocean text-poly-dark py-4 rounded-full uppercase tracking-[0.2em] text-sm font-black hover:bg-poly-sand transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {loading ? 'A Guardar...' : 'Guardar Alterações'}
        </button>
      </form>
    </div>
  );
};
