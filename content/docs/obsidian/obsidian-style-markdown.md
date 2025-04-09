---
title: Obsidian-flavored Markdown Support
author: Dr. Hex
date: 2024-04-02
publish: true
audience: content-author
tags: [documentation, markdown, obsidian]
---

# Obsidian-flavored Markdown

> A key feature of our CMS is its ability to seamlessly integrate with well known `.md` file editors such as [Obsidian](https://obsidian.md/). Along with Vercel and GitHub actions, this allows for one the smoothest web publishing experiences avaliable! 

The following guide explains the available syntax and features, specific to Obsidian.

## Basic Text Formatting

### Emphasis and Highlighting
- **Bold**: Wrap text in double asterisks: `**bold text**`
- *Italic*: Use single asterisks: `*italic text*`
- ***Bold and Italic***: Combine both: `***bold and italic***`
- ==Highlighted Text==: Use double equals: `==highlighted text==`
- ~~Strikethrough~~: Use double tildes: `~~strikethrough~~`

## Wikilinks

Obsidian's distinctive feature is the ability to create links between notes using double-bracket syntax, known as "wikilinks".

### Basic Wikilinks

To create a link to another page in your vault, simply wrap the page name in double brackets:

```markdown
[[page-name]]
```

This creates a link to the page named "page-name". 

Example: This is a link to the [[installation]] page.

### Wikilinks with Custom Text

You can specify custom display text by using the pipe character:

```markdown
[[page-name|Custom Display Text]]He
```

Example: Check out our [[configuration|configuration guide]].

### External Links

You can use the same syntax to link to external URLs:

```markdown
[[https://example.com|Visit Example]]
```

Example: Visit our [[https://hex21.org|main website]].

## Image Embeds

Obsidian allows embedding images directly in your documents using the exclamation point followed by wikilink syntax.

### Basic Image Embeds

To embed an image, use this syntax:

```markdown
![[image-name.png]]
```

Example: 

![[cat-band-1.png]]

### Image Embeds with Alt Text

You can provide alternative text for accessibility using the pipe character:

```markdown
![[image-name.png|Alternative text description]]
```

Example:

![[cat-band-1.png|Cats playing in a band]]

### Headings
Use 1-6 hash symbols for different heading levels:
```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4// Extract and protect fenced code blocks
html = html.replace(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g, (match) => {
  const id = `__CODE_BLOCK_${codeBlocks.length}__`;
  codeBlocks.push(match);
  return id;
});

// Then protect inline code blocks separately
html = html.replace(/(<code[^>]*>[\s\S]*?<\/code>)/g, (match) => {
  const id = `__CODE_BLOCK_${codeBlocks.length}__`;
  codeBlocks.push(match);
  return id;
});
##### Heading 5
###### Heading 6
```

## Wikilinks

A powerful feature of Obsidian is the ability to link between documents using wikilinks:

### Basic Wikilinks
Use double square brackets to link to another document:
```markdown
[[another-document]]
```

This creates a link to `another-document.md` in your content folder.

### Wikilinks with Custom Text
You can customize the display text by adding a pipe character:
```markdown
[[another-document|Custom Link Text]]
```

### Linking to External Resources
Wikilinks also work for external URLs by adding the full URL:
```markdown
[[https://example.com|Visit Example]]
```

## Image Embeds

Obsidian supports embedding images using a special syntax:

### Basic Image Embed
Use an exclamation mark before the wikilink syntax to embed an image:
```markdown
![[cat-band-1.png]]
```

This will embed the image `cat-band-1.png` from your assets folder.

### Image Embed with Alt Text
Add alt text using the pipe character:
```markdown
![[cat-band-1.png|A band of musical cats]]
```

### Image Embed with Attributes
You can add attributes like width and height:
```markdown
![[cat-band-1.png|A band of musical cats|width=100]]
```

Here's an example of the cat band image embedded in this document:

![[cat-band-1.png|Cat band playing musical instruments|width=100]]

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

## Callout Blocks

Callouts—sometimes referred to as **admonitions**—are a special type of blockquote that are visually distinguished with colors and icons. They're great for highlighting important information, warnings, or notes.

### Basic Syntax

Callouts use the following syntax:

```markdown
> [!note] Optional Title
> Content of the callout
```

The callout type determines the styling and icon of the callout. Below are examples of all supported callout types.

### Callout Examples

> [!note] Note
> Important information that isn't critical.

Syntax:
```markdown
> [!note] Note
> Important information that isn't critical.
```

> [!abstract] Abstract/Summary
> Brief summary of a complex topic.

Syntax:
```markdown
> [!abstract] Abstract/Summary
> Brief summary of a complex topic.
```

> [!info] Information
> Additional information that may be helpful.

Syntax:
```markdown
> [!info] Information
> Additional information that may be helpful.
```

> [!tip] Pro Tip
> A helpful piece of advice.

Syntax:
```markdown
> [!tip] Pro Tip
> A helpful piece of advice.
```

> [!success] Success
> A task that has been completed successfully.

Syntax:
```markdown
> [!success] Success
> A task that has been completed successfully.
```

> [!question] Frequently Asked Question
> Questions that may need answers or clarification.

Syntax:
```markdown
> [!question] Frequently Asked Question
> Questions that may need answers or clarification.
```

> [!warning] Caution
> Warning that users should be careful about something.

Syntax:
```markdown
> [!warning] Caution
> Warning that users should be careful about something.
```

> [!failure] Failed Task
> A task that failed or is incomplete.

Syntax:
```markdown
> [!failure] Failed Task
> A task that failed or is incomplete.
```

> [!danger] Critical Warning
> Critical information about dangerous actions or significant risks.

Syntax:
```markdown
> [!danger] Critical Warning
> Critical information about dangerous actions or significant risks.
```

> [!bug] Known Issue
> Report of a known bug or issue.

Syntax:
```markdown
> [!bug] Known Issue
> Report of a known bug or issue.
```

> [!example] Code Example
> An example demonstrating a concept or technique.

Syntax:
```markdown
> [!example] Code Example
> An example demonstrating a concept or technique.
```

> [!quote] Famous Quote
> "The best way to predict the future is to invent it." - Alan Kay

Syntax:
```markdown
> [!quote] Famous Quote
> "The best way to predict the future is to invent it." - Alan Kay
```

### Callout with Rich Content

> [!tip] Advanced Formatting
> You can include **bold text**, *italics*, or `code` within callouts.
> 
> - Lists work too
> - Another item
> 
> ```python
> # Even code blocks work!
> def hello_world():
>     print("Hello from a callout")
> ```

Syntax:
```markdown
> [!tip] Advanced Formatting
> You can include **bold text**, *italics*, or `code` within callouts.
> 
> - Lists work too
> - Another item
> 
> ```python
> # Even code blocks work!
> def hello_world():
>     print("Hello from a callout")
> ```
```

> [!disclaimer] Legal Disclaimer
> The content provided is for informational purposes only and does not constitute legal advice.

Syntax:
```markdown
> [!disclaimer] Legal Disclaimer
> The content provided is for informational purposes only and does not constitute legal advice.
```

## Related Documentation

- [[dita-integration|DITA Integration Guide]]
- [[content-authoring|Content Authoring Guide]]
- [[metadata-guide|Metadata and Frontmatter Guide]] 