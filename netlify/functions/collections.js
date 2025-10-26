// API endpoints for managing symbol collections
import { db } from '../../db/index.ts';
import { collections, collectionSymbols } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';

export const handler = async (event, context) => {
  const { httpMethod, body, queryStringParameters } = event;

  try {
    // GET /collections - Fetch all collections with their symbols
    if (httpMethod === 'GET') {
      const allCollections = await db.select().from(collections);
      
      const result = await Promise.all(
        allCollections.map(async (col) => {
          const symbols = await db
            .select({ symbol_char: collectionSymbols.symbol_char })
            .from(collectionSymbols)
            .where(eq(collectionSymbols.collection_id, col.id));
          
          return {
            id: col.id,
            name: col.name,
            created_at: col.created_at,
            updated_at: col.updated_at,
            symbols: symbols.map(s => s.symbol_char)
          };
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result),
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

      const result = await db
        .insert(collections)
        .values({ name })
        .returning();

      return {
        statusCode: 201,
        body: JSON.stringify(result[0]),
        headers: { 'Content-Type': 'application/json' }
      };
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

      const result = await db
        .delete(collections)
        .where(eq(collections.name, name))
        .returning();

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
