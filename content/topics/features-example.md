---
title: Advanced Markdown Features
author: Dr. Hex
date: 2024-04-02
publish: true
audience: beginner
tags: [markdown, formatting, examples]
---

# Advanced Markdown Features

This document showcases various Obsidian-style markdown features supported in our CMS.

## Text Formatting

You can make text **bold**, *italic*, or ***both***. You can also ==highlight important concepts== or ~~strike through~~ text that's no longer relevant.

## Lists

### Unordered Lists
- First item
- Second item
  - Sub-item A
  - Sub-item B
    - Even deeper
    + Mix and match
    * Different markers

### Ordered Lists
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Task Lists
- [ ] Write documentation
- [x] Create examples
- [ ] Implement parser
  - [x] Basic syntax
  - [ ] Advanced features

## Links and References

### External Links
Visit our [GitHub repository](https://github.com/example/hex21-cms) for more information.

### Internal Links
- See our [[math-example|Mathematical Examples]]
- Reference to [[Nonexistent Page]] (should show as broken link)

### Embedded Content
Here's an embedded section from our math document:
![[math-example#Basic Inline Math]]

## Quotes and Code

> This is a blockquote.
> It can span multiple lines.
>> And can be nested.

Here's some code:

```python
def calculate_factorial(n):
    if n <= 1:
        return 1
    return n * calculate_factorial(n - 1)
```

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Basic Markdown | ✅ | Fully implemented |
| LaTeX | ✅ | See [[math-example]] |
| Wikilinks | 🚧 | In progress |

## Footnotes

Markdown supports several footnote styles. Basic reference footnotes[^3] are the most common.

For technical content, footnotes can provide additional context without interrupting the flow[^4].

You can also use inline footnotes[^5].

Footnotes can be placed anywhere in your document, but are always rendered at the bottom[^6].

[^3]: This is a basic footnote. Simply add a reference and define it elsewhere in the document.

[^4]: When documenting technical concepts, footnotes can provide:
    - Additional background information
    - Links to related resources
    - Technical specifications
    
    Use indentation to include multiple paragraphs in a single footnote.

[^5]: An inline footnote is defined right where it's used, which is convenient for short explanations.

[^6]: Footnote definitions can be placed anywhere in the document. They will be collected and displayed together at the end, regardless of where they appear in the source.

## Horizontal Rule

Above the horizontal rule

---

Below the horizontal rule

## HTML Compatibility

<div class="custom-class">
  Some HTML is supported, but use with caution!
</div>

<details>
<summary>Click to expand</summary>

This content is collapsible!
</details> 