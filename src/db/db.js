import Dexie from 'dexie';

export const db = new Dexie('LyricsVaultDB');

db.version(1).stores({
  songs: '++id, title, *keywords, createdAt'
});

// Helper functions for song operations
export const songService = {
  async getAll() {
    return await db.songs.orderBy('createdAt').reverse().toArray();
  },

  async add(song) {
    return await db.songs.add({
      ...song,
      createdAt: Date.now()
    });
  },

  async update(id, song) {
    return await db.songs.update(id, song);
  },

  async delete(id) {
    return await db.songs.delete(id);
  }
};
