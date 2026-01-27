import React, { useState, useEffect } from 'react';
import { Borne, CreateBorneDTO, Antenne } from '../types';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import './BorneModal.css';

interface BorneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateBorneDTO) => Promise<void>;
  borne?: Borne | null;
}

export default function BorneModal({ isOpen, onClose, onSave, borne }: BorneModalProps) {
  const { token } = useAuth();
  const [numero, setNumero] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [antenneId, setAntenneId] = useState<string>('');
  const [antennes, setAntennes] = useState<Antenne[]>([]);
  const [isLoadingAntennes, setIsLoadingAntennes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des antennes quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && token) {
      setIsLoadingAntennes(true);
      apiService.setToken(token);
      apiService.getAntennes()
        .then((response) => {
          setAntennes(response.data || []);
        })
        .catch((err) => {
          console.error('Erreur chargement antennes:', err);
        })
        .finally(() => {
          setIsLoadingAntennes(false);
        });
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (borne) {
      setNumero(borne.numero);
      setNumeroSerie(borne.numero_serie);
      setAntenneId(borne.antenne_id?.toString() || '');
    } else {
      setNumero('');
      setNumeroSerie('');
      setAntenneId('');
    }
    setError(null);
  }, [borne, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!numero.trim() || !numeroSerie.trim()) {
      setError('Le numero et le numero de serie sont requis');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        numero: numero.trim(),
        numero_serie: numeroSerie.trim(),
        antenne_id: antenneId ? parseInt(antenneId) : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{borne ? 'Modifier la borne' : 'Nouvelle borne'}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="numero">Numero *</label>
              <input
                type="text"
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: B001"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="numeroSerie">Numero de serie *</label>
              <input
                type="text"
                id="numeroSerie"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="Ex: SN-2024-001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="antenneId">Antenne</label>
              <select
                id="antenneId"
                value={antenneId}
                onChange={(e) => setAntenneId(e.target.value)}
                disabled={isLoadingAntennes}
              >
                <option value="">-- Non rattachee --</option>
                {antennes.map((antenne) => (
                  <option key={antenne.id} value={antenne.id}>
                    {antenne.prenom} {antenne.nom}
                  </option>
                ))}
              </select>
              {isLoadingAntennes && <small className="form-hint">Chargement des antennes...</small>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : borne ? 'Modifier' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
