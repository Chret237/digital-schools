// components/layout/Layout.js
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faFolderOpen,
  faUser,
  faEnvelope,
  faGear,
  faAnglesLeft,
  faAnglesRight,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { logout } from "../../store/slices/authSlice";
import { fetchMesInvitations } from "../../store/slices/invitationSlice";
import { Avatar } from "../ui";
import "../../styles/layout.css";

const NAV = [
  { to: "/dashboard", icon: faChartPie, label: "Tableau de bord" },
  { to: "/projects", icon: faFolderOpen, label: "Projets" },
  { to: "/profile", icon: faUser, label: "Mon profil" },
  { to: "/invitations", icon: faEnvelope, label: "Invitations", badge: true },
];

export default function Layout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { enAttente } = useSelector((s) => s.invitations);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    dispatch(fetchMesInvitations());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo">DS</span>
          {!collapsed && (
            <span className="brand-name">
              Digital
              <br />
              Solutions
            </span>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {NAV.map(({ to, icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                <FontAwesomeIcon icon={icon} />
              </span>
              {!collapsed && <span className="nav-label">{label}</span>}
              {badge && enAttente > 0 && (
                <span className="nav-badge">{enAttente}</span>
              )}
            </NavLink>
          ))}

          {user?.role === "administrateur" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">
                <FontAwesomeIcon icon={faGear} />
              </span>
              {!collapsed && <span className="nav-label">Administration</span>}
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="user-info">
              <Avatar name={user?.nom || ""} size="sm" />
              <div className="user-meta">
                <span className="user-name truncate">{user?.nom}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Réduire"
          >
            <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} />
          </button>
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Déconnexion"
          >
            <span>
              <FontAwesomeIcon icon={faRightFromBracket} />
            </span>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="main-content" id="main">
        {children}
      </main>
    </div>
  );
}
