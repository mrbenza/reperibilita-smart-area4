/**
 * Anagrafica.gs - Gestione Utenti
 * CRUD utenti, stati, punti
 */

const SHEET_ANAGRAFICA = 'Anagrafica';

/**
 * Inizializza il foglio Anagrafica
 */
function initAnagrafica() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ANAGRAFICA);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ANAGRAFICA);

    // Header
    const headers = ['ID', 'Nome', 'Cognome', 'Email', 'Stato', 'Punti_Totali', 'Ultimo_Turno', 'Data_Assunzione', 'Note'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
    sheet.setFrozenRows(1);

    // Dati di esempio
    const sampleData = [
      ['USR001', 'Mario', 'Rossi', 'mario.rossi@azienda.com', 'ON', 0, '', '', ''],
      ['USR002', 'Luca', 'Bianchi', 'luca.bianchi@azienda.com', 'ON', 0, '', '', ''],
      ['USR003', 'Anna', 'Verdi', 'anna.verdi@azienda.com', 'ON', 0, '', '', ''],
      ['USR004', 'Giulia', 'Neri', 'giulia.neri@azienda.com', 'ON', 0, '', '', ''],
    ];

    if (sampleData.length > 0) {
      sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
    }

    // Formatta colonne
    sheet.setColumnWidth(1, 80);
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 120);
    sheet.setColumnWidth(4, 200);
    sheet.setColumnWidth(5, 60);
    sheet.setColumnWidth(6, 80);
    sheet.setColumnWidth(7, 100);
    sheet.setColumnWidth(8, 100);
    sheet.setColumnWidth(9, 200);

    // Data validation per Stato
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['ON', 'OFF'], true)
      .build();
    sheet.getRange('E2:E').setDataValidation(rule);
  }

  return sheet;
}

/**
 * Ottieni tutti gli utenti (INTERNAL)
 */
function Anagrafica_getUsersInternal() {
  try {
    const sheet = initAnagrafica();
    const rows = getDataRows(sheet);

    const users = rows.map(r => ({
      id: r[0],
      nome: r[1],
      cognome: r[2],
      email: r[3],
      stato: r[4],
      punti: parseFloat(r[5]) || 0,
      ultimoTurno: r[6] ? formatDate(r[6]) : '',
      dataAssunzione: r[7] ? formatDate(r[7]) : '',
      note: r[8] || ''
    }));

    return { success: true, users: users };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Aggiungi nuovo utente (INTERNAL)
 */
function Anagrafica_addUserInternal(data, userId) {
  try {
    const sheet = initAnagrafica();
    const id = data.id || 'USR' + Date.now();

    sheet.appendRow([
      id,
      data.nome,
      data.cognome,
      data.email,
      data.stato || 'ON',
      0,
      '',
      data.dataAssunzione || new Date(),
      data.note || ''
    ]);

    // Aggiungi anche in Auth
    addToAuth(id, data.email, data.nome + ' ' + data.cognome);

    logAction('ANAGRAFICA', 'ADD_USER', id, userId, 'Utente aggiunto: ' + data.nome + ' ' + data.cognome);

    return {
      success: true,
      user: { id, ...data },
      message: 'Utente aggiunto con successo'
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Aggiorna utente (INTERNAL)
 */
function Anagrafica_updateUserInternal(data, userId) {
  try {
    const sheet = initAnagrafica();
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        const row = i + 1;
        if (data.nome) sheet.getRange(row, 2).setValue(data.nome);
        if (data.cognome) sheet.getRange(row, 3).setValue(data.cognome);
        if (data.email) sheet.getRange(row, 4).setValue(data.email);
        if (data.stato) sheet.getRange(row, 5).setValue(data.stato);
        if (data.note) sheet.getRange(row, 9).setValue(data.note);

        logAction('ANAGRAFICA', 'UPDATE_USER', data.id, userId, 'Utente aggiornato');

        return { success: true, message: 'Utente aggiornato' };
      }
    }

    return { success: false, error: 'Utente non trovato' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Cambia stato utente (INTERNAL)
 */
function Anagrafica_setUserStatusInternal(id, stato, userId, motivo) {
  try {
    const sheet = initAnagrafica();
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        const row = i + 1;
        sheet.getRange(row, 5).setValue(stato);

        logAction('ANAGRAFICA', 'SET_STATUS', id, userId, 'Stato cambiato a ' + stato + ' - ' + (motivo || ''));

        return { success: true, message: 'Stato aggiornato' };
      }
    }

    return { success: false, error: 'Utente non trovato' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Aggiorna punti utente
 */
function aggiornaPuntiUtente(idTecnico, punti, dataTurno) {
  try {
    const sheet = initAnagrafica();
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === idTecnico) {
        const attuali = parseFloat(rows[i][5]) || 0;
        const row = i + 1;
        sheet.getRange(row, 6).setValue(attuali + punti);
        if (dataTurno) {
          sheet.getRange(row, 7).setValue(dataTurno);
        }
        break;
      }
    }

    return true;
  } catch (error) {
    Logger.log('Errore aggiornaPuntiUtente: ' + error.toString());
    return false;
  }
}

/**
 * Aggiungi utente al foglio Auth
 */
function addToAuth(userId, email, nome) {
  try {
    const authSheet = getSheetOrInit('Auth');
    authSheet.appendRow([
      userId,
      email,
      '1234', // PIN default
      'USER',
      nome
    ]);
  } catch (e) {
    Logger.log('Errore addToAuth: ' + e.toString());
  }
}
