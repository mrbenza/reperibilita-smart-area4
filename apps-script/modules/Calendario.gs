/**
 * Calendario.gs - Gestione Turni e Date
 */

const SHEET_CALENDARIO = 'Calendario';

/**
 * Inizializza il foglio Calendario
 */
function initCalendario() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CALENDARIO);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CALENDARIO);
    const headers = ['Data', 'Giorno', 'Tipo_Giorno', 'Tecnico_Assegnato', 'ID_Tecnico', 'Stato_Turno', 'Punti_Assegnati', 'Note'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#0f9d58');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
    sheet.setFrozenRows(1);
    generaDateFuture(sheet);
  }
  return sheet;
}

/**
 * Ottieni tutti i turni (INTERNAL)
 */
function Calendario_getTurnsInternal() {
  try {
    const sheet = initCalendario();
    const rows = getDataRows(sheet);
    const turns = rows.map(r => ({
      data: r[0] ? formatDate(r[0]) : '',
      giorno: r[1],
      tipoGiorno: r[2],
      tecnicoAssegnato: r[3] || '',
      idTecnico: r[4] || '',
      statoTurno: r[5] || '',
      puntiAssegnati: parseFloat(r[6]) || 0,
      note: r[7] || ''
    }));
    return { success: true, turns: turns };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Aggiungi turno (INTERNAL)
 */
function Calendario_addTurnInternal(data, userId) {
  try {
    const sheet = initCalendario();
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (formatDate(rows[i][0]) === data.data) {
        const row = i + 1;
        sheet.getRange(row, 4).setValue(data.tecnicoNome);
        sheet.getRange(row, 5).setValue(data.idTecnico);
        sheet.getRange(row, 6).setValue('ASSEGNATO');
        sheet.getRange(row, 7).setValue(data.punti || 0);
        sheet.getRange(row, 8).setValue(data.note || '');

        // Aggiungi allo storico
        Calendario_addToStorico(data);
        
        // Aggiorna punti
        aggiornaPuntiUtente(data.idTecnico, data.punti, data.data);
        
        // Log
        logAction('CALENDARIO', 'ADD_TURN', data.idTecnico, userId, 'Turno aggiunto il ' + data.data);

        return { success: true, message: 'Turno aggiunto' };
      }
    }
    return { success: false, error: 'Data non trovata' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Elimina turno (INTERNAL)
 */
function Calendario_deleteTurnInternal(data, userId) {
  try {
    const sheet = initCalendario();
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (formatDate(rows[i][0]) === data) {
        const row = i + 1;
        sheet.getRange(row, 4).clearContent();
        sheet.getRange(row, 5).clearContent();
        sheet.getRange(row, 6).clearContent();
        sheet.getRange(row, 7).clearContent();
        sheet.getRange(row, 8).clearContent();

        logAction('CALENDARIO', 'DELETE_TURN', '', userId, 'Turno eliminato del ' + data);
        return { success: true, message: 'Turno eliminato' };
      }
    }
    return { success: false, error: 'Turno non trovato' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Genera date future (sabati e domeniche)
 */
function generaDateFuture(sheet) {
  const today = new Date();
  const endMonth = today.getMonth() + 6;
  let row = 2;
  let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);

  while (currentDate.getMonth() <= endMonth % 12 || currentDate.getFullYear() < today.getFullYear() + 1) {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 6 || dayOfWeek === 0) {
        const isHoliday = isFestivo(date);
        const tipoGiorno = getTipoGiorno(dayOfWeek, isHoliday);

        sheet.getRange(row, 1).setValue(date);
        sheet.getRange(row, 2).setValue(getNomeGiorno(dayOfWeek));
        sheet.getRange(row, 3).setValue(tipoGiorno);
        row++;
      }
    }
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
}

function getTipoGiorno(dayOfWeek, isHoliday) {
  if (isHoliday) return 'FESTIVO';
  if (dayOfWeek === 6) return 'SABATO';
  if (dayOfWeek === 0) return 'DOMENICA';
  return 'FERIALE';
}

function getNomeGiorno(dayOfWeek) {
  const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return giorni[dayOfWeek];
}

function isFestivo(date) {
  const month = date.getMonth();
  const day = date.getDate();
  const fisse = [
    { m: 0, d: 1 }, { m: 0, d: 6 }, { m: 3, d: 25 }, { m: 4, d: 1 },
    { m: 5, d: 2 }, { m: 7, d: 15 }, { m: 9, d: 1 }, { m: 10, d: 8 },
    { m: 11, d: 25 }, { m: 11, d: 26 }
  ];
  return fisse.some(f => f.m === month && f.d === day);
}

/**
 * Aggiungi allo storico
 */
function Calendario_addToStorico(data) {
  try {
    const sheet = getSheetOrInit('Turni_Storico');
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([['ID_Turno', 'Data', 'ID_Tecnico', 'Nome_Tecnico', 'Tipo_Giorno', 'Punti', 'Data_Inserimento', 'Stato']]);
    }
    sheet.appendRow([
      'TRN' + Date.now(),
      data.data,
      data.idTecnico,
      data.tecnicoNome,
      data.tipoGiorno || '',
      data.punti || 0,
      new Date(),
      'COMPLETATO'
    ]);
  } catch (e) {}
}
