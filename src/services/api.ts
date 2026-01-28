import { Borne, CreateBorneDTO, UpdateBorneDTO, PaginatedResponse, BorneStats, Antenne } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api/booth';
const API_ANTENNES_URL = process.env.REACT_APP_API_ANTENNES_URL || 'https://konitys-api-antennes-production.up.railway.app/api/antennes';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur reseau' }));
      throw new Error(error.error || `Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }

  async getBornes(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Borne>> {
    return this.request<PaginatedResponse<Borne>>(`/bornes?page=${page}&limit=${limit}`);
  }

  async getBorne(id: number): Promise<{ success: boolean; data: Borne }> {
    return this.request(`/bornes/${id}`);
  }

  async getBornesByAntenne(antenneId: number): Promise<{ success: boolean; data: Borne[] }> {
    return this.request(`/bornes/antenne/${antenneId}`);
  }

  async getBorneStats(): Promise<{ success: boolean; data: BorneStats }> {
    return this.request('/bornes/stats');
  }

  async createBorne(data: CreateBorneDTO): Promise<{ success: boolean; data: Borne; message: string }> {
    return this.request('/bornes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBorne(id: number, data: UpdateBorneDTO): Promise<{ success: boolean; data: Borne; message: string }> {
    return this.request(`/bornes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBorne(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/bornes/${id}`, {
      method: 'DELETE',
    });
  }

  async getAntennes(): Promise<{ success: boolean; data: Antenne[] }> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    // Récupérer toutes les antennes (limit=1000 pour être sûr d'avoir toutes)
    const response = await fetch(`${API_ANTENNES_URL}?limit=1000`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }

  async getAntenneById(id: number): Promise<{ success: boolean; data: Antenne }> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    const response = await fetch(`${API_ANTENNES_URL}/${id}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
