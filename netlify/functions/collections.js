// API endpoints for managing symbol collections
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
    // GET /collections - Fetch all collections with their symbols
    if (httpMethod === 'GET') {
      const collections = await sql`
        SELECT 
          c.id,
          c.name,
          c.created_at,
          c.updated_at,
          COALESCE(json_agg(cs.symbol_char) FILTER (WHERE cs.symbol_char IS NOT NULL), '[]'::json) as symbols
        FROM collections c
        LEFT JOIN collection_symbols cs ON c.id = cs.collection_id
        GROUP BY c.id, c.name, c.created_at, c.updated_at
        ORDER BY c.name
      `;

      return {
        statusCode: 200,
        body: JSON.stringify(collections),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // POST /collections - Create a new collection
    if (httpMethod === 'POST') {
      const { name } = JSON.parse(body);

      if (!name || typeof name !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Collection name is required' })
        };
      }

      try {
        const result = await sql`
          INSERT INTO collections (name)
          VALUES (${name})
          RETURNING id, name, created_at
        `;

        return {
          statusCode: 201,
          body: JSON.stringify(result[0]),
          headers: { 'Content-Type': 'application/json' }
        };
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate') || error.message.includes('already exists')) {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Collection already exists' }),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        throw error;
      }
    }

    // DELETE /collections?name=CollectionName - Delete a collection
    if (httpMethod === 'DELETE') {
      const { name } = queryStringParameters || {};

      if (!name) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Collection name is required' })
        };
      }

      const result = await sql`
        DELETE FROM collections
        WHERE name = ${name}
        RETURNING id, name
      `;

      if (result.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Collection not found' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Collection deleted', collection: result[0] }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Collections API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
