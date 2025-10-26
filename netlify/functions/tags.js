// API endpoints for managing symbol tags
import { db } from '../../db/index.ts';
import { symbolTags } from '../../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export const handler = async (event, context) => {
  const { httpMethod, body, queryStringParameters } = event;

  try {
    // GET /tags - Fetch all tags grouped by symbol
    if (httpMethod === 'GET') {
      const allTags = await db.select().from(symbolTags);

      // Convert to object format for easier client-side use
      const tagsObject = {};
      allTags.forEach(row => {
        if (!tagsObject[row.symbol_char]) {
          tagsObject[row.symbol_char] = [];
        }
        tagsObject[row.symbol_char].push(row.tag);
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
        const result = await db
          .insert(symbolTags)
          .values({ symbol_char: symbolChar, tag: tag.toLowerCase() })
          .returning();

        return {
          statusCode: 201,
          body: JSON.stringify(result[0]),
          headers: { 'Content-Type': 'application/json' }
        };
      } catch (error) {
        // Handle unique constraint violation
        if (error.message.includes('unique')) {
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

      const result = await db
        .delete(symbolTags)
        .where(and(
          eq(symbolTags.symbol_char, symbolChar),
          eq(symbolTags.tag, tag.toLowerCase())
        ))
        .returning();

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
