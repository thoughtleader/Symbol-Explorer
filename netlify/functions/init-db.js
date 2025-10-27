// Database initialization function
const { neon } = require('@netlify/neon');

exports.handler = async (event, context) => {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    // Create collections table
    await sql`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create collection_symbols table (junction table)
    await sql`
      CREATE TABLE IF NOT EXISTS collection_symbols (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        symbol_char VARCHAR(10) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(collection_id, symbol_char)
      )
    `;

    // Create symbol_tags table
    await sql`
      CREATE TABLE IF NOT EXISTS symbol_tags (
        id SERIAL PRIMARY KEY,
        symbol_char VARCHAR(10) NOT NULL,
        tag VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symbol_char, tag)
      )
    `;

    // Create text_snippets table
    await sql`
      CREATE TABLE IF NOT EXISTS text_snippets (
        id VARCHAR(50) PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database initialized successfully' }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
