---
title: Supported File Types
author: Hex21 DITA Team
date: 2024-04-01
tags: [documentation, guide, dita, file-types, markdown, xml]
description: Information on the DITA-related file types supported by Hex21.
id: dita-file-types
---

# File Types and Structure

Hex21 CMS uses a combination of file types and a specific directory structure to organize and manage content effectively. This document explains the supported file types and how they should be organized.

## Supported File Types

### 1. Standard Markdown (`.md`)
Plain Markdown files are fully supported and automatically processed into DITA-compatible format:

```markdown
---
title: My Article
author: Your Name
date: 2024-04-01
publish: true
audience: beginner
tags: [science, tutorial]
---

# Introduction

This is a standard Markdown article with **bold** and *italic* text.

## Methods

Here's an equation: $E = mc^2$

## Results

- First finding
- Second finding

> Important note about the results
```

### 2. DITA Maps (`.ditamap`)
DITA maps are XML files that organize your content by defining the structure and relationships between topics.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
  <title>Your Article Title</title>
  <topicmeta>
    <author>Your Name</author>
    <category>Your Category</category>
    <data name="publish" value="true"/>
  </topicmeta>
  
  <topicref href="../topics/introduction.md" format="markdown"/>
  <topicref href="../topics/main-content.mdita" format="mdita"/>
  <topicref href="../topics/conclusion.dita" format="dita"/>
</map>
```

### 3. Markdown DITA (`.mdita`)
MDITA files use Markdown syntax with optional YAML frontmatter for metadata, providing additional DITA-specific features:

```markdown
---
title: Topic Title
author: Author Name
audience: beginner
---

# Main Heading

This is a paragraph with **bold** and *italic* text.

## Subheading

1. First item
2. Second item

> Important note or quote

```latex
E = mc^2
```
```

### 4. DITA XML (`.dita`)
Traditional DITA XML files for complex content requiring full DITA features:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="sample_topic">
  <title>Sample Topic</title>
  <body>
    <p>This is a paragraph in DITA XML format.</p>
    <note type="important">This is an important note.</note>
  </body>
</topic>
```

### 5. Supporting XML (`.xml`)
Used for shared content, variables, and other supporting data:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<variables>
  <product-name>Hex21 CMS</product-name>
  <version>1.0</version>
  <support-email>support@hex21.com</support-email>
</variables>
```

## File Type Processing

1. **Standard Markdown (`.md`)**
   - Automatically converted to DITA-compatible format
   - Supports YAML frontmatter for metadata
   - Handles standard Markdown syntax
   - Processes LaTeX equations and code blocks
   - Can be referenced directly in DITA maps

2. **MDITA (`.mdita`)**
   - Extends standard Markdown with DITA features
   - Supports DITA-specific elements and attributes
   - Full metadata support via YAML frontmatter

3. **DITA XML (`.dita`)**
   - Used for complex, structured content
   - Full DITA feature support
   - XML validation against DTDs

## Directory Structure

```plaintext
hex21/
├── content/
│   ├── maps/
│   │   ├── article1.ditamap
│   │   └── article2.ditamap
│   ├── topics/
│   │   ├── introduction.md      # Standard Markdown
│   │   ├── methods.mdita        # Markdown DITA
│   │   └── results.dita         # DITA XML
│   ├── shared/
│   │   ├── authors.dita
│   │   └── variables.xml
│   └── media/
│       ├── images/
│       └── videos/
├── schemas/
│   ├── dtd/
│   └── json/
└── templates/
    ├── article.md
    ├── article.mdita
    └── concept.dita
```

## File Naming Conventions

1. **Content Files**
   - Use kebab-case: `your-article-name.md`, `topic-name.mdita`
   - Descriptive but concise names
   - Clear indication of content type in name

2. **Topics**
   - Use kebab-case: `topic-name.md`, `topic-name.mdita`
   - Include purpose in name: `quantum-intro.md`

3. **Shared Content**
   - Use descriptive category prefixes: `authors.dita`, `variables.xml`
   - Group related content: `physics-equations.dita`

## Best Practices

1. **Organization**
   - Keep maps in the `maps/` directory
   - Store topics in `topics/` with subdirectories for large projects
   - Use `shared/` for reusable content
   - Place media files in appropriate subdirectories

2. **File Type Selection**
   - Use `.md` for simple content with basic formatting
   - Use `.mdita` when DITA features are needed
   - Use `.dita` for complex, structured content
   - Mix formats as needed within a single map

3. **Metadata**
   - Include YAML frontmatter in `.md` and `.mdita` files
   - Use `topicmeta` in DITA maps
   - Maintain consistent metadata fields

4. **Version Control**
   - Commit related files together
   - Use meaningful commit messages
   - Follow branching strategy for major changes

## Common Issues and Solutions

1. **Missing References**
   - Always validate paths in `href` attributes
   - Use relative paths from the map location
   - Check file extensions match format attribute

2. **Metadata Conflicts**
   - Topic metadata overrides map metadata
   - Use consistent metadata fields
   - Document metadata hierarchy

3. **Format Mismatches**
   - Ensure `format` attribute matches file extension
   - Use correct format values (`markdown`, `mdita`, `dita`)
   - Validate XML syntax when required

## Next Steps

- Review [Content Reuse Features](content-reuse.mdita) to learn about conrefs and keyrefs
- Explore [Templates and Examples](templates/index.mdita) for practical examples
- Check [Conditional Processing](conditional-processing.mdita) for content filtering options 