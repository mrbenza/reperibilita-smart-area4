const API_BASE = '/api';

import type { User, Turn, Preference, Config, Holiday, LogEntry, Stats } from '../src/types';

// Chiama le API Vercel (che fanno da proxy a Google Apps Script)
async function callAPI(action: string, data?: any): Promise<any> {
  const url = `${API_BASE}?action=${action}`;

  const options: RequestInit = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  return await response.json();
}

// ==================== UTENTI ====================

export async function getUsers(): Promise<User[]> {
  const result = await callAPI('getUsers');
  return result.users || [];
}

export async function addUser(user: Omit<User, 'id' | 'punti' | 'ultimoTurno'>): Promise<User> {
  const result = await callAPI('addUser', user);
  if (!result.success) {
    throw new Error(result.error || 'Failed to add user');
  }
  return result.user;
}

export async function updateUser(user: Partial<User> & { id: string }): Promise<User> {
  const result = await callAPI('updateUser', user);
  if (!result.success) {
    throw new Error(result.error || 'Failed to update user');
  }
  return result.user;
}

export async function setUserStatus(id: string, stato: 'ON' | 'OFF', motivo?: string): Promise<void> {
  const result = await callAPI('setUserStatus', { id, stato, motivo });
  if (!result.success) {
    throw new Error(result.error || 'Failed to update status');
  }
}

// ==================== TURNI ====================

export async function getTurns(): Promise<Turn[]> {
  const result = await callAPI('getTurns');
  return result.turns || [];
}

export async function addTurn(turn: {
  data: string;
  idTecnico: string;
  tecnicoNome: string;
  tipoGiorno: string;
  punti: number;
  note?: string;
}): Promise<void> {
  const result = await callAPI('addTurn', turn);
  if (!result.success) {
    throw new Error(result.error || 'Failed to add turn');
  }
}

export async function deleteTurn(data: string, motivo?: string): Promise<void> {
  const result = await callAPI('deleteTurn', { data, motivo });
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete turn');
  }
}

export async function forceTurn(turn: any): Promise<void> {
  const result = await callAPI('forceTurn', turn);
  if (!result.success) {
    throw new Error(result.error || 'Failed to force turn');
  }
}

// ==================== PREFERENZE ====================

export async function getPreferences(): Promise<Preference[]> {
  const result = await callAPI('getPreferences');
  return result.preferences || [];
}

export async function setPreference(preference: {
  idTecnico: string;
  nomeTecnico: string;
  data: string;
  preferenza: 'VERDE' | 'BIANCO' | 'GIALLO' | 'ROSSO';
}): Promise<void> {
  const result = await callAPI('setPreference', preference);
  if (!result.success) {
    throw new Error(result.error || 'Failed to set preference');
  }
}

// ==================== CONFIG ====================

export async function getConfig(): Promise<Config> {
  const result = await callAPI('getConfig');
  return result.config || {};
}

// ==================== FESTIVITÀ ====================

export async function getHolidays(): Promise<Holiday[]> {
  const result = await callAPI('getHolidays');
  return result.holidays || [];
}

// ==================== LOG ====================

export async function getLog(): Promise<LogEntry[]> {
  const result = await callAPI('getLog');
  return result.log || [];
}

// ==================== STATS ====================

export async function getStats(): Promise<Stats> {
  const result = await callAPI('getStats');
  return result.stats || {};
}

// ==================== AZIONI MANAGER ====================

export async function calculateTurniAutomatici(): Promise<{ assegnazioni: number; anomalie: any[] }> {
  const result = await callAPI('calculateTurni');
  if (!result.success) {
    throw new Error(result.error || 'Failed to calculate turns');
  }
  return { assegnazioni: result.assegnazioni, anomalie: result.anomalie };
}

export async function updatePoints(): Promise<void> {
  const result = await callAPI('updatePoints');
  if (!result.success) {
    throw new Error(result.error || 'Failed to update points');
  }
}

export async function generateModulo(mese: number, anno: number): Promise<{ foglio: string; url: string }> {
  const result = await callAPI('generateModulo', { mese, anno });
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate modulo');
  }
  return { foglio: result.foglio, url: result.url };
}
