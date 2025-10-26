// Client-side API wrapper for Neon database operations
// This replaces localStorage calls with API calls to Netlify Functions

const API_BASE = '/.netlify/functions';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let error;
      
      if (contentType && contentType.includes('application/json')) {
        error = await response.json();
        throw new Error(error.error || `API error: ${response.status}`);
      } else {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from API');
      }
      return JSON.parse(text);
    } else {
      throw new Error(`Invalid content type: ${contentType}`);
    }
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Collections API
export const collectionsAPI = {
  async getAll() {
    return apiCall('/collections');
  },

  async create(name) {
    return apiCall('/collections', 'POST', { name });
  },

  async delete(name) {
    return apiCall(`/collections?name=${encodeURIComponent(name)}`, 'DELETE');
  },

  async addSymbol(collectionName, symbolChar) {
    return apiCall('/collection-symbols', 'POST', { collectionName, symbolChar });
  },

  async removeSymbol(collectionName, symbolChar) {
    return apiCall(
      `/collection-symbols?collectionName=${encodeURIComponent(collectionName)}&symbolChar=${encodeURIComponent(symbolChar)}`,
      'DELETE'
    );
  }
};

// Tags API
export const tagsAPI = {
  async getAll() {
    return apiCall('/tags');
  },

  async add(symbolChar, tag) {
    return apiCall('/tags', 'POST', { symbolChar, tag });
  },

  async remove(symbolChar, tag) {
    return apiCall(
      `/tags?symbolChar=${encodeURIComponent(symbolChar)}&tag=${encodeURIComponent(tag)}`,
      'DELETE'
    );
  }
};

// Snippets API
export const snippetsAPI = {
  async getAll() {
    return apiCall('/snippets');
  },

  async create(id, text) {
    return apiCall('/snippets', 'POST', { id, text });
  },

  async delete(id) {
    return apiCall(`/snippets?id=${encodeURIComponent(id)}`, 'DELETE');
  }
};

// Fallback to localStorage if API is not available (for development)
export const storageAPI = {
  isOnline: true,

  async checkConnection() {
    try {
      await fetch(`${API_BASE}/collections`);
      this.isOnline = true;
      return true;
    } catch (error) {
      console.warn('API not available, falling back to localStorage');
      this.isOnline = false;
      return false;
    }
  },

  // Collections with fallback
  async loadCollections() {
    if (this.isOnline) {
      try {
        const collections = await collectionsAPI.getAll();
        const result = {};
        collections.forEach(col => {
          result[col.name] = col.symbols || [];
        });
        return result;
      } catch (error) {
        console.error('Failed to load collections from API:', error);
        this.isOnline = false;
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('utf8SymbolCollections');
    return stored ? JSON.parse(stored) : {};
  },

  async saveCollections(collections) {
    if (this.isOnline) {
      try {
        // Sync collections to database
        for (const [name, symbols] of Object.entries(collections)) {
          try {
            await collectionsAPI.create(name);
          } catch (error) {
            // Collection might already exist
            if (!error.message.includes('already exists')) {
              throw error;
            }
          }
        }
        return;
      } catch (error) {
        console.error('Failed to save collections to API:', error);
        this.isOnline = false;
      }
    }
    
    // Fallback to localStorage
    localStorage.setItem('utf8SymbolCollections', JSON.stringify(collections));
  },

  // Tags with fallback
  async loadTags() {
    if (this.isOnline) {
      try {
        return await tagsAPI.getAll();
      } catch (error) {
        console.error('Failed to load tags from API:', error);
        this.isOnline = false;
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('utf8SymbolTags');
    return stored ? JSON.parse(stored) : {};
  },

  async saveTags(tags) {
    if (this.isOnline) {
      try {
        // Sync tags to database
        for (const [symbol, tagList] of Object.entries(tags)) {
          for (const tag of tagList) {
            try {
              await tagsAPI.add(symbol, tag);
            } catch (error) {
              // Tag might already exist
              if (!error.message.includes('already exists')) {
                throw error;
              }
            }
          }
        }
        return;
      } catch (error) {
        console.error('Failed to save tags to API:', error);
        this.isOnline = false;
      }
    }
    
    // Fallback to localStorage
    localStorage.setItem('utf8SymbolTags', JSON.stringify(tags));
  },

  // Snippets with fallback
  async loadSnippets() {
    if (this.isOnline) {
      try {
        return await snippetsAPI.getAll();
      } catch (error) {
        console.error('Failed to load snippets from API:', error);
        this.isOnline = false;
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('utf8TextSnippets');
    return stored ? JSON.parse(stored) : [];
  },

  async saveSnippets(snippets) {
    if (this.isOnline) {
      try {
        for (const snippet of snippets) {
          await snippetsAPI.create(snippet.id, snippet.text);
        }
        return;
      } catch (error) {
        console.error('Failed to save snippets to API:', error);
        this.isOnline = false;
      }
    }
    
    // Fallback to localStorage
    localStorage.setItem('utf8TextSnippets', JSON.stringify(snippets));
  }
};
