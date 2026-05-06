// pages/DashboardPage.js
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFolderOpen,
  faCheckDouble,
  faChartLine,
  faUserShield,
  faChevronRight,
  faHandSparkles,
} from "@fortawesome/free-solid-svg-icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchProjets } from "../store/slices/projetSlice";
import { Spinner, Badge, Avatar } from "../components/ui";
import "../styles/global.css";

const STATUT_COLORS = {
  a_faire: "#8b949e",
  en_cours: "#388bfd",
  termine: "#10b981",
};
const STATUT_LABELS = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { list: projets, loading } = useSelector((s) => s.projets);

  useEffect(() => {
    dispatch(fetchProjets({ limite: 10 }));
  }, [dispatch]);

  // Computed stats (memoized to avoid re-renders)
  const { totalProjets, projetsActifs, totalTaches, tachesTerminees } =
    React.useMemo(
      () => ({
        totalProjets: projets.length,
        projetsActifs: projets.filter((p) => p.statut === "actif").length,
        totalTaches: projets.reduce(
          (s, p) => s + parseInt(p.total_taches || 0),
          0,
        ),
        tachesTerminees: projets.reduce(
          (s, p) => s + parseInt(p.taches_terminees || 0),
          0,
        ),
      }),
      [projets],
    );

  const barData = React.useMemo(
    () =>
      projets.slice(0, 6).map((p) => ({
        name: p.titre.slice(0, 14) + (p.titre.length > 14 ? "…" : ""),
        taches: parseInt(p.total_taches || 0),
        terminees: parseInt(p.taches_terminees || 0),
      })),
    [projets],
  );

  const statutData = React.useMemo(
    () =>
      [
        {
          name: "Actif",
          value: projets.filter((p) => p.statut === "actif").length,
          color: "#10b981",
        },
        {
          name: "En pause",
          value: projets.filter((p) => p.statut === "en_pause").length,
          color: "#d29922",
        },
        {
          name: "Terminé",
          value: projets.filter((p) => p.statut === "terminé").length,
          color: "#388bfd",
        },
      ].filter((d) => d.value > 0),
    [projets],
  );

  const progress =
    totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  if (loading) return <Spinner size="lg" center />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting}, {user?.nom?.split(" ")[0]}{" "}
            <FontAwesomeIcon icon={faHandSparkles} />
          </h1>
          <p className="page-subtitle">Voici un aperçu de votre activité</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary btn-md">
          <FontAwesomeIcon icon={faPlus} />
          <span>Nouveau projet</span>
        </Link>
      </div>

      <div className="page-body">
        {/* Stats cards */}
        <div className="stats-grid fade-in">
          <StatCard
            icon={faFolderOpen}
            label="Projets totaux"
            value={totalProjets}
            sub={`${projetsActifs} actifs`}
            color="green"
          />
          <StatCard
            icon={faCheckDouble}
            label="Tâches complétées"
            value={tachesTerminees}
            sub={`sur ${totalTaches} total`}
            color="blue"
          />
          <StatCard
            icon={faChartLine}
            label="Avancement global"
            value={`${progress}%`}
            sub="toutes tâches confondues"
            color="yellow"
          />
          <StatCard
            icon={faUserShield}
            label="Mon rôle"
            value={user?.role === "administrateur" ? "Admin" : "Membre"}
            sub="niveau d'accès"
            color="purple"
          />
        </div>

        {/* Charts row */}
        <div className="charts-row">
          {/* Bar chart */}
          <div
            className="chart-card fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <h3 className="chart-title">Tâches par projet</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={barData}
                  margin={{ top: 4, right: 8, bottom: 4, left: -20 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#8b949e", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8b949e", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1c2333",
                      border: "1px solid #30363d",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#e6edf3" }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar
                    dataKey="taches"
                    name="Total"
                    fill="#30363d"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="terminees"
                    name="Terminées"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Aucun projet pour le moment</div>
            )}
          </div>

          {/* Pie chart */}
          <div
            className="chart-card fade-in"
            style={{ animationDelay: "0.15s" }}
          >
            <h3 className="chart-title">Statuts des projets</h3>
            {statutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {statutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1c2333",
                        border: "1px solid #30363d",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {statutData.map((d) => (
                    <span key={d.name} className="pie-legend-item">
                      <span
                        className="pie-dot"
                        style={{ background: d.color }}
                      />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-empty">Aucune donnée</div>
            )}
          </div>
        </div>

        {/* Recent projects */}
        <div className="section-header">
          <h2 className="section-title">Projets récents</h2>
          <Link to="/projects" className="section-link">
            <span>Voir tout</span>{" "}
            <FontAwesomeIcon icon={faChevronRight} />
          </Link>
        </div>
        <div
          className="recent-projects fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          {projets.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="recent-project-card"
            >
              <div className="rp-header">
                <span className="rp-title">{p.titre}</span>
                <StatutBadge statut={p.statut} />
              </div>
              <p className="rp-desc">
                {p.description || "Aucune description."}
              </p>
              <div className="rp-footer">
                <div className="rp-progress">
                  <div className="rp-progress-bar">
                    <div
                      className="rp-progress-fill"
                      style={{
                        width: `${p.total_taches > 0 ? Math.round((p.taches_terminees / p.total_taches) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="rp-progress-text">
                    {p.taches_terminees}/{p.total_taches} tâches
                  </span>
                </div>
                <div className="rp-members">
                  <Avatar name={p.createur_nom || ""} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <span className="stat-icon">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        <span className="stat-sub">{sub}</span>
      </div>
    </div>
  );
}

function StatutBadge({ statut }) {
  const map = {
    actif: { color: "green", label: "Actif" },
    en_pause: { color: "yellow", label: "En pause" },
    terminé: { color: "blue", label: "Terminé" },
    annulé: { color: "red", label: "Annulé" },
  };
  const s = map[statut] || { color: "gray", label: statut };
  return <Badge color={s.color}>{s.label}</Badge>;
}
