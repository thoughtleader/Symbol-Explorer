// API endpoints for managing text snippets
const { neon } = require('@netlify/neon');

// Initialize database tables
async function initializeDatabase(sql) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS text_snippets (
        id VARCHAR(50) PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    // GET /snippets - Fetch all text snippets
    if (httpMethod === 'GET') {
      const snippets = await sql`
        SELECT id, text, created_at, updated_at
        FROM text_snippets
        ORDER BY created_at DESC
      `;

      return {
        statusCode: 200,
        body: JSON.stringify(snippets),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // POST /snippets - Create a new text snippet
    if (httpMethod === 'POST') {
      const { id, text } = JSON.parse(body);

      if (!id || !text) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Snippet ID and text are required' })
        };
      }

      try {
        const result = await sql`
          INSERT INTO text_snippets (id, text)
          VALUES (${id}, ${text})
          ON CONFLICT (id) DO UPDATE SET text = ${text}, updated_at = CURRENT_TIMESTAMP
          RETURNING id, text, created_at, updated_at
        `;

        return {
          statusCode: 201,
          body: JSON.stringify(result[0]),
          headers: { 'Content-Type': 'application/json' }
        };
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          const result = await sql`
            UPDATE text_snippets
            SET text = ${text}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING id, text, created_at, updated_at
          `;

          return {
            statusCode: 200,
            body: JSON.stringify(result[0]),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        throw error;
      }
    }

    // DELETE /snippets?id=X - Delete a text snippet
    if (httpMethod === 'DELETE') {
      const { id } = queryStringParameters || {};

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Snippet ID is required' })
        };
      }

      const result = await sql`
        DELETE FROM text_snippets
        WHERE id = ${id}
        RETURNING id, text
      `;

      if (result.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Snippet not found' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Snippet deleted' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Snippets API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
