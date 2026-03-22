const REPO_OWNER = 'nottaklu';
const REPO_NAME = 'lyrics-vault';
const BRANCH = 'main';

// UTF-8 safe base64 encode/decode
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(base64) {
  return decodeURIComponent(escape(atob(base64)));
}

export const githubService = {
  getToken() {
    return localStorage.getItem('gh_token');
  },

  setToken(token) {
    localStorage.setItem('gh_token', token);
  },

  async fetchFile(path) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`;
    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'If-None-Match': ''
      },
      cache: 'no-store'
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `GitHub fetch failed (${response.status})`);
    }

    const data = await response.json();
    const content = base64ToUtf8(data.content.replace(/\n/g, ''));
    return { content: JSON.parse(content), sha: data.sha };
  },

  async uploadFile(path, content, message, sha = null) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const body = {
      message,
      content: utf8ToBase64(content),
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `GitHub upload failed (${response.status})`);
    }
    return await response.json();
  },

  async getSongs() {
    const file = await this.fetchFile('data/songs.json');
    return file ? file.content : [];
  }
};
