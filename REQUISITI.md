Ti preparo un resoconto completo e ordinato di come deve funzionare la Web App “Reperibilità Smart”, come se fosse il documento di progetto definitivo.
Puoi usarlo come specifica tecnica per costruire l’app o per farla sviluppare.


---

📱 Web App “Reperibilità Smart”

Sistema automatico per la gestione della reperibilità nei fine settimana e nei giorni festivi.

L’obiettivo è:

automatizzare la pianificazione

garantire equità tra i tecnici

rispettare le preferenze personali

ridurre quasi a zero il lavoro manuale del manager.



---

1️⃣ Struttura del Sistema

La Web App è composta da tre elementi principali.

1. Database

Il database è un file Google Sheets che contiene tutti i dati.

Fogli principali:

Foglio	Funzione

Anagrafica	elenco tecnici e punti
Calendario	tutte le date da coprire
Preferenze_Colori	preferenze dei tecnici
Configurazione	regole del sistema
Festività	giorni festivi
Log_IA	registro decisioni
Template_Modulo	modulo AREA 4


Il foglio è il cuore dei dati.


---

2️⃣ Automazioni (Google Apps Script)

Lo script è il cervello dell’app.

Funzioni principali:

1 Generazione calendario

Lo script crea automaticamente:

sabati

domeniche

festivi

Pasqua

Pasquetta


Mantiene sempre 3-6 mesi futuri disponibili.


---

2 Assegnazione automatica turni

L’algoritmo assegna i turni rispettando:

1️⃣ punteggio utenti
2️⃣ pausa minima tra turni
3️⃣ preferenze colori


---

3 Aggiornamento punti

Quando un turno viene svolto:

i punti vengono aggiunti automaticamente

il database si aggiorna



---

4 Creazione modulo ufficiale

Lo script:

1. copia Template_Modulo


2. inserisce:

date

nomi

orari




Risultato:

📄 modulo AREA 4 pronto da stampare o salvare PDF


---

3️⃣ Interfaccia Web (per i tecnici)

I tecnici non devono usare il foglio.

Accedono a una pagina web privata.

Funzioni disponibili:

Login

Accesso tramite email aziendale.


---

Calendario preferenze

I tecnici vedono i giorni futuri e possono impostare:

🟩 Verde → disponibile volentieri
⬜ Bianco → neutro
🟨 Giallo → preferirei evitare
🟥 Rosso → impossibile


---

Visualizzazione turni

Ogni tecnico può vedere:

i turni assegnati

il proprio punteggio

quando è stato l’ultimo turno



---

4️⃣ Algoritmo di assegnazione turni

Quando il sistema deve coprire una data, esegue questo processo.


---

Fase 1 — filtro esclusione

Vengono eliminati subito:

utenti OFF

utenti ROSSI

utenti in pausa minima


(esempio 30 giorni)


---

Fase 2 — punteggio virtuale

Per gli utenti rimanenti viene calcolato:

Punteggio virtuale =
Punti reali + bonus/malus colore

Valori:

Colore	Effetto

🟩 Verde	-2 punti
⬜ Bianco	0
🟨 Giallo	+2 punti
🟥 Rosso	escluso



---

Fase 3 — scelta utente

L’IA seleziona chi ha il punteggio virtuale più basso.

Questo garantisce:

⚖️ equità tra tecnici.


---

Fase 4 — spareggio

Se due tecnici hanno lo stesso punteggio:

priorità:

Verde
Bianco
Giallo


---

Fase 5 — anomalia

Se tutti sono esclusi:

il sistema segna

⚠️ ANOMALIA

e avvisa il manager.


---

5️⃣ Sistema punti

Ogni turno ha un valore.

Configurabile nel foglio Configurazione.

Esempio:

Giorno	Punti

Sabato	1
Domenica	1
Festivo	3


Quando un tecnico lavora:

punti_totali = punti_totali + valore_turno


---

6️⃣ Pausa minima

Per evitare turni troppo ravvicinati.

Regola tipica:

pausa minima = 30 giorni

Chi ha lavorato da meno di 30 giorni non può essere scelto.


---

7️⃣ Ciclo mensile della pianificazione

Il sistema segue questo ciclo.


---

Giorni 1-14

I tecnici inseriscono i colori.


---

Giorno 15

Lo script:

calcola i turni del mese successivo

genera la bozza



---

Giorni 15-24

Periodo per:

modifiche

scambi turno

interventi manager



---

Giorno 25

🔒 FREEZE

Il calendario diventa definitivo.


---

Fine mese

Il sistema:

aggiorna i punti

prepara i mesi successivi.



---

8️⃣ Funzioni manager

Il manager ha una pagina dedicata.

Può:

Attivare / disattivare utenti

ON
OFF

per ferie o malattie.


---

Forzare un turno

Può assegnare manualmente una persona.


---

Inviare solleciti

Se qualcuno lascia troppi giorni bianchi.


---

Consultare il log IA

Ogni decisione è registrata:

data
utente scelto
punteggio
motivo scelta

Trasparenza totale.


---

9️⃣ Sicurezza e controllo

Il sistema garantisce:

✔ nessuna modifica ai turni congelati
✔ nessuna assegnazione a chi è rosso
✔ nessun turno troppo ravvicinato


---

🔟 Vantaggi del sistema

Risparmio tempo

Il manager non deve più costruire i turni manualmente.


---

Equità

L’algoritmo distribuisce i turni in modo matematico.


---

Trasparenza

Il log mostra il motivo di ogni decisione.


---

Riduzione conflitti

Le preferenze vengono considerate automaticamente.


---

⭐ In sintesi

La Web App fa automaticamente:

1️⃣ genera calendario futuri
2️⃣ raccoglie preferenze tecnici
3️⃣ calcola turni equi
4️⃣ aggiorna punteggi
5️⃣ crea modulo ufficiale

Il manager deve solo:

✔ controllare
✔ approvare
✔ stampare il modulo.


---

💡 Se vuoi, nel prossimo passo posso anche mostrarti una cosa molto utile:

la struttura definitiva del foglio Google (celle e colonne esatte)
così lo script funzionerà senza errori e senza doverlo rifare dopo.