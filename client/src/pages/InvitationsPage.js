// pages/InvitationsPage.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { fetchMesInvitations, accepterInvitation, refuserInvitation } from '../store/slices/invitationSlice';
import { fetchProjets } from '../store/slices/projetSlice';
import { Button, Badge, Spinner, Avatar, EmptyState } from '../components/ui';
import toast from 'react-hot-toast';
import '../styles/invitations.css';

const STATUT_META = {
  en_attente: { color: 'yellow', label: 'En attente' },
  acceptee:   { color: 'green',  label: 'Acceptée' },
  refusee:    { color: 'red',    label: 'Refusée' },
  annulee:    { color: 'gray',   label: 'Annulée' },
};

export default function InvitationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mesInvitations, loading } = useSelector(s => s.invitations);

  useEffect(() => { dispatch(fetchMesInvitations()); }, [dispatch]);

  const handleAccepter = async (inv) => {
    const res = await dispatch(accepterInvitation(inv.id));
    if (!res.error) {
      toast.success(`Vous avez rejoint "${inv.projet_titre}" !`);
      dispatch(fetchProjets({ limite: 50 }));
      navigate(`/projects/${inv.projet_id}`);
    }
  };

  const handleRefuser = async (inv) => {
    if (!window.confirm(`Refuser l'invitation pour "${inv.projet_titre}" ?`)) return;
    const res = await dispatch(refuserInvitation(inv.id));
    if (!res.error) toast.success('Invitation refusée.');
  };

  if (loading) return <Spinner size="lg" center />;

  const enAttente = mesInvitations.filter(i => i.statut === 'en_attente');
  const historique = mesInvitations.filter(i => i.statut !== 'en_attente');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invitations</h1>
          <p className="page-subtitle">
            {enAttente.length > 0
              ? `${enAttente.length} invitation(s) en attente de réponse`
              : 'Aucune invitation en attente'}
          </p>
        </div>
      </div>

      <div className="page-body">
        {/* En attente */}
        {enAttente.length > 0 && (
          <section className="inv-section">
            <h2 className="section-title" style={{ marginBottom: 14 }}>En attente</h2>
            <div className="inv-list">
              {enAttente.map((inv, i) => (
                <InvitationCard
                  key={inv.id}
                  inv={inv}
                  onAccepter={() => handleAccepter(inv)}
                  onRefuser={() => handleRefuser(inv)}
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Historique */}
        <section className="inv-section" style={{ marginTop: enAttente.length > 0 ? 32 : 0 }}>
          <h2 className="section-title" style={{ marginBottom: 14 }}>Historique</h2>
          {historique.length === 0 && enAttente.length === 0 ? (
            <EmptyState
              icon={<FontAwesomeIcon icon={faEnvelope} />}
              title="Aucune invitation"
              description="Vous n'avez reçu aucune invitation pour l'instant."
            />
          ) : historique.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun historique.</p>
          ) : (
            <div className="inv-list">
              {historique.map(inv => (
                <InvitationCard key={inv.id} inv={inv} readonly />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InvitationCard({ inv, onAccepter, onRefuser, readonly = false, style }) {
  const meta = STATUT_META[inv.statut] || { color: 'gray', label: inv.statut };
  const date = new Date(inv.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="inv-card fade-in" style={style}>
      <div className="inv-card-left">
        <div className="inv-project-icon">
          <FontAwesomeIcon icon={faFolderOpen} />
        </div>
        <div className="inv-info">
          <h3 className="inv-project-name">{inv.projet_titre}</h3>
          {inv.projet_description && (
            <p className="inv-project-desc">{inv.projet_description}</p>
          )}
          <div className="inv-meta">
            <Avatar name={inv.invite_par_nom || ''} size="sm" />
            <span className="inv-from">
              Invité par <strong>{inv.invite_par_nom}</strong>
            </span>
            <span className="inv-date">· {date}</span>
          </div>
          {inv.message && (
            <blockquote className="inv-message">"{inv.message}"</blockquote>
          )}
        </div>
      </div>
      <div className="inv-card-right">
        <Badge color={meta.color}>{meta.label}</Badge>
        {!readonly && inv.statut === 'en_attente' && (
          <div className="inv-actions">
            <Button size="sm" onClick={onAccepter}>Accepter</Button>
            <Button size="sm" variant="secondary" onClick={onRefuser}>Refuser</Button>
          </div>
        )}
      </div>
    </div>
  );
}
