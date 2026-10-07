// Config do electron-builder fora do package.json de propósito: o --config
// aponta pra este arquivo e ele já monta o objeto certo pra emissora ativa
// (electron-builder não faz merge implícito entre --config e package.json).
const STATION = ['sarandi', 'cacique', 'alvorada'].includes(process.env.STATION) ? process.env.STATION : 'sarandi';

const OVERRIDES = {
  sarandi: {
    appId: 'com.radiosarandi.newsroom-dashboard',
    productName: 'PlayNews',
    publish: {
      provider: 'github',
      owner: 'lnpti',
      repo: 'sarandi-newsroom-dashboard',
      releaseType: 'release',
    },
    win: { icon: 'build/icon.ico', target: ['nsis'] },
  },
  cacique: {
    // Mesmo appId de sempre (identidade interna do instalador — evita as
    // duas emissoras colidirem se testadas na mesma máquina), mas ícone e
    // nome exibido são os mesmos do PlayNews em qualquer emissora.
    appId: 'com.tuaradiocacique.newsroom-dashboard',
    productName: 'PlayNews',
    publish: {
      provider: 'github',
      owner: 'lnpti',
      repo: 'tua-radio-cacique-dashboard',
      releaseType: 'release',
    },
    win: { icon: 'build/icon.ico', target: ['nsis'] },
  },
  alvorada: {
    appId: 'com.tuaradioalvorada.newsroom-dashboard',
    productName: 'PlayNews',
    publish: {
      provider: 'github',
      owner: 'lnpti',
      repo: 'tua-radio-alvorada-dashboard',
      releaseType: 'release',
    },
    win: { icon: 'build/icon.ico', target: ['nsis'] },
  },
};

const STATION_TITLES = { sarandi: 'Sarandi', cacique: 'Cacique', alvorada: 'Alvorada' };

module.exports = {
  directories: { output: 'dist' },
  files: ['out/**/*'],
  // Um nome de instalador por emissora: antes as três geravam o MESMO arquivo
  // (PlayNews-Setup-<versão>.exe) na pasta dist, cada build sobrescrevia a
  // anterior, e era fácil pegar o instalador de uma rádio achando que era de
  // outra (o PlayNews do Sarandi virou o do Cacique). Agora os três coexistem.
  artifactName: 'PlayNews-' + STATION_TITLES[STATION] + '-Setup-${version}.${ext}',
  nsis: { oneClick: true, perMachine: false, runAfterFinish: true },
  ...OVERRIDES[STATION],
};
