import { Notification, shell } from 'electron';

// Notifica só o que é genuinamente novo desde a última busca. Se `previousItems`
// for null (primeiro carregamento, sem cache de sessão anterior), não notifica
// nada — senão as ~17 notícias da janela inicial disparariam de uma vez.
export function notifyNewRadioNews(previousItems, newItems) {
  if (!previousItems || !Notification.isSupported()) return;

  const previousIds = new Set(previousItems.map((item) => item.id));
  const fresh = newItems.filter((item) => !previousIds.has(item.id));

  for (const item of fresh) {
    const notification = new Notification({
      title: 'Nova notícia — Rádio Sarandi',
      body: item.titulo,
    });
    notification.on('click', () => shell.openExternal(item.url));
    notification.show();
  }
}
