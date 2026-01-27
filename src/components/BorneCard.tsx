import React from 'react';
import { Borne, Antenne } from '../types';
import './BorneCard.css';

interface BorneCardProps {
  borne: Borne;
  antenne?: Antenne;
  onEdit: (borne: Borne) => void;
  onDelete: (id: number) => void;
}

export default function BorneCard({ borne, antenne, onEdit, onDelete }: BorneCardProps) {
  return (
    <div className="borne-card">
      <div className="borne-card-header">
        <div className="borne-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="16" y2="10" />
          </svg>
        </div>
        <div className="borne-info">
          <h3>{borne.numero}</h3>
          <span className="borne-serial">{borne.numero_serie}</span>
        </div>
      </div>

      <div className="borne-card-body">
        <div className="borne-detail">
          <span className="detail-label">Antenne</span>
          <span className={`detail-value ${!borne.antenne_id ? 'unassigned' : ''}`}>
            {(console.log('antenne:', antenne), null)}
            {antenne ? `${antenne.prenom} ${antenne.nom}` : (borne.antenne_id ? `#${borne.antenne_id}` : 'Non rattachee')}
          </span>
        </div>
        <div className="borne-detail">
          <span className="detail-label">Cree le</span>
          <span className="detail-value">
            {new Date(borne.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      <div className="borne-card-actions">
        <button className="action-btn edit" onClick={() => onEdit(borne)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Modifier
        </button>
        <button className="action-btn delete" onClick={() => onDelete(borne.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Supprimer
        </button>
      </div>
    </div>
  );
}
