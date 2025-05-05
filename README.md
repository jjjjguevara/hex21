# Hex 21 CMS Blueprint

  

The application is a **lightweight, scalable Content Management System (CMS)** designed to streamline the publication of **scientific content**—such as articles, research papers, and mixed media like images and videos—using a **docs-as-code workflow** that integrates **version control** for systematic tracking and propagation of changes. Its **key features** include robust version control for revision history, metadata management for efficient content organization and tagging, and support for **exportable formats** like PDF, ePub, and HTML to ensure accessibility. The CMS is powered by a modern **tech stack**: **Lightweight DITA (LwDITA)** for structured content authoring, **Git and GitHub** for version control, **Next.js (React)** for a dynamic yet statically generated front-end, **GitHub Actions** for automated builds and deployments, and **Vercel or Netlify** for global hosting. It's further enhanced with **MathJax** for rendering LaTeX equations, **Lunr.js** for client-side search functionality, and **custom React components** for interactive elements, making it an ideal tool for researchers and content creators to collaborate on and publish precise, technical documentation with ease.

  
  

## Architectural Map

  

Below is a comprehensive breakdown of the system, designed to handle metadata-driven features, data indexes, and conditional rendering effectively.

  

### Domains

  

The system is divided into seven core domains, each representing a major area of functionality:

  

1. **Content Authoring**: Where content and metadata are created.

2. **Content Transformation**: Converts authored content into usable formats.

3. **Front-End Rendering**: Displays content to users with conditional logic.

4. **Metadata Management**: Handles storage, indexing, and retrieval of metadata.

5. **Version Control**: Tracks changes to content and metadata.

6. **Automation**: Streamlines processes like builds and deployments.

7. **Hosting**: Delivers the final product to users.

  

### Modules and Submodules

  

Each domain contains specific modules and submodules to implement the required functionality:

  

#### 1. Content Authoring

- **LwDITA Authoring**: Tools for creating lightweight DITA content in Markdown (MDITA) and XML (XDITA) formats.

- **Metadata Editor**: A user-friendly interface for adding YAML or XML metadata, such as `publish: true`, `audience: expert`, or other conditional flags.

  

#### 2. Content Transformation

- **DITA Open Toolkit**: Transforms LwDITA content into output formats like HTML or PDF.

- **Metadata Parser**: Extracts metadata from YAML/XML files for use in rendering and indexing.

  

#### 3. Front-End Rendering

- **Next.js Pages**: Dynamic routes for articles, metadata-driven indexes, and dashboards.

- **Conditional Rendering Engine**: Logic to show/hide content based on metadata conditions (e.g., `publish: true` or user role).

- **Data-Driven Components**: React components that visualize metadata, such as dashboards showing publication trends.

  

#### 4. Metadata Management

- **Metadata Database**: Stores parsed metadata for fast querying and retrieval.

- **Indexing Service**: Generates searchable indexes from metadata for navigation and search.

- **API Layer**: Provides endpoints to expose metadata and indexes to the front-end.

  

#### 5. Version Control

- **Git Repository**: Stores content files and metadata in a versioned structure.

- **Version Tagging**: Uses Git tags to manage content versions (e.g., v1.0, v2.0).

  

#### 6. Automation

- **GitHub Actions Workflows**: Automates transformation, metadata syncing, and deployment tasks.

- **Metadata Sync**: Updates the metadata database whenever content changes are detected.

  

#### 7. Hosting

- **Static Site Hosting**: Deploys Next.js static site generation (SSG) output to platforms like Vercel or Netlify.

- **Serverless Functions**: Handles dynamic API requests for real-time data.

  

### Services

  

These standalone services power the system's core operations:

  

1. **Content Transformation Service**

- **Function**: Executes the DITA Open Toolkit to generate HTML, PDF, or other formats.

- **Trigger**: Activated by Git pushes or manual requests.

  

2. **Metadata Extraction Service**

- **Function**: Parses YAML/XML metadata from content files into JSON.

- **Output**: Feeds the metadata database.

  

3. **Database Service**

- **Function**: Stores and retrieves metadata efficiently.

- **Technology**: PostgreSQL with JSONB for flexible, schema-less storage.

  

4. **Indexing Service**

- **Function**: Builds and maintains searchable indexes from metadata.

- **Technology**: Elasticsearch for server-side search or Lunr.js for client-side indexing.

  

5. **API Service**

- **Function**: Exposes RESTful endpoints for metadata, indexes, and dashboards.

- **Technology**: Next.js API routes or FastAPI for a standalone service.

  

6. **Rendering Service**

- **Function**: Applies conditional rendering logic based on metadata flags.

- **Integration**: Embedded within Next.js for seamless front-end execution.

  

### Interactions

  

The domains and services interact in a clear workflow:

  

1. **Authoring to Version Control**

- Authors commit content and metadata (e.g., YAML files with `publish: false`) to a Git repository.

  

2. **Version Control to Automation**

- A Git push triggers GitHub Actions workflows to process the changes.

  

3. **Automation to Transformation**

- The workflow invokes the DITA Open Toolkit to transform content into HTML.

  

4. **Transformation to Metadata Management**

- The Metadata Parser extracts metadata and inserts it into the Metadata Database.

  

5. **Metadata Management to Front-End**

- The API Layer serves metadata and indexes to Next.js for rendering.

  

6. **Front-End to Rendering**

- The Conditional Rendering Engine uses metadata (e.g., `audience: expert`) to filter content dynamically.

  

7. **Front-End to Hosting**

- Next.js generates static pages via SSG, which are deployed to a hosting platform.

  

---

  

## Detailed Features

  

Let's zoom in on the key features you highlighted: metadata and data-driven indexes/dashboards, and prop/metadata-based conditional rendering.

  

### Metadata and Data-Driven Indexes/Dashboards

  

- **Metadata Storage**:

- Use PostgreSQL with JSONB columns to store metadata like:

```yaml

title: "Article Title"

publish: true

audience: "expert"

tags: ["tech", "guide"]

```

- JSONB allows flexible querying without a rigid schema.

  

- **Indexing**:

- Implement Elasticsearch for powerful full-text search and faceted navigation (e.g., filter by `tags` or `audience`).

- Example: An index page listing all articles where `publish: true`, sortable by metadata fields like `date`.

  

- **Dashboards**:

- Build React components that query the API for real-time metadata insights.

- Example: A dashboard showing:

- Number of published vs. draft articles (`publish: true/false`).

- Content distribution by `audience` or `tags`.

- Use libraries like Chart.js or Recharts for visualization.

  

### Prop/Metadata-Based Conditional Rendering

  

- **Metadata Flags**:

- Define conditions in YAML or XML, such as:

```yaml

publish: true

audience: "expert"

region: "US"

```

- These flags control what content is rendered and for whom.

  

- **Rendering Logic**:

- In Next.js, leverage `getStaticProps` or server-side rendering (SSR) to filter content:

```javascript

export async function getStaticProps({ params }) {

const metadata = await fetchMetadata(params.id);

if (!metadata.publish) return { notFound: true };

return { props: { content: metadata } };

}

```

- On the client side, use React state or context to toggle visibility:

```javascript

function Article({ metadata }) {

if (!metadata.publish) return null;

if (user.role !== metadata.audience) return <AccessDenied />;

return <div>{metadata.content}</div>;

}

```

  

- **Dynamic Components**:

- Create reusable React components that adapt based on metadata:

```javascript

function ContentBlock({ metadata }) {

return metadata.publish ? (

<section>{metadata.content}</section>

) : null;

}

```

- Extend this with user preferences (e.g., showing `region: US` content only to US users).

  

---

  

## Architectural Diagram (Conceptual)

  

Here's a simplified visual representation of the system:

  

```

+----------------+ +----------------+ +----------------+

| Content | --> | Version | --> | Automation |

| Authoring | | Control (Git) | | (GitHub Actions)|

+----------------+ +----------------+ +----------------+

| |

v v

+----------------+ +----------------+

| Metadata | <--- | Transformation |

| Management | | (DITA Toolkit) |

+----------------+ +----------------+

| |

v v

+----------------+ +----------------+

| Front-End | ---> | Hosting |

| Rendering | | (Vercel/Netlify)|

| (Next.js) | +----------------+

+----------------+

```

  

- **Arrows**: Indicate data flow (e.g., metadata from authoring to management, rendered pages to hosting).

  

---

  

## Additional Considerations

  

- **Scalability**: The Metadata Database and Indexing Service can scale with increased content volume using cloud-hosted solutions (e.g., AWS RDS, Elastic Cloud).

- **Performance**: Static site generation (SSG) ensures fast page loads, while serverless functions handle dynamic requests efficiently.

- **Extensibility**: The JSONB metadata schema and modular architecture allow easy addition of new features (e.g., more conditional flags).

  

---

  



**Goal:** Build the Hex 21 CMS incrementally, focusing on core functionality first and adding complexity layer by layer, culminating in an automated, deployable system.

  

**Assumptions:**

* You have Node.js and npm/yarn installed.

* You have Git installed and configured.

* You have cloned the `hex21-cms` repository locally.

* You have Cursor IDE installed.

* You have accounts on GitHub and Vercel/Netlify (or will create them).

  

---

  

## Phase 0: Initial Setup & Environment Configuration

  

**Objective:** Prepare the development environment, initialize the Next.js project, and set up basic version control and tooling.

  

**Tasks:**

  

1. **Open Project in Cursor:**

* Open Cursor IDE.

* Go to `File > Open Folder...` and select your cloned `hex21-cms` directory. This sets up your workspace.

* Open the integrated terminal in Cursor (`Terminal > New Terminal`).

  

2. **Initialize Next.js Project:**

* In the Cursor terminal, run:

```bash

npx create-next-app@latest . --typescript --eslint --tailwind --src-dir --app --import-alias "@/*"

# Answer prompts as needed. Installs in the current directory '.'

# Use TypeScript, ESLint, Tailwind CSS (useful for styling later)

# Use `src/` directory for better organization

# Use App Router (modern Next.js standard)

# Use default import alias `@/*`

```

* Follow the prompts. This will set up the basic Next.js structure within your existing repo.

  

3. **Install DITA Open Toolkit (DITA-OT):**

* **Decision:** How to manage DITA-OT?

* **Option A (Local Install):** Download DITA-OT from [dita-ot.org](https://www.dita-ot.org/download) and unzip it somewhere accessible. You'll need Java Runtime Environment (JRE) installed. Add the `dita-ot/bin` directory to your system's PATH or reference it directly in scripts. *Simpler for initial local dev.*

* **Option B (Docker):** Use a DITA-OT Docker image. Requires Docker installation. Good for consistency across environments and CI/CD. *Better for automation later.*

* **Recommendation:** Start with Option A for local development ease, plan to move to Option B for GitHub Actions.

* *Action:* Download and set up DITA-OT locally. Note the path to `dita-ot-X.Y.Z/bin/dita`.

  

4. **Initial Git Commit:**

* Stage the changes made by `create-next-app`.

* In Cursor's Source Control panel (or terminal):

```bash

git add .

git commit -m "feat: Initialize Next.js project structure"

git push origin main # Or your default branch

```

  

5. **Cursor Setup:**

* Familiarize yourself with Cursor's features: AI Chat (Cmd/Ctrl+K), AI Edit (Cmd/Ctrl+L), integrated terminal, Git integration, file explorer.

* Install relevant VS Code extensions if needed (e.g., DITA syntax highlighting, YAML, Markdownlint).

  

**Dependencies:** Node.js, npm/yarn, Git, Cursor, DITA-OT (and JRE), GitHub repository.

  

**Key Files/Folders:**

* `/src/app/` (Next.js App Router structure)

* `/package.json`

* `/tsconfig.json`

* `/tailwind.config.ts`

* `/next.config.mjs`

* `/.git/`

* `/.gitignore` (Ensure build outputs like `.dita-ot-temp` and generated HTML/PDFs are ignored initially)

* `/dita-ot-X.Y.Z/` (If installed locally, ideally outside the repo or gitignored)

  

---

  

## Phase 1: Basic Content Authoring, Transformation, and Rendering

  

**Objective:** Establish the core workflow: create simple LwDITA content, manually transform it, and display it statically in Next.js.

  

**Tasks:**

  

1. **Create Sample Content:**

* Create a `/content` directory (or similar) at the root.

* Inside `/content`, create a sample LwDITA topic using Markdown (MDITA), e.g., `/content/sample-article.mdita`:

```markdown

---

title: My First Scientific Article

author: Dr. Hex

date: 2023-10-27

publish: true

audience: beginner

tags: [science, example]

---

  

# Introduction

  

This is the introduction to my groundbreaking paper.

  

## Methods

  

We used cutting-edge methods. Here's an equation: $E=mc^2$.

  

## Results

  

The results were significant.

```

* *Note:* We're using YAML frontmatter for initial metadata.

  

2. **Manual Transformation:**

* In the Cursor terminal, run DITA-OT manually to transform the MDITA file to HTML. You'll need a simple DITA map file.

* Create `/content/main.ditamap`:

```xml

<?xml version="1.0" encoding="UTF-8"?>

<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">

<map title="Hex 21 CMS Content">

<topicref href="sample-article.mdita" format="mdita"/>

</map>

```

* Run the transformation (replace `path/to/dita` with your actual DITA-OT bin path):

```bash

path/to/dita --input=content/main.ditamap --format=html5 --output=out/html

# Or using Docker if you chose that route

```

* Examine the output in the `out/html` directory.

  

3. **Basic Static Rendering in Next.js:**

* For simplicity *initially*, copy the generated `sample-article.html` (or its body content) into a Next.js page component.

* Create a simple page route, e.g., `/src/app/articles/sample/page.tsx`:

```typescript

// src/app/articles/sample/page.tsx

import React from 'react';

  

export default function SampleArticlePage() {

// In this phase, we might just paste the HTML content directly

// or read it from the manually generated file (less ideal)

const htmlContent = `

<h1>My First Scientific Article</h1>

<p>...</p> // Content from out/html/sample-article.html

`;

  

return (

<main>

{/* Later replace with dynamic fetching and proper rendering */}

<div dangerouslySetInnerHTML={{ __html: htmlContent }} />

</main>

);

}

```

* Run the Next.js dev server (`npm run dev`) and view the page.

  

4. **Git Commit:**

* Commit the new content files, the manual output (or decide to gitignore it), and the Next.js page.

* ```bash

git add content/ src/app/articles/sample/page.tsx # Add out/html to .gitignore if not committing output

git commit -m "feat: Add sample content and basic static rendering"

git push

```

  

**Dependencies:** Phase 0 setup, Sample MDITA content, DITA map file.

  

**Key Files/Folders:**

* `/content/sample-article.mdita`

* `/content/main.ditamap`

* `/out/html/` (Generated output, likely gitignored)

* `/src/app/articles/sample/page.tsx`

* `/.gitignore` (Update to ignore `out/` and `.dita-ot-temp/`)

  

---

  

## Phase 2: Build-Time Transformation & Dynamic Loading

  

**Objective:** Automate the DITA transformation during the Next.js build process (`getStaticProps` or equivalent for App Router) and dynamically load content based on file structure. Parse basic metadata.

  

**Tasks:**

  

1. **Script DITA-OT Execution:**

* Create a script (e.g., `/scripts/transform-dita.mjs`) that can run the DITA-OT command programmatically. Use Node.js `child_process`.

```javascript

// scripts/transform-dita.mjs (simplified example)

import { execSync } from 'child_process';

import path from 'path';

  

const DITA_OT_BIN = 'path/to/dita'; // Configure this

const CONTENT_DIR = path.resolve('content');

const OUTPUT_DIR = path.resolve('.dita-build-output'); // Temporary build output

  

export function transformDita(inputFile = 'main.ditamap', format = 'html5') {

const inputPath = path.join(CONTENT_DIR, inputFile);

const outputPath = path.join(OUTPUT_DIR, format);

console.log(`Running DITA-OT: ${inputPath} -> ${outputPath} (${format})`);

try {

// Ensure output dir exists or DITA-OT might fail

// execSync(`mkdir -p ${outputPath}`); // May not be needed depending on DITA-OT version

execSync(`${DITA_OT_BIN} --input=${inputPath} --format=${format} --output=${outputPath}`, { stdio: 'inherit' });

console.log('DITA-OT transformation complete.');

return outputPath;

} catch (error) {

console.error('DITA-OT transformation failed:', error);

throw error;

}

}

  

// Optional: Allow running directly from CLI

if (process.argv[1] === path.resolve('scripts/transform-dita.mjs')) {

transformDita();

}

```

* Add `.dita-build-output` to `.gitignore`.

  

2. **Integrate Transformation into Next.js Build:**

* Use Next.js data fetching methods. For App Router, this often involves `generateStaticParams` and the page component's async function itself.

* Create a dynamic route, e.g., `/src/app/articles/[slug]/page.tsx`.

* **Metadata Parsing:** Use a library like `gray-matter` to parse YAML frontmatter from `.mdita` files.

* **Content Loading:**

* In `generateStaticParams`, find all `.mdita` files in `/content`.

* In the page component, for a given `slug`, find the corresponding `.mdita` file.

* *During build time (e.g., within `generateStaticParams` or a shared utility function called by page):*

* Run the DITA transformation script for the specific file (or maybe all files at once for efficiency).

* Read the generated HTML content from the `.dita-build-output` directory.

* Parse the metadata using `gray-matter`.

* Pass the HTML content and metadata as props to the page component.

  

3. **Dynamic Page Component:**

* Modify `/src/app/articles/[slug]/page.tsx`:

```typescript

// src/app/articles/[slug]/page.tsx

import { promises as fs } from 'fs';

import path from 'path';

import { notFound } from 'next/navigation';

import matter from 'gray-matter'; // npm install gray-matter

// Assume transformDita exists and places output predictably

// import { transformDita } from '@/scripts/transform-dita'; // May need adjustment for build env

  

// Helper to get content paths/slugs

async function getContentSlugs() {

const contentDir = path.join(process.cwd(), 'content');

const filenames = await fs.readdir(contentDir);

return filenames

.filter((name) => name.endsWith('.mdita'))

.map((name) => name.replace(/\.mdita$/, ''));

}

  

// Generate routes at build time

export async function generateStaticParams() {

const slugs = await getContentSlugs();

// Pre-run DITA-OT for all content here if desired, or do it per-page below

console.log('Generating static params for slugs:', slugs);

// Ensure DITA transformation runs *before* page generation attempts

// You might call a master transform script here.

return slugs.map((slug) => ({ slug }));

}

  

// Fetch data for a specific page

async function getArticleData(slug: string) {

const contentDir = path.join(process.cwd(), 'content');

const filePath = path.join(contentDir, `${slug}.mdita`);

  

try {

const fileContents = await fs.readFile(filePath, 'utf8');

const { data: metadata, content: mditaContent } = matter(fileContents);

  

// --- Transformation & HTML Reading ---

// This is the tricky part - ensuring DITA-OT runs correctly at build time

// Option 1: Assume a full build ran beforehand via generateStaticParams or script

// Option 2: Trigger transformation here (might be slow, sync issues)

// Let's assume Option 1 for now.

const htmlOutputPath = path.join(process.cwd(), '.dita-build-output', 'html5', `${slug}.html`); // Adjust path based on DITA-OT output structure

const htmlContent = await fs.readFile(htmlOutputPath, 'utf8');

// You'll likely need to extract just the body or relevant part of the HTML

  

return { metadata, htmlContent };

} catch (error) {

console.error(`Error fetching article ${slug}:`, error);

return null; // Handle error appropriately

}

}

  

export default async function ArticlePage({ params }: { params: { slug: string } }) {

const data = await getArticleData(params.slug);

  

if (!data) {

notFound(); // Triggers 404 page

}

  

const { metadata, htmlContent } = data;

  

return (

<article>

<h1>{metadata.title}</h1>

<p>Author: {metadata.author}</p>

{/* Render other metadata */}

<div dangerouslySetInnerHTML={{ __html: htmlContent }} /> {/* Sanitize potentially? */}

</article>

);

}

```

* **Challenge:** Ensure the DITA-OT process runs reliably *before* Next.js tries to read the output during `next build`. You might need to modify the `build` script in `package.json` to run your DITA script first: `"build": "node ./scripts/transform-dita.mjs && next build"`.

  

4. **Git Commit:**

* Commit the transformation script, dynamic route, updated build script, and any new dependencies.

* ```bash

git add scripts/ src/app/articles/[slug]/page.tsx package.json .gitignore

git commit -m "feat: Implement build-time DITA transformation and dynamic content loading"

git push

```

  

**Dependencies:** Phase 1, `gray-matter` library, Node.js `child_process`, Robust DITA-OT execution logic.

  

**Key Files/Folders:**

* `/scripts/transform-dita.mjs`

* `/src/app/articles/[slug]/page.tsx`

* `/package.json` (updated build script, new dependencies)

* `/.dita-build-output/` (Generated build files, gitignored)

  

---

  

## Phase 3: Core Features - LaTeX, Search, Index Pages

  

**Objective:** Implement key features for scientific content: LaTeX rendering, client-side search, and basic index pages based on metadata.

  

**Tasks:**

  

1. **LaTeX Rendering:**

* Choose a library: MathJax (more feature-complete).

* Install MathJax: `npm install MathJax`

* Add MathJax CSS to your main layout (`/src/app/layout.tsx`):

```typescript

import MathJax, etc

```

* Modify the DITA-OT transformation (or use a post-processing step on the HTML) to wrap LaTeX equations (e.g., `$E=mc^2$`) in a specific tag or class that your React component can target. Alternatively, configure DITA-OT math plugins if available for LwDITA/MDITA.

* Create a React component (`<MathRenderer>`) that uses `MathJax` to find and render equations within the loaded HTML string. This might involve parsing the HTML string or using `dangerouslySetInnerHTML` carefully with post-render hooks.

* Integrate `<MathRenderer>` into `/src/app/articles/[slug]/page.tsx`.

  

2. **Client-Side Search (Lunr.js):**

* Install Lunr.js: `npm install lunr`

* **Index Generation:** During the build process (after content is transformed and metadata parsed), create a Lunr.js index.

* Create a script (`/scripts/build-search-index.mjs`) that:

* Reads all content files/metadata.

* Builds a Lunr index containing relevant fields (title, slug, maybe stripped content, tags).

* Saves the serialized index to the `/public` directory (e.g., `/public/search-index.json`).

* Update the `build` script in `package.json`: `"build": "node ./scripts/transform-dita.mjs && node ./scripts/build-search-index.mjs && next build"`

* **Search UI:** Create a search component (e.g., `/src/components/Search.tsx`).

* It should fetch `/search-index.json` on the client side.

* Load the index into Lunr.

* Provide an input field and display search results (linking to the respective article pages).

  

3. **Index Pages:**

* Create pages to list content, e.g., `/src/app/articles/page.tsx` (listing all articles).

* Use similar data fetching logic as the individual article pages, but gather metadata for *all* articles.

* Read all `.mdita` files, parse their frontmatter.

* Filter/sort based on metadata (e.g., list only `publish: true` articles, sort by date).

* Render a list of links to the articles, potentially showing titles and summaries.

  

4. **Styling:**

* Start applying basic styling using Tailwind CSS to improve presentation.

  

5. **Git Commit:**

* Commit LaTeX integration, search implementation, index pages, and styling updates.

* ```bash

git add src/components/ src/app/articles/page.tsx public/ # Add search-index.json if generated locally for checking

git commit -m "feat: Add LaTeX rendering, client-side search, and index pages"

git push

```

  

**Dependencies:** Phase 2, `MathJax`, `MathJax`, `lunr`, Build-time index generation script.

  

**Key Files/Folders:**

* `/src/app/layout.tsx` (MathJax CSS import)

* `/src/components/MathRenderer.tsx` (Optional, if needed)

* `/scripts/build-search-index.mjs`

* `/public/search-index.json` (Generated index, committed or gitignored but generated by build)

* `/src/components/Search.tsx`

* `/src/app/articles/page.tsx`

  

---

  

## Phase 4: Automation, Deployment & Basic Conditional Rendering

  

**Objective:** Automate the build and deployment process using GitHub Actions and implement basic conditional rendering based on metadata flags.

  

**Tasks:**

  

1. **GitHub Actions Workflow:**

* Create a workflow file: `/.github/workflows/deploy.yml`.

* **Trigger:** On push to the `main` branch.

* **Jobs:**

* `checkout`: Check out the repository code.

* `setup-node`: Set up the correct Node.js version.

* `setup-dita-ot`: **Crucial Step.** Either download and install DITA-OT within the action runner or use a Docker image containing DITA-OT and Java. Using Docker is recommended here for consistency.

* `install-deps`: Run `npm ci` (clean install).

* `build`: Run the full build command (`npm run build`), which should now include DITA transformation and search index generation.

* `deploy`: Deploy the build output (`.next` directory for standard Next.js) to Vercel or Netlify using their respective GitHub Actions integrations.

  

2. **Deployment Platform Setup:**

* Connect your GitHub repository to Vercel or Netlify.

* Configure build settings on the platform (usually auto-detected for Next.js, but ensure the build command is correct if not using the Actions workflow for deployment).

* Set up environment variables if needed (e.g., path to DITA-OT if handled differently in CI).

  

3. **Basic Conditional Rendering (`publish: true`):**

* Modify the data fetching logic (`getArticleData`, `generateStaticParams`, index page logic) to check the `publish` flag from the metadata.

* If `publish` is not `true`:

* Exclude the article from `generateStaticParams` so its page isn't built.

* Exclude the article from index pages.

* (Optional) In dev mode, you might still render it but add a clear "Draft" indicator.

  

4. **Git Commit & Test Deployment:**

* Commit the GitHub Actions workflow file and any code changes for conditional rendering.

* ```bash

git add .github/workflows/deploy.yml src/ # Check relevant files modified for conditional rendering

git commit -m "feat: Add GitHub Actions workflow for build/deploy and basic conditional rendering"

git push

```

* Monitor the action run on GitHub. Check the deployment on Vercel/Netlify.

  

**Dependencies:** Phase 3, GitHub account, Vercel/Netlify account, Docker knowledge (recommended for DITA-OT in CI).

  

**Key Files/Folders:**

* `/.github/workflows/deploy.yml`

* Updated data fetching logic in page components and scripts.

  

---

  

## Phase 5: Advanced Metadata, Conditional Rendering & Exports

  

**Objective:** Implement more sophisticated metadata handling (potentially DB/API if needed), advanced conditional rendering, data-driven dashboards, and alternative export formats.

  

**Tasks:**

  

1. **Advanced Metadata Strategy:**

* **Evaluate Need for DB/API:** With potentially many articles and complex metadata queries (dashboards, complex filtering), is the build-time parsing sufficient?

* **If Yes (Sticking with Build-Time):** Enhance the build scripts to generate more complex JSON data structures from metadata, which can be fetched by index pages and dashboard components. Lunr.js might handle most filtering needs.

* **If No (Need DB/API):** This is a significant architectural shift.

* Set up PostgreSQL (e.g., using Vercel Postgres, Neon, Supabase, or AWS RDS).

* Create a schema for metadata (e.g., a table with `id`, `slug`, `metadata JSONB`).

* Modify the build process (or a separate GitHub Action triggered on content change): Instead of just building the site, parse metadata and *sync* it to the PostgreSQL database (Metadata Extraction Service -> Database Service).

* Implement Next.js API Routes (`/src/app/api/...`) to act as the API Layer, querying the database.

* Refactor front-end components (index pages, dashboards) to fetch data from these API routes instead of static JSON files or build-time props. This enables more dynamic features but moves away from pure SSG for some parts.

* **Recommendation:** Start by pushing the limits of the build-time approach first. Introduce the DB/API layer *only if necessary* due to scale or dynamic requirements not met by SSG/ISR.

  

2. **Advanced Conditional Rendering:**

* Extend metadata schema (e.g., `audience: expert`, `region: US`).

* Implement logic in components or data fetching to filter/display content based on these flags. This might involve:

* Build-time filtering (if flags are static per build).

* Client-side logic (if dependent on user context, e.g., user role/region, which implies needing user authentication/session management - a whole new domain).

  

3. **Data-Driven Dashboards:**

* Create a new page route (e.g., `/src/app/dashboard/page.tsx`).

* Create React components using charting libraries (e.g., `recharts` - `npm install recharts`).

* Fetch aggregated metadata (either from build-time generated JSON or the API if using DB).

* Display visualizations (e.g., articles by status, tag distribution).

  

4. **Alternative Export Formats (PDF, ePub):**

* Modify the DITA-OT transformation script/workflow to support other formats:

* Update `/scripts/transform-dita.mjs` or the GitHub Action step to accept a `format` parameter (`pdf`, `epub`).

* Ensure necessary DITA-OT plugins for PDF/ePub are installed/configured (PDF requires an XSL-FO processor like Apache FOP).

* Decide how users trigger/access these formats (e.g., download links on article pages, a separate export process). You might generate them during the build and provide links, or generate them on-demand via a serverless function (more complex).

  

5. **Git Commit:**

* Commit changes related to advanced metadata, conditional rendering, dashboards, and export features.

* ```bash

# Example commits, adjust based on chosen path

git commit -m "feat: Enhance build-time metadata processing for dashboards"

git commit -m "feat: Add dashboard page with recharts visualization"

git commit -m "feat: Implement audience-based conditional rendering"

git commit -m "feat: Add PDF export generation during build"

git push

```

  

**Dependencies:** Phase 4, Decision on DB/API, Charting library, DITA-OT PDF/ePub plugins, potentially auth system for user-specific conditional rendering.

  

**Key Files/Folders:**

* (If DB/API) `/src/app/api/`, Database schema files, sync scripts.

* `/src/app/dashboard/page.tsx`

* `/src/components/charts/` (Example)

* Updated build scripts/workflows for exports.

  

---

  
## Phase 5.5: DITA Feature Integration

  

**Objective:** Enhance the Markdown-centric workflow with powerful DITA capabilities for content reuse, conditional processing, and version control while maintaining the simplicity and flexibility of Markdown.

  

**Tasks:**

  

1. **Enhanced YAML Frontmatter for DITA Attributes:**

* Extend frontmatter schema to support DITA-specific attributes:

```yaml

---

title: Example Document

audience: [beginner, intermediate, expert]

platform: [web, mobile, desktop]

product: product-x

otherprops: 

  confidentiality: internal

  review-status: draft

revision:

  version: "1.2.0"

  modified: "2024-04-10"

---

```

* Update the `md-to-dita.ts` converter to map these attributes to proper DITA attributes during transformation.

* Modify `src/lib/dita.ts` to intelligently use these attributes for filtering during rendering.

  

2. **Content Reuse System:**

* Implement a conref-like syntax within Markdown:

```markdown

{{conref:path/to/file.md#section-id}}

```

* Create a preprocessing step in `md-to-dita.ts` that resolves these references before DITA-OT processing.

* Build a content fragment library with commonly reused content blocks.

* Add validation to ensure referenced content exists and is accessible.

  

3. **Key References and Variables:**

* Create a central `keys.yml` configuration file for defining global variables:

```yaml

product-name: "Hex21 CMS"

version: "2.0"

company: "HexTech Industries"

support-email: "support@example.com"

```

* Implement inline variable syntax:

```markdown

Contact {{key:support-email}} for assistance with {{key:product-name}}.

```

* Update `md-to-dita.ts` to resolve these references during preprocessing.

  

4. **Conditional Processing:**

* Implement block-level conditional syntax:

```markdown

:::if audience="expert" platform="desktop":::

This content is only visible to expert users on desktop platforms.

::::::

```

* Create a rich ditaval-like configuration system:

```yaml

# conditional-config.yml

include:

  audience: [beginner, intermediate]

  platform: [web, mobile]

exclude:

  otherprops:

    confidentiality: [classified]

```

* Build a preprocessing step that applies these conditions during conversion.

* Add UI controls in the web interface to toggle different output versions.

  

5. **Version Control and Branch Filtering:**

* Implement Git-integrated versioning that leverages DITA branch filtering concepts:

```yaml

# version-config.yml

versions:

  - id: "2.0"

    branch: "main"

    status: "current"

  - id: "1.5"

    branch: "v1.5"

    status: "supported"

  - id: "1.0"

    branch: "v1.0"

    status: "archived"

```

* Modify build scripts to generate version-specific outputs.

* Add version dropdown in the web UI for readers to select documentation versions.

* Implement automatic comparison to highlight changes between versions.

  

6. **DITA Specialization via Markdown Extensions:**

* Create custom domain-specific extensions through special syntax:

```markdown

:::api-endpoint method="GET" url="/api/users":::

Returns a list of users.


**Parameters:**

- `limit`: Maximum number of results

:::query-params:::

| Name | Type | Required | Description |

|------|------|----------|-------------|

| limit | number | No | Max results |

::::::

::::::

```

* Build specialized renderers for these custom elements.

* Create a plugin system for organizations to define their own specializations.

  

7. **Metadata Exchange and Round-Trip Editing:**

* Implement a system to preserve DITA metadata during the round-trip between:

```

DITA → Markdown → Editing → DITA

```

* Store complex DITA attributes as specially formatted comments in Markdown.

* Build tooling to validate that manual edits maintain structural integrity.

  

8. **Interactive Version Flyout Menu:**

* Implement a Read the Docs-style floating menu component for dynamic version switching:

```jsx

// Example web component implementation

<version-flyout 
  position="bottom-right"
  current-version="2.0"
  show-downloads="true">
</version-flyout>

```

* Create a comprehensive menu that includes:

  * Version switcher showing all active versions

  * Format options (HTML, PDF, ePub) for offline reading

  * Language/translation selector (when i18n is implemented)

  * Quick access to search

* Support multiple positioning options (bottom-right, bottom-left, top-right, top-left)

* Implement version comparison features:

  * Visual diff highlighting between versions

  * "What's new in this version" indicators

  * Maintain scroll position when switching versions

* Integrate with the build system to:

  * Generate version metadata during build time

  * Pre-render version-specific content or implement dynamic loading

* Use JavaScript custom events for theme integration:

```javascript

document.addEventListener('version-selected', (event) => {
  const { version, url } = event.detail;
  // Handle version change
});

```

* Create configuration options in a central config file:

```yaml

# flyout-config.yml

position: bottom-right

sort-method: semver

default-version: latest

show-special-versions-first: true

available-formats: [html, pdf, epub]

```

* Ensure accessibility compliance with proper ARIA attributes and keyboard navigation

8. **Git Commit:**

```bash

git add scripts/md-to-dita.ts src/lib/dita.ts config/keys.yml

git commit -m "feat: Implement DITA feature integration"

git push

```

  

**Dependencies:** Phase 5, DITA-OT integration, understanding of DITA architecture, Markdown processing pipeline.

  

**Key Files/Folders:**

* Updated `/scripts/md-to-dita.ts`

* Enhanced `/src/lib/dita.ts`

* New configuration files: `/config/keys.yml`, `/config/conditional-config.yml`

* New plugins: `/plugins/dita-extensions/`

* Documentation: `/docs/authoring/dita-features.md`

  

---

  

## Phase 6: Refinement, Testing & Documentation

  

**Objective:** Polish the application, add tests, write documentation, and ensure a stable final product.

  

**Tasks:**

  

1. **Testing:**

* Implement unit tests (e.g., using Jest/Vitest) for utility functions, metadata parsing logic, components.

* Implement integration tests (e.g., using React Testing Library) for page rendering and interactions.

* Consider end-to-end tests (e.g., using Playwright or Cypress) for critical user flows (viewing articles, searching, navigating).

2. **Code Quality & Refactoring:**

* Review code for clarity, performance, and maintainability.

* Ensure consistent error handling.

* Optimize build times and page load performance.

3. **Authoring Documentation:**

* Create guides for content authors on how to write MDITA, use metadata flags, and follow the Git workflow. This could even be content *within* the CMS itself.

4. **README & Developer Docs:**

* Update the `README.md` with setup instructions, architectural overview, and contribution guidelines.

5. **Final Deployment Checks:**

* Verify production build configurations.

* Monitor deployed application performance and logs.

  

**Dependencies:** All previous phases. Testing frameworks (`jest`, `@testing-library/react`, `playwright`/`cypress`).

  

**Key Files/Folders:**

* `/tests/` or `src/**/*.test.ts`

* `/docs/authoring/` (Example)

* `README.md`

  

---

  

## IDE Usage Throughout

  

* **AI Chat (Cmd/Ctrl+K):** Use for generating boilerplate code (components, functions), explaining concepts (DITA-OT commands, Next.js APIs), debugging errors, writing scripts (like `transform-dita.mjs`), generating GitHub Actions workflow syntax.

* **AI Edit Code (Cmd/Ctrl+L):** Refactor code, add types, generate documentation strings, fix linting issues directly inline.

* **Integrated Terminal:** Run all commands (`npm`, `git`, `dita`).

* **Source Control Panel:** Manage Git staging, commits, branches visually.

* **Workspace:** Keep all project files easily accessible. Define workspace settings if needed.

* **Debugging Tools:** Utilize the integrated debugger for Node.js and client-side JavaScript.

  

This phased plan provides a structured approach to building your Hex 21 CMS, starting simple and layering complexity. Remember to commit frequently and adapt the plan based on discoveries made during development. Good luck!
