---
title: DITA Features Overview
author: Hex21 DITA Team
date: 2024-04-01
tags: [documentation, guide, dita, features, overview]
description: An overview of the DITA standard and its implementation in Hex21.
id: dita-overview
publish: true
audience: Content Authors
categories:
  - Documentation
  - DITA
keywords:
  - dita
  - lwdita
  - features
  - overview
shortdesc: A comprehensive guide to DITA features in Hex21 CMS, including content reuse, conditional processing, and version control.
---

# DITA in Hex21 CMS: Overview

Hex21 CMS leverages the power of DITA XML (Darwin Information Typing Architecture) to create, manage, and publish scientific and technical content. Our implementation focuses on Lightweight DITA (LwDITA) to provide a more accessible authoring experience while maintaining the robust features of DITA.

## Key Features

### 1. Lightweight DITA (LwDITA) Support
- **MDITA**: Markdown-based authoring for simple, readable content
- **XDITA**: XML-based authoring for complex structures
- **Hybrid Approach**: Mix MDITA and XDITA as needed

### 2. Content Reuse
- **Conrefs**: Reference and reuse content fragments
- **Keyrefs**: Define and use variables across documents
- **Topic-based Writing**: Modular content creation and reuse

### 3. Conditional Processing
- **Props**: Control content visibility based on conditions
- **Filtering**: Show/hide content based on audience, platform, etc.
- **Profiling**: Customize output for different user groups

### 4. Version Control Integration
- **Git-based**: Track changes and manage versions
- **Branch Management**: Handle multiple content versions
- **Collaborative Workflow**: Support team-based authoring

### 5. Publishing Features
- **Multiple Formats**: HTML, PDF, and other outputs
- **Customizable Styling**: Control the look and feel
- **Metadata-driven**: Dynamic content organization

## File Extensions

Our CMS supports the following DITA-related file extensions:

| Extension | Description | Use Case |
|-----------|-------------|----------|
| `.ditamap` | DITA map files | Content organization and structure |
| `.dita` | DITA XML files | Complex, structured content |
| `.mdita` | Markdown DITA files | Simple, readable content |
| `.md` | Raw Markdown files | Simple, readable and widely supported format |
| `.xml` | Standard XML files | Supporting content and data |

## Getting Started

To begin working with DITA in Hex21 CMS:

1. Review the [File Types and Structure](file-types.mdita) documentation
2. Explore our [Templates and Examples](templates/index.mdita)
3. Learn about [Content Reuse Features](content-reuse.mdita)
4. Understand [Conditional Processing](conditional-processing.mdita)

## Best Practices

1. **Start Simple**
   - Begin with MDITA for basic content
   - Graduate to XDITA as needs grow

2. **Plan for Reuse**
   - Design topics to be modular
   - Use conrefs for shared content
   - Implement keyrefs for variables

3. **Use Metadata**
   - Add descriptive frontmatter
   - Tag content appropriately
   - Consider conditional processing needs

4. **Follow Standards**
   - Adhere to DITA best practices
   - Use consistent formatting
   - Document your approach

## Support and Resources

- [DITA Templates](templates/index.mdita)
- [Content Reuse Guide](content-reuse.mdita)
- [Version Control Guide](version-control.mdita)
- [Planned Improvements](roadmap.mdita)

For additional help, consult our [Getting Started Guide](/docs/getting-started) or contact the Hex21 team. 