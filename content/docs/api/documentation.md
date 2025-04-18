---
title: Documentation API
author: Hex21 API Team
date: 2024-04-01
tags: [documentation, api, reference, docs, crud]
description: API endpoints for managing general documentation pages (like this one).
id: api-documentation
---

# Documentation API

The Documentation API provides access to documentation content and metadata in the Hex21 CMS.

## List Documentation

Retrieve a paginated list of documentation pages.

```http
GET /api/docs
```

### Query Parameters

| Parameter | Type    | Description                                      |
|-----------|---------|--------------------------------------------------|
| page      | integer | Page number (default: 1)                         |
| limit     | integer | Pages per page (default: 10, max: 100)           |
| category  | string  | Filter by category                               |
| tag       | string  | Filter by tag                                    |
| audience  | string  | Filter by audience level                         |

### Response

```json
{
  "data": [
    {
      "slug": "api-overview",
      "title": "API Overview",
      "description": "Overview of the Hex21 CMS API",
      "author": "Hex21 Team",
      "date": "2024-03-21T00:00:00Z",
      "category": "API",
      "tags": ["api", "overview"],
      "audience": "developer"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

## Get Documentation

Retrieve a specific documentation page by its slug.

```http
GET /api/docs/{slug}
```

### Path Parameters

| Parameter | Type   | Description                             |
|-----------|--------|-----------------------------------------|
| slug      | string | The unique slug of the documentation page |

### Response

```json
{
  "data": {
    "slug": "api-overview",
    "title": "API Overview",
    "description": "Overview of the Hex21 CMS API",
    "author": "Hex21 Team",
    "date": "2024-03-21T00:00:00Z",
    "category": "API",
    "tags": ["api", "overview"],
    "audience": "developer",
    "content": "# API Overview\n\nThe Hex21 CMS API...",
    "sections": [
      {
        "id": "authentication",
        "title": "Authentication",
        "level": 2
      },
      {
        "id": "rate-limiting",
        "title": "Rate Limiting",
        "level": 2
      }
    ]
  }
}
```

## Search Documentation

Search through documentation content.

```http
GET /api/docs/search
```

### Query Parameters

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| q         | string | Search query                               |
| page      | integer| Page number (default: 1)                   |
| limit     | integer| Results per page (default: 10, max: 100)   |

### Response

```json
{
  "data": [
    {
      "slug": "api-overview",
      "title": "API Overview",
      "description": "Overview of the Hex21 CMS API",
      "excerpt": "...The Hex21 CMS API provides programmatic access...",
      "relevance": 0.95
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

## Error Responses

### Documentation Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Documentation page with slug 'invalid-slug' not found"
  }
}
```

### Invalid Search Query

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Search query must be at least 3 characters long"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { Hex21Client } from '@hex21/sdk';

const client = new Hex21Client('your-api-key');

// List documentation
const docs = await client.docs.list({
  page: 1,
  limit: 10,
  category: 'API'
});

// Get documentation by slug
const doc = await client.docs.get('api-overview');

// Search documentation
const results = await client.docs.search({
  q: 'authentication',
  page: 1,
  limit: 10
});
```

### Python

```python
from hex21 import Hex21Client

client = Hex21Client('your-api-key')

# List documentation
docs = client.docs.list(
    page=1,
    limit=10,
    category='API'
)

# Get documentation by slug
doc = client.docs.get('api-overview')

# Search documentation
results = client.docs.search(
    q='authentication',
    page=1,
    limit=10
)
``` 