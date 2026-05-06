// pages/ProfilePage.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '../store/slices/authSlice';
import { Button, Input, Avatar } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import '../styles/global.css';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const [profileForm, setProfileForm] = useState({ nom: user?.nom || '', avatar: user?.avatar || '' });
  const [pwdForm, setPwdForm] = useState({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const handleProfile = async e => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', profileForm);
      await dispatch(fetchMe());
      toast.success('Profil mis à jour !');
    } finally { setSavingProfile(false); }
  };

  const handlePassword = async e => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.nouveau_mot_de_passe.length < 6) { setPwdError('Minimum 6 caractères.'); return; }
    if (pwdForm.nouveau_mot_de_passe !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
    setSavingPwd(true);
    try {
      await api.put('/auth/password', {
        ancien_mot_de_passe: pwdForm.ancien_mot_de_passe,
        nouveau_mot_de_passe: pwdForm.nouveau_mot_de_passe,
      });
      toast.success('Mot de passe modifié !');
      setPwdForm({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirm: '' });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Erreur.');
    } finally { setSavingPwd(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mon profil</h1>
          <p className="page-subtitle">Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className="page-body">
        <div className="profile-grid">
          {/* Left: profile card */}
          <div className="profile-card fade-in">
            <div className="profile-avatar-section">
              <Avatar name={user?.nom || ''} size="lg" />
              <div>
                <h2 className="profile-name">{user?.nom}</h2>
                <span className="profile-role">{user?.role}</span>
              </div>
            </div>
            <div className="profile-info-list">
              <ProfileInfo label="Email" value={user?.email} mono />
              <ProfileInfo label="Rôle" value={user?.role} />
              <ProfileInfo label="Membre depuis" value={user?.date_inscription ? new Date(user.date_inscription).toLocaleDateString('fr-FR') : '—'} />
            </div>
          </div>

          {/* Right: forms */}
          <div className="profile-forms">
            {/* Edit profile */}
            <div className="profile-section fade-in" style={{ animationDelay: '0.05s' }}>
              <h3 className="profile-section-title">Informations générales</h3>
              <form onSubmit={handleProfile} className="modal-form">
                <Input
                  label="Nom complet"
                  value={profileForm.nom}
                  onChange={e => setProfileForm(f => ({ ...f, nom: e.target.value }))}
                  required
                />
                <Input
                  label="URL de l'avatar (optionnel)"
                  placeholder="https://..."
                  value={profileForm.avatar}
                  onChange={e => setProfileForm(f => ({ ...f, avatar: e.target.value }))}
                />
                <div className="modal-actions">
                  <Button type="submit" loading={savingProfile}>Enregistrer</Button>
                </div>
              </form>
            </div>

            {/* Change password */}
            <div className="profile-section fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="profile-section-title">Changer le mot de passe</h3>
              <form onSubmit={handlePassword} className="modal-form">
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  placeholder="••••••••"
                  value={pwdForm.ancien_mot_de_passe}
                  onChange={e => setPwdForm(f => ({ ...f, ancien_mot_de_passe: e.target.value }))}
                  required
                />
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  placeholder="Min. 6 caractères"
                  value={pwdForm.nouveau_mot_de_passe}
                  onChange={e => setPwdForm(f => ({ ...f, nouveau_mot_de_passe: e.target.value }))}
                  error={pwdError}
                  required
                />
                <Input
                  label="Confirmer"
                  type="password"
                  placeholder="••••••••"
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                />
                {pwdError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{pwdError}</p>}
                <div className="modal-actions">
                  <Button type="submit" loading={savingPwd} variant="secondary">Modifier le mot de passe</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileInfo({ label, value, mono }) {
  return (
    <div className="profile-info-row">
      <span className="profile-info-label">{label}</span>
      <span className={`profile-info-value ${mono ? 'mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}
