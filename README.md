# ESV Bible Verses for Obsidian

An Obsidian plugin that allows you to insert ESV Bible verses directly into your notes using the ESV API.

## Features

- **Insert Bible verses** directly into your notes with a simple command
- **Select a reference** in your note and convert it to the full verse text
- **Search for verses** by topic or keyword (e.g. "verse about trusting God"), preview, then insert
- **Customizable formatting** options for verse display
- Support for single verses, verse ranges, and entire chapters

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "ESV Bible Verses"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from the releases page
2. Extract the files into your vault's `.obsidian/plugins/obsidian-esv-bible/` folder
3. Reload Obsidian
4. Enable the plugin in Settings > Community Plugins

## Setup

### Getting an API Key

1. Go to [https://api.esv.org/](https://api.esv.org/)
2. Create a free account
3. Create an application to get your API key
4. Copy your API key

### Configuring the Plugin

1. Open Obsidian Settings
2. Go to ESV Bible Verses in the left sidebar
3. Paste your API key in the "ESV API Key" field

## Usage

### Insert a Bible Verse

1. Open the command palette (`Ctrl/Cmd + P`)
2. Search for "Insert Bible verse"
3. Enter a Bible reference (e.g., "John 3:16", "Romans 8:28-30", "Psalm 23")
4. Press Enter or click "Insert Verse"

### Search for a Verse

1. Open the command palette (`Ctrl/Cmd + P`)
2. Search for "Search Bible verses"
3. Type what you're looking for, e.g. "find me the verse about anxiety" or "trusting God"
4. Pick a result with the arrow keys and press Enter to preview the full passage
5. Press Enter again (or click "Insert") to add it to your note, or "Back to results" to keep looking

Results combine a built-in list of common topics (anxiety, forgiveness, hope, and more) with live ESV keyword search. Typing a reference like "John 3:16" skips the search and goes straight to the preview. Search is keyword-based, so it matches the words in the verse rather than the idea behind them. The number of results shown can be changed in settings (default 5).

### Insert from Selected Text

1. Select a Bible reference in your note (e.g., "John 3:16")
2. Open the command palette (`Ctrl/Cmd + P`)
3. Search for "Insert verse from selected reference"
4. The verse will be inserted at your cursor position

## Formatting Options

Configure these in the plugin settings:

| Option | Description | Default |
|--------|-------------|---------|
| Include verse numbers | Show verse numbers in the passage | On |
| Include footnotes | Include footnotes in the passage | Off |
| Include headings | Include section headings | On |
| Include short copyright | Include ESV copyright notice | On |
| Indent poetry | Indent poetic passages | On |

## Example References

The plugin supports various reference formats:

- Single verse: `John 3:16`
- Verse range: `Romans 8:28-30`
- Multiple verses: `John 3:16-17`
- Entire chapter: `Psalm 23`
- Chapter range: `Genesis 1-2`
- Multiple chapters: `Matthew 5-7`

## Development

### Building the Plugin

```bash
# Install dependencies
npm install

# Build for development (with watch mode)
npm run dev

# Build for production
npm run build
```

### Project Structure

```
obsidian-esv-bible/
├── main.ts          # Main plugin code
├── manifest.json    # Obsidian plugin manifest
├── package.json     # Node.js dependencies
├── tsconfig.json    # TypeScript configuration
└── esbuild.config.mjs # Build configuration
```

## License

MIT License

## Credits

- Uses the [ESV API](https://api.esv.org/) for Bible text
- Scripture quotations are from the ESV Bible (The Holy Bible, English Standard Version), copyright 2001 by Crossway
