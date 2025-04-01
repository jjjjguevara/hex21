# Article Creation Guide

## Overview

Articles in our CMS are composed of multiple DITA topics organized by a DITA map. This structure allows for collaborative authoring while maintaining strict metadata control and content organization.

## File Structure

```
content/
├── maps/
│   └── your-article.ditamap
└── topics/
    ├── topic1.mdita
    ├── topic2.mdita
    └── topic3.mdita
```

## Creating Topics

Topics are individual markdown files (`.mdita`) that contain a section of your article. Each topic should have its own metadata.

### Topic Metadata Structure

```yaml
---
id: unique-topic-id
title: Topic Title
author: Author Name
audience: beginner|intermediate|expert|Undergraduate Students
category: Physics|Acoustics|Philosophy|etc
conditional:
  access_level: public|restricted|classified
tags:
  - tag1
  - tag2
---

# Your Content Here
```

### Topic Guidelines

1. Each topic must have a unique `id`
2. Topics can have their own audience level and access level
3. Topics cannot override map-level metadata
4. Use markdown for content with LaTeX support: `$E=mc^2$`

## Creating Maps (Articles)

Maps are DITA files (`.ditamap`) that organize topics into a complete article.

### Map Metadata Structure

```yaml
---
id: unique-map-id
title: Article Title
author: Primary Author
category: Physics|Acoustics|Philosophy|etc
audience: beginner|intermediate|expert|Undergraduate Students
publish: true
access_level: public|restricted|classified
publish_date: 2024-03-31
topics:
  - topic1-id
  - topic2-id
  - topic3-id
tags:
  - tag1
  - tag2
---

# Your Map Content Here
```

### Map Guidelines

1. Maps control the final publication status with `publish: true|false`
2. Maps must specify a category
3. Maps define the base access level - topics cannot exceed this
4. Future `publish_date` will prevent the article from appearing until that date
5. Topics must be listed in the `topics` array using their IDs

## Metadata Hierarchy

The system follows these rules for metadata resolution:

1. Map metadata takes precedence over topic metadata
2. Topics cannot override map-level settings
3. Access levels follow a hierarchy: public → restricted → classified
4. Audience levels follow a hierarchy: beginner → intermediate → expert → Undergraduate Students

## Content Classification

If a topic's metadata conflicts with the map's metadata, the following occurs:

1. The topic is replaced with a [CONTENT CLASSIFIED] marker
2. The rest of the article renders normally
3. Higher access levels can view all content
4. Lower access levels see only compatible content

## Categories

Current supported categories:
- Physics
- Acoustics
- Philosophy
- Ontology
- Mathematics

To add a new category, please contact the system administrator.

## Example Article

### Map File (article.ditamap)
```yaml
---
id: sound-physics
title: Introduction to Sound Physics
author: Dr. Mary Jones
category: Physics
audience: Undergraduate Students
publish: true
access_level: public
topics:
  - intro-sound
  - wave-properties
  - frequency-analysis
tags:
  - physics
  - sound
  - waves
---

This article introduces the fundamental concepts of sound physics.
```

### Topic File (intro-sound.mdita)
```yaml
---
id: intro-sound
title: Introduction to Sound
author: Dr. Mary Jones
audience: beginner
conditional:
  access_level: public
---

# Introduction to Sound

Sound is a form of energy that travels through matter as waves...
```

## Best Practices

1. Use clear, unique IDs for topics and maps
2. Keep topics focused and single-purpose
3. Use appropriate audience levels
4. Set access levels appropriately
5. Test your content with different access levels
6. Use LaTeX for mathematical equations
7. Include relevant tags for better searchability 