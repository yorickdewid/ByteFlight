# ByteFlight ✈️

> Modern VFR Flight Planning Application

A feature-rich flight planning tool built with React, TypeScript, and Mapbox GL, designed for Visual Flight Rules (VFR) pilots.

## ✨ Features

- 🗺️ **Interactive Map** - Real-time flight route visualization with Mapbox
- 📋 **Flight Planning** - Comprehensive waypoint management and route calculation
- ✈️ **Aircraft Management** - Multiple aircraft profiles with performance data
- 🌤️ **Weather Integration** - Live METAR data and weather visualization
- 📊 **Weight & Balance** - Built-in W&B calculations
- 🧭 **Navigation Log** - Detailed flight log with distance and time calculations

## 🚀 Tech Stack

- **Framework**: React 19 with TypeScript 5
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **Maps**: Mapbox GL JS 3
- **Icons**: Lucide React
- **Package Manager**: pnpm
- **Code Quality**: ESLint 9 + Prettier 3

## 📁 Project Structure

```
src/
├── app/                 # Application entry & global styles
├── assets/              # Static files
├── components/          # Shared UI components
│   ├── ui/             # Design system primitives
│   └── layout/         # Layout components
├── features/           # Feature-based modules
│   ├── map/           # Map visualization
│   ├── flight-plan/   # Flight planning
│   ├── aircraft/      # Aircraft management
│   ├── weather/       # Weather data
│   └── navigation/    # Navigation intelligence
├── hooks/             # Custom React hooks
├── lib/               # Utilities & configs
├── stores/            # State management
└── types/             # TypeScript types
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed architecture documentation.

## 🛠️ Development

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm 8+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yorickdewid/ByteFlight.git
   cd ByteFlight
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint errors |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check code formatting |
| `pnpm type-check` | Run TypeScript type checking |

## 🏗️ Building for Production

```bash
# Type check + build
pnpm build

# Preview the build
pnpm preview
```

The build output will be in the `dist/` directory.

## 🔧 Configuration

### TypeScript

Modern strict TypeScript configuration with:
- Strict mode enabled
- Unused variables/parameters detection
- Path aliases (`@/*` → `src/*`)

### ESLint

Flat config format (ESLint 9) with:
- TypeScript support
- React Hooks rules
- React Refresh plugin

### Tailwind CSS

Custom theme with aviation-themed colors and utilities.

### Vite

Optimized build with:
- Code splitting
- Vendor chunk separation
- Modern ES2022 target
- Fast Refresh

## 📦 Dependencies

### Core
- React 19.2
- React DOM 19.2
- TypeScript 5.9

### UI & Styling
- Tailwind CSS 3.4
- Lucide React (icons)
- Mapbox GL JS 3.18

### Development
- Vite 7.3
- ESLint 9
- Prettier 3
- TypeScript ESLint 8

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow the existing code style
- Run `pnpm lint:fix` before committing
- Run `pnpm format` to format code
- Ensure `pnpm type-check` passes

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Mapbox for excellent mapping libraries
- The React team for React 19
- Tailwind Labs for Tailwind CSS

---

Built with ❤️ by [Yorick de Wid](https://github.com/yorickdewid)
