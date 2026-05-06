// pages/ProjectDetailPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTriangleExclamation,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchProjet,
  updateProjet,
  deleteProjet,
} from "../store/slices/projetSlice";
import {
  fetchTaches,
  createTache,
  updateStatut,
  deleteTache,
  addCommentaire,
} from "../store/slices/tacheSlice";
import {
  Button,
  Badge,
  Spinner,
  Modal,
  Input,
  Textarea,
  Select,
  Avatar,
} from "../components/ui";
import toast from "react-hot-toast";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";
import {
  fetchInvitationsProjet,
  envoyerInvitation,
  annulerInvitation,
} from "../store/slices/invitationSlice";
import "../styles/components.css";

const COLUMNS = [
  {
    key: "a_faire",
    label: "À faire",
    dot: "#8b949e",
    activeClass: "active-todo",
  },
  {
    key: "en_cours",
    label: "En cours",
    dot: "#388bfd",
    activeClass: "active-doing",
  },
  {
    key: "termine",
    label: "Terminé",
    dot: "#10b981",
    activeClass: "active-done",
  },
];

const PRIORITY_COLORS = {
  faible: "#484f58",
  normale: "#8b949e",
  haute: "#d29922",
  urgente: "#f85149",
};

const PROJECT_STATUS_META = {
  actif: { color: "green", label: "Actif" },
  en_pause: { color: "yellow", label: "En pause" },
  terminé: { color: "blue", label: "Terminé" },
  annulé: { color: "red", label: "Annulé" },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, loading: projLoading } = useSelector((s) => s.projets);
  const { list: taches, loading: tachesLoading } = useSelector((s) => s.taches);
  const { user } = useSelector((s) => s.auth);

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskCol, setNewTaskCol] = useState("a_faire");
  const [taskForm, setTaskForm] = useState({
    titre: "",
    description: "",
    assigne_a: "",
    priorite: "normale",
    date_echeance: "",
  });
  const [savingTask, setSavingTask] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [taskComments, setTaskComments] = useState([]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const invitationsProjet = useSelector(
    (s) => s.invitations.parProjet[id] || [],
  );
  const [editProject, setEditProject] = useState(false);
  const [editForm, setEditForm] = useState({});

  const projet = current?.projet;
  useSocket(id); // Join project room for real-time updates
  const membres = current?.membres || [];
  const isOwner =
    projet &&
    (projet.createur_id === user?.id || user?.role === "administrateur");

  useEffect(() => {
    dispatch(fetchProjet(id));
    dispatch(fetchTaches({ projetId: id }));
    api.get("/utilisateurs").then((r) => setUtilisateurs(r.data.utilisateurs));
    if (isOwner !== false) dispatch(fetchInvitationsProjet(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (projet)
      setEditForm({
        titre: projet.titre,
        description: projet.description || "",
        statut: projet.statut,
        date_echeance: projet.date_echeance?.slice(0, 10) || "",
      });
  }, [projet]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.titre.trim()) return;
    setSavingTask(true);
    const payload = { ...taskForm, assigne_a: taskForm.assigne_a || undefined };
    const res = await dispatch(createTache({ projetId: id, ...payload }));
    setSavingTask(false);
    if (!res.error) {
      toast.success("Tâche créée !");
      setShowNewTask(false);
      setTaskForm({
        titre: "",
        description: "",
        assigne_a: "",
        priorite: "normale",
        date_echeance: "",
      });
    }
  };

  const handleStatusChange = async (taskId, newStatut) => {
    await dispatch(updateStatut({ id: taskId, statut: newStatut }));
    if (selectedTask?.id === taskId)
      setSelectedTask((t) => ({ ...t, statut: newStatut }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    await dispatch(deleteTache(taskId));
    setSelectedTask(null);
    toast.success("Tâche supprimée.");
  };

  const openTask = async (task) => {
    setSelectedTask(task);
    try {
      const { data } = await api.get(`/taches/${task.id}`);
      setTaskComments(data.commentaires);
    } catch {
      setTaskComments([]);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSendingComment(true);
    const res = await dispatch(
      addCommentaire({ id: selectedTask.id, contenu: comment }),
    );
    setSendingComment(false);
    if (!res.error) {
      setTaskComments((c) => [...c, res.payload.commentaire]);
      setComment("");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteUserId) return;
    setSendingInvite(true);
    const res = await dispatch(
      envoyerInvitation({
        projetId: id,
        utilisateur_id: parseInt(inviteUserId),
        message: inviteMessage,
      }),
    );
    setSendingInvite(false);
    if (!res.error) {
      toast.success("Invitation envoyée !");
      setInviteUserId("");
      setInviteMessage("");
      setShowInviteModal(false);
      dispatch(fetchInvitationsProjet(id));
    }
  };

  const handleAnnulerInvitation = async (invId) => {
    await dispatch(annulerInvitation(invId));
    toast.success("Invitation annulée.");
    dispatch(fetchInvitationsProjet(id));
  };

  const handleRetirerMembre = async (userId, nomMembre) => {
    if (!window.confirm(`Retirer ${nomMembre} du projet ?`)) return;
    try {
      await api.delete(`/projets/${id}/membres/${userId}`);
      toast.success(`${nomMembre} a été retiré du projet.`);
      dispatch(fetchProjet(id));
    } catch {}
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    const res = await dispatch(updateProjet({ id, ...editForm }));
    if (!res.error) {
      toast.success("Projet modifié.");
      setEditProject(false);
      dispatch(fetchProjet(id));
    }
  };

  const handleDeleteProject = async () => {
    if (
      !window.confirm(
        "Supprimer définitivement ce projet et toutes ses tâches ?",
      )
    )
      return;
    await dispatch(deleteProjet(id));
    toast.success("Projet supprimé.");
    navigate("/projects");
  };

  if (projLoading && !projet) return <Spinner size="lg" center />;
  if (!projet)
    return (
      <div className="page-body">
        <p>Projet introuvable.</p>
      </div>
    );

  const tachesParCol = (col) => taches.filter((t) => t.statut === col);
  const pendingInvitations = invitationsProjet.filter(
    (i) => i.statut === "en_attente",
  );
  const totalTasks = taches.length;
  const completedTasks = tachesParCol("termine").length;
  const overdueTasks = taches.filter(
    (task) =>
      task.date_echeance &&
      new Date(task.date_echeance) < new Date() &&
      task.statut !== "termine",
  ).length;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const projectStatus =
    PROJECT_STATUS_META[projet.statut] || {
      color: "gray",
      label: projet.statut,
    };

  return (
    <div>
      <div className="page-header project-hero">
        <div className="project-hero-copy">
          <p className="page-subtitle project-hero-back">
            <Link to="/projects">
              <FontAwesomeIcon icon={faArrowLeft} /> Retour aux projets
            </Link>
          </p>
          <div className="project-hero-title-row">
            <h1 className="page-title">{projet.titre}</h1>
            <Badge color={projectStatus.color}>{projectStatus.label}</Badge>
          </div>
          <p className="project-hero-description">
            {projet.description || "Un espace central pour suivre l'avancement, les membres et les tâches du projet."}
          </p>
          <div className="project-hero-stats">
            <div className="project-hero-stat">
              <span className="project-hero-stat-label">Avancement</span>
              <strong className="project-hero-stat-value">{progress}%</strong>
            </div>
            <div className="project-hero-stat">
              <span className="project-hero-stat-label">Tâches</span>
              <strong className="project-hero-stat-value">{totalTasks}</strong>
            </div>
            <div className="project-hero-stat">
              <span className="project-hero-stat-label">Membres</span>
              <strong className="project-hero-stat-value">{membres.length}</strong>
            </div>
            <div className="project-hero-stat">
              <span className="project-hero-stat-label">En retard</span>
              <strong className="project-hero-stat-value">{overdueTasks}</strong>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="project-hero-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowInviteModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Inviter</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditProject(true)}
            >
              Modifier
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteProject}>
              Supprimer
            </Button>
          </div>
        )}
      </div>

      <div className="page-body">
        <div className="detail-shell">
          {/* Main: Kanban */}
          <div className="detail-main">
            <div className="detail-toolbar">
              <h2 className="section-title">Tableau des tâches</h2>
              <Button
                size="sm"
                onClick={() => {
                  setNewTaskCol("a_faire");
                  setShowNewTask(true);
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Tâche</span>
              </Button>
            </div>

            {tachesLoading ? (
              <Spinner center />
            ) : (
              <div className="kanban-board">
                {COLUMNS.map((col) => {
                  const cards = tachesParCol(col.key);
                  return (
                    <div key={col.key} className="kanban-col">
                      <div className="kanban-col-header">
                        <span className="kanban-col-title">
                          <span
                            className="kanban-col-dot"
                            style={{ background: col.dot }}
                          />
                          {col.label}
                        </span>
                        <span className="kanban-col-count">{cards.length}</span>
                      </div>

                      <div className="kanban-cards">
                        {cards.length === 0 && (
                          <p className="kanban-empty">Aucune tâche</p>
                        )}
                        {cards.map((task) => {
                          const isOverdue =
                            task.date_echeance &&
                            new Date(task.date_echeance) < new Date() &&
                            task.statut !== "termine";
                          return (
                            <div
                              key={task.id}
                              className="task-card"
                              onClick={() => openTask(task)}
                            >
                              <div className="task-card-top">
                                <span className="task-title">{task.titre}</span>
                                <span
                                  className={`priority-dot priority-${task.priorite}`}
                                  title={task.priorite}
                                />
                              </div>
                              {task.description && (
                                <p className="task-desc">{task.description}</p>
                              )}
                              <div className="task-card-footer">
                                {task.assigne_nom ? (
                                  <span className="task-assignee">
                                    <Avatar name={task.assigne_nom} size="sm" />
                                    {task.assigne_nom}
                                  </span>
                                ) : (
                                  <span />
                                )}
                                {task.date_echeance && (
                                  <span
                                    className={`task-date ${isOverdue ? "task-overdue" : ""}`}
                                  >
                                    {isOverdue ? <FontAwesomeIcon icon={faTriangleExclamation} /> : null}{" "}
                                    {new Date(
                                      task.date_echeance,
                                    ).toLocaleDateString("fr-FR")}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        className="kanban-add-btn"
                        onClick={() => {
                          setNewTaskCol(col.key);
                          setShowNewTask(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faPlus} /> Ajouter une tâche
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="detail-sidebar">
            {/* Info projet */}
            <div className="detail-section">
              <div className="detail-section-header">Infos du projet</div>
              <div className="detail-section-body detail-stack">
                <InfoRow
                  label="Statut"
                  value={
                    <Badge color={projectStatus.color}>{projectStatus.label}</Badge>
                  }
                />
                <InfoRow label="Créateur" value={projet.createur_nom} />
                {projet.date_echeance && (
                  <InfoRow
                    label="Échéance"
                    value={new Date(projet.date_echeance).toLocaleDateString(
                      "fr-FR",
                    )}
                  />
                )}
                <InfoRow
                  label="Créé le"
                  value={new Date(projet.date_creation).toLocaleDateString(
                    "fr-FR",
                  )}
                />
              </div>
            </div>

            {/* Membres */}
            <div className="detail-section">
              <div className="detail-section-header">
                <span>
                  Membres{" "}
                  <span className="kanban-col-count">{membres.length}</span>
                </span>
                {isOwner && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowInviteModal(true)}
                  >
                    + Inviter
                  </button>
                )}
              </div>
              <div className="detail-section-body">
                <div className="member-list">
                  {membres.map((m) => (
                    <div key={m.id} className="member-item">
                      <Avatar name={m.nom} size="sm" />
                      <div className="member-info">
                        <div className="member-name">{m.nom}</div>
                        <div className="member-role">{m.role_projet}</div>
                      </div>
                      {isOwner && m.role_projet !== "chef" && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{
                            color: "var(--danger)",
                            padding: "2px 6px",
                            marginLeft: "auto",
                          }}
                          onClick={() => handleRetirerMembre(m.id, m.nom)}
                          title="Retirer du projet"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Invitations en attente */}
            {isOwner &&
              pendingInvitations.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-header">
                    Invitations en attente
                    <span className="kanban-col-count">
                      {pendingInvitations.length}
                    </span>
                  </div>
                  <div className="detail-section-body">
                    <div className="member-list">
                      {pendingInvitations.map((inv) => (
                          <div key={inv.id} className="member-item">
                            <Avatar name={inv.utilisateur_nom} size="sm" />
                            <div className="member-info">
                              <div className="member-name">
                                {inv.utilisateur_nom}
                              </div>
                              <div
                                className="member-role"
                                style={{ color: "var(--warning)" }}
                              >
                                en attente
                              </div>
                            </div>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{
                                color: "var(--danger)",
                                padding: "2px 6px",
                                marginLeft: "auto",
                              }}
                              onClick={() => handleAnnulerInvitation(inv.id)}
                              title="Annuler l'invitation"
                            >
                              <FontAwesomeIcon icon={faXmark} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

            {/* Stats */}
            <div className="detail-section">
              <div className="detail-section-header">Avancement</div>
              <div className="detail-section-body detail-stack-sm">
                <div className="project-progress-block">
                  <div className="project-progress-head">
                    <span>Progression globale</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="proj-progress-bar">
                    <div
                      className="proj-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                {COLUMNS.map((col) => {
                  const count = tachesParCol(col.key).length;
                  return (
                    <div key={col.key} className="progress-row">
                      <span
                        className="progress-dot"
                        style={{ background: col.dot }}
                      />
                      <span className="progress-label">{col.label}</span>
                      <span className="progress-value">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Task slide panel */}
      {selectedTask && (
        <>
          <div
            className="task-panel-overlay"
            onClick={() => setSelectedTask(null)}
          />
          <div className="task-panel">
            <div className="task-panel-header">
              <h3 className="task-panel-title">{selectedTask.titre}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTask(null)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </Button>
            </div>
            <div className="task-panel-body">
              {selectedTask.description && (
                <div className="task-panel-section">
                  <p className="task-panel-label">Description</p>
                  <p className="task-panel-text">{selectedTask.description}</p>
                </div>
              )}

              <div className="task-panel-section">
                <p className="task-panel-label">Statut</p>
                <div className="status-selector">
                  {COLUMNS.map((col) => (
                    <button
                      key={col.key}
                      className={`status-btn ${selectedTask.statut === col.key ? col.activeClass : ""}`}
                      onClick={() =>
                        handleStatusChange(selectedTask.id, col.key)
                      }
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="task-panel-meta">
                {selectedTask.assigne_nom && (
                  <InfoRow
                    label="Assigné à"
                    value={
                      <span className="inline-person">
                        <Avatar name={selectedTask.assigne_nom} size="sm" />
                        {selectedTask.assigne_nom}
                      </span>
                    }
                  />
                )}
                {selectedTask.date_echeance && (
                  <InfoRow
                    label="Échéance"
                    value={new Date(
                      selectedTask.date_echeance,
                    ).toLocaleDateString("fr-FR")}
                  />
                )}
                <InfoRow
                  label="Priorité"
                  value={
                    <span
                      style={{
                        color: PRIORITY_COLORS[selectedTask.priorite],
                        fontWeight: 600,
                      }}
                    >
                      {selectedTask.priorite}
                    </span>
                  }
                />
              </div>

              {/* Comments */}
              <div className="task-panel-section">
                <p className="task-panel-label">
                  Commentaires ({taskComments.length})
                </p>
                <div className="comment-list">
                  {taskComments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <Avatar name={c.auteur_nom || ""} size="sm" />
                      <div className="comment-bubble">
                        <div className="comment-meta">
                          <span className="comment-author">{c.auteur_nom}</span>
                          {" · "}
                          {new Date(c.date_creation).toLocaleDateString(
                            "fr-FR",
                          )}
                        </div>
                        <p className="comment-text">{c.contenu}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={handleSendComment}
                  className="comment-form"
                >
                  <input
                    className="comment-input"
                    placeholder="Ajouter un commentaire…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button type="submit" size="sm" loading={sendingComment}>
                    Envoyer
                  </Button>
                </form>
              </div>

              <div className="task-panel-footer">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                >
                  Supprimer la tâche
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteSearch("");
          setInviteUserId("");
          setInviteMessage("");
        }}
        title="Inviter un membre"
      >
        <form onSubmit={handleInvite} className="modal-form" noValidate>
          <div>
            <label className="field-label">Rechercher un utilisateur</label>
            <input
              className="field-input"
              placeholder="Taper un nom ou email…"
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              autoFocus
            />
          </div>

          {inviteSearch.length >= 1 && (
            <div className="invite-user-list">
              {utilisateurs
                .filter(
                  (u) =>
                    (u.nom.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                      u.email
                        .toLowerCase()
                        .includes(inviteSearch.toLowerCase())) &&
                    !membres.find((m) => m.id === u.id) &&
                    !invitationsProjet.find(
                      (i) =>
                        i.utilisateur_id === u.id && i.statut === "en_attente",
                    ),
                )
                .slice(0, 6)
                .map((u) => (
                  <div
                    key={u.id}
                    className={`invite-user-item ${inviteUserId === String(u.id) ? "selected" : ""}`}
                    onClick={() => {
                      setInviteUserId(String(u.id));
                      setInviteSearch(u.nom);
                    }}
                  >
                    <Avatar name={u.nom} size="sm" />
                    <div className="invite-user-meta">
                      <div className="invite-user-name">{u.nom}</div>
                      <div className="invite-user-email">{u.email}</div>
                    </div>
                    {inviteUserId === String(u.id) && (
                      <span className="invite-user-check">
                        <FontAwesomeIcon icon={faCheck} />
                      </span>
                    )}
                  </div>
                ))}
              {utilisateurs.filter(
                (u) =>
                  (u.nom.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                    u.email
                      .toLowerCase()
                      .includes(inviteSearch.toLowerCase())) &&
                  !membres.find((m) => m.id === u.id) &&
                  !invitationsProjet.find(
                    (i) =>
                      i.utilisateur_id === u.id && i.statut === "en_attente",
                  ),
              ).length === 0 && (
                <p className="invite-empty">
                  Aucun utilisateur trouvé ou déjà membre / invitation en
                  attente.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="field-label">
              Message personnalisé (optionnel)
            </label>
            <input
              className="field-input"
              placeholder="ex: Rejoins notre équipe !"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={sendingInvite}
              disabled={!inviteUserId}
            >
              Envoyer l'invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Task Modal */}
      <Modal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        title="Nouvelle tâche"
      >
        <form onSubmit={handleCreateTask} className="modal-form" noValidate>
          <Input
            label="Titre *"
            placeholder="ex: Intégrer la maquette"
            value={taskForm.titre}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, titre: e.target.value }))
            }
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="Détails de la tâche…"
            value={taskForm.description}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <div className="detail-form-grid">
            <Select
              label="Assigner à"
              value={taskForm.assigne_a}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, assigne_a: e.target.value }))
              }
            >
              <option value="">Non assigné</option>
              {membres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </Select>
            <Select
              label="Priorité"
              value={taskForm.priorite}
              onChange={(e) =>
                setTaskForm((f) => ({ ...f, priorite: e.target.value }))
              }
            >
              <option value="faible">Faible</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </Select>
          </div>
          <Select
            label="Colonne initiale"
            value={newTaskCol}
            onChange={(e) => setNewTaskCol(e.target.value)}
          >
            {COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Select>
          <Input
            label="Date d'échéance"
            type="date"
            value={taskForm.date_echeance}
            onChange={(e) =>
              setTaskForm((f) => ({ ...f, date_echeance: e.target.value }))
            }
          />
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowNewTask(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={savingTask}>
              Créer la tâche
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit project modal */}
      <Modal
        isOpen={editProject}
        onClose={() => setEditProject(false)}
        title="Modifier le projet"
      >
        <form onSubmit={handleUpdateProject} className="modal-form" noValidate>
          <Input
            label="Titre *"
            value={editForm.titre || ""}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, titre: e.target.value }))
            }
          />
          <Textarea
            label="Description"
            value={editForm.description || ""}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <Select
            label="Statut"
            value={editForm.statut || "actif"}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, statut: e.target.value }))
            }
          >
            <option value="actif">Actif</option>
            <option value="en_pause">En pause</option>
            <option value="terminé">Terminé</option>
            <option value="annulé">Annulé</option>
          </Select>
          <Input
            label="Date d'échéance"
            type="date"
            value={editForm.date_echeance || ""}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, date_echeance: e.target.value }))
            }
          />
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditProject(false)}
            >
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-row-label">{label}</span>
      <span className="info-row-value">{value}</span>
    </div>
  );
}
