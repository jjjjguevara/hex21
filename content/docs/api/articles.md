---
title: Articles API
author: Hex21 API Team
date: 2024-04-01
tags: [documentation, api, reference, articles, crud]
description: API endpoints for managing articles (maps and associated topics).
id: api-articles
---

# Articles API

The Articles API provides access to article content and metadata in the Hex21 CMS.

## List Articles

Retrieve a paginated list of articles.

```http
GET /api/articles
```

### Query Parameters

| Parameter | Type    | Description                                      |
|-----------|---------|--------------------------------------------------|
| page      | integer | Page number (default: 1)                         |
| limit     | integer | Articles per page (default: 10, max: 100)        |
| category  | string  | Filter by category                               |
| tag       | string  | Filter by tag                                    |
| author    | string  | Filter by author                                 |
| published | boolean | Filter by publication status (default: true)      |

### Response

```json
{
  "data": [
    {
      "slug": "quantum-mechanics-intro",
      "title": "Introduction to Quantum Mechanics",
      "description": "A beginner's guide to quantum mechanics",
      "author": "Dr. Jane Smith",
      "date": "2024-03-21T00:00:00Z",
      "category": "Physics",
      "tags": ["quantum", "physics", "introduction"],
      "audience": "beginner",
      "access_level": "public"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

## Get Article

Retrieve a specific article by its slug.

```http
GET /api/articles/{slug}
```

### Path Parameters

| Parameter | Type   | Description                    |
|-----------|--------|--------------------------------|
| slug      | string | The unique slug of the article |

### Response

```json
{
  "data": {
    "slug": "quantum-mechanics-intro",
    "title": "Introduction to Quantum Mechanics",
    "description": "A beginner's guide to quantum mechanics",
    "author": "Dr. Jane Smith",
    "date": "2024-03-21T00:00:00Z",
    "category": "Physics",
    "tags": ["quantum", "physics", "introduction"],
    "audience": "beginner",
    "access_level": "public",
    "content": "# Introduction\n\nQuantum mechanics is...",
    "topics": [
      {
        "slug": "wave-particle-duality",
        "title": "Wave-Particle Duality"
      }
    ]
  }
}
```

## List Categories

Retrieve all available article categories.

```http
GET /api/categories
```

### Response

```json
{
  "data": [
    {
      "name": "Physics",
      "slug": "physics",
      "description": "Physics articles and topics",
      "article_count": 25
    }
  ]
}
```

## Error Responses

### Article Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Article with slug 'invalid-slug' not found"
  }
}
```

### Invalid Parameters

```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid page number: must be greater than 0"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { Hex21Client } from '@hex21/sdk';

const client = new Hex21Client('your-api-key');

// List articles
const articles = await client.articles.list({
  page: 1,
  limit: 10,
  category: 'Physics'
});

// Get article by slug
const article = await client.articles.get('quantum-mechanics-intro');
```

### Python

```python
from hex21 import Hex21Client

client = Hex21Client('your-api-key')

# List articles
articles = client.articles.list(
    page=1,
    limit=10,
    category='Physics'
)

# Get article by slug
article = client.articles.get('quantum-mechanics-intro')
``` 