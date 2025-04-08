---
title: Conditional Processing
author: Hex21 DITA Team
date: 2024-04-01
tags: [documentation, guide, dita, conditional-processing, filtering, profiling]
description: Using DITA attributes for conditional processing and content filtering.
id: dita-conditional-processing
---

# Conditional Processing

Hex21 CMS supports DITA's conditional processing features, allowing you to create content that can be filtered or styled differently based on various conditions. This is particularly useful for creating documentation that targets different audiences, platforms, or regions.

## Understanding Props and Filtering

### Basic Props

Props are attributes that mark content for conditional processing. Common props include:

- `audience`
- `platform`
- `product`
- `otherprops`
- `props` (custom properties)

### Using Props in DITA XML

```xml
<p audience="expert">This content is for expert users only.</p>
<note platform="windows">This note applies to Windows systems.</note>
<section product="premium">Premium feature documentation.</section>
```

### Using Props in MDITA

```markdown
<?props audience="expert"?>
This content is for expert users only.
<?end-props?>

<?props platform="windows"?>
This note applies to Windows systems.
<?end-props?>
```

## Filtering Mechanisms

### 1. DITAVAL Files

Create a DITAVAL file to specify which content to include or exclude:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<val>
  <prop att="audience" val="expert" action="include"/>
  <prop att="audience" val="beginner" action="exclude"/>
  <prop att="platform" val="windows" action="include"/>
  <prop att="platform" val="linux" action="exclude"/>
</val>
```

### 2. Metadata-Based Filtering

Use metadata in your DITA map or topics to control content visibility:

```xml
<topicref href="advanced-topic.dita">
  <topicmeta>
    <audience type="expert"/>
    <prodinfo>
      <prodname>Premium Edition</prodname>
    </prodinfo>
  </topicmeta>
</topicref>
```

## Profiling

Profiling allows you to customize how conditionally processed content appears in the output.

### Style-Based Profiling

```xml
<val>
  <prop att="audience" val="expert" style="color: blue;"/>
  <prop att="status" val="draft" style="background-color: yellow;"/>
</val>
```

### Flag-Based Profiling

```xml
<val>
  <prop att="platform" val="windows" flag="images/windows-icon.png"/>
  <prop att="platform" val="linux" flag="images/linux-icon.png"/>
</val>
```

## Implementation in Hex21 CMS

### 1. Configuration

Set up conditional processing in your project:

1. Create a `.ditaval` file in your project:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<val>
  <!-- Audience settings -->
  <prop att="audience">
    <startflag><alt-text>Expert: </alt-text></startflag>
  </prop>
  
  <!-- Platform settings -->
  <prop att="platform" val="windows" action="include"/>
  <prop att="platform" val="linux" action="include"/>
  <prop att="platform" val="mac" action="include"/>
  
  <!-- Product settings -->
  <prop att="product" val="basic" action="exclude"/>
  <prop att="product" val="premium" action="include"/>
</val>
```

2. Reference the DITAVAL file in your build configuration:
```json
{
  "ditaOptions": {
    "filter": "path/to/your.ditaval"
  }
}
```

### 2. Using Props in Content

In your DITA topics:

```xml
<topic id="installation">
  <title>Installation Guide</title>
  <body>
    <section platform="windows">
      <title>Windows Installation</title>
      <p>Windows-specific instructions...</p>
    </section>
    
    <section platform="linux">
      <title>Linux Installation</title>
      <p>Linux-specific instructions...</p>
    </section>
    
    <note audience="expert">
      Advanced configuration options...
    </note>
  </body>
</topic>
```

In your MDITA topics:

```markdown
# Installation Guide

<?props platform="windows"?>
## Windows Installation

Windows-specific instructions...
<?end-props?>

<?props platform="linux"?>
## Linux Installation

Linux-specific instructions...
<?end-props?>

<?props audience="expert"?>
> **Note**: Advanced configuration options...
<?end-props?>
```

## Best Practices

1. **Plan Your Conditions**
   - Define clear conditions upfront
   - Document condition usage
   - Maintain a consistent naming scheme

2. **Organize Props**
   - Group related conditions
   - Use meaningful values
   - Avoid overlapping conditions

3. **Test Filtering**
   - Verify all combinations
   - Check for missing content
   - Validate output accuracy

4. **Maintain Documentation**
   - Document condition meanings
   - Track condition usage
   - Update DITAVAL files

## Common Use Cases

1. **Audience-Based Content**
```xml
<topic id="feature_doc">
  <title>Feature Documentation</title>
  <body>
    <p audience="beginner">Basic overview...</p>
    <p audience="expert">Advanced details...</p>
  </body>
</topic>
```

2. **Platform-Specific Instructions**
```xml
<steps>
  <step platform="windows">
    <cmd>Click Start...</cmd>
  </step>
  <step platform="mac">
    <cmd>Click Apple menu...</cmd>
  </step>
</steps>
```

3. **Product Edition Features**
```xml
<section product="premium">
  <title>Premium Features</title>
  <p>Available in Premium Edition only...</p>
</section>
```

## Troubleshooting

1. **Content Not Filtering**
   - Check DITAVAL syntax
   - Verify prop values match
   - Confirm build configuration

2. **Unexpected Filtering**
   - Review prop hierarchy
   - Check for conflicting rules
   - Validate condition logic

3. **Missing Content**
   - Verify prop spelling
   - Check action attributes
   - Review build logs

## Next Steps

- Explore [Templates and Examples](templates/index.mdita)
- Learn about [Version Control](version-control.mdita)
- Review [Content Reuse Features](content-reuse.mdita) 