# SETUP — dallo ZIP al sito CoreX funzionante

> **Pacchetto WIP:** per creare e pubblicare `IceWolf23X/CoreChatX-WebSite-wip`, parti da [docs/DEPLOY_WIP.md](docs/DEPLOY_WIP.md) e avvia `PUBBLICA-WIP.cmd`. Il deploy Pages via Actions è incluso. Questa preparazione locale non ha già creato la repository.

Questa guida riguarda **l'uso del tema website**, non l'installazione del plugin Minecraft.
Le pagine del sito rimangono in inglese; questa guida operativa è in italiano.

## 1. Aprire il sito subito

1. Estrai **tutto** lo ZIP. Non aprire `index.html` direttamente dentro l'archivio compresso.
2. Entra nella cartella `CoreChatX-WebSite-wip`.
3. Apri `index.html` con un browser desktop moderno.
4. Controlla landing, Documentation e cambio tema. `reference.html` mostra il riferimento completo.

Per consultare il sito o modificare testi/immagini non servono Node.js, Python, npm, un server o una compilazione. I file JavaScript sono normali script locali, non moduli che devono essere caricati con `fetch()`.

La gallery arriva volutamente **vuota**, con il placeholder già previsto: non sono inclusi screenshot di gioco inventati. Aggiungi i tuoi file seguendo il punto 3.

## 2. Dove si modifica ogni cosa

| Voglio cambiare… | File da modificare |
| --- | --- |
| Nome, descrizione, logo, favicon, link, palette chiara/scura | `assets/js/data/site-config.js` |
| Repository e cache delle release, nomi degli allegati JAR | `assets/js/data/site-config.js` → `releases` |
| Immagini della preview e comportamento della gallery | `assets/js/data/site-config.js` → `assets.heroPreview` |
| Titoli, pulsanti, schede, FAQ, menu, footer, ordine delle sezioni | `assets/js/data/landing-content.js` |
| Categorie, titoli, spiegazioni e corpi degli articoli wiki | `assets/js/data/docs-content.js` |
| Etichette di ricerca, navigazione, copia, controlli della gallery | `assets/js/data/ui-text.js` |
| Quali default vengono pubblicati dalla repository privata | `tools/config-sync-map.mjs` |

Salva il file e ricarica il browser. Non occorre rigenerare nulla per una normale modifica ai `.js` editoriali.

**La rigenerazione necessaria per i config riguarda i file originali** (`.yml`, `.properties`, ecc.): questi vengono impacchettati in un bundle JavaScript per essere disponibili anche offline. Non modificare a mano `assets/js/generated/config-files.js`. Lo snapshot delle release GitHub può essere aggiornato separatamente per la consultazione offline: vedi il punto 11.

I corpi degli articoli usano `bodyHtml`: sono stringhe HTML dentro il `.js`, non contenuti da scrivere in `index.html`. Sono contenuti fidati dell'editor, non una destinazione per HTML fornito dai visitatori. I Markdown in `sources/` conservano la provenienza della documentazione, ma **non sono il sistema di aggiornamento** del tema.

## 3. Configurare la gallery della preview

### Caricare e indicare le immagini

1. Copia i tuoi screenshot in `assets/img/`, ad esempio `chat-01.webp` e `chat-02.webp`.
2. Apri `assets/js/data/site-config.js`.
3. Dentro `assets`, modifica l'oggetto **già esistente** `heroPreview`. Non creare un secondo oggetto con lo stesso nome.

```js
heroPreview: {
  images: [
    {
      src: 'assets/img/chat-01.webp',
      alt: 'Public chat with mentions',
      caption: 'Public chat, formatted for your server.'
    },
    {
      src: 'assets/img/chat-02.webp',
      alt: 'A shared inventory preview',
      caption: 'Share a snapshot without leaving the conversation.',
      objectFit: 'contain'
    }
  ],
  autoplay: true,
  intervalMs: 5000,
  transitionMs: 240,
  pauseOnHover: true,
  objectFit: 'contain',
  src: '',
  alt: 'CoreChatX running in Minecraft'
}
```

I nomi sopra sono **esempi**: il file deve esistere davvero. Usa percorsi relativi con `/`, senza `C:\`, senza un `/` iniziale e rispettando maiuscole/minuscole. PNG, JPEG, WebP e altri formati immagine supportati dal browser possono essere usati come normali asset. Per mantenere il sito offline, usa immagini incluse nella cartella, non URL esterni.

### Cosa succede in base al numero di immagini

| Immagini valide e distinte | Comportamento |
| --- | --- |
| Nessuna | Rimane il placeholder. Nessun controllo o avanzamento automatico. |
| Una | Immagine statica. Nessun timer di rotazione, duplicato, transizione verso sé stessa o controllo superfluo. |
| Due o più | Gallery con dissolvenza, avanzamento automatico, click sull'immagine, frecce, indicatori e pausa/ripresa. |

Le immagini vengono caricate e decodificate prima della visualizzazione. Il riquadro conserva le proprie dimensioni passando tra immagini di proporzioni diverse. Un file che non si carica entro 12 secondi, o non è un'immagine decodificabile, viene escluso per quella visita. Se resta un solo file valido, il comportamento torna statico; se non ne resta nessuno, rimane il placeholder. Percorsi duplicati equivalenti vengono conteggiati una sola volta.

`src` e `alt` al livello principale rimangono compatibili con la vecchia preview singola: `src` viene usato **solo quando `images` è vuoto o assente**. Con una lista non vuota, questa ha la precedenza. Per mostrare davvero il placeholder, lascia vuoti sia `images` sia `src`.

### Regolare tempi e visualizzazione

- `intervalMs`: permanenza dell'immagine completamente visibile prima del prossimo cambio automatico; default 5000 ms, minimo 1000 ms, massimo 600000 ms.
- `transitionMs`: durata della dissolvenza; default 240 ms, valori da 0 a 1000 ms. Con 0 il cambio è immediato.
- `autoplay: false`: la gallery parte in pausa; il visitatore può comunque scorrere o premere Play.
- `pauseOnHover: true`: sospende la rotazione finché il puntatore è sopra il riquadro.
- `objectFit: 'contain'`: mostra l'immagine intera, lasciando spazio neutro se le proporzioni differiscono. `'cover'` riempie il riquadro, eventualmente tagliando i bordi. Un valore sull'immagine prevale su quello generale.
- `caption`: didascalia opzionale per immagine. Se assente, viene usata `hero.preview.captionLeft` da `landing-content.js`.

Il click sull'immagine avanza di una posizione, **senza zoom o popup**, e azzera l'attesa del cambio successivo. Le frecce e i puntini permettono la navigazione diretta; su touch è disponibile lo swipe orizzontale senza bloccare lo scroll verticale. Da tastiera, entra nei controlli con Tab e usa frecce sinistra/destra, Home/End o i pulsanti.

Quando il focus entra nei controlli, la rotazione si ferma fino a Play. Questo vale anche se il focus è stato dato con il mouse: è distinto dalla pausa temporanea al semplice hover. In una scheda nascosta, nella wiki o quando la preview è fuori schermo, non vengono accumulati avanzamenti. Con la preferenza di sistema “riduci animazioni”, niente autoplay o dissolvenza; la navigazione manuale rimane disponibile. L'inclinazione/hover originale di `preview-shell` è separata dalla gallery e conserva le regole desktop/ultrawide.

## 4. Creare o aggiornare la repository del website

Per un sito separato, una struttura possibile è:

```text
IceWolf23X/CoreChatX-plugin     privata: sorgenti del plugin
IceWolf23X/CoreChatX-WebSite-wip    sito: solo materiale pubblicabile
```

Questi nomi non creano le repository automaticamente. Usa i nomi reali che hai scelto. Se la repository del website esiste già, parti da un clone aggiornato e conserva dominio personalizzato, impostazioni hosting e modifiche locali.

1. Crea/clona la repository del website, oppure apri il clone esistente.
2. Copia **il contenuto** di `CoreChatX-WebSite-wip/` nella radice della repository: `index.html` deve stare accanto a `assets/`, `tools/`, `.github/` e `SETUP.md`, non un livello più sotto.
3. Includi anche la cartella nascosta `.github` e il file `.gitignore`.
4. Controlla con `git status` cosa stai per pubblicare. Non copiare cartelle server, `.env`, token o sorgenti privati.
5. Fai commit e push sul branch scelto per il sito.

Nessun workflow è stato installato o avviato nel tuo account dalla preparazione di questo ZIP: i passi GitHub qui sotto sono da configurare una volta.

## 5. Prima sincronizzazione dei config, manuale su GitHub

### 5.1 Impostare repository e branch sorgente

Controlla **entrambi** questi file nel website:

- `.github/workflows/sync-plugin-configs.yml`: nello step `Check out private plugin source`, `repository` e `ref` selezionano ciò che Actions scarica.
- `tools/config-sync-map.mjs`: `SOURCE_REPOSITORY` e `SOURCE_REF` descrivono la provenienza nel bundle. Devono coincidere con il checkout; non modificano automaticamente il workflow.

Il pacchetto punta a `IceWolf23X/CoreChatX-plugin`, branch **`master`**. La copia legge i file presenti in quel branch, non i config di un server avviato, non modifiche locali non pubblicate e non l'ultimo tag per magia.

Verifica anche la lista `CONFIG_FILES`: contiene i percorsi dei soli default autorizzati. Il template `generated/velocity-advancements.properties`, con `source: null`, è un template mantenuto nel sito, **non** un file copiato dalla cartella resources del plugin.

### 5.2 Creare il token di lettura del plugin

Nel tuo account GitHub apri **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Seleziona il proprietario corretto, una scadenza appropriata e **Only select repositories**, scegliendo soltanto la repository privata del plugin. Imposta **Repository permissions → Contents → Read-only**. Il token deve essere approvato dall'organizzazione se le sue policy lo richiedono. [1]

Nella repository **website**, apri **Settings → Secrets and variables → Actions → New repository secret**. Nome:

```text
COREX_PLUGIN_READ_TOKEN
```

Nel valore incolla il token. Non inserirlo in un `.js`, in un file YAML del progetto o in questa guida. Il workflow lo legge tramite `secrets.COREX_PLUGIN_READ_TOKEN`. [2]

### 5.3 Eseguire e controllare il primo sync

1. Verifica che `.github/workflows/sync-plugin-configs.yml` sia pubblicato nel branch predefinito del website.
2. In **Actions**, seleziona **Sync plugin configuration defaults → Run workflow** sul branch predefinito.
3. Controlla gli step di checkout, sincronizzazione, bundle, validazione e commit.
4. Il risultato previsto è un commit che aggiorna `synced-configs/` e `assets/js/generated/config-files.js`; se i default sono già uguali, non viene creato un commit inutile.
5. Apri una pagina config della wiki e confronta una chiave con il file sorgente.

Il workflow ha `permissions: contents: write`. Policy dell'organizzazione, branch protection o ruleset possono comunque impedirne il push: in quel caso adatta il flusso a una pull request o a un branch di sincronizzazione autorizzato, senza disabilitare indiscriminatamente le protezioni.

## 6. Attivare la notifica automatica dalla repository privata

Questo passaggio evita di dover premere Run workflow a ogni aggiornamento.

1. Copia `docs/examples/plugin-repository-notify.yml` **nella repository privata del plugin**, con il nome `.github/workflows/notify-website-config-sync.yml`.
2. In quel file sostituisci `OWNER/WEBSITE_REPOSITORY` con il nome reale del website, ad esempio `IceWolf23X/CoreChatX-WebSite-wip`.
3. Controlla `branches: [master]` e `paths`: devono corrispondere al branch e ai percorsi che vuoi osservare nel plugin.
4. Crea un altro fine-grained PAT limitato alla sola repository **website**, con **Contents: Read and write**. Questo permesso è richiesto dall'endpoint `repository_dispatch`; non basta “Actions: write”. [3]
5. Salvalo nei secret Actions della repository **plugin**, col nome `COREX_WEBSITE_DISPATCH_TOKEN`.
6. Pubblica il notifier e avvialo manualmente una volta dal tab Actions del plugin.
7. Controlla che compaia una nuova esecuzione del workflow di sincronizzazione sul website.

Flusso risultante:

```text
push di un default nei percorsi osservati del plugin / master
    → notifier del plugin
    → repository_dispatch sul website
    → checkout privato con token di sola lettura
    → copia della allow-list
    → bundle config + validazione
    → commit nel website
```

Il notifier incluso invia solo un evento: **non trasmette un commit/tag da usare come sorgente**. Il workflow del website scarica il `ref` configurato. Il comportamento predefinito è sincronizzare `master` dopo push rilevanti, NON sincronizzare solo release. Per adottare una politica basata sui tag devi allineare anche il checkout a un tag/ref validato: cambiare soltanto il trigger non basta.

Non aggiungere a questi workflow esecuzioni da pull request non fidate con accesso ai token. Nessun codice del plugin viene compilato o eseguito dal sync: vengono letti solo i file elencati.

## 7. Pubblicare il sito: GitHub Pages tramite Actions

Questo pacchetto WIP include `.github/workflows/deploy-pages.yml` e lo script di prima pubblicazione `PUBBLICA-WIP.cmd` (wrapper PowerShell + Node). La procedura completa è in [docs/DEPLOY_WIP.md](docs/DEPLOY_WIP.md).

La sorgente Pages deve essere **GitHub Actions**, non `Deploy from a branch` e non `/docs`. Lo script configura la repository pubblica, `main`, HTTPS, la variabile `COREX_PAGES_ENABLED=true` e avvia il deploy. Il workflow prepara `_site/` con i soli file pubblici necessari: nessun checkout privato, `.git`, token o strumenti di manutenzione viene pubblicato nell'artefatto Pages.

Il deploy parte su push a `main`, manualmente, oppure alla conclusione riuscita dei due workflow fidati che sincronizzano default e snapshot release. Il trigger `workflow_run` gestisce anche i commit fatti con `GITHUB_TOKEN`; **non serve `COREX_WEBSITE_WRITE_TOKEN` per il deploy di questo pacchetto**. [4][5]

La prima pubblicazione usa i default già inclusi e non richiede token per la repository privata. Per le sincronizzazioni future aggiungi `COREX_PLUGIN_READ_TOKEN`, con solo Contents: Read sulla repo plugin. Per avviarle dal plugin usa il notifier di esempio (già indirizzato alla repo WIP) e il relativo token di dispatch, oppure esegui il workflow di sync manualmente.

### Riepilogo dei secret

| Secret | Dove crearlo | Accesso minimo del PAT proposto |
| --- | --- | --- |
| `COREX_PLUGIN_READ_TOKEN` | Website | Contents: Read-only, solo plugin privato |
| `COREX_WEBSITE_DISPATCH_TOKEN` | Plugin | Contents: Read and write, solo website, per il dispatch |
| `COREX_WEBSITE_WRITE_TOKEN` | Website | Opzionale per altre pipeline; non necessario per il deploy Pages incluso |

Non condividere i token e pianifica il rinnovo prima della scadenza. Una GitHub App è un'alternativa per gestire più repository; i suoi token di installazione vanno generati/rinnovati dal workflow, non incollati come secret permanenti aspettandosi che durino indefinitamente. [6]

## 8. Aggiornare i default sul PC e preparare uno ZIP offline

Serve Node.js **22 o successivo** solo per questi comandi di manutenzione. Il pacchetto non richiede `npm install` per sincronizzazione, bundle o validazione.

Con due cartelle affiancate:

```text
CoreX/
├── CoreChatX-plugin/
└── CoreChatX-WebSite-wip/
```

Apri PowerShell/Terminal nella cartella website ed esegui:

```powershell
node --version
node tools/sync-plugin-configs.mjs ../CoreChatX-plugin .
node tools/build-config-bundle.mjs .
node tests/validate-theme.mjs
node --test
```

Se hai già copiato i config in `synced-configs/`, salta soltanto il primo comando di sync. Lancia comunque bundle e validazione.

Per ottenere il sito aggiornato sul PC dopo un sync fatto da Actions, esegui `git pull` nel clone website oppure scarica di nuovo la repository. L'archivio ZIP che avevi scaricato prima **non si aggiorna da solo**.

Per distribuire un nuovo ZIP, comprimi l'intera cartella website aggiornata, includendo asset e bundle. Non includere `.git/`, `.sync/`, `__pycache__/`, token, checkout privati o file del tuo server. Per un pacchetto di solo consultazione bastano HTML, assets, config e fonti referenziate; per un template riutilizzabile conserva anche guide, workflow, tools e tests.

### Aggiungere un nuovo file config

Aggiungi una voce alla allow-list in `tools/config-sync-map.mjs`, con `id`, `platform`, `format`, `source`, `target` e `article`. Crea la corrispondente pagina in `docs-content.js` con `configFile` e un mount `data-config-file` che usino lo stesso id; poi sincronizza, rigenera e valida. Il dettaglio del componente è in `docs/CUSTOMIZATION.md`.

I file non presenti nella lista **non vengono pubblicati automaticamente**, anche se terminano in `.yml`. Nuovi articoli e spiegazioni non vengono inventati a partire da nomi di chiavi. Se rimuovi una voce dalla lista, elimina esplicitamente anche il vecchio snapshot pubblico quando non deve più essere distribuito: il sync incluso non cancella genericamente le cartelle di destinazione.

## 9. Riutilizzare il tema per CoreArmorX o un altro CoreX

Lavora su una nuova copia/repository, non sovrascrivere CoreChatX accidentalmente.

1. In `site-config.js` cambia prodotto, descrizione, tagline, logo/favicon, link, palette e gallery. Sostituisci le immagini nei percorsi configurati.
2. In `landing-content.js` sostituisci testi, schede, FAQ e collegamenti alla wiki.
3. In `docs-content.js` sostituisci gli articoli e le categorie; rimuovi i contenuti CoreChatX non pertinenti. Aggiorna anche `ui-text.js`, che contiene testi editoriali delle pagine indice oltre alle etichette generiche.
4. Aggiorna fonti/provenienza in `sources/` e tutti i riferimenti rimasti al vecchio prodotto.
5. In `tools/config-sync-map.mjs` cambia repository/ref e lista dei default. Rimuovi gli snapshot del vecchio plugin che non devono restare pubblici, poi rigenera il bundle.
6. Allinea anche `repository`/`ref` nel workflow website e percorsi/branch/destinazione nel notifier del nuovo plugin. I secret devono avere accesso alle **nuove** repository.
7. Adatta i test specifici di CoreChatX: `validate-theme.mjs` contiene una soglia di almeno 60 articoli e i browser test verificano pagine/chiavi CoreChatX. Mantieni i controlli di integrità e quelli generici della gallery; sostituisci solo le aspettative di prodotto.
8. Verifica tema chiaro/scuro, ricerca, link, gallery con 0/1/più immagini e layout mobile/ultrawide prima del deploy.

`theme.storageKey: 'corex.theme'` condivide la preferenza tra siti nello stesso origin. Puoi scegliere una chiave diversa per separare i prodotti. In locale la persistenza dello storage può dipendere dalle restrizioni del browser; il cambio tema corrente continua a funzionare senza storage persistente.

## 10. Problemi frequenti

| Problema | Controllo |
| --- | --- |
| Pagina vuota dopo una modifica | Controlla virgole, apici e parentesi nei `.js`; apri F12 → Console. |
| La foto non appare | Percorso relativo, nome esatto e file esistente; riapri/ricarica dopo aver corretto il riferimento. Verifica `images` versus `src`. |
| La gallery resta ferma | Con una sola immagine è intenzionale. Con più immagini controlla Pause, hover/focus, `autoplay`, preferenze di movimento ridotto e visibilità della preview. |
| I nuovi YAML non compaiono offline | Rigenera `config-files.js`, oppure recupera il commit aggiornato dal website. |
| Checkout privato: 404/403 | Repo/ref corretti, token non scaduto, repo selezionata, Contents: Read-only e approvazioni organizzative. |
| Dispatch non avvia il website | Destinazione corretta, token nel plugin, Contents: Read and write sul website; workflow destinatario nel branch predefinito ed event type esatto. |
| Commit non consentito | Verifica token di scrittura e branch protection/ruleset, senza aggirarli indiscriminatamente. |
| Repository aggiornata ma sito vecchio | Controlla `Deploy GitHub Pages`, la variabile `COREX_PAGES_ENABLED=true` e che il workflow precedente sia riuscito. |
| Un nuovo file non viene copiato | Deve essere autorizzato in `CONFIG_FILES` e avere un articolo/mount coerente. |
| La sync ripristina valori che avevo editato sul website | È previsto: i default autorizzati del plugin sono la fonte. Modifica il plugin, non lo snapshot sincronizzato. |

## Riferimenti ufficiali e verifiche

Percorsi dell'interfaccia e requisiti dei token controllati sulla documentazione GitHub il 2 ottobre 2026. Le policy del tuo account/organizzazione possono imporre altri vincoli. La preparazione dello ZIP non configura token, repository o hosting nel tuo account e non dimostra un'esecuzione live di Actions.

[1]: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
[2]: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
[3]: https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event
[4]: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
[5]: https://docs.github.com/en/actions/concepts/security/github_token
[6]: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow

I test inclusi usano Chromium, Playwright e BeautifulSoup per le verifiche browser. Il browser gestito dell'ambiente di preparazione blocca `file://`: i controlli browser sono stati eseguiti caricando gli stessi file nell'harness, non simulando un doppio clic riuscito. Dettagli in `docs/GALLERY_QA.md`.

## 11. Pubblicare release e download da GitHub

I download ora provengono da **GitHub Releases della repository pubblica del website**,
configurata in `assets/js/data/site-config.js` → `releases`:

```js
owner: 'IceWolf23X',
repository: 'CoreChatX-WebSite-wip'
```

1. Nella repository website apri **Releases → Draft a new release**.
2. Imposta un tag come `v2026.3.2`, titolo e descrizione Markdown.
3. Allega **`papermc.jar`** e/o **`velocity.jar`** (sono supportati anche nomi versionati).
4. Per una build sperimentale attiva **Set as a pre-release**.
5. Pubblica: `#/releases` legge l'API automaticamente. **Refresh** aggiorna subito;
   senza refresh la cache dei visitatori dura normalmente 15 minuti.

**Non devi più creare cartelle `release/`, committare JAR o riscrivere i changelog nei JS.**
Il file salvato dal visitatore arriva direttamente da GitHub. Le bozze e le release
senza JAR riconoscibili non vengono mostrate; una sola piattaforma produce un solo pulsante.
Il checksum compare solo se fornito da GitHub, senza valori inventati.

Per aggiornare i metadati inclusi nello ZIP offline:

```powershell
node tools/build-releases.mjs .
node tests/validate-theme.mjs
node --test
```

Questa operazione richiede Node.js 22+ e Internet, ma **non serve per l'aggiornamento live**.
Lo script e il workflow `.github/workflows/build-releases.yml` aggiornano soltanto lo
snapshot `assets/js/generated/releases.js`, mai i JAR. Il workflow può eseguire il refresh
agli eventi release, giornalmente o manualmente da Actions.

Offline puoi leggere il catalogo salvato; per scaricare i JAR da GitHub serve Internet.
Non inserire token nei JS: le release devono essere pubbliche.

**Guida completa:** [docs/GITHUB_RELEASES.md](docs/GITHUB_RELEASES.md), con pattern degli
asset, cache, errori, API, snapshot, trigger GitHub, migrazione dal vecchio folder e riuso CoreX.
