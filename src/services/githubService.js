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
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.getToken()}`,
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
    // 1. Convert image to base64
    const base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(imageBlob);
    });

    // 2. Upload image
    const imagePath = `data/images/${Date.now()}.jpg`;
    const imageUpload = await this.uploadFile(imagePath, base64Image, `Add image for ${songData.title}`);
    const imageUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${imagePath}`;

    // 3. Update songs.json
    const songsFile = await this.fetchFile('data/songs.json');
    const songs = songsFile ? songsFile.content : [];
    const newSong = {
      ...songData,
      id: Date.now(),
      imageUrl,
      imagePath,
      createdAt: new Date().toISOString()
    };
    delete newSong.imageBlob; // Remove blob before saving to JSON

    const updatedSongs = [newSong, ...songs];
    await this.uploadFile('data/songs.json', JSON.stringify(updatedSongs, null, 2), `Add song: ${songData.title}`, songsFile?.sha);
    
    return newSong;
  },

  async updateSong(id, updatedData, newImageBlob = null) {
    const songsFile = await this.fetchFile('data/songs.json');
    let songs = songsFile.content;
    const index = songs.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Song not found');

    let imageUrl = songs[index].imageUrl;
    let imagePath = songs[index].imagePath;

    if (newImageBlob) {
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(newImageBlob);
      });
      imagePath = `data/images/${Date.now()}.jpg`;
      await this.uploadFile(imagePath, base64Image, `Update image for ${updatedData.title}`);
      imageUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${imagePath}`;
    }

    songs[index] = {
      ...songs[index],
      ...updatedData,
      imageUrl,
      imagePath
    };
    delete songs[index].imageBlob;

    await this.uploadFile('data/songs.json', JSON.stringify(songs, null, 2), `Update song: ${updatedData.title}`, songsFile.sha);
  },

  async deleteSong(id) {
    const songsFile = await this.fetchFile('data/songs.json');
    const songs = songsFile.content;
    const updatedSongs = songs.filter(s => s.id !== id);
    await this.uploadFile('data/songs.json', JSON.stringify(updatedSongs, null, 2), `Delete song ID: ${id}`, songsFile.sha);
  }
};
