export interface Borne {
  id: number;
  numero: string;
  numero_serie: string;
  antenne_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBorneDTO {
  numero: string;
  numero_serie: string;
  antenne_id: number | null;
}

export interface UpdateBorneDTO {
  numero?: string;
  numero_serie?: string;
  antenne_id?: number | null;
}

export interface BorneStats {
  total: number;
  by_antenne: { antenne_id: number; count: number }[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Antenne {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}
