/**
 * Log.gs - Registro Operazioni
 */

const SHEET_LOG = 'Log_IA';

/**
 * Inizializza il foglio Log
 */
function initLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_LOG);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LOG);
    const headers = ['Timestamp', 'Azione', 'Data_Turno', 'ID_Tecnico', 'Nome_Tecnico', 'Punteggio', 'Motivo', 'Dettagli'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#607d8b');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Ottieni log (INTERNAL)
 */
function Log_getLogInternal() {
  try {
    const sheet = initLog();
    const rows = getDataRows(sheet);
    const log = rows.map(r => ({
      timestamp: r[0] ? new Date(r[0]).toISOString() : '',
      azione: r[1],
      dataTurno: r[2] ? formatDate(r[2]) : '',
      idTecnico: r[3],
      nomeTecnico: r[4],
      punteggio: r[5],
      motivo: r[6],
      dettagli: r[7]
    }));
    log.reverse();
    return { success: true, log: log };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Logga azione IA
 */
function logIA(azione, dataTurno, idTecnico, nomeTecnico, punteggio, motivo, dettagli) {
  try {
    const sheet = initLog();
    sheet.appendRow([
      new Date(),
      azione,
      dataTurno,
      idTecnico,
      nomeTecnico,
      punteggio,
      motivo,
      dettagli
    ]);
  } catch (e) {}
}

/**
 * Logga azione generica
 */
function logAction(modulo, azione, targetId, actorId, dettagli) {
  try {
    const sheet = getSheetOrInit('Log_Azioni');
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 6).setValues([['Timestamp', 'Modulo', 'Azione', 'Target_ID', 'Actor_ID', 'Dettagli']]);
    }
    sheet.appendRow([new Date(), modulo, azione, targetId, actorId, dettagli]);
  } catch (e) {}
}
