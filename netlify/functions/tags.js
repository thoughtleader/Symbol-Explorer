// API endpoints for managing symbol tags
const { neon } = require('@netlify/neon');

// Initialize database tables
async function initializeDatabase(sql) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS symbol_tags (
        id SERIAL PRIMARY KEY,
        symbol_char VARCHAR(10) NOT NULL,
        tag VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symbol_char, tag)
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
    // GET /tags - Fetch all tags grouped by symbol
    if (httpMethod === 'GET') {
      const tags = await sql`
        SELECT 
          symbol_char,
          json_agg(tag ORDER BY tag) as tags
        FROM symbol_tags
        GROUP BY symbol_char
        ORDER BY symbol_char
      `;

      // Convert to object format for easier client-side use
      const tagsObject = {};
      tags.forEach(row => {
        tagsObject[row.symbol_char] = row.tags;
      });

      return {
        statusCode: 200,
        body: JSON.stringify(tagsObject),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // POST /tags - Add a tag to a symbol
    if (httpMethod === 'POST') {
      const { symbolChar, tag } = JSON.parse(body);

      if (!symbolChar || !tag) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Symbol character and tag are required' })
        };
      }

      try {
        const result = await sql`
          INSERT INTO symbol_tags (symbol_char, tag)
          VALUES (${symbolChar}, ${tag.toLowerCase()})
          ON CONFLICT (symbol_char, tag) DO NOTHING
          RETURNING id, symbol_char, tag
        `;

        if (result.length === 0) {
          // Tag already exists for this symbol
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Tag already exists for symbol' }),
            headers: { 'Content-Type': 'application/json' }
          };
        }

        return {
          statusCode: 201,
          body: JSON.stringify(result[0]),
          headers: { 'Content-Type': 'application/json' }
        };
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Tag already exists for symbol' }),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        throw error;
      }
    }

    // DELETE /tags?symbolChar=X&tag=Y - Remove a tag from a symbol
    if (httpMethod === 'DELETE') {
      const { symbolChar, tag } = queryStringParameters || {};

      if (!symbolChar || !tag) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Symbol character and tag are required' })
        };
      }

      const result = await sql`
        DELETE FROM symbol_tags
        WHERE symbol_char = ${symbolChar} AND tag = ${tag.toLowerCase()}
        RETURNING id, symbol_char, tag
      `;

      if (result.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Tag not found for symbol' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Tag removed from symbol' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Tags API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
