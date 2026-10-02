# Prima pubblicazione di CoreChatX-WebSite-wip

## Stato del pacchetto

Pubblicazione completata il 2 ottobre 2026: [sito WIP](https://icewolf23x.github.io/CoreChatX-WebSite-wip/), repository pubblica su `main`, Pages tramite GitHub Actions e HTTPS. I default provengono dal branch `codex/fix-source-audit`, commit `eb06bd05f2a4d952ee7fee6323e3f52b32d7b145`. La descrizione della preparazione originale sotto rimane storica.

La repository di destinazione è **IceWolf23X/CoreChatX-WebSite-wip**, pubblica, branch `main`. Lo ZIP è pronto per la pubblicazione, **ma durante la sua preparazione non è stata creata alcuna repository e non è stato attivato Pages sul tuo account**: gli strumenti GitHub disponibili in quella chat erano di sola lettura.

Il sito include già landing, wiki, gallery, tema chiaro/scuro, layout fino a 32:9, catalogo release via API della repository WIP, i 19 default amministrativi verificati tramite GitHub e un template generato separato. Le release della repository di produzione restano indipendenti.

## 1. Prerequisiti sul tuo PC Windows

Servono **Git**, **GitHub CLI** e **Node.js 22 o successivo**. Non servono Python o `npm install` per pubblicare.

Verifica da PowerShell:

```powershell
git --version
gh --version
node --version
```

Se mancano, installa quelli necessari (può essere richiesta conferma da Windows/WinGet):

```powershell
winget install --id Git.Git --exact
winget install --id GitHub.cli --exact
winget install --id OpenJS.NodeJS.LTS --exact
```

Dopo un'installazione chiudi e riapri il terminale, così il PATH aggiornato è disponibile.

## 2. Pubblica

1. Estrai l'intero ZIP in una **cartella nuova**, non dentro un checkout esistente del plugin o del vecchio sito.
2. Entra in `CoreChatX-WebSite-wip` e avvia **`PUBBLICA-WIP.cmd`** con doppio clic.
3. Se GitHub CLI non è autenticato, completa l'accesso nel browser con **IceWolf23X**. La procedura richiede gli scope `repo` e `workflow` per creare la repository e caricare i workflow. Le credenziali sono gestite da GitHub CLI; non vengono scritte nel sito o nei suoi JavaScript.
4. Attendi l'esito: lo script mostra il link del sito solo dopo che il suo workflow Pages risulta riuscito. Un errore o un timeout non viene presentato come pubblicazione riuscita.

In alternativa, da PowerShell nella cartella del pacchetto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Publish-Wip.ps1
```

Il bypass vale solo per quel processo: non cambia permanentemente la policy del PC. È possibile eseguire direttamente `node tools/publish-wip.mjs`.

## 3. Cosa fa lo script

- Verifica struttura, bundle dei default e test Node prima delle modifiche remote.
- Controlla che l'account GitHub attivo sia IceWolf23X.
- Rifiuta repository preesistenti non create da quella stessa esecuzione/cartella; non sovrascrive il website di produzione e non cambia la visibilità di repository private.
- Crea `IceWolf23X/CoreChatX-WebSite-wip` come **public** e carica il sito alla radice, non in una sottocartella.
- Imposta `main` come branch predefinito.
- Configura **Pages → Source: GitHub Actions** e HTTPS.
- Imposta la variabile repository `COREX_PAGES_ENABLED=true`.
- Avvia `Deploy GitHub Pages`, segue quella specifica esecuzione per massimo 15 minuti e ne controlla l'esito.
- Configura il link Homepage della repository usando l'URL reale restituito da GitHub Pages, anche se un dominio dell'account modifica il normale URL github.io.

Non crea release del plugin e non carica JAR. Li pubblicherai nella sezione **Releases della repository WIP**. Fino alla prima release con un JAR riconosciuto, la pagina download resta vuota.

Il workflow Pages pubblica soltanto `index.html`, `reference.html`, `assets/` e `synced-configs/`, più metadata pubblici di build. Gli articoli della wiki sono mantenuti nei dati JavaScript sotto `assets/`. Il checkout privato `.sync/`, le credenziali Git e i tool non entrano nell'artefatto distribuito. Guide e tool restano comunque pubblici come file della repository.

## 4. Aggiornamenti successivi

Modifica i file di contenuto/asset, fai commit e push a `main`: Pages si aggiorna automaticamente. Non rilanciare lo script di prima pubblicazione per la normale manutenzione.

```powershell
git add assets
git commit -m "site: update content"
git push
```

Per i default, lo snapshot iniziale è già pronto: **nessun token della repo privata è necessario per visualizzare o pubblicare il sito**.

La sincronizzazione futura dalla repository privata richiede una configurazione separata perché il GITHUB_TOKEN del website non può leggere CoreChatX-plugin:

1. Crea un fine-grained token limitato a **CoreChatX-plugin**, permesso **Contents: Read-only**.
2. Nel website vai su **Settings → Secrets and variables → Actions → New repository secret** e salvalo come `COREX_PLUGIN_READ_TOKEN`.
3. Riabilita **Actions → Sync plugin configuration defaults → Enable workflow**, poi seleziona **Run workflow**. Il workflow è stato disabilitato dopo la pubblicazione perché il token privato non è ancora configurato.
4. Il deploy Pages parte dopo il sync riuscito tramite `workflow_run`, anche se il commit è fatto dal normale GITHUB_TOKEN. Non serve un token di scrittura aggiuntivo per Pages.

Il notifier nella repository privata è facoltativo e non è stato installato durante la preparazione. L'esempio `docs/examples/plugin-repository-notify.yml` è già diretto a `IceWolf23X/CoreChatX-WebSite-wip`: richiede `COREX_WEBSITE_DISPATCH_TOKEN` con Contents: Read and write **solo sul website**. La guida completa resta `docs/GITHUB_SYNC.md`. Non mettere un token in `site-config.js` e non pubblicare configurazioni reali di server.

## 5. Recupero dagli errori

**Account sbagliato:** `gh auth switch --hostname github.com --user IceWolf23X`, poi rilancia lo script.

**Permesso workflow mancante con login già esistente:** esegui `gh auth refresh --hostname github.com --scopes repo,workflow`, completa l'accesso richiesto e rilancia. Se usi GH_TOKEN/GITHUB_TOKEN come variabile d'ambiente, la loro precedenza può richiedere di correggere quella credenziale invece del login memorizzato.

**Repository già esistente:** lo script si ferma prima di fare push. Non eliminarla per tentativi. Controlla il contenuto della repository e pubblica manualmente su quella corretta. Un'esecuzione interrotta può essere ripresa dalla stessa cartella, che conserva `.wip-publish-state.json` (ignorato da Git, senza credenziali).

**Git push rifiutato:** non eseguire force-push. Se un workflow ha già aggiornato `main` durante un tentativo precedente, ispeziona lo stato e usa `git pull --rebase origin main`, risolvi eventuali conflitti e riprova. I branch protetti o le policy dell'account vanno rispettati.

**Pages non parte:** verifica Pages con sorgente Actions, `COREX_PAGES_ENABLED=true`, e l'esito delle Actions. Il primo push precedente all'attivazione del flag può avere un deploy saltato: lo script ne richiede un secondo esplicitamente dopo la configurazione.

**Errore HTTPS/certificato:** controlla Settings → Pages; attendi l'emissione del certificato quando richiesta e riprendi. Nessun dominio personalizzato viene aggiunto o rimosso dallo script.

**Test symlink saltato in Windows:** alcuni account senza Developer Mode non possono creare symlink. Solo quel test viene saltato localmente; il controllo viene comunque eseguito da CI Linux. Le altre verifiche rimangono attive.

## 6. Fonti tecniche

Documentazione ufficiale consultata il 2 ottobre 2026:

- GitHub CLI, creazione repository: https://cli.github.com/manual/gh_repo_create
- GitHub CLI, login: https://cli.github.com/manual/gh_auth_login
- GitHub REST, creazione/aggiornamento Pages: https://docs.github.com/en/rest/pages/pages
- GitHub Pages tramite workflow: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Token e workflow ricorsivi: https://docs.github.com/en/actions/concepts/security/github_token

Le verifiche locali dello script simulano GitHub CLI e le risposte delle API: non equivalgono a una pubblicazione live già avvenuta. L'esito reale viene controllato dallo script quando lo esegui sul tuo PC.
