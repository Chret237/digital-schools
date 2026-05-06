// App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./store";

import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/layout/PrivateRoute";

import { LoginPage, RegisterPage } from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProfilePage from "./pages/ProfilePage";
import InvitationsPage from "./pages/InvitationsPage";
import { useSocket } from "./hooks/useSocket";

import "./styles/global.css";
import "./styles/components.css";
import "./styles/pages.css";

function ProtectedLayout() {
  useSocket(); // Global socket connection for personal notifications
  return (
    <PrivateRoute>
      <Layout>
        <Routes>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="invitations" element={<InvitationsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Layout>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1c2333",
              color: "#e6edf3",
              border: "1px solid #30363d",
              borderRadius: "8px",
              fontSize: "0.85rem",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error: { iconTheme: { primary: "#f85149", secondary: "#fff" } },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}
