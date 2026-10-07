// Espelha no Cloudflare R2 a build que o electron-builder acabou de gerar em
// dist/ (instalador + blockmap + latest.yml), pra o app poder se atualizar por
// lá quando o GitHub estiver inacessível (ver src/main/updater.js).
//
// Uso (logo DEPOIS do build da emissora — as duas emissoras geram o MESMO nome
// de arquivo em dist/, então a próxima build sobrescreve):
//   STATION=sarandi|cacique|alvorada node scripts/publish-cloudflare.mjs
//
// Credenciais só por variável de ambiente (nunca salvas em arquivo):
//   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
//
// Mesma conta/bucket (app-releases) do PlayTranscription e do AutoTrigger; cada
// emissora tem a sua pasta, com o seu próprio latest.yml (os instaladores são
// diferentes). Não usa o provider "s3" do electron-builder pelo mesmo motivo do
// PlayTranscription: ele grava no app-update.yml a URL privada da API S3.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ENDPOINT = 'https://3ba41e8e3fe261af1fe20455343c36d1.r2.cloudflarestorage.com';
const R2_PUBLIC_BASE = 'https://pub-8060abbe70084968817647c74ce4ffbc.r2.dev';
const R2_BUCKET = 'app-releases';

const station = ['sarandi', 'cacique', 'alvorada'].includes(process.env.STATION) ? process.env.STATION : 'sarandi';
const prefix = `playnews-${station}`;

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
if (!accessKeyId || !secretAccessKey) {
  console.error('Faltam as variáveis de ambiente R2_ACCESS_KEY_ID e/ou R2_SECRET_ACCESS_KEY.');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(root, 'dist');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

const stationTitle = station.charAt(0).toUpperCase() + station.slice(1);
const installer = `PlayNews-${stationTitle}-Setup-${version}.exe`;
const manifestPath = join(distDir, 'latest.yml');

// Confere que o latest.yml é DESTA versão — senão publicaria um manifesto velho
// apontando pra um instalador que não é o que está sendo enviado.
if (!existsSync(join(distDir, installer)) || !existsSync(manifestPath)) {
  console.error(`Não achei ${installer} e/ou latest.yml em dist/. Rode o build da emissora antes ("npm run release").`);
  process.exit(1);
}
if (!readFileSync(manifestPath, 'utf-8').includes(`version: ${version}`)) {
  console.error(`dist/latest.yml não é da versão ${version} — rode o build da emissora de novo.`);
  process.exit(1);
}

// Ordem importa: o latest.yml vai por último, pra nenhum app enxergar um
// manifesto novo apontando pra um instalador que ainda não terminou de subir.
const files = [
  { name: installer, type: 'application/octet-stream' },
  { name: `${installer}.blockmap`, type: 'application/octet-stream' },
  { name: 'latest.yml', type: 'text/yaml' },
].filter((f) => existsSync(join(distDir, f.name)));

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId, secretAccessKey },
});

console.log(`Cloudflare R2 — ${station} v${version}`);
for (const file of files) {
  const key = `${prefix}/${file.name}`;
  console.log(`  enviando ${file.name} -> ${R2_BUCKET}/${key}`);
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: readFileSync(join(distDir, file.name)),
      ContentType: file.type,
    })
  );
}

console.log(`\nPublicado: ${R2_PUBLIC_BASE}/${prefix}/latest.yml`);
console.log(`Instalador: ${R2_PUBLIC_BASE}/${prefix}/${installer}`);
