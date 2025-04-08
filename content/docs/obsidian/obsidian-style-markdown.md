---
title: Obsidian-Style Markdown Support
author: Dr. Hex
date: 2024-04-02
publish: true
audience: content-author
tags: [documentation, markdown, obsidian]
---

# Obsidian-Style Markdown Support

Our CMS supports an extended version of Markdown that includes many features found in Obsidian. This guide explains the available syntax and features.

## Basic Text Formatting

### Emphasis and Highlighting
- **Bold**: Wrap text in double asterisks: `**bold text**`
- *Italic*: Use single asterisks: `*italic text*`
- ***Bold and Italic***: Combine both: `***bold and italic***`
- ==Highlighted Text==: Use double equals: `==highlighted text==`
- ~~Strikethrough~~: Use double tildes: `~~strikethrough~~`

### Headings
Use 1-6 hash symbols for different heading levels:
```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

## Lists

### Unordered Lists
Use `-`, `+`, or `*` for bullet points:
```markdown
- First item
+ Second item
* Third item
  - Nested item
```

### Ordered Lists
Use numbers followed by periods:
```markdown
1. First item
2. Second item
   1. Nested item
   2. Another nested item
```

### Task Lists
Create checkboxes using `- [ ]` for unchecked and `- [x]` for checked items:
```markdown
- [ ] Unchecked task
- [x] Completed task
  - [ ] Nested task
```

## Links and References

### External Links
Use standard Markdown link syntax:
```markdown
[Link text](https://example.com)
```

### Internal Links (Wikilinks)
Use double square brackets for internal links:
- Basic: `[[Page Name]]`
- With alias: `[[Page Name|Display Text]]`

### Embedded Content
Use exclamation mark with wikilinks to embed content:
```markdown
![[Note Title]]
![[Note Title#Section Heading]]
```

## Footnotes

### Standard Footnotes
Create numbered footnotes:
```markdown
Here's a sentence with a footnote[^1].

[^1]: This is the footnote text.
```

### Inline Footnotes
Create quick footnotes inline:
```markdown
Here's a sentence with an inline footnote^[This appears at the bottom].
```

## Tables
Create tables using pipes and dashes:
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

## Code Blocks

### Inline Code
Use single backticks for `inline code`.

### Fenced Code Blocks
Use triple backticks with optional language specification:
````markdown
```python
def hello():
    print("Hello, world!")
```
````

## Mathematical Expressions

### Inline Math
Use single dollar signs for inline equations:
```markdown
$E = mc^2$
```

### Block Math
Use double dollar signs for block equations:
```markdown
$$
\frac{d}{dx}e^x = e^x
$$
```

## Quotes
Create blockquotes using `>`:
```markdown
> This is a quote
>> This is a nested quote
```

## Horizontal Rules
Create horizontal rules using three or more dashes:
```markdown
---
```

## HTML Support
Limited HTML is supported for advanced formatting:
```html
<details>
<summary>Click to expand</summary>
This content is collapsible!
</details>
```

## Special Considerations

### DITA Integration
Our Obsidian-style markdown is designed to work seamlessly with DITA:
- Wikilinks are resolved to appropriate DITA references
- Embedded content is handled through DITA content references
- Metadata in YAML frontmatter is converted to DITA metadata

### Path Resolution
- Relative paths in wikilinks are resolved based on the current document's location
- Links to nonexistent pages are highlighted in the UI
- External links are validated during build

### Footnote Handling
- Footnotes are automatically numbered
- Both reference and footnote text are clickable
- Inline footnotes are converted to regular footnotes during processing

## Examples

For practical examples of these features in action, see:
- [[math-example|Mathematical Expressions Example]]
- [[features-example|Advanced Features Example]]

## Best Practices

1. Use YAML frontmatter for metadata
2. Keep wikilinks relative when possible
3. Use meaningful link aliases
4. Include language specifiers in code blocks
5. Test embedded content references

## Related Documentation

- [[dita-integration|DITA Integration Guide]]
- [[content-authoring|Content Authoring Guide]]
- [[metadata-guide|Metadata and Frontmatter Guide]] 