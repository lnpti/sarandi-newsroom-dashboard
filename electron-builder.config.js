// Config do electron-builder fora do package.json de propósito: o --config
// aponta pra este arquivo e ele já monta o objeto certo pra emissora ativa
// (electron-builder não faz merge implícito entre --config e package.json).
const STATION = process.env.STATION === 'cacique' ? 'cacique' : 'sarandi';

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
};

module.exports = {
  directories: { output: 'dist' },
  files: ['out/**/*'],
  artifactName: '${productName}-Setup-${version}.${ext}',
  nsis: { oneClick: true, perMachine: false, runAfterFinish: true },
  ...OVERRIDES[STATION],
};
