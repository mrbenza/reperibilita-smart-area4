export interface User {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  stato: 'ON' | 'OFF';
  punti: number;
  ultimoTurno: string;
  dataAssunzione: string;
  note: string;
  role?: 'MANAGER' | 'USER';
}

export interface Turn {
  data: string;
  giorno: string;
  tipoGiorno: 'SABATO' | 'DOMENICA' | 'FESTIVO' | 'FERIALE';
  tecnicoAssegnato: string;
  idTecnico: string;
  statoTurno: string;
  puntiAssegnati: number;
  note: string;
}

export interface Preference {
  idTecnico: string;
  nomeTecnico: string;
  data: string;
  preferenza: 'VERDE' | 'BIANCO' | 'GIALLO' | 'ROSSO';
  meseRiferimento: string;
  dataInserimento: string;
}

export interface Config {
  Pausa_Minima_Giorni: number;
  Punti_Sabato: number;
  Punti_Domenica: number;
  Punti_Festivo: number;
  Giorno_Freeze: number;
  Mesi_Futuri_Min: number;
  Mesi_Futuri_Max: number;
  Manager_Email: string;
  Ultimo_Calcolo: string;
}

export interface Holiday {
  data: string;
  nome: string;
  tipo: 'Fissa' | 'Mobile';
  anno: number;
}

export interface LogEntry {
  timestamp: string;
  azione: string;
  dataTurno: string;
  idTecnico: string;
  nomeTecnico: string;
  punteggio: number;
  motivo: string;
  dettagli: string;
}

export interface Stats {
  totaleUtenti: number;
  utentiAttivi: number;
  turniAssegnati: number;
  turniDaCoprire: number;
}
