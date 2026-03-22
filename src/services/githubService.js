const REPO_OWNER = 'nottaklu';
const REPO_NAME = 'lyrics-vault';
const BRANCH = 'main';

export const githubService = {
  getToken() {
    return localStorage.getItem('gh_token');
  },

  setToken(token) {
    localStorage.setItem('gh_token', token);
  },

  async fetchFile(path) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch file from GitHub');

    const data = await response.json();
    const content = atob(data.content.replace(/\n/g, ''));
    return { content: JSON.parse(content), sha: data.sha };
  },

  async uploadFile(path, content, message, sha = null) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const body = {
      message,
      content: typeof content === 'string' ? btoa(content) : content, // Already base64 for images
      branch: BRANCH
    };
    if (sha) body.sha = sha;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to upload to GitHub');
    }
    return await response.json();
  },

  async getSongs() {
    const file = await this.fetchFile('data/songs.json');
    return file ? file.content : [];
  },

  async saveSong(songData, imageBlob) {
    let imageUrl = songData.imageUrl;
    let imagePath = songData.imagePath;

    if (imageBlob) {
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(imageBlob);
      });

      imagePath = `data/images/${Date.now()}.jpg`;
      await this.uploadFile(imagePath, base64Image, `Add image for ${songData.title}`);
      imageUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${imagePath}`;
    }

    const songsFile = await this.fetchFile('data/songs.json');
    const songs = songsFile ? songsFile.content : [];
    
    const newSong = {
      ...songData,
      id: songData.id || Date.now(),
      imageUrl,
      imagePath,
      createdAt: songData.createdAt || new Date().toISOString()
    };
    
    // Check if updating or adding
    const existingIndex = songs.findIndex(s => s.id === newSong.id);
    let updatedSongs;
    if (existingIndex > -1) {
      updatedSongs = [...songs];
      updatedSongs[existingIndex] = newSong;
    } else {
      updatedSongs = [newSong, ...songs];
    }

    await this.uploadFile('data/songs.json', JSON.stringify(updatedSongs, null, 2), `Save song: ${songData.title}`, songsFile?.sha);
    
    return newSong;
  },

  async deleteSong(id) {
    const songsFile = await this.fetchFile('data/songs.json');
    if (!songsFile) return;
    const songs = songsFile.content;
    const updatedSongs = songs.filter(s => s.id !== id);
    await this.uploadFile('data/songs.json', JSON.stringify(updatedSongs, null, 2), `Delete song ID: ${id}`, songsFile.sha);
  }
};
