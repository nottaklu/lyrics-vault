import Dexie from 'dexie';

export const db = new Dexie('LyricsVaultDB');
db.version(1).stores({
  songs: '++id, title, scale, *keywords, order' // primary key 'id' is auto-incremented
});
