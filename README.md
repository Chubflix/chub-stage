# Chubflix: Next Episode Stage

A ChubAI Stage that provides visual navigation between episodic greetings in Chubflix character narratives.

## Features

- **Next Episode Button**: Prominent, clickable button to advance to the next greeting/episode
- **Episode Progress**: Visual progress bar showing current position in the story arc
- **Episode Titles**: Extracts and displays episode titles from greeting text
- **Context Injection**: Optionally injects episode context into prompts for narrative continuity
- **State Persistence**: Remembers episode progress across sessions
- **Multiple Themes**: Choose between Chubflix (red), Dark, and Light themes

## Installation

### Prerequisites

- Node.js 21.7.1
- Yarn package manager

### Setup

```bash
# Clone/copy the stage
cd chubflix/stages/next-episode

# Install dependencies
yarn install

# Run in development mode
yarn dev
```

## Configuration

The stage can be configured through the ChubAI stage settings UI:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showEpisodeNumber` | boolean | `true` | Show "Episode X of Y" text |
| `showProgress` | boolean | `true` | Show progress bar |
| `buttonText` | string | `"Next Episode"` | Custom button text |
| `injectContext` | boolean | `true` | Add episode info to prompts |
| `theme` | string | `"chubflix"` | Color theme: `chubflix`, `dark`, `light` |

## How It Works

### Episode Detection

The stage reads the character's greetings:
- `first_mes` counts as Episode 1
- `alternate_greetings` become Episodes 2, 3, etc.

### Title Extraction

Episode titles are extracted from greeting text using these patterns:
- `**Title**` (bold markdown)
- `# Title` (heading markdown)
- `"Title"` (quoted)
- `Episode X: Title`

### State Management

- **Init State**: Total episodes, character name, episode titles
- **Message State**: Current episode index, timestamp
- **Chat State**: Highest episode reached, completion status

### Prompt Injection

When enabled, adds context like:
```
[Chubflix Episode Context: Currently on "Coffee Shop Confession" (2/7). 
Maintain narrative continuity with previous episodes.]
```

## Deployment

### To ChubAI

1. Get an API token from [Chub Tokens](https://chub.ai/my_stages?active=tokens)
2. Add as GitHub secret: `CHUB_AUTH_TOKEN`
3. Push to main branch
4. Stage deploys automatically via GitHub Actions

### Manual Build

```bash
yarn build
```

Output is in the `dist/` directory.

## Development

### Testing

The TestRunner (`src/TestRunner.tsx`) provides a local testing environment:

```bash
yarn dev
```

This opens a browser with:
- Stage preview (left panel)
- Test controls (right panel)
  - Simulate beforePrompt
  - Simulate afterResponse
  - Force re-render

### Project Structure

```
next-episode/
├── public/
│   └── chub_meta.yaml     # Stage metadata
├── src/
│   ├── Stage.tsx          # Main stage implementation
│   ├── TestRunner.tsx     # Development test runner
│   ├── App.tsx            # App entry
│   ├── main.tsx           # React entry
│   ├── index.scss         # Styles
│   └── assets/
│       └── test-init.json # Test data
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Usage with Characters

Add the stage to a Chubflix character that has multiple greetings representing episodes:

1. Go to Chat Settings
2. Click "Add Stage"
3. Search for "Chubflix: Next Episode"
4. Configure settings as desired
5. Start chatting - the stage appears on the right

## Limitations

- **Navigation API**: Currently, the stage updates its internal state when clicking Next Episode, but actually navigating to a different greeting requires ChubAI chat API integration (pending feature)
- **Title Extraction**: Works best with consistent title formatting in greetings

## Future Enhancements

- Actual greeting navigation when ChubAI API supports it
- Episode thumbnails/images
- Episode descriptions
- Skip to specific episode
- Episode recap/summary

## License

MIT

## Author

Chubflix
