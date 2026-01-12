<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Agnostic Trigger Workflow Builder

A powerful visual workflow builder for streaming automation with intelligent condition filtering and gift management.

## Features

- 🎯 **Visual Workflow Builder** - Drag and drop interface for creating automated workflows
- 🎁 **Gift Selector** - Intelligent gift selection with async/await fetching and search
- 📋 **Condition Gallery** - Pre-built filter templates for common streaming scenarios
- 🔀 **Multi-Condition Logic** - Support for SIMPLE and GROUP modes with AND/OR logic
- 🎨 **Beautiful UI** - Dark mode, smooth animations, and responsive design
- 🐛 **Live Debugger** - Real-time workflow simulation and execution logs
- 📝 **YAML Export** - Export your workflows as YAML configuration

## Quick Start

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Usage

### Creating Workflows

1. **Add Nodes**: Click the "+" button to add Trigger, Condition, or Action nodes
2. **Connect Nodes**: Drag from a socket on the right of one node to a socket on the left of another
3. **Configure Nodes**: Click on any node to edit its properties

### Condition Gallery

Access pre-built filter templates:
1. Select or create a CONDITION node
2. Click the **"Condition Gallery"** button
3. Browse templates like:
   - Gift por ID
   - High Value Gifts
   - Premium Bundle
   - Super Rare Gifts
   - And more...

### Gift Selector

When using gift-related fields (e.g., `data.gift.id`):
- The value input automatically becomes a Gift Selector
- Search gifts by name or ID
- Select from a dropdown of available gifts
- Enter custom gift IDs manually

## Workflow Example

```
Trigger (TikTok Live → Gift Received)
  ↓
Condition (High Value Gifts ≥ 100 coins)
  ↓
Action (TTS Alert + Visual Overlay)
```

## Project Structure

```
agnostic-trigger-workflow-builder/
├── components/
│   ├── ActionGalleryModal.tsx      # Pre-built action templates
│   ├── ConditionGalleryModal.tsx   # Pre-built condition templates
│   ├── Node.tsx                   # Workflow node component
│   └── selectors/
│       └── GiftSelector.tsx         # Gift selection component
├── services/
│   └── giftService.ts             # Gift data and fetching
├── App.tsx                        # Main application
├── constants.tsx                  # Initial workflow state
├── types.ts                       # TypeScript interfaces
└── package.json
```

## Available Condition Templates

| Template | Mode | Description |
|----------|-------|-------------|
| Gift por ID | SIMPLE | Filter by specific gift ID |
| Gift por Nombre | SIMPLE | Filter by gift name |
| High Value Gifts | SIMPLE | Filter by minimum coin value |
| Premium Bundle | GROUP | Match Galaxy, Yacht, or Ferrari |
| Super Rare Gifts | GROUP | Match Train, Jet, or Universe |
| Medium Tier Gifts | GROUP | Filter gifts in a coin range |
| Stickers Only | SIMPLE | Filter only sticker gifts |
| User & Gift Combo | GROUP | Match user AND specific gift |
| Excluir Low Tier | GROUP | Exclude low-value gifts |
| Combo Gifts | GROUP | Filter combinable gifts |

## Documentation

- [Gift Selector Documentation](./GIFT_SELECTOR_README.md) - Complete guide to the gift selection system
- [Condition Gallery Documentation](./CONDITION_GALLERY_README.md) - Details on condition templates

## License

MIT