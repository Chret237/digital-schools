// pages/ProjectsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faFolderOpen,
  faXmark,
  faCalendarDays,
  faListCheck,
  faUsers,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { fetchProjets, createProjet, deleteProjet } from '../store/slices/projetSlice';
import { Button, Input, Select, Badge, Spinner, Modal, Textarea, EmptyState } from '../components/ui';
import { Avatar } from '../components/ui';
import toast from 'react-hot-toast';
import '../styles/components.css';

const STATUT_META = {
  actif:    { color: 'green',  label: 'Actif' },
  en_pause: { color: 'yellow', label: 'En pause' },
  'terminé':{ color: 'blue',   label: 'Terminé' },
  annulé:   { color: 'red',    label: 'Annulé' },
};

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector(s => s.projets);
  const { user } = useSelector(s => s.auth);

  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]   = useState({ titre: '', description: '', date_echeance: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const load = useCallback(() => {
    dispatch(fetchProjets({ page, limite: 9, search: search || undefined, statut: statut || undefined }));
  }, [dispatch, page, search, statut]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.titre.trim()) { setErrors({ titre: 'Le titre est requis.' }); return; }
    setSaving(true);
    const res = await dispatch(createProjet(form));
    setSaving(false);
    if (!res.error) {
      toast.success('Projet créé !');
      setShowModal(false);
      setForm({ titre: '', description: '', date_echeance: '' });
      navigate(`/projects/${res.payload.id}`);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Supprimer ce projet ?')) return;
    await dispatch(deleteProjet(id));
    toast.success('Projet supprimé.');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projets</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} projet(s) trouvé(s)</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} />
          <span>Nouveau projet</span>
        </Button>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="proj-filters fade-in">
          <Input
            placeholder="Rechercher un projet…"
            icon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="proj-search"
          />
          <Select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} className="proj-filter-select">
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="en_pause">En pause</option>
            <option value="terminé">Terminé</option>
            <option value="annulé">Annulé</option>
          </Select>
        </div>

        {/* Grid */}
        {loading ? (
          <Spinner size="lg" center />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<FontAwesomeIcon icon={faFolderOpen} />}
            title="Aucun projet trouvé"
            description="Créez votre premier projet ou modifiez vos filtres."
            action={<Button onClick={() => setShowModal(true)}><FontAwesomeIcon icon={faPlus} /><span>Nouveau projet</span></Button>}
          />
        ) : (
          <>
            <div className="proj-grid">
              {list.map((p, i) => {
                const meta = STATUT_META[p.statut] || { color: 'gray', label: p.statut };
                const progress = p.total_taches > 0
                  ? Math.round((p.taches_terminees / p.total_taches) * 100) : 0;
                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="proj-card fade-in"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="proj-card-header">
                      <Badge color={meta.color}>{meta.label}</Badge>
                      {(p.createur_id === user?.id || user?.role === 'administrateur') && (
                        <button
                          className="proj-delete-btn"
                          onClick={e => handleDelete(e, p.id)}
                          title="Supprimer"
                          aria-label="Supprimer le projet"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      )}
                    </div>

                    <h3 className="proj-title">{p.titre}</h3>
                    <p className="proj-desc">{p.description || 'Aucune description.'}</p>

                    <div className="proj-meta">
                      {p.date_echeance && (
                        <span className="proj-date">
                          <FontAwesomeIcon icon={faCalendarDays} />{" "}
                          {new Date(p.date_echeance).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      <span className="proj-tasks">
                        <FontAwesomeIcon icon={faListCheck} />{" "}
                        {p.taches_terminees}/{p.total_taches} tâches
                      </span>
                    </div>

                    <div className="proj-progress">
                      <div className="proj-progress-bar">
                        <div className="proj-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="proj-progress-pct">{progress}%</span>
                    </div>

                    <div className="proj-footer">
                      <div className="proj-creator">
                        <Avatar name={p.createur_nom || ''} size="sm" />
                        <span className="proj-creator-name">{p.createur_nom}</span>
                      </div>
                      <span className="proj-members">
                        <FontAwesomeIcon icon={faUsers} /> {p.total_membres}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="pagination">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                  <span>Précédent</span>
                </Button>
                <span className="pagination-info">Page {page} / {pagination.pages}</span>
                <Button variant="secondary" size="sm" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>
                  <span>Suivant</span>
                  <FontAwesomeIcon icon={faChevronRight} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau projet">
        <form onSubmit={handleCreate} className="modal-form" noValidate>
          <Input
            label="Titre du projet *"
            placeholder="ex: Refonte site vitrine"
            value={form.titre}
            onChange={e => { setForm(f => ({ ...f, titre: e.target.value })); setErrors({}); }}
            error={errors.titre}
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="Décrivez les objectifs du projet…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Date d'échéance"
            type="date"
            value={form.date_echeance}
            onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Créer le projet</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
