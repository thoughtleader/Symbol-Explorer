# Deployment Guide - Symbol Explorer with Neon Database

## What's Been Set Up

Your Symbol Explorer app has been successfully configured to use **Neon (PostgreSQL)** via **Netlify DB** for persistent data storage, replacing localStorage.

### Key Components

1. **Database Schema** (`db/schema.ts`)
   - Collections table for symbol collections
   - Collection symbols junction table
   - Symbol tags table
   - Text snippets table

2. **Netlify Functions** (`netlify/functions/`)
   - `collections.js` - Manage symbol collections
   - `collection-symbols.js` - Add/remove symbols from collections
   - `tags.js` - Manage custom tags
   - `snippets.js` - Manage text snippets

3. **Client-Side API Wrapper** (`api-client.js`)
   - Automatic fallback to localStorage if API unavailable
   - Unified interface for all database operations

4. **Drizzle ORM Configuration**
   - `drizzle.config.ts` - ORM configuration
   - `db/index.ts` - Database connection
   - `migrations/` - Database schema migrations

## Deployment Steps

### Step 1: Verify Netlify Link
Your project is already linked to Netlify. Verify with:
```bash
netlify status
```

### Step 2: Push to GitHub
```bash
git push origin main
```

### Step 3: Netlify Deployment
Your site will automatically deploy when you push to GitHub. The deployment will:
- Install dependencies
- Build the project
- Deploy Netlify Functions
- Connect to your Neon database

### Step 4: Verify Database Connection
After deployment, check the Netlify Functions logs:
```bash
netlify functions:list
```

## Environment Variables

The `NETLIFY_DATABASE_URL` environment variable is automatically set by Netlify DB. You can view it in:
- Netlify Dashboard → Site Settings → Build & Deploy → Environment

## Testing the Integration

### Local Testing
```bash
netlify dev
```

This starts a local development server with:
- Your app on `http://localhost:8888`
- Netlify Functions on `http://localhost:8888/.netlify/functions/`

### Testing API Endpoints
```bash
# Get all collections
curl http://localhost:8888/.netlify/functions/collections

# Create a collection
curl -X POST http://localhost:8888/.netlify/functions/collections \
  -H "Content-Type: application/json" \
  -d '{"name":"My Collection"}'

# Get all tags
curl http://localhost:8888/.netlify/functions/tags

# Get all snippets
curl http://localhost:8888/.netlify/functions/snippets
```

## Database Management

### View Database in Drizzle Studio
```bash
npm run db:studio
```

### Generate New Migrations
After modifying `db/schema.ts`:
```bash
npm run db:generate
```

### Apply Migrations
```bash
npm run db:migrate
```

## Troubleshooting

### Database Connection Fails
1. Check `NETLIFY_DATABASE_URL` is set in Netlify environment
2. Verify Neon database is active in Neon console
3. Check Netlify Function logs for errors

### API Returns 500 Error
1. Check browser console for error details
2. Review Netlify Function logs
3. Verify request format matches API specification

### App Falls Back to localStorage
This is normal behavior when:
- API is unavailable
- Running locally without `netlify dev`
- Network issues occur

The app will automatically sync to database when connection is restored.

## File Structure

```
symbol-explorer/
├── db/
│   ├── index.ts           # Database connection
│   └── schema.ts          # Drizzle ORM schema
├── migrations/
│   ├── 0000_broken_scourge.sql  # Initial schema
│   └── meta/              # Migration metadata
├── netlify/
│   └── functions/
│       ├── collections.js
│       ├── collection-symbols.js
│       ├── tags.js
│       └── snippets.js
├── api-client.js          # Client-side API wrapper
├── drizzle.config.ts      # Drizzle ORM config
├── netlify.toml           # Netlify configuration
├── index.html             # Main app
└── NEON_SETUP.md          # Setup documentation
```

## Next Steps

1. **Deploy**: Push to GitHub to trigger Netlify deployment
2. **Test**: Verify database operations work in production
3. **Monitor**: Check Netlify Function logs for any issues
4. **Optimize**: Monitor database performance and adjust as needed

## Support

For issues or questions:
- Check Netlify Function logs: `netlify functions:list`
- Review Neon console: https://console.neon.tech
- Check Drizzle ORM docs: https://orm.drizzle.team
- Netlify DB docs: https://docs.netlify.com/build/data-and-storage/netlify-db/
