/**
 * Algoritmo.gs - Assegnazione Automatica Turni
 */

/**
 * Calcola turni automatici (INTERNAL)
 */
function Algoritmo_calculateTurniAutomaticiInternal(userId) {
  try {
    const config = getConfigData();
    const usersResult = Anagrafica_getUsersInternal();
    const turnsResult = Calendario_getTurnsInternal();
    const prefResult = Preferenze_getPreferencesInternal();

    if (!usersResult.success || !turnsResult.success) {
      return { success: false, error: 'Errore nel recupero dati' };
    }

    const users = usersResult.users.filter(u => u.stato === 'ON');
    const turns = turnsResult.turns.filter(t =>
      !t.idTecnico && (t.tipoGiorno === 'SABATO' || t.tipoGiorno === 'DOMENICA' || t.tipoGiorno === 'FESTIVO')
    );

    let assegnazioni = 0;
    let anomalie = [];

    for (const turno of turns) {
      const result = assegnaTurno(turno, users, prefResult.preferences || [], config);

      if (result.success) {
        // Aggiungi turno al calendario
        Calendario_addTurnInternal({
          data: turno.data,
          idTecnico: result.idTecnico,
          tecnicoNome: result.tecnicoNome,
          tipoGiorno: turno.tipoGiorno,
          punti: result.punti,
          note: 'Assegnazione automatica'
        }, userId);

        assegnazioni++;
        logIA('AUTO_ASSIGN', turno.data, result.idTecnico, result.tecnicoNome,
          result.punteggioVirtuale, 'Assegnazione automatica - ' + turno.tipoGiorno,
          'Punti reali: ' + result.puntiReali);
      } else {
        anomalie.push({ data: turno.data, motivo: result.motivo });
        logIA('ANOMALY', turno.data, '', '', 0, 'Nessun tecnico disponibile', result.motivo);
      }
    }

    return { success: true, assegnazioni: assegnazioni, anomalie: anomalie };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Aggiorna punti (INTERNAL)
 */
function Algoritmo_updatePointsInternal(userId) {
  try {
    const usersSheet = getSheetOrInit('Anagrafica');
    const storicoSheet = getSheetOrInit('Turni_Storico');

    const users = getDataRows(usersSheet);
    const storico = getDataRows(storicoSheet);

    // Calcola punti totali per utente
    const puntiPerUtente = {};
    for (const row of storico) {
      const idTecnico = row[2];
      const punti = parseFloat(row[5]) || 0;
      puntiPerUtente[idTecnico] = (puntiPerUtente[idTecnico] || 0) + punti;
    }

    // Aggiorna foglio anagrafica
    for (let i = 1; i < users.length; i++) {
      const id = users[i][0];
      const puntiTotali = puntiPerUtente[id] || 0;
      usersSheet.getRange(i + 1, 6).setValue(puntiTotali);
    }

    logAction('ALGORITMO', 'UPDATE_POINTS', '', userId, 'Punti aggiornati per tutti gli utenti');

    return { success: true, message: 'Punti aggiornati' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Assegna singolo turno
 */
function assegnaTurno(turno, users, preferences, config) {
  const turnoDate = new Date(turno.data);

  // Fase 1: Filtro esclusione
  let candidati = users.filter(u => {
    if (u.stato === 'OFF') return false;
    if (u.ultimoTurno) {
      const giorniDallUltimo = daysBetween(new Date(u.ultimoTurno), turnoDate);
      if (giorniDallUltimo < config.pausaMinima) return false;
    }
    return true;
  });

  if (candidati.length === 0) {
    return { success: false, motivo: 'Nessun tecnico disponibile (tutti OFF o in pausa)' };
  }

  // Fase 2: Controllo preferenze (ROSSO = escluso)
  const preferenza = getPreferenzaPerData(candidati, turno.data, preferences);
  candidati = candidati.filter(u => preferenza[u.id] !== 'ROSSO');

  if (candidati.length === 0) {
    return { success: false, motivo: 'Tutti i tecnici hanno preferito ROSSO' };
  }

  // Fase 3: Punteggio virtuale
  const punteggiVirtuali = candidati.map(u => {
    const pref = preferenza[u.id] || 'BIANCO';
    let bonusMalus = 0;
    if (pref === 'VERDE') bonusMalus = -2;
    else if (pref === 'GIALLO') bonusMalus = 2;

    return {
      user: u,
      puntiVirtuali: u.punti + bonusMalus,
      preferenza: pref
    };
  });

  // Ordina per punteggio virtuale
  punteggiVirtuali.sort((a, b) => a.puntiVirtuali - b.puntiVirtuali);
  const vincitore = punteggiVirtuali[0];

  // Calcola punti
  let punti = 0;
  if (turno.tipoGiorno === 'FESTIVO') punti = config.puntiFestivo;
  else if (turno.tipoGiorno === 'DOMENICA') punti = config.puntiDomenica;
  else if (turno.tipoGiorno === 'SABATO') punti = config.puntiSabato;

  return {
    success: true,
    idTecnico: vincitore.user.id,
    tecnicoNome: vincitore.user.nome + ' ' + vincitore.user.cognome,
    punti: punti,
    puntiReali: vincitore.user.punti,
    punteggioVirtuale: vincitore.puntiVirtuali,
    preferenza: vincitore.preferenza
  };
}

/**
 * Ottieni preferenza per data
 */
function getPreferenzaPerData(users, data, preferences) {
  const result = {};
  if (!data) {
    users.forEach(u => result[u.id] = 'BIANCO');
    return result;
  }
  const dataStr = formatDate(data);
  users.forEach(u => {
    const pref = preferences.find(p => p.idTecnico === u.id && p.data === dataStr);
    result[u.id] = pref ? pref.preferenza : 'BIANCO';
  });
  return result;
}

/**
 * Config dati
 */
function getConfigData() {
  return {
    pausaMinima: 30,
    puntiSabato: 1,
    puntiDomenica: 1,
    puntiFestivo: 3
  };
}

/**
 * Giorni tra due date
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date2 - date1) / oneDay));
}
