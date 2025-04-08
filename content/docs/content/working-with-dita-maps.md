---
title: Working with DITA Maps
description: Learn how to create and manage DITA maps in Hex 21 CMS.
author: Hex21 CMS Team
date: 2024-04-01
tags: [documentation, guide, dita, maps, content-organization]
id: working-with-dita-maps
---

# Working with DITA Maps

DITA maps are the backbone of content organization in Hex 21 CMS. They help you structure your documentation and manage relationships between topics.

## Understanding DITA Maps

A DITA map is typically an XML document (or a Markdown file with YAML frontmatter in our system) that organizes topics into a hierarchy. It defines:
- The structure of your documentation
- Relationships between topics (via hierarchy or relationship tables)
- Navigation sequence
- Content reuse patterns (using keys)

## Creating a DITA Map (Markdown Format)

1. Create a new file with the `.ditamap` extension in the appropriate directory.
2. Add YAML frontmatter to define map metadata (title, id, author, etc.).
3. Use a Markdown list to define the structure, referencing topics using wiki links:

```markdown
---
title: My Documentation Map
id: my-doc-map
author: Your Name
---

# My Documentation Map

- [[introduction.md|Introduction]]
- Concepts
  - [[concept1.md]]
  - [[concept2.md|A Better Title for Concept 2]]
- Tasks
  - [[task1.md]]
```

## Creating a DITA Map (XML Format - For Reference)

While we primarily use Markdown maps, understanding the traditional XML format is helpful:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
    <title>My Documentation</title>
    <topicref href="introduction.dita"/>
    <topicref href="concepts.dita"/>
    <topicref href="tasks.dita"/>
</map>
```

## Best Practices

- Use meaningful, unique IDs for maps and topics.
- Keep the hierarchy relatively shallow (3-4 levels suggested).
- Use descriptive titles in the YAML frontmatter or wiki link aliases.
- Leverage relationship tables (in XML maps) or specific topic links for cross-references.
- Implement consistent naming conventions for files and IDs.

## Advanced Features (XML DITA)

These features are standard in XML DITA and may have equivalents or workarounds in our Markdown/conversion process:

### Relationship Tables
Used to define non-hierarchical links between topics.
```xml
<reltable>
    <relrow>
        <relcell>
            <topicref href="concept.dita"/>
        </relcell>
        <relcell>
            <topicref href="task.dita"/>
        </relcell>
    </relrow>
</reltable>
```

### Keys and Key References (`keydef`, `keyref`)
Powerful mechanism for indirect addressing and content reuse.
```xml
<map>
    <title>Using Keys</title>
    <keydef keys="product-name" format="text">Hex 21 CMS</keydef>
    <keydef keys="install-guide" href="installation.dita"/>
    <topicref href="topic-using-keys.dita"/>
    <!-- In topic-using-keys.dita, you might have <ph keyref="product-name"/> -->
    <!-- or <xref keyref="install-guide"/> -->
</map>
```

## Next Steps

- Review the [[metadata-guidelines.md|Metadata Guidelines]]
- Explore [[../dita/content-reuse.md|Content Reuse Techniques]]
- Learn about publishing options (Link TBD)
