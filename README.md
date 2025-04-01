# Hex21 CMS

A lightweight, scalable Content Management System designed for scientific content publication using a docs-as-code workflow.

## Features

- DITA XML-powered content management
- Scientific content support with LaTeX rendering
- Version control integration
- Metadata-driven content organization
- Multiple export formats (HTML, PDF, ePub)
- Client-side search functionality

## Tech Stack

- Next.js (React) with TypeScript
- Tailwind CSS for styling
- KaTeX for LaTeX rendering
- Lunr.js for search
- DITA Open Toolkit for content transformation

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- DITA Open Toolkit
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hex21-cms.git
cd hex21-cms
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
hex21/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── lib/          # Core libraries and utilities
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Helper functions
├── content/          # DITA content files
│   └── articles/     # Article content
├── schemas/          # XML and JSON schemas
│   ├── dtd/         # DITA DTD files
│   └── json/        # JSON validation schemas
└── public/          # Static assets
```

## License

[MIT](LICENSE)
