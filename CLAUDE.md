# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based AI tools website that showcases and categorizes various AI tools for Korean users. The application uses Vite as the build tool and is deployed to GitHub Pages.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy` - Deploy to GitHub Pages (runs build first)

## Architecture & Key Components

### Main Structure
- **Entry Point**: `src/main.jsx` renders the root App component
- **Root Component**: `src/app.jsx` contains the main layout and imports AIToolsGrid
- **Primary Component**: `src/components/AIToolsGrid.jsx` - The main application component containing all functionality

### Data Management
- **AI Tools Data**: `src/data/aiTools.js` contains comprehensive AI tool definitions with categories, ratings, features, strengths/weaknesses
- **Usage Guides**: `src/data/aiUsageGuides.js` contains workflow guides for AI tool usage

### Component Architecture
- **AIToolsGrid.jsx**: Main component handling search, filtering, modals, and tool display
- **AIToolIcon.jsx**: Dynamic icon rendering component for AI tools
- **AIToolsContainer.jsx**: Container component for tool listings
- **UI Components**: Located in `src/components/ui/` - Shadcn/ui components for consistent design

### Key Features
- **Search & Filter**: Category-based filtering and text search across tools
- **Modal System**: Detailed tool information modals and workflow guides
- **Prompt Generator**: Built-in AI prompt generation with model recommendations
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Build Configuration

- **Vite Config**: Base path set to `/ai-tool/` for GitHub Pages deployment
- **Path Aliases**: `@` mapped to `./src` directory
- **GitHub Pages**: Deploys from `dist` directory to `gh-pages` branch

## Styling

- **Framework**: Tailwind CSS with custom configurations
- **UI Library**: Shadcn/ui components
- **Icons**: Lucide React icons with dynamic mapping
- **Responsive**: Grid layouts that adapt to screen sizes

## Deployment

The project is configured for GitHub Pages deployment:
- Homepage URL: `https://ryugw10.github.io/ai-tool`
- Deployment branch: `gh-pages`
- Build output: `dist` directory

## Data Structure

AI tools include comprehensive metadata:
- Basic info (name, category, rating, description)
- Strengths and weaknesses
- Features and use cases
- Competitive advantages
- Integration capabilities
- Free tier limitations

## Korean Localization

The application is specifically designed for Korean users with:
- Korean language interface
- AI tools curated for Korean market
- Korean-specific use cases and examples