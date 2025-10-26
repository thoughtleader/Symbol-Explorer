// API endpoints for managing symbols within collections
import { db } from '../../db/index.ts';
import { collections, collectionSymbols } from '../../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export const handler = async (event, context) => {
  const { httpMethod, body, queryStringParameters } = event;

  try {
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
      const col = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.name, collectionName));

      if (col.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Collection not found' })
        };
      }

      const collectionId = col[0].id;

      // Add symbol to collection
      try {
        const result = await db
          .insert(collectionSymbols)
          .values({ collection_id: collectionId, symbol_char: symbolChar })
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
      const col = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.name, collectionName));

      if (col.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Collection not found' })
        };
      }

      const collectionId = col[0].id;

      // Remove symbol from collection
      const result = await db
        .delete(collectionSymbols)
        .where(and(
          eq(collectionSymbols.collection_id, collectionId),
          eq(collectionSymbols.symbol_char, symbolChar)
        ))
        .returning();

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
