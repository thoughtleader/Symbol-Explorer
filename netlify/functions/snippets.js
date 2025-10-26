// API endpoints for managing text snippets
import { db } from '../../db/index.ts';
import { textSnippets } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';

export const handler = async (event, context) => {
  const { httpMethod, body, queryStringParameters } = event;

  try {
    // GET /snippets - Fetch all text snippets
    if (httpMethod === 'GET') {
      const snippets = await db
        .select()
        .from(textSnippets)
        .orderBy(textSnippets.created_at);

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
        const result = await db
          .insert(textSnippets)
          .values({ id, text })
          .returning();

        return {
          statusCode: 201,
          body: JSON.stringify(result[0]),
          headers: { 'Content-Type': 'application/json' }
        };
      } catch (error) {
        // Handle unique constraint violation - update instead
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          const result = await db
            .update(textSnippets)
            .set({ text, updated_at: new Date() })
            .where(eq(textSnippets.id, id))
            .returning();

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

      const result = await db
        .delete(textSnippets)
        .where(eq(textSnippets.id, id))
        .returning();

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
