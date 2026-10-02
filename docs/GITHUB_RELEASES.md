# Download e release da GitHub

La sorgente dei download è **`IceWolf23X/CoreChatX-WebSite-wip` → Releases**.
La repository privata del plugin non viene interrogata dal browser. I JAR sono allegati
alle release pubbliche del website: non fanno parte del suo albero di file né dello ZIP del tema.

## 1. Pubblicare una nuova versione

1. Apri la repository **CoreChatX-WebSite-wip**, non CoreChatX-plugin.
2. Entra in **Releases → Draft a new release**.
3. Seleziona/crea il tag, per esempio `v2026.3.2` oppure `2026.3.2`.
4. Scrivi il titolo e il changelog nella descrizione della release. Il corpo è Markdown:
   non serve allegare un `changelog.md` separato.
5. Allega i JAR usando `papermc.jar` e `velocity.jar`. È sufficiente anche un solo JAR.
6. Per le build sperimentali attiva **Set as a pre-release**; tag come
   `v2026.4.0-alpha.1`, `v2026.4.0-beta.2` e `v2026.4.0-rc.1` producono etichette dedicate.
7. Pubblica la release. Un semplice tag senza release, una bozza o una release senza
   JAR riconoscibili non produce una voce scaricabile nel sito.
8. Apri `index.html#/releases` (o la stessa rotta sul sito) e premi **Refresh**.
   I visitatori con una cache valida possono vedere la versione precedente fino alla sua scadenza.

Non occorre ricompilare, fare un commit di JAR, creare cartelle `release/`, modificare HTML
oppure registrare ogni nuova versione in JavaScript. Il changelog viene dalla **descrizione**,
non da un eventuale allegato omonimo. GitHub fornisce timestamp, dimensioni, link e digest
quando disponibile. [1][2]

## 2. Repository e nomi degli allegati

In `assets/js/data/site-config.js`:

```js
releases: {
  provider: 'github',
  owner: 'IceWolf23X',
  repository: 'CoreChatX-WebSite-wip',
  cacheMinutes: 15,
  requestTimeoutMs: 10000,
  maxPages: 10,
  assetNames: {
    paper: ['papermc.jar', 'paper.jar', '*-paper-*.jar', '*-paper.jar'],
    velocity: ['velocity.jar', '*-velocity-*.jar', '*-velocity.jar']
  }
}
```

Le liste contengono nomi esatti o pattern con `*`, senza distinzione maiuscole/minuscole.
I pattern sono controllati in ordine: `papermc.jar` ha precedenza su un nome versionato.
Sono già riconosciuti, per esempio, `corechatx-paper-2026.3.2.jar` e
`corechatx-velocity-2026.3.2.jar`. Gli archivi `*-sources.jar`, `*-javadoc.jar`,
`original-*` e gli allegati non ancora caricati vengono ignorati.

Se uno stesso pattern seleziona due JAR per una piattaforma, il tema **non sceglie a caso**:
omette quel pulsante e segnala l'ambiguità. Rinomina gli allegati oppure rendi il pattern più preciso.
I link devono appartenere a `github.com/<owner>/<repository>/releases/download/`.
Le copie ZIP/tar del codice sorgente create automaticamente da GitHub non vengono usate come JAR.

Il sito conserva il tag completo; ordina numericamente i componenti, comprese versioni
con prefisso `v`, hotfix a quattro componenti e prerelease numerate. Nella pagina iniziale
seleziona la versione stabile numericamente più alta; in sua assenza, la prima prerelease.
**Latest stable** è quindi la scelta del tema, non il flag manuale “Latest” di GitHub.
Un link `#/releases/v2026.3.2` seleziona quella release specifica.

## 3. Download e changelog

I pulsanti puntano a `browser_download_url` dell'asset. Il trasferimento passa da GitHub,
non dal tuo hosting e non richiede che il visitatore apra prima la pagina GitHub.
Il nome del file salvato viene deciso dal download GitHub/browser: rinomina l'asset prima
della pubblicazione per controllarlo, non fare affidamento sull'attributo HTML `download`
per un file ospitato su un altro dominio.

SHA-256 viene mostrato e copiato **solo** se GitHub fornisce un digest SHA-256 valido.
Non viene inventato, e il sito non scarica interi JAR per calcolarlo. Se assente, compare
un messaggio esplicito. La compatibilità Minecraft non è dedotta dal tag del plugin.

Markdown supportato: titoli, paragrafi, enfasi, barrato, elenchi semplici, citazioni,
separatore, codice inline/blocchi fenced, tabelle semplici e link HTTP/HTTPS/mailto.
Non è un clone integrale di GitHub Flavored Markdown: l'HTML grezzo è mostrato come testo,
le immagini remote diventano link e non si esegue HTML/JavaScript proveniente dai changelog.
Nessuna richiesta a immagini remote parte soltanto perché compare nel testo una loro URL.

## 4. Cache, aggiornamento e guasti

La landing e la wiki **non fanno richieste release**. Il primo accesso alla pagina Releases
avvia la lettura API pubblica, senza cookie o token. La cache dei metadati dura 15 minuti,
separata per repository; resta in memoria anche se il browser blocca `localStorage`.
Il sito verifica la scadenza quando si entra/rientra nella pagina, non tramite un polling continuo.
**Refresh** forza una nuova lettura salvo un periodo di blocco dopo un errore/rate limit.

L'API è paginata: il client segue il collegamento `next` fino al completamento.
Il limite configurato di 10 pagine da 100 elementi è una protezione: se viene superato,
la lettura fallisce esplicitamente senza sostituire la cache con un catalogo parziale.
Aumenta `maxPages` quando serve. [1][3]

Se GitHub non risponde, la connessione manca, una pagina intermedia fallisce o l'API limita
le richieste, il tema mantiene l'ultimo catalogo completo e lo segnala. Il pulsante GitHub
rimane disponibile. Una risposta valida `[]`, invece, svuota davvero il catalogo: release
rimosse non restano aggiunte artificialmente. Lo stato di errore non viene confuso con
una repository vuota. Una copia in cache può temporaneamente contenere link ad asset rimossi:
aggiorna il catalogo o apri GitHub per controllarne la disponibilità attuale.

Le richieste REST pubbliche non autenticate hanno limiti condivisi per IP. Il client
rispetta `Retry-After`/`X-RateLimit-Reset` e non fa retry automatici in un ciclo. [4]

## 5. Cosa funziona offline

HTML, CSS, logo, landing, wiki e gallery locale rimangono nel pacchetto.
Per le release il sito può mostrare la cache salvata oppure
**`assets/js/generated/releases.js`**, una copia dei soli metadati pubblici.
Per aggiornare l'elenco o scaricare un JAR remoto serve Internet.

Lo ZIP iniziale non contiene release dimostrative, binari fittizi o copie della repo privata.
Se la repository non contiene release pubbliche, il catalogo resta vuoto.
Il browser non usa `fetch()` per caricare file adiacenti `file://`: carica normali script locali.
La lettura API online è cross-origin e soggetta alle regole del browser; GitHub dichiara
il supporto CORS alle richieste AJAX da ogni origin. [5]

Per aggiornare la copia offline sul tuo PC, con Node.js 22+ e Internet:

```powershell
node tools/build-releases.mjs .
node tests/validate-theme.mjs
node --test
```

Lo script legge owner/repository dagli stessi dati usati dal sito. Se l'API fallisce,
termina con errore e **non sovrascrive** la copia precedente. Con contenuti invariati non
riscrive il file; altrimenti lo sostituisce in modo atomico. I dati non contengono credenziali,
draft, informazioni dell'autore non necessarie o HTML già renderizzato.
Dopo il refresh puoi comprimere la cartella per distribuire uno ZIP con metadati aggiornati.

## 6. GitHub Action facoltativa per la copia offline

È incluso `.github/workflows/build-releases.yml`, ora chiamato
**Refresh GitHub release snapshot**. Non è richiesto per l'elenco live nel browser.

Il workflow aggiorna la copia quando una release viene pubblicata/modificata/rimossa,
una volta al giorno per intercettare anche modifiche ai soli allegati, oppure tramite
**Actions → Refresh GitHub release snapshot → Run workflow**. [6]

Esegue test Node, legge le release pubbliche, valida il sito e committa solamente
`assets/js/generated/releases.js` quando cambia. Esegue il checkout del branch
predefinito del website, non del codice del tag del plugin.
La lettura API avviene senza autenticazione anche nel builder: se il nome punta a una
repository privata, deve fallire invece di esportarne il contenuto.

**Prima installazione:** carica il workflow sul branch predefinito prima di creare i nuovi tag.
Un evento release relativo a un vecchio tag può non trovare il workflow aggiornato;
in quel caso usa l'avvio manuale oppure attendi quello pianificato.
Il trigger `push.branches` è impostato su `main`: adattalo se il branch predefinito ha un altro nome.
L'orario giornaliero è UTC e le esecuzioni pianificate non sono garantite al secondo.

Per committare occorre che le policy del repository consentano scrittura a Actions.
Il workflow usa `GITHUB_TOKEN` oppure l'esistente secret opzionale
`COREX_WEBSITE_WRITE_TOKEN`. Un push con `GITHUB_TOKEN` non avvia normalmente un altro workflow;
questo pacchetto WIP usa invece `deploy-pages.yml` con `workflow_run` dopo lo snapshot riuscito: non richiede il token dedicato per pubblicare Pages.
**L'elenco live continua comunque a leggere GitHub**, anche se la copia offline non è stata ridistribuita. [7]
Branch protetti/ruleset possono rifiutare il commit: non disabilitarli indiscriminatamente;
usa il builder nel flusso di pubblicazione approvato o applica il file tramite pull request.
Nessun workflow, secret, release o deploy è stato creato/attivato nel tuo account durante
la preparazione di questo ZIP.

## 7. Migrazione e riuso

Il vecchio `release/` non è più una sorgente. Prima di eliminarne una copia sul tuo PC,
carica i JAR reali come asset GitHub e trasferisci `changelog.md` nella descrizione.
Il vecchio generatore da cartelle è stato sostituito; `build-releases.yml` conserva il percorso
per sostituire il workflow precedente, senza lasciare due automazioni in conflitto.

Per un altro prodotto CoreX cambia `releases.owner`, `releases.repository`, i pattern
necessari e i testi di `ui-text.js`. Poi rigenera lo snapshot. Un vecchio snapshot appartenente
a un altro repository viene ignorato dal client e rifiutato dalla validazione.
I secret della **sincronizzazione dei default privati** restano una funzione distinta:
non occorre aggiungere un token nel frontend per rendere pubblici i download.

## Fonti ufficiali

Consultate durante la preparazione del pacchetto (2 ottobre 2026):

[1] https://docs.github.com/en/rest/releases/releases
[2] https://docs.github.com/en/rest/releases/assets
[3] https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api
[4] https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
[5] https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests
[6] https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
[7] https://docs.github.com/en/actions/concepts/security/github_token
