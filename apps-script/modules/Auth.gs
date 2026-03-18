/**
 * Auth.gs - Sistema di Autenticazione
 * Gestisce login, PIN e ruoli (USER/MANAGER)
 */

const SHEET_AUTH = 'Auth';

/**
 * Inizializza il foglio Auth con utenti e PIN
 */
function initAuth() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_AUTH);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_AUTH);

    // Header
    sheet.getRange(1, 1, 1, 5).setValues([[
      'ID', 'Email', 'PIN', 'Ruolo', 'Nome'
    ]]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 5).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, 5).setFontColor('white');
    sheet.setFrozenRows(1);

    // Utenti di default (PIN: 1234 per user, 0000 per manager)
    const defaultUsers = [
      ['USR001', 'mario.rossi@azienda.com', '1234', 'USER', 'Mario Rossi'],
      ['USR002', 'luca.bianchi@azienda.com', '1234', 'USER', 'Luca Bianchi'],
      ['USR003', 'anna.verdi@azienda.com', '1234', 'USER', 'Anna Verdi'],
      ['USR004', 'giulia.neri@azienda.com', '1234', 'USER', 'Giulia Neri'],
      ['MGR001', 'manager@azienda.com', '0000', 'MANAGER', 'Manager'],
    ];

    if (defaultUsers.length > 0) {
      sheet.getRange(2, 1, defaultUsers.length, 5).setValues(defaultUsers);
    }

    // Formatta colonne
    sheet.setColumnWidth(1, 80);   // ID
    sheet.setColumnWidth(2, 200);  // Email
    sheet.setColumnWidth(3, 80);   // PIN
    sheet.setColumnWidth(4, 100);  // Ruolo
    sheet.setColumnWidth(5, 150);  // Nome
  }

  return sheet;
}

/**
 * Verifica login con email e PIN (INTERNAL)
 */
function Auth_loginInternal(email, pin) {
  try {
    const sheet = getSheetOrInit(SHEET_AUTH);
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowEmail = String(row[1]).toLowerCase().trim();
      const rowPin = String(row[2]).trim();

      if (rowEmail === email.toLowerCase().trim() && rowPin === pin) {
        return {
          success: true,
          user: {
            id: row[0],
            email: row[1],
            ruolo: row[3],
            nome: row[4],
            isManager: row[3] === 'MANAGER'
          }
        };
      }
    }

    return {
      success: false,
      error: 'Email o PIN non validi'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Errore nel login: ' + error.toString()
    };
  }
}

/**
 * Cambia il PIN di un utente (INTERNAL)
 */
function Auth_changePinInternal(userId, newPin, requestedBy) {
  try {
    // Verifica che chi richiede sia manager
    const sheet = getSheetOrInit(SHEET_AUTH);
    const rows = sheet.getDataRange().getValues();
    let isManager = false;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === requestedBy && rows[i][3] === 'MANAGER') {
        isManager = true;
        break;
      }
    }

    if (!isManager) {
      return {
        success: false,
        error: 'Solo un manager può cambiare i PIN'
      };
    }

    // Verifica formato PIN (4 cifre)
    if (!/^\d{4}$/.test(newPin)) {
      return {
        success: false,
        error: 'Il PIN deve essere composto da 4 cifre'
      };
    }

    // Trova e aggiorna utente
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === userId) {
        const row = i + 1;
        sheet.getRange(row, 3).setValue(newPin);

        logAuth('CHANGE_PIN', userId, requestedBy, 'PIN modificato');

        return {
          success: true,
          message: 'PIN aggiornato con successo'
        };
      }
    }

    return {
      success: false,
      error: 'Utente non trovato'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Errore: ' + error.toString()
    };
  }
}

/**
 * Resetta il PIN di un utente (INTERNAL)
 */
function Auth_resetPinInternal(userId, requestedBy) {
  try {
    const sheet = getSheetOrInit(SHEET_AUTH);
    const rows = sheet.getDataRange().getValues();
    let isManager = false;
    let userRole = '';

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === requestedBy && rows[i][3] === 'MANAGER') {
        isManager = true;
      }
      if (rows[i][0] === userId) {
        userRole = rows[i][3];
      }
    }

    if (!isManager) {
      return {
        success: false,
        error: 'Solo un manager può resettare i PIN'
      };
    }

    // PIN default in base al ruolo
    const defaultPin = userRole === 'MANAGER' ? '0000' : '1234';

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === userId) {
        const row = i + 1;
        sheet.getRange(row, 3).setValue(defaultPin);

        logAuth('RESET_PIN', userId, requestedBy, 'PIN resettato a ' + defaultPin);

        return {
          success: true,
          message: 'PIN resettato a ' + defaultPin,
          newPin: defaultPin
        };
      }
    }

    return {
      success: false,
      error: 'Utente non trovato'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Errore: ' + error.toString()
    };
  }
}

/**
 * Ottieni lista utenti (INTERNAL)
 */
function Auth_getUserListInternal(requestedBy) {
  try {
    const sheet = getSheetOrInit(SHEET_AUTH);
    const rows = sheet.getDataRange().getValues();
    let isManager = false;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === requestedBy && rows[i][3] === 'MANAGER') {
        isManager = true;
        break;
      }
    }

    if (!isManager) {
      return {
        success: false,
        error: 'Accesso riservato ai manager'
      };
    }

    const users = [];
    for (let i = 1; i < rows.length; i++) {
      users.push({
        id: rows[i][0],
        email: rows[i][1],
        ruolo: rows[i][3],
        nome: rows[i][4],
        pinMasked: '****'
      });
    }

    return {
      success: true,
      users: users
    };
  } catch (error) {
    return {
      success: false,
      error: 'Errore: ' + error.toString()
    };
  }
}

/**
 * Logga le operazioni di auth
 */
function logAuth(azione, targetUserId, actorUserId, dettagli) {
  try {
    const sheet = getSheetOrInit(SHEET_AUTH + '_Log');
    sheet.appendRow([
      new Date(),
      azione,
      targetUserId,
      actorUserId,
      dettagli
    ]);
  } catch (e) {
    // Ignora errori di log
  }
}
