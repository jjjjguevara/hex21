---
title: Metadata Guidelines
author: Hex21 CMS Team
date: 2024-04-01
tags: [documentation, guide, metadata, dita]
description: Detailed guidelines for using YAML frontmatter metadata in Hex21 CMS topics and maps.
id: metadata-guidelines
---

# Metadata Guidelines for Content

This guide explains how to use metadata in your DITA maps and topics to control content visibility and organization in the CMS.

## Currently Implemented Metadata Fields

These fields are fully supported and functional in the current version of the CMS:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| title | string | Yes | The title of the content | "The Physics of Sound" |
| slug | string | Yes | URL-friendly identifier | "physics-of-sound" |
| features.featured | boolean | No | Shows content in featured section | true |
| publish | boolean | Yes | Controls content visibility | true |
| date | string | No | Publication date (YYYY-MM-DD) | "2024-11-30" |
| lastEdited | string | No | Last modification date | "2024-12-04T15:45:00" |
| categories | string[] | No | Content categories | ["Physics", "Acoustics"] |
| authors | Author[] | No | Content authors with optional conref | [{ "conref": "shared-authors.dita#professors/mary-jones" }] |
| editor | string | No | Content editor | "Dr. Hex" |
| reviewer | string | No | Content reviewer | "Prof. Poly" |
| keywords | string[] | No | Search keywords | ["sound waves", "frequency"] |
| audience | string[] | No | Target audience | ["Undergraduate Students"] |
| language | string | No | Content language code | "en-US" |
| version | string | No | Content version | "1.2" |

## Pending Implementation

These fields are defined in our content but not yet implemented in the CMS:

| Field | Type | Priority | Description | Example |
|-------|------|----------|-------------|---------|
| content-type | string | High | Type of content | "learning-material" |
| media | object | High | Associated media files | { "pdf-download": "file.pdf" } |
| accessibility-compliant | string | Medium | Accessibility standard | "WCAG 2.1 AA" |
| delivery | object | Medium | Delivery channels | { "channel-web": true } |
| analytics | object | Low | Analytics settings | { "engagement-tracking": "enabled" } |
| revision-history | string | Low | Change log | "2024-11-28: Initial draft" |
| region | string | Low | Geographic region | "Global" |

## Example DITA Map with Required Fields

```yaml
---
title: "Your Article Title"
slug: your-article-slug
publish: true
features:
  featured: true  # Required for featured section visibility
categories:
  - Category One
  - Category Two
authors:
  - conref: shared-authors.dita#professors/author-name
date: "2024-04-01"
---
```

## Content Visibility Rules

1. **Articles Index (`/articles`)**
   - Requires: `publish: true`
   - Shows: title, categories, authors, date

2. **Featured Section (`/featured`)**
   - Requires: `publish: true` AND `features.featured: true`
   - Shows: title, categories, authors, date

3. **Search Results**
   - Indexes: title, keywords, categories, content
   - Only includes: `publish: true` content

## Best Practices

1. **Dates and Times**
   - Use ISO 8601 format for dates: `YYYY-MM-DD`
   - Use ISO 8601 format for timestamps: `YYYY-MM-DDThh:mm:ss`

2. **Categories and Keywords**
   - Use consistent casing (preferably Title Case for categories)
   - Keep keywords lowercase for better search matching

3. **Authors and Contributors**
   - Use conrefs for consistent author information
   - Store author details in `shared-authors.dita`

## Future Enhancements

We plan to implement these features in upcoming releases:

1. **Access Control**
   - Subscription-based content visibility
   - Role-based access control
   - Geographic region restrictions

2. **Media Management**
   - Automated PDF generation
   - Interactive media embedding
   - Video transcoding and hosting

3. **Analytics Integration**
   - Content engagement tracking
   - User behavior analysis
   - A/B testing support

# Metadata Guidelines

Proper metadata management is crucial for organizing and discovering content in Hex 21 CMS. This guide explains how to use metadata effectively in your DITA content.

## YAML Frontmatter

Every MDITA file should include YAML frontmatter at the beginning:

```yaml
---
title: My Article Title
description: A brief description of the article
author: John Doe
date: 2024-04-01
tags: [science, physics, quantum]
category: research
status: draft
---
```

## Required Metadata Fields

### Title
- Must be descriptive and unique
- Keep it under 60 characters
- Use title case

### Description
- Summarize the content in 2-3 sentences
- Include key terms for searchability
- Keep it under 160 characters

### Author
- Use full name
- Include organizational affiliation
- Add ORCID if available

## Optional Metadata

### Tags
- Use lowercase
- Separate multiple words with hyphens
- Choose from the controlled vocabulary
- Maximum 5 tags per document

### Category
- Choose one primary category
- Must match the taxonomy structure
- Examples: research, tutorial, reference

### Status
- Valid values: draft, review, published
- Affects content visibility
- Controls workflow transitions

## Taxonomy Integration

Your metadata should align with our taxonomy:

```yaml
category: research
subcategory: physics
domain: quantum-mechanics
```

## Best Practices

1. **Consistency**
   - Follow naming conventions
   - Use controlled vocabularies
   - Maintain standard formats

2. **Completeness**
   - Fill all required fields
   - Add optional fields when relevant
   - Update metadata when content changes

3. **Quality Control**
   - Validate metadata before publishing
   - Check for spelling errors
   - Ensure proper formatting

## Schema Validation

Hex 21 CMS validates metadata against JSON Schema:

```json
{
  "type": "object",
  "required": ["title", "description", "author"],
  "properties": {
    "title": {
      "type": "string",
      "maxLength": 60
    },
    "description": {
      "type": "string",
      "maxLength": 160
    }
  }
}
```

## Next Steps

- [Explore DITA maps](./dita-maps)
- [Learn about content validation](./validation)
- [View publishing workflows](./workflows) 