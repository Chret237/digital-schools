// pages/AuthPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearError } from '../store/slices/authSlice';
import { Button, Input } from '../components/ui';
import toast from 'react-hot-toast';
import '../styles/auth.css';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });

  useEffect(() => { if (token) navigate('/dashboard'); }, [token, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(login(form));
    if (!res.error) { toast.success('Bienvenue !'); navigate('/dashboard'); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-grid" />
        <div className="auth-glow" />
      </div>

      <div className="auth-card fade-in">
        <div className="auth-logo">
          <span className="auth-logo-mark">DS</span>
          <span className="auth-logo-text">Digital Solutions</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-subtitle">Accédez à votre espace de travail</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <Input
            label="Adresse email"
            name="email"
            type="email"
            placeholder="vous@digital.cm"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <Input
            label="Mot de passe"
            name="mot_de_passe"
            type="password"
            placeholder="••••••••"
            value={form.mot_de_passe}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          <Button type="submit" loading={loading} size="lg" className="auth-submit">
            Se connecter
          </Button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ?{' '}
          <Link to="/register">Créer un compte</Link>
        </p>

        <div className="auth-hint">
          <span>Test rapide :</span>
          <code>admin@digital.cm</code> / <code>password</code>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth);
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '', confirm: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => { if (token) navigate('/dashboard'); }, [token, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = 'Le nom est requis.';
    if (!form.email) e.email = 'L\'email est requis.';
    if (form.mot_de_passe.length < 6) e.mot_de_passe = 'Minimum 6 caractères.';
    if (form.mot_de_passe !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    const { confirm, ...payload } = form;
    const res = await dispatch(register(payload));
    if (!res.error) { toast.success('Compte créé avec succès !'); navigate('/dashboard'); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-grid" />
        <div className="auth-glow" />
      </div>

      <div className="auth-card auth-card-register fade-in">
        <div className="auth-logo">
          <span className="auth-logo-mark">DS</span>
          <span className="auth-logo-text">Digital Solutions</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-subtitle">Rejoignez votre équipe sur la plateforme</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <Input label="Nom complet" name="nom" placeholder="Alice Dupont"
            value={form.nom} onChange={handleChange} error={errors.nom} required />
          <Input label="Adresse email" name="email" type="email" placeholder="vous@digital.cm"
            value={form.email} onChange={handleChange} error={errors.email} required />
          <Input label="Mot de passe" name="mot_de_passe" type="password" placeholder="Min. 6 caractères"
            value={form.mot_de_passe} onChange={handleChange} error={errors.mot_de_passe} required />
          <Input label="Confirmer le mot de passe" name="confirm" type="password" placeholder="••••••••"
            value={form.confirm} onChange={handleChange} error={errors.confirm} required />
          <Button type="submit" loading={loading} size="lg" className="auth-submit">
            Créer mon compte
          </Button>
        </form>

        <p className="auth-switch">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
