# Verifica — migrazione a GitHub Releases

## Risultati

- **47 test Node, zero fallimenti**: normalizzazione API, versioni, asset, URL, Markdown sicuro,
  paginazione, cache, deduplicazione richieste, timeout/rate limit, isolamento repository e snapshot atomico.
- **7 scenari browser release**, comprendenti 16 combinazioni di larghezza/tema da 320 a 7680 px,
  deep link, cambi rotta durante una richiesta, errori, cache e rimozione release. Zero errori JavaScript.
- Landing/wiki: smoke test, ricerca, navigazione, rendering dei **67 articoli** e riferimento completo
  con **20 configurazioni** passati senza richieste API release sulle pagine non interessate.
- **14 casi gallery** passati in sottogruppi; hover originale e verifica ultrawide passati.
- CSS landing/wiki/gallery/ultrawide, controller gallery, articoli, dati landing e bundle config
  sono stati confrontati byte-per-byte con lo ZIP precedente: invariati.
- YAML del workflow e presenza delle dipendenze locali controllati. Archivio verificato dopo la creazione.

## Ambito e limiti

Il Chromium gestito blocca la navigazione nativa `file://` e il dominio HTTPS fittizio dei test.
Le verifiche browser caricano **i veri HTML/CSS/JS** in una pagina vuota; il client API riceve
risposte deterministiche tramite un sostituto di `fetch`. Non sono una prova end-to-end di
CORS, download GitHub reale o doppio clic su Windows. I test Node coprono anche persistenza
cache e storage bloccato, senza pretendere di verificare le policy di ogni browser.

La richiesta in sola lettura tramite connettore GitHub ha restituito un catalogo pubblico vuoto.
La rete diretta Node/Python del container non ha raggiunto l'endpoint. Il builder conserva
correttamente la copia precedente quando questa richiesta fallisce; lo snapshot distribuito
resta vuoto, senza release o JAR fittizi. La compilazione snapshot è stata testata con risposte
API controllate. Nessun workflow è stato eseguito nell'account, né sono stati modificati repository,
secret o release.

Due esecuzioni aggregate della gallery hanno superato il limite del tool. La stessa suite è stata
rieseguita in quattro sottogruppi senza modificare il controller: tutti i 14 casi sono passati.
Il test accetta ora `--match` per poter ripetere i sottogruppi in ambienti con un timeout breve.

Dettagli numerici: `GITHUB_RELEASES_VERIFICATION.json`; scenari release: `GITHUB_RELEASES_QA.json`.

## Comandi

```powershell
node --test
node tests/validate-theme.mjs
python tests/browser_github_releases.py
python tests/browser_smoke.py --embedded
python tests/browser_reference.py
python tests/browser_gallery.py
python tests/browser_preview_hover.py --embedded
python tests/browser_ultrawide.py --embedded
```

Le verifiche browser richiedono Python, Playwright, BeautifulSoup e Chromium; non servono
per utilizzare o personalizzare normalmente il sito. Il builder offline richiede Node 22+ e Internet.
