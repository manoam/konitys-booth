import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import wsService from '../services/websocket';
import { Borne, CreateBorneDTO, BorneStats, Antenne } from '../types';
import BorneCard from '../components/BorneCard';
import BorneModal from '../components/BorneModal';
import './BorneListPage.css';

export default function BorneListPage() {
  const { token } = useAuth();
  const [bornes, setBornes] = useState<Borne[]>([]);
  const [antenneMap, setAntenneMap] = useState<Record<number, Antenne>>({});
  const [stats, setStats] = useState<BorneStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBorne, setSelectedBorne] = useState<Borne | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadBornes = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      apiService.setToken(token);

      // Charger les bornes et stats
      const [bornesResponse, statsResponse] = await Promise.all([
        apiService.getBornes(page, 12),
        apiService.getBorneStats(),
      ]);

      setBornes(bornesResponse.data);
      setTotalPages(bornesResponse.pagination.totalPages);
      setStats(statsResponse.data);

      // Charger uniquement les antennes référencées par les bornes
      const antenneIds = Array.from(new Set(bornesResponse.data
        .map(b => b.antenne_id)
        .filter((id): id is number => id !== null)
      ));

      const map: Record<number, Antenne> = {};
      await Promise.all(
        antenneIds.map(async (id) => {
          try {
            const response = await apiService.getAntenneById(id);
            if (response.data) {
              map[id] = response.data;
            }
          } catch (err) {
            console.warn(`Impossible de charger l'antenne ${id}:`, err);
          }
        })
      );
      setAntenneMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    loadBornes();
  }, [loadBornes]);

  // Connexion WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    // Se connecter au WebSocket
    wsService.connect();

    // Handler pour la mise à jour d'une antenne
    const handleAntenneUpdated = (data: unknown) => {
      const antenneData = data as Antenne;
      console.log('Antenne mise à jour:', antenneData);

      // Mettre à jour l'antenne dans le map local
      setAntenneMap((prev) => ({
        ...prev,
        [antenneData.id]: antenneData,
      }));
    };

    // Handler pour la suppression d'une antenne
    const handleAntenneDeleted = (data: unknown) => {
      const { antenneId } = data as { antenneId: number };
      console.log('Antenne supprimée:', antenneId);

      // Supprimer l'antenne du map et recharger les bornes
      setAntenneMap((prev) => {
        const newMap = { ...prev };
        delete newMap[antenneId];
        return newMap;
      });

      // Recharger les bornes car leur antenne_id a été mis à null
      loadBornes();
    };

    // Handler pour la désactivation d'une antenne
    const handleAntenneDeactivated = (data: unknown) => {
      const { antenneId } = data as { antenneId: number };
      console.log('Antenne désactivée:', antenneId);

      // Recharger les bornes car leur antenne_id a été mis à null
      loadBornes();
    };

    // S'abonner aux événements
    const unsubUpdated = wsService.on('antenne.updated', handleAntenneUpdated);
    const unsubDeleted = wsService.on('antenne.deleted', handleAntenneDeleted);
    const unsubDeactivated = wsService.on('antenne.deactivated', handleAntenneDeactivated);

    // Cleanup
    return () => {
      unsubUpdated();
      unsubDeleted();
      unsubDeactivated();
    };
  }, [loadBornes]);

  const handleCreate = () => {
    setSelectedBorne(null);
    setIsModalOpen(true);
  };

  const handleEdit = (borne: Borne) => {
    setSelectedBorne(borne);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateBorneDTO) => {
    if (!token) return;
    apiService.setToken(token);

    if (selectedBorne) {
      await apiService.updateBorne(selectedBorne.id, data);
    } else {
      await apiService.createBorne(data);
    }

    await loadBornes();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer cette borne ?')) {
      return;
    }

    if (!token) return;
    apiService.setToken(token);

    try {
      await apiService.deleteBorne(id);
      await loadBornes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression');
    }
  };

  const detachedCount = bornes.filter(b => !b.antenne_id).length;

  return (
    <div className="borne-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Gestion des Bornes</h1>
          <p>Gerez vos bornes et leur rattachement aux antennes</p>
        </div>
        <button className="add-btn" onClick={handleCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouvelle borne
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total bornes</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon assigned">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.total - detachedCount}</span>
              <span className="stat-label">Rattachees</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon detached">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{detachedCount}</span>
              <span className="stat-label">Non rattachees</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des bornes...</p>
        </div>
      ) : bornes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Aucune borne</h2>
          <p>Commencez par ajouter votre premiere borne</p>
          <button className="add-btn" onClick={handleCreate}>
            Ajouter une borne
          </button>
        </div>
      ) : (
        <>
          <div className="bornes-grid">
            {bornes.map((borne) => (
              <BorneCard
                key={borne.id}
                borne={borne}
                antenne={borne.antenne_id ? antenneMap[borne.antenne_id] : undefined}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Precedent
              </button>
              <span>
                Page {page} sur {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      <BorneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        borne={selectedBorne}
      />
    </div>
  );
}
