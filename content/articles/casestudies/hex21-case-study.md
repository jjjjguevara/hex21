---
title: "Case Study: Hex 21 CMS - Streamlining Scientific Publishing with Docs-as-Code"
slug: hex21-cms-case-study
author: Josué Guevara
published: 2025-04-09 
description: "An analysis of the Hex 21 CMS project, detailing its architecture, development journey, and features designed for efficient scientific content management using LwDITA and a docs-as-code workflow."
tags: ["CMS", "DITA", "LwDITA", "Scientific Publishing", "Docs-as-Code", "Next.js", "Case Study"]
publish: true
category: ["Technology", "Case Study"]
datalist: ["author", "published", "category", "tags"]
---

# Case Study: Hex 21 CMS

> [!note]
> This case study analyzes the Hex 21 Content Management System, examining its approach to solving challenges in scientific content publishing through a metadata-driven, docs-as-code workflow powered by Lightweight DITA (LwDITA) and a modern web stack.

## 1. Project Overview & Business Context

### Scientific Publishing Challenges and Business Drivers

Traditional scientific publishing workflows often face significant hurdles: managing complex content structures, ensuring consistency across revisions, handling specialized formats like mathematical equations, and adapting content for diverse audiences and output formats. These processes can be manual, error-prone, and slow, hindering the rapid dissemination of research and technical information. The primary business driver for Hex 21 CMS is to address these inefficiencies by providing a streamlined, automated, and version-controlled system specifically tailored for scientific and technical documentation.

### Target Users and Stakeholder Requirements

The target users include researchers, technical writers, editors, and content managers involved in creating, reviewing, and publishing scientific articles, research papers, and technical documentation. Key stakeholder requirements include:

1.  **Structured Authoring:** Support for robust content structuring (like DITA) but with simpler syntax options (like Markdown).
2.  **Version Control:** Seamless integration with Git for tracking changes, collaboration, and reproducibility.
3.  **Metadata Management:** Flexible system for tagging content with metadata (e.g., audience, status, topic) to drive organization, discovery, and conditional display.
4.  **Specialized Content Support:** Native rendering of LaTeX equations and potentially other scientific notations or interactive elements.
5.  **Multi-Format Output:** Ability to generate standard web formats (HTML) as well as print/offline formats (PDF, potentially ePub).
6.  **Automation:** Automated build, test, and deployment processes to minimize manual intervention.
7.  **Discoverability:** Effective search functionality across the content repository.

### Core Pain Points Addressed by the Solution

Hex 21 CMS directly targets the pain points of complexity, inconsistency, manual effort, and lack of version control inherent in many traditional systems. It aims to reduce the friction in publishing high-quality, accurate scientific content.

### Docs-as-Code Approach Rationale

The project adopts a "docs-as-code" philosophy, treating documentation artifacts (LwDITA/Markdown files, metadata) as code assets stored and managed in a Git repository. This approach unlocks several benefits:

*   **Version Control:** Leverages Git's powerful branching, merging, and history tracking.
*   **Collaboration:** Enables standard code review workflows for documentation.
*   **Automation:** Integrates naturally with CI/CD pipelines (e.g., GitHub Actions) for automated testing, transformation, and deployment.
*   **Consistency:** Ensures that documentation is developed, reviewed, and deployed using repeatable processes.
*   **Integration:** Allows documentation to live alongside and evolve with related code or research artifacts if needed.

## 2. Solution Architecture

### Technical Stack and Architectural Decisions

Hex 21 CMS employs a modern web stack chosen for performance, developer experience, and suitability for a content-driven application:

*   **Front-End Framework:** Next.js (React) - Enables Server-Side Rendering (SSR) and Static Site Generation (SSG) for performance, provides a robust component model, and includes features like API routes. The App Router is used for modern routing and data fetching patterns.
*   **Content Authoring:** Lightweight DITA (LwDITA) - Specifically MDITA (Markdown) and potentially XDITA (XML), offering structured authoring benefits with a lower barrier to entry than full DITA. YAML frontmatter within MDITA files serves as the primary mechanism for inline metadata.
*   **Content Transformation:** DITA Open Toolkit (DITA-OT) - The industry standard for processing DITA content into various output formats (HTML5, PDF, etc.). Integrated into the build process (`src/lib/dita.ts`, `scripts/transform-dita.mjs`).
*   **Version Control:** Git / GitHub - Underpins the docs-as-code workflow.
*   **Automation:** GitHub Actions - Orchestrates the build, transformation, and deployment pipeline (`.github/workflows/deploy.yml`).
*   **Styling:** Tailwind CSS - Utility-first CSS framework for rapid UI development.
*   **Search:** Lunr.js - Client-side search indexing and querying, generated at build time (`src/lib/search.server.ts`, `scripts/build-search-index.mjs`).
*   **Hosting:** Vercel / Netlify - Platforms optimized for deploying Next.js applications, offering features like global CDN and serverless functions.

The architecture prioritizes build-time generation (SSG) where possible to maximize performance and reduce server load, leveraging Next.js's data fetching capabilities (`generateStaticParams`, async page components) within the App Router.

### Metadata Strategy and Implementation

Metadata is central to Hex 21 CMS. The primary strategy relies on YAML frontmatter embedded within the MDITA content files.

```yaml
---
title: "Article Title"
publish: true
audience: "expert"
tags: ["tech", "guide"]
date: 2023-10-27
---

# Article Content...
```

This metadata is parsed during the build process using libraries like `gray-matter` (as seen in data fetching logic within `src/app/articles/[slug]/page.tsx` and helper functions like `src/lib/articles.ts` or `src/lib/content.server.ts`). The parsed metadata drives:

*   **Content Indexing:** Populating lists and navigation (e.g., `/src/app/articles/page.tsx`).
*   **Conditional Rendering:** Determining if content should be built/displayed (e.g., checking the `publish: true` flag).
*   **Search Indexing:** Providing fields for the Lunr.js index.
*   **Data Visualization:** Feeding potential dashboard components.

While the initial implementation relies on build-time parsing, the architecture acknowledges the potential need for a dedicated database (e.g., PostgreSQL with JSONB) and an API layer (`src/app/api/...`) for more complex querying, scalability, and real-time updates, as outlined in Phase 5 of the development plan.

### System Domains and Component Interaction

The `README.md` outlines key domains (Content Authoring, Transformation, Rendering, Metadata Management, Version Control, Automation, Hosting). In the Next.js implementation, these translate roughly to:

*   **Authoring:** Local development environment using text editors/IDEs (like Cursor) to create `.mdita` files in the `/content` directory.
*   **Version Control:** Git commands (`add`, `commit`, `push`) interacting with the GitHub repository.
*   **Automation:** GitHub Actions workflow (`.github/workflows/deploy.yml`) triggered by pushes.
*   **Transformation:** DITA-OT executed via scripts (`scripts/transform-dita.mjs`, invoked by `npm run build`) potentially using utility functions (`src/lib/dita.ts`). Output stored temporarily (e.g., `.dita-build-output`).
*   **Metadata Management (Build-Time):** Parsing logic within Next.js data fetching (`src/lib/articles.ts`, `src/lib/metadata.ts`, page components). Search index generation (`scripts/build-search-index.mjs`).
*   **Rendering:** Next.js App Router pages (`src/app/...`), reusable React components (`src/components/...` like `ArticleRenderer.tsx`, `MarkdownContent.tsx`, `ObsidianContent.tsx`), and layout files (`src/app/layout.tsx`).
*   **Hosting:** Deployment of the `.next` build output to Vercel/Netlify.

The interaction flow follows the docs-as-code model: Author commits -> Git push -> GitHub Action triggers -> DITA transform -> Metadata parse -> Search index build -> Next.js build -> Deploy.

### Content Transformation Workflow

1.  **Trigger:** `npm run build` command, typically executed within the CI/CD pipeline (GitHub Actions).
2.  **Execution:** The build script invokes the DITA-OT transformation script (`scripts/transform-dita.mjs`).
3.  **Input:** Reads DITA map files (e.g., `content/main.ditamap`) which reference the MDITA source files.
4.  **Processing:** DITA-OT processes the input files, applying transformations for the target format (initially HTML5). LaTeX equations (`$E=mc^2$`) are handled potentially via MathJax integration (`src/components/MathJaxConfig.tsx`).
5.  **Output:** Generates output files (e.g., HTML) in a temporary build directory (`.dita-build-output`).
6.  **Consumption:** Next.js data fetching functions read the processed HTML content and parsed metadata during the `next build` phase to generate static pages.

### Key Differentiators from Traditional CMS Solutions

*   **Git-Native Workflow:** Treats content as code, leveraging established developer tooling and practices.
*   **Structured Authoring Focus:** Built around LwDITA for inherent structure, unlike many Markdown-centric or WYSIWYG systems.
*   **Build-Time Centric:** Prioritizes static generation for performance and security, contrasting with dynamic, database-heavy traditional CMS.
*   **Decoupled Architecture:** Separation of content management (Git, filesystem) from content delivery (Next.js, hosting platform).
*   **Developer Control:** High degree of customization and control over the entire pipeline, rather than being confined by a monolithic platform.

## 3. Development Journey & Implementation

### Phased Development Approach

The project followed a structured, phased approach as detailed in the `README.md`, starting with basic setup and incrementally adding core features:

*   **Phase 0:** Environment setup, Next.js initialization, DITA-OT installation.
*   **Phase 1:** Basic content creation, manual transformation, static rendering.
*   **Phase 2:** Automating DITA-OT during the build (`getStaticProps`/App Router data fetching), dynamic content loading based on slugs (`src/app/articles/[slug]/page.tsx`), basic metadata parsing (`gray-matter`).
*   **Phase 3:** Implementing core scientific features like LaTeX (`MathJaxConfig.tsx`), client-side search (`lunr`, `scripts/build-search-index.mjs`, `src/components/Search.tsx`), and metadata-driven index pages (`src/app/articles/page.tsx`).
*   **Phase 4:** Automating deployment via GitHub Actions (`.github/workflows/deploy.yml`), implementing basic conditional rendering (e.g., `publish` flag).
*   **Phase 5:** Planning for advanced metadata (potential DB/API), complex conditional rendering, dashboards, and alternative exports (PDF).
*   **Phase 6:** Refinement, testing, and documentation.

This incremental approach allowed for focused development, early feedback loops, and manageable complexity at each stage.

### Critical Technical Challenges and Solutions

1.  **Integrating DITA-OT into Next.js Build:**
    *   **Challenge:** Ensuring DITA-OT runs reliably *before* Next.js needs the transformed content during `next build`. Managing DITA-OT dependencies (Java) in different environments (local dev vs. CI).
    *   **Solution:** Modifying the `package.json` build script (`"build": "node ./scripts/transform-dita.mjs && node ./scripts/build-search-index.mjs && next build"`) to explicitly run transformation and indexing before `next build`. Using Docker containers within GitHub Actions to provide a consistent DITA-OT environment (`setup-dita-ot` step in `deploy.yml`).
2.  **Handling Diverse Content Sources:**
    *   **Challenge:** Supporting both structured MDITA and potentially less structured Markdown or Obsidian formats.
    *   **Solution:** Creating distinct rendering components (`MarkdownContent.tsx`, `ObsidianContent.tsx`) and potentially different processing pipelines or configurations within `content.server.ts` or similar library files. Utilizing robust parsing libraries.
3.  **Client-Side Search Indexing:**
    *   **Challenge:** Generating an efficient and comprehensive search index at build time without significantly slowing down the build.
    *   **Solution:** Creating a dedicated build script (`scripts/build-search-index.mjs`) to iterate through content, extract relevant metadata/text, build the Lunr index, and serialize it to `/public` for easy client-side fetching.

### Integration of Scientific Content Requirements

*   **LaTeX:** Integrated MathJax (`src/components/MathJaxConfig.tsx`) to render mathematical notation embedded within Markdown/MDITA content (e.g., `$E=mc^2$`). This requires client-side JavaScript execution.
*   **Structured Data:** Leveraged LwDITA's inherent structure and metadata frontmatter to represent relationships and classifications within the content. The transformation process preserves necessary semantics for HTML output.

### Incremental Testing and Refinement

While Phase 6 explicitly focuses on testing, the phased approach allows for testing at each stage. Manual testing after each phase ensures the core workflow functions. The plan includes adding unit, integration, and potentially end-to-end tests later using frameworks like Jest, React Testing Library, and Playwright/Cypress. Refinement occurs iteratively as features are added and integrated.

### Automation and Deployment Strategy

Automation is achieved via GitHub Actions (`.github/workflows/deploy.yml`). The workflow automates:

1.  Code Checkout
2.  Environment Setup (Node.js, DITA-OT via Docker)
3.  Dependency Installation (`npm ci`)
4.  Full Build (`npm run build`), including DITA transformation and search index generation.
5.  Deployment to Vercel/Netlify using dedicated actions.

This ensures consistent, repeatable deployments triggered automatically on pushes to the main branch.

## 4. Key Features & Capabilities

### Metadata-Driven Content Management

Metadata, primarily from YAML frontmatter, is the engine driving content organization and presentation. Functions within `src/lib/articles.ts`, `src/lib/metadata.ts`, and `src/lib/content.server.ts` handle reading, parsing, and filtering content based on this metadata. Index pages dynamically list articles, potentially sorting or filtering them by date, tags, or publication status.

### Conditional Rendering by Audience and Permissions

The initial implementation focuses on the `publish` flag to control visibility at build time. Articles with `publish: false` are excluded from static generation and index pages. The architecture anticipates more complex conditional rendering (e.g., based on `audience` metadata or user roles), which might require client-side logic or integration with an authentication system and potentially the API layer outlined in Phase 5.

### Scientific Notation and Equation Support

MathJax provides robust support for rendering LaTeX equations directly within the browser, ensuring accurate display of complex mathematical notation essential for scientific content. This is configured in `src/components/MathJaxConfig.tsx` and applied during rendering.

### Multi-Format Export Capabilities

Leveraging the DITA Open Toolkit allows the system to generate various output formats beyond HTML5. By modifying the transformation script (`scripts/transform-dita.mjs`) or the GitHub Actions workflow, formats like PDF (requiring an XSL-FO processor like Apache FOP) or ePub can be generated, providing users with downloadable or offline versions of the content.

### Search Functionality and Content Discovery

Client-side search powered by Lunr.js offers fast and effective content discovery. The search index, built during deployment (`scripts/build-search-index.mjs`) and stored in `/public/search-index.json`, allows users to search across titles, tags, and potentially content excerpts directly in the browser via components like `src/components/Search.tsx` interacting with search logic (`src/lib/search.ts`). Server-side aspects might be handled by `src/lib/search.server.ts`.

### Data Visualization and Analytics Dashboards

Phase 5 outlines the implementation of dashboards. These would leverage the parsed metadata (either from build-time JSON or a dedicated API/DB) to provide insights into the content repository. React components using libraries like Recharts or Chart.js would visualize metrics such as content status (published vs. draft), distribution by tags or audience, or publication frequency.

## 5. Results & Future Direction

### Workflow Efficiency Improvements

The docs-as-code workflow powered by Hex 21 CMS is expected to yield significant efficiency gains compared to traditional methods:

*   **Reduced Manual Effort:** Automation of transformation, indexing, and deployment saves considerable time.
*   **Improved Consistency:** Version control and standardized workflows ensure content quality and uniformity.
*   **Faster Turnaround:** Streamlined processes enable quicker updates and publication cycles.
*   **Enhanced Collaboration:** Git-based workflows facilitate parallel development and review.

### User Adoption Metrics and Feedback (Anticipated)

Successful adoption would be indicated by:

*   Regular commits and content updates via the Git workflow.
*   Positive feedback from authors and editors regarding ease of use and efficiency.
*   Usage analytics showing engagement with search features and diverse content.
*   Reduced time spent on manual formatting and publishing tasks.

### Lessons Learned and Technical Insights

*   **Build Pipeline Complexity:** Integrating external tools like DITA-OT into a modern JavaScript build system requires careful orchestration and dependency management, especially across different environments (local/CI). Docker proved valuable for consistency.
*   **Metadata Strategy Evolution:** While frontmatter is convenient initially, scaling complex queries and relationships might necessitate a transition towards a dedicated database and API, impacting the architecture's static nature.
*   **Client-Side vs. Server-Side Trade-offs:** Features like search (Lunr.js) and potentially advanced conditional rendering involve balancing build-time generation, client-side computation, and server-side logic (API routes).

### Scalability Considerations

*   **Build Times:** As the content volume grows, DITA-OT transformation and full Next.js site generation times may increase. Optimizing the transformation process (e.g., incremental builds if supported, parallel processing) will be important.
*   **Metadata Querying:** Large numbers of files may make build-time metadata aggregation slow or unwieldy, reinforcing the potential need for a database/API solution (Phase 5).
*   **Search Index Size:** Large client-side search indexes (Lunr.js) can impact initial load time; server-side search solutions (like Elasticsearch) might be considered for very large repositories.

### Future Enhancement Roadmap

Based on the phased plan and potential needs:

1.  **Implement Database/API Layer:** Transition metadata management to PostgreSQL/API routes for enhanced scalability and dynamic querying (Phase 5).
2.  **Advanced Conditional Rendering:** Implement user role/attribute-based content visibility, likely requiring an authentication system.
3.  **Enhanced Authoring Experience:** Explore IDE integrations or simple web-based editors that integrate with the Git workflow.
4.  **Comprehensive Testing Suite:** Fully implement unit, integration, and E2E tests (Phase 6).
5.  **Optimize Build Performance:** Investigate incremental builds or other DITA-OT/Next.js optimizations.
6.  **Interactive Components:** Develop custom React components for richer content interaction beyond static text and images.
7.  **Workflow Improvements:** Add features like content validation hooks or improved preview mechanisms.

By addressing the unique needs of scientific publishing through a well-architected, automated docs-as-code system, Hex 21 CMS provides a powerful and efficient platform for creating, managing, and disseminating complex technical information.
