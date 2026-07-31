# Como publicar uma nova versão (atualização automática)

O app se atualiza sozinho a partir do **GitHub Releases** do repositório
`lnpti/sarandi-newsroom-dashboard`. Quando você publica uma versão nova, cada
máquina com o app instalado detecta, baixa em segundo plano e reinicia sozinha
já **em tela cheia**.

## Pré-requisito (uma vez só)

1. Gere um **Personal Access Token** no GitHub com permissão de `repo`
   (Settings → Developer settings → Tokens).
2. Deixe ele disponível no terminal antes de publicar:

   ```powershell
   $env:GH_TOKEN = "seu_token_aqui"
   ```

## A cada nova versão

1. **Suba o número da versão** em `package.json` (campo `"version"`).
   A atualização só dispara quando a versão publicada for **maior** que a
   instalada. Ex.: `1.0.0` → `1.0.1`.
2. Publique:

   ```bash
   npm run release
   ```

   Isso compila, gera o instalador e envia pro GitHub Releases os arquivos
   `Setup.exe`, `latest.yml` e `.blockmap` (o `latest.yml` é o que o app lê pra
   saber que existe versão nova).
3. Pronto. Em até ~30 min (ou no próximo start) os apps instalados atualizam
   sozinhos. Para forçar na hora, basta reabrir o app.

## Importante — versão base

A **primeira instalação** precisa ser feita manualmente com o instalador gerado
por `npm run release` (ou `npm run dist`), porque só a partir dele o app passa a
saber checar os releases. Depois disso, tudo é automático.

## Observações

- Sem `GH_TOKEN`, `npm run release` falha ao enviar (o build local funciona,
  mas não publica).
- Se quiser gerar o instalador **sem publicar** (teste local), use `npm run dist`.
- O app só verifica atualizações quando está **empacotado** (instalado) — em
  `npm run dev` o auto-update fica desligado de propósito.
