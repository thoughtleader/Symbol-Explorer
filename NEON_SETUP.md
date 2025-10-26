# Neon Database Setup Guide

This Symbol Explorer app now uses Neon (PostgreSQL) via Netlify DB for persisting data instead of localStorage.

## Setup Instructions

### 1. Link Your Project to Netlify

If you haven't already, link your project to Netlify:

```bash
npx netlify link
```

### 2. Initialize Netlify DB

Run the following command in your project directory:

```bash
npx netlify db init
```

This command will:
- Provision a PostgreSQL database on Neon
- Configure Drizzle ORM automatically
- Set up environment variables securely
- Connect your database to your Netlify project
- Generate database migrations

### 3. Environment Variables

After running `npx netlify db init`, your `NETLIFY_DATABASE_URL` environment variable will be automatically configured in your Netlify project settings.

### 4. Deploy to Netlify

Push your code to your Git repository and deploy to Netlify:

```bash
git add .
git commit -m "Add Neon database integration"
git push
```

Your Netlify Functions will automatically use the `NETLIFY_DATABASE_URL` environment variable to connect to your Neon database.

### 5. Verify Database Setup

After deployment, check your Netlify Functions logs to ensure the database is working correctly:

```bash
netlify functions:list
```

## Database Schema

The app uses the following tables:

### Collections
- `collections` - Stores symbol collection names
- `collection_symbols` - Junction table linking symbols to collections

### Tags
- `symbol_tags` - Stores custom tags for symbols

### Snippets
- `text_snippets` - Stores user's text snippets

## API Endpoints

The app provides the following Netlify Functions:

### Collections
- `GET /.netlify/functions/collections` - Get all collections
- `POST /.netlify/functions/collections` - Create a new collection
- `DELETE /.netlify/functions/collections?name=X` - Delete a collection

### Collection Symbols
- `POST /.netlify/functions/collection-symbols` - Add symbol to collection
- `DELETE /.netlify/functions/collection-symbols?collectionName=X&symbolChar=Y` - Remove symbol

### Tags
- `GET /.netlify/functions/tags` - Get all tags
- `POST /.netlify/functions/tags` - Add a tag to a symbol
- `DELETE /.netlify/functions/tags?symbolChar=X&tag=Y` - Remove a tag

### Snippets
- `GET /.netlify/functions/snippets` - Get all snippets
- `POST /.netlify/functions/snippets` - Create a snippet
- `DELETE /.netlify/functions/snippets?id=X` - Delete a snippet

## Fallback to localStorage

The `api-client.js` includes automatic fallback to localStorage if the API is not available. This allows the app to work offline or during development without a database connection.

## Development

For local development, you can use Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

This will start a local development server with Netlify Functions support.

## Troubleshooting

### Database Connection Issues
- Verify `NETLIFY_DATABASE_URL` is set in your Netlify environment variables
- Check that your Neon database is active in the Neon console
- Review Netlify Function logs for detailed error messages

### API Errors
- Check browser console for error messages
- Verify the API endpoint URLs are correct
- Ensure request payloads match the expected format

### Fallback to localStorage
If the API is unavailable, the app will automatically fall back to localStorage. Check the browser console for warnings about API availability.
