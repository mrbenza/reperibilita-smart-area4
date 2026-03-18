import { google } from 'googleapis'
import { User, Turn } from '../src/types'

const sheetId = process.env.GOOGLE_SHEET_ID
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!sheetId || !serviceAccountEmail || !privateKey) {
  throw new Error('Missing Google Sheets environment variables')
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccountEmail,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

export async function getUsers(): Promise<User[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Utenti!A2:D',
  })

  const rows = response.data.values || []
  return rows.map((row, index) => ({
    id: row[0] || `user-${index}`,
    name: row[1] || '',
    email: row[2] || '',
    active: row[3] !== 'false' && row[3] !== 'FALSE',
  }))
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
  const id = `user-${Date.now()}`
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Utenti!A:D',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, user.name, user.email, String(user.active)]],
    },
  })

  return { id, ...user }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const users = await getUsers()
  const userIndex = users.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    throw new Error('User not found')
  }

  const updatedUser = { ...users[userIndex], ...updates }
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Utenti!A${userIndex + 2}:D${userIndex + 2}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        updatedUser.id,
        updatedUser.name,
        updatedUser.email,
        String(updatedUser.active)
      ]],
    },
  })

  return updatedUser
}

export async function getTurns(): Promise<Turn[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Turni!A2:E',
  })

  const rows = response.data.values || []
  return rows.map((row, index) => ({
    id: row[0] || `turn-${index}`,
    userId: row[1] || '',
    userName: row[2] || '',
    date: row[3] || '',
    type: (row[4] as Turn['type']) || 'ordinario',
    notes: row[5] || '',
  }))
}

export async function addTurn(turn: Omit<Turn, 'id'>): Promise<Turn> {
  const id = `turn-${Date.now()}`
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Turni!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, turn.userId, turn.userName, turn.date, turn.type, turn.notes || '']],
    },
  })

  return { id, ...turn }
}

export async function deleteTurn(id: string): Promise<void> {
  const turns = await getTurns()
  const turnIndex = turns.findIndex(t => t.id === id)
  
  if (turnIndex === -1) {
    throw new Error('Turn not found')
  }

  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `Turni!A${turnIndex + 2}:E${turnIndex + 2}`,
  })
}
