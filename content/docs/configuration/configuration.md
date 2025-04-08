---
title: CMS Configuration
author: Hex21 Config Team
date: 2024-04-01
tags: [documentation, guide, configuration, settings]
description: Guide to configuring various aspects of the Hex21 CMS.
id: configuration-guide
---

# CMS Configuration

Learn how to configure Hex 21 CMS to match your specific requirements and workflow.

## Basic Configuration

The main configuration file is `config.yaml` in the root directory. Here you can set:

- Site metadata (title, description)
- Content directories
- Build output paths
- DITA-OT settings

## Content Settings

Configure how your content is processed:

```yaml
content:
  sources:
    - path: content/articles
      type: mdita
    - path: content/docs
      type: mdita
  output:
    path: .dita-build-output
    formats:
      - html5
      - pdf
```

## Authentication

Set up authentication providers:

```yaml
auth:
  providers:
    - github
    - google
  roles:
    - admin
    - editor
    - viewer
```

## LaTeX Configuration

Configure MathJax settings for LaTeX rendering:

```yaml
latex:
  engine: mathjax
  options:
    inlineMath:
      - ['$', '$']
      - ['\\(', '\\)']
    displayMath:
      - ['$$', '$$']
      - ['\\[', '\\]']
```

## Search Configuration

Set up the search functionality:

```yaml
search:
  engine: lunr
  fields:
    - title
    - content
    - tags
  language: en
``` 