# Local Development Guide

## Running Locally

When running locally with `http-server` or `npm start`, the Netlify Functions API endpoints are not available. The app automatically detects this and falls back to localStorage.

### What You'll See

When you start the app locally, check the browser console for:

```
⚠ API not available - using localStorage fallback
```

This is **normal and expected** for local development.

### How It Works

1. **API Check**: On startup, the app tries to connect to `/.netlify/functions/collections`
2. **Fallback**: If the API is unavailable, it automatically switches to localStorage
3. **Transparent**: All data operations work the same way - the app handles both seamlessly

### Local Development Setup

```bash
# Install dependencies
npm install

# Build Tailwind CSS (one-time)
npm run build:css

# Start local server
npm start

# Or watch Tailwind CSS changes while developing
npm run watch:css
```

### Testing Locally

All features work locally with localStorage:
- ✅ Search symbols
- ✅ Create collections
- ✅ Add symbols to collections
- ✅ Add tags to symbols
- ✅ Save text snippets
- ✅ Convert text to bold sans-serif
- ✅ Data persists on page refresh

### Testing with Netlify Functions

To test Netlify Functions locally, use Netlify CLI:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Start dev server with Functions support
netlify dev

# This will:
# - Start the app on http://localhost:8888
# - Enable Netlify Functions on http://localhost:8888/.netlify/functions/
# - Connect to your Neon database
```

When using `netlify dev`, you'll see:

```
✓ API connection available - using Neon database
```

### Console Messages

**Local Development (http-server)**:
```
⚠ API not available - using localStorage fallback
Loaded 3683 symbols in 24 categories
✓ Service Worker registered
```

**With Netlify Dev**:
```
✓ API connection available - using Neon database
Loaded 3683 symbols in 24 categories
✓ Service Worker registered
```

### Troubleshooting

#### "API call failed" errors in console
- **Expected**: This happens when using `http-server` (no API available)
- **Solution**: Use `netlify dev` to test with actual API

#### Data not persisting
- **Check**: Browser console for API status
- **If localStorage**: Data is stored locally, won't sync to database
- **If API**: Check Netlify Function logs with `netlify functions:list`

#### Service Worker errors
- **Favicon errors**: Normal, service worker skips favicon requests
- **Promise rejections**: Handled gracefully, won't break the app

### Development Workflow

1. **Make changes** to HTML/CSS/JS
2. **Refresh browser** to see changes
3. **Check console** for any errors
4. **Test features** locally with localStorage
5. **Deploy** to Netlify to test with database

### Building for Production

```bash
# Build Tailwind CSS
npm run build:css

# Commit changes
git add -A
git commit -m "Your message"

# Push to GitHub
git push origin main

# Netlify auto-deploys and connects to Neon database
```

### Environment Variables

**Local Development**: No environment variables needed
- Uses localStorage automatically
- No database connection required

**Production (Netlify)**: 
- `NETLIFY_DATABASE_URL` - Auto-set by Netlify DB
- Automatically connected to Neon database

### Performance Tips

1. **Lazy Loading**: Symbols load 120 at a time, then 100 per scroll
2. **Caching**: Service Worker caches static assets
3. **Compiled CSS**: Tailwind CSS is pre-compiled, not generated on-the-fly
4. **Efficient Queries**: Drizzle ORM optimizes database queries

### Debugging

**Enable verbose logging**:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
location.reload();
```

**Check API status**:
```javascript
// In browser console
window.storageAPI.isOnline  // true if API available, false if using localStorage
```

**View stored data**:
```javascript
// In browser console
localStorage.getItem('utf8SymbolCollections')
localStorage.getItem('utf8SymbolTags')
localStorage.getItem('utf8TextSnippets')
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Empty response from API" | Using http-server | Use `netlify dev` |
| Data not syncing | Using localStorage | Deploy to Netlify |
| Favicon 404 errors | Service Worker | Normal, ignored |
| Symbols not loading | Network issue | Check symbols.json |
| Collections empty | First time | Create a collection |

### Next Steps

1. **Develop locally** with `npm start`
2. **Test features** with localStorage
3. **Deploy to Netlify** with `git push`
4. **Verify database** operations in production
5. **Monitor logs** with Netlify dashboard

---

**Note**: The app is designed to work seamlessly in both modes. You don't need to do anything special - it automatically detects the environment and uses the appropriate storage method.
