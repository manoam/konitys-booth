import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">B</span>
          <span className="logo-text">Konitys Booth</span>
        </div>
      </div>
      <div className="header-right">
        <div className="user-info">
          <span className="user-avatar">{user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}</span>
          <span className="user-name">{user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username}</span>
        </div>
        <button className="logout-btn" onClick={logout}>
          Deconnexion
        </button>
      </div>
    </header>
  );
}
