// components/ui/index.js — All reusable UI primitives

import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

/* ── Button ─────────────────────────────────────── */
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled, className = '', ...props
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };
  const sizes = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };

  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="spinner-xs" aria-hidden="true" />}
      {children}
    </button>
  );
};

/* ── Input ──────────────────────────────────────── */
export const Input = ({ label, error, icon, className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field-label">{label}</label>}
    <div className={`field-wrap ${icon ? 'has-icon' : ''}`}>
      {icon && <span className="field-icon">{icon}</span>}
      <input className={`field-input ${error ? 'error' : ''}`} {...props} />
    </div>
    {error && <span className="field-error">{error}</span>}
  </div>
);

/* ── Textarea ───────────────────────────────────── */
export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field-label">{label}</label>}
    <textarea className={`field-input field-textarea ${error ? 'error' : ''}`} {...props} />
    {error && <span className="field-error">{error}</span>}
  </div>
);

/* ── Select ─────────────────────────────────────── */
export const Select = ({ label, error, className = '', children, ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field-label">{label}</label>}
    <select className={`field-input field-select ${error ? 'error' : ''}`} {...props}>
      {children}
    </select>
    {error && <span className="field-error">{error}</span>}
  </div>
);

/* ── Badge ──────────────────────────────────────── */
export const Badge = ({ children, color = 'default', size = 'sm' }) => (
  <span className={`badge badge-${color} badge-${size}`}>{children}</span>
);

/* ── Spinner ────────────────────────────────────── */
export const Spinner = ({ size = 'md', center = false }) => (
  <div className={center ? 'spinner-center' : ''}>
    <span className={`spinner spinner-${size}`} role="status" aria-label="Chargement…" />
  </div>
);

/* ── Card ───────────────────────────────────────── */
export const Card = ({ children, className = '', hover = false, ...props }) => (
  <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>
    {children}
  </div>
);

/* ── Modal ──────────────────────────────────────── */
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal modal-${size} fade-in`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

/* ── Avatar ─────────────────────────────────────── */
export const Avatar = ({ name = '', size = 'md' }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#10b981','#388bfd','#d29922','#f85149','#8b5cf6','#06b6d4'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <span className={`avatar avatar-${size}`} style={{ background: color }} aria-label={name}>
      {initials}
    </span>
  );
};

/* ── Empty State ────────────────────────────────── */
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {icon && <div className="empty-icon">{icon}</div>}
    <h3 className="empty-title">{title}</h3>
    {description && <p className="empty-desc">{description}</p>}
    {action && <div className="empty-action">{action}</div>}
  </div>
);
