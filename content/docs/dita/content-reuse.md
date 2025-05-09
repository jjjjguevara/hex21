---
title: Content Reuse Strategies
author: Hex21 DITA Team
date: 2024-04-01
tags: [documentation, guide, dita, content-reuse, conref, keyref]
description: Techniques for reusing content effectively using DITA features.
id: dita-content-reuse
---

# Content Reuse Features

Hex21 CMS provides powerful content reuse capabilities through DITA's content reference mechanisms. This document explains how to use conrefs, keyrefs, and variables effectively in your content.

## Content References (Conrefs)

Content references allow you to reuse content fragments across multiple documents. This is particularly useful for maintaining consistent terminology, definitions, or shared content blocks.

### Basic Conref Syntax

In DITA XML:
```xml
<p conref="shared/definitions.dita#definitions/quantum_tunneling"/>
```

In MDITA (using special processing instructions):
```markdown
<?conref path="shared/definitions.dita" fragment="quantum_tunneling"?>
```

### Creating Reusable Content

1. Create a source file (`shared/definitions.dita`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="definitions">
  <title>Shared Definitions</title>
  <body>
    <p id="quantum_tunneling">Quantum tunneling is a quantum mechanical phenomenon 
    where a particle passes through a potential barrier that it classically 
    could not surmount.</p>
  </body>
</topic>
```

2. Reference the content in your topics:
```markdown
## Quantum Phenomena

<?conref path="shared/definitions.dita" fragment="quantum_tunneling"?>

This phenomenon has important applications in...
```

## Key References (Keyrefs)

Keys provide a level of indirection for references, making it easier to manage links and content references across your documentation.

### Defining Keys

In your DITA map:
```xml
<map>
  <title>Physics Documentation</title>
  <keydef keys="quantum_def" href="shared/definitions.dita#definitions/quantum_tunneling"/>
  <keydef keys="author_info" href="shared/authors.dita#authors/einstein"/>
</map>
```

### Using Keys

In DITA XML:
```xml
<p keyref="quantum_def"/>
<p>Written by <ph keyref="author_info"/></p>
```

In MDITA:
```markdown
<?keyref key="quantum_def"?>

Written by <?keyref key="author_info"?>
```

## Variables

Variables allow you to define reusable text that might change over time, such as product names, versions, or contact information.

### Defining Variables

Create a variables file (`shared/variables.xml`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<variables>
  <product-name>Hex21 CMS</product-name>
  <version>1.0</version>
  <release-date>2024-04-01</release-date>
  <support-email>support@hex21.com</support-email>
</variables>
```

### Using Variables

In DITA XML:
```xml
<p>Welcome to <ph conref="shared/variables.xml#variables/product-name"/> 
version <ph conref="shared/variables.xml#variables/version"/>.</p>
```

In MDITA:
```markdown
Welcome to <?conref path="shared/variables.xml" fragment="product-name"?> 
version <?conref path="shared/variables.xml" fragment="version"?>.
```

## Best Practices

1. **Organize Reusable Content**
   - Keep shared content in a dedicated directory
   - Use meaningful file and ID names
   - Document the purpose of shared content

2. **Manage Dependencies**
   - Track which topics use which shared content
   - Update all affected topics when changing shared content
   - Version control shared content carefully

3. **Use Keys for Flexibility**
   - Prefer keys over direct references when possible
   - Define keys at the map level
   - Document key definitions

4. **Handle Variables Efficiently**
   - Centralize variable definitions
   - Use consistent naming conventions
   - Keep variable values up to date

## Common Patterns

### 1. Shared Definitions
```xml
<topic id="shared_defs">
  <title>Shared Definitions</title>
  <body>
    <dl>
      <dlentry id="def1">
        <dt>Term 1</dt>
        <dd>Definition 1</dd>
      </dlentry>
    </dl>
  </body>
</topic>
```

### 2. Author Information
```xml
<topic id="authors">
  <title>Author Information</title>
  <body>
    <ul>
      <li id="author1">
        <p>Dr. Jane Doe, PhD in Physics</p>
      </li>
    </ul>
  </body>
</topic>
```

### 3. Product Information
```xml
<topic id="product_info">
  <title>Product Information</title>
  <body>
    <p id="version_info">Version 1.0 (April 2024)</p>
    <p id="support_info">Contact support@hex21.com for assistance</p>
  </body>
</topic>
```

## Troubleshooting

1. **Missing References**
   - Verify file paths are correct
   - Check ID values exist in source files
   - Ensure proper DTD declarations

2. **Circular References**
   - Avoid conrefs that reference each other
   - Document content dependencies
   - Use tools to detect circular references

3. **Version Conflicts**
   - Track shared content versions
   - Update all references when changing shared content
   - Use source control to manage changes

## Next Steps

- Learn about [Conditional Processing](conditional-processing.mdita)
- Explore [Templates and Examples](templates/index.mdita)
- Review [Version Control](version-control.mdita) practices 