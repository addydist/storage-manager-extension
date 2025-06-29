# Storage Manager Pro - Chrome Extension

A powerful Chrome extension for managing localStorage and sessionStorage data with a modern React interface.

## Features

✅ **View Storage Data** - Clean, paginated table view for all storage items  
✅ **Search & Filter** - Real-time search across keys and values  
✅ **Edit & Update** - Inline editing with validation  
✅ **Delete Operations** - Individual item deletion or clear all  
✅ **Export/Import** - JSON export/import functionality  
✅ **Responsive UI** - Modern design with Tailwind CSS  
✅ **Performance Optimized** - Handles thousands of storage items efficiently  
✅ **Error Handling** - Comprehensive error handling and user feedback  
✅ **Accessibility** - ARIA labels and keyboard navigation support

## Installation

### Option 1: Build from Source (Recommended)

1. **Clone/Download** the project files to your local machine

2. **Install Dependencies**

   ```bash
   cd storage-manager-extension
   npm install
   ```

3. **Build the Extension**

   ```bash
   npm run build
   ```

   This creates a `dist/` folder with the compiled extension.

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist/` folder

### Option 2: Development Mode

For development with hot reloading:

```bash
npm run dev
```

Then load the `dist/` folder in Chrome as above. The extension will rebuild automatically when you make changes.

## Project Structure

```
storage-manager-extension/
├── manifest.json              # Extension manifest (v3)
├── package.json              # Dependencies and scripts
├── webpack.config.js         # Build configuration
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
├── src/
│   ├── popup/                # Main UI (React app)
│   │   ├── index.js         # Entry point
│   │   ├── App.jsx          # Main component
│   │   ├── popup.html       # HTML template
│   │   └── styles.css       # Tailwind imports
│   ├── content/             # Content scripts
│   │   ├── content.js       # Content script
│   │   └── injected.js      # Injected script
│   └── background/          # Background script
│       └── background.js    # Service worker
└── dist/                    # Built extension (generated)
```

## How It Works

### Architecture Overview

1. **Background Script** - Service worker that handles extension lifecycle
2. **Content Script** - Injected into web pages to communicate with the page context
3. **Injected Script** - Runs in page context to access localStorage/sessionStorage
4. **Popup UI** - React application providing the user interface

### Message Flow

```
Popup UI ↔ Content Script ↔ Injected Script ↔ Page Storage APIs
```

The extension uses Chrome's messaging API to communicate between contexts while respecting security boundaries.

## Usage

1. **Open Extension** - Click the extension icon in Chrome toolbar
2. **Select Storage Type** - Choose between localStorage and sessionStorage tabs
3. **View Data** - Browse paginated storage items
4. **Search** - Use the search bar to filter items
5. **Edit Items** - Click edit icon to modify values inline
6. **Add New Items** - Use "Add New" button to create entries
7. **Export Data** - Download storage data as JSON
8. **Import Data** - Upload JSON files to populate storage
9. **Delete Items** - Remove individual items or clear all storage

## Advanced Features

### Search & Filtering

- Real-time search across both keys and values
- Case-insensitive matching
- Automatic pagination reset on new searches

### Performance Optimization

- Virtual scrolling for large datasets
- Pagination with configurable page size (50 items default)
- Efficient React rendering with useMemo hooks
- Minimal DOM updates during operations

### Error Handling

- Graceful handling of storage quota exceeded errors
- Invalid JSON detection during import
- Network communication error recovery
- User-friendly error notifications

### Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast color schemes
- Screen reader compatible

## Development

### Available Scripts

- `npm run build` - Production build
- `npm run dev` - Development build with watching
- `npm test` - Run tests (Jest)

### Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Webpack 5
- **Package Manager**: npm
- **Browser APIs**: Chrome Extension APIs (Manifest v3)

### Adding Features

1. **New UI Components** - Add to `src/popup/`
2. **Storage Operations** - Extend `src/content/injected.js`
3. **Message Handling** - Update `src/content/content.js`
4. **Styling** - Use Tailwind utility classes

## Browser Compatibility

- ✅ Chrome (Primary support)
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- ⚠️ Firefox (Requires manifest.json modifications)

## Security Considerations

The extension:

- Uses Manifest v3 for enhanced security
- Requests minimal permissions (`activeTab`, `storage`, `scripting`)
- Runs in isolated contexts
- Does not transmit data externally
- Validates all user inputs

## Troubleshooting

### Common Issues

**Extension not loading:**

- Ensure Developer mode is enabled
- Check console for build errors
- Verify all files are in dist/ folder

**Storage data not showing:**

- Refresh the current tab
- Check if site has storage data
- Verify extension permissions

**Build errors:**

- Run `npm install` to install dependencies
- Check Node.js version (14+ recommended)
- Clear node_modules and reinstall if needed

### Debug Mode

Enable Chrome extension debugging:

1. Go to `chrome://extensions/`
2. Click "Details" on the extension
3. Enable "Collect errors"
4. Check "Inspect views" for popup debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Changelog

### Version 1.0.0

- Initial release
- Full localStorage/sessionStorage management
- React-based UI with Tailwind CSS
- Export/import functionality
- Search and pagination
- Manifest v3 compatibility
