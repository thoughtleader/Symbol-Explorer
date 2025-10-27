// API endpoints for managing symbols within collections
const { neon } = require('@netlify/neon');

// Initialize database tables
async function initializeDatabase(sql) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS collection_symbols (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        symbol_char VARCHAR(10) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(collection_id, symbol_char)
      )
    `;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

exports.handler = async (event, context) => {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  const { httpMethod, body, queryStringParameters } = event;

  try {
    // Initialize database on first request
    await initializeDatabase(sql);
    // POST /collection-symbols - Add a symbol to a collection
    if (httpMethod === 'POST') {
      const { collectionName, symbolChar } = JSON.parse(body);

      if (!collectionName || !symbolChar) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Collection name and symbol character are required' })
        };
      }

      // Get collection ID
      const collections = await sql`
        SELECT id FROM collections WHERE name = ${collectionName}
      `;

      if (collections.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Collection not found' })
        };
      }

      const collectionId = collections[0].id;

      // Add symbol to collection
      try {
        const result = await sql`
          INSERT INTO collection_symbols (collection_id, symbol_char)
          VALUES (${collectionId}, ${symbolChar})
          ON CONFLICT (collection_id, symbol_char) DO NOTHING
          RETURNING id, collection_id, symbol_char
        `;

        return {
          statusCode: 201,
          body: JSON.stringify(result[0] || { message: 'Symbol already in collection' }),
          headers: { 'Content-Type': 'application/json' }
        };
      } catch (error) {
        if (error.message.includes('unique')) {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Symbol already in collection' }),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        throw error;
      }
    }

    // DELETE /collection-symbols?collectionName=X&symbolChar=Y - Remove symbol from collection
    if (httpMethod === 'DELETE') {
      const { collectionName, symbolChar } = queryStringParameters || {};

      if (!collectionName || !symbolChar) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Collection name and symbol character are required' })
        };
      }

      // Get collection ID
      const collections = await sql`
        SELECT id FROM collections WHERE name = ${collectionName}
      `;

      if (collections.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Collection not found' })
        };
      }

      const collectionId = collections[0].id;

      // Remove symbol from collection
      const result = await sql`
        DELETE FROM collection_symbols
        WHERE collection_id = ${collectionId} AND symbol_char = ${symbolChar}
        RETURNING id, collection_id, symbol_char
      `;

      if (result.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Symbol not found in collection' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Symbol removed from collection' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Collection symbols API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
