---
title: DITA and Version Control
author: Hex21 DITA Team
date: 2024-04-01
tags: [documentation, guide, dita, version-control, git, best-practices]
description: Best practices for using DITA with version control systems like Git.
id: dita-version-control
---

# Version Control and Content Management

Hex21 CMS uses Git for version control, providing robust tracking of content changes and enabling collaborative content development. This document explains our version control strategy and content management practices.

## Git Integration

### Repository Structure

```plaintext
hex21/
├── content/
│   ├── maps/          # DITA maps
│   ├── topics/        # Topic files
│   ├── shared/        # Reusable content
│   └── media/         # Images and other media
├── schemas/           # DTD and validation schemas
└── templates/         # Content templates
```

### Branch Strategy

1. **Main Branches**
   - `main`: Production-ready content
   - `staging`: Content under review
   - `development`: Active content development

2. **Feature Branches**
   - `feature/topic-name`: New topics
   - `update/topic-name`: Content updates
   - `fix/topic-name`: Content fixes

3. **Release Branches**
   - `release/v1.x`: Version-specific content
   - `hotfix/v1.x.x`: Urgent fixes

## Content Versioning

### Version Numbers

We use semantic versioning for content:

- `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
  - MAJOR: Significant content changes
  - MINOR: New topics or sections
  - PATCH: Small updates or fixes

### Version Tags

```bash
# Tag a new version
git tag -a v1.2.3 -m "Release version 1.2.3"

# Push tags to remote
git push origin --tags
```

### Version Metadata

In DITA maps:
```xml
<map>
  <topicmeta>
    <data name="version" value="1.2.3"/>
    <data name="release-date" value="2024-04-01"/>
  </topicmeta>
  <!-- ... -->
</map>
```

## Workflow

### 1. Content Creation

```bash
# Create a new feature branch
git checkout -b feature/quantum-mechanics

# Create and edit content
touch content/topics/quantum-mechanics.mdita
```

### 2. Content Review

```bash
# Push changes for review
git add content/topics/quantum-mechanics.mdita
git commit -m "feat: Add quantum mechanics topic"
git push origin feature/quantum-mechanics

# Create pull request to staging
```

### 3. Content Publication

```bash
# Merge to staging after review
git checkout staging
git merge feature/quantum-mechanics

# Test and verify
# Then merge to main
git checkout main
git merge staging
```

## Change Management

### 1. Content Changes

Track changes using Git commits:

```bash
# Small changes
git commit -m "fix: Correct equation in quantum tunneling section"

# Major changes
git commit -m "feat: Add new section on wave functions

- Add wave function introduction
- Include Schrödinger equation
- Add probability density examples"
```

### 2. Change Documentation

Use detailed commit messages:

```bash
git commit -m "update: Revise quantum mechanics introduction

- Simplify explanations for beginner audience
- Add more visual examples
- Update mathematical notation
- Fix LaTeX formatting issues

Resolves: DOCS-123"
```

## Collaborative Editing

### 1. Concurrent Work

```bash
# Before starting work
git pull origin development
git checkout -b feature/your-topic

# Regular updates
git fetch origin development
git rebase origin/development
```

### 2. Conflict Resolution

```bash
# When conflicts occur
git status
git diff
# Resolve conflicts
git add resolved-file.mdita
git rebase --continue
```

## Best Practices

1. **Commit Guidelines**
   - Write clear commit messages
   - Use conventional commits
   - Reference issue numbers

2. **Branch Management**
   - Keep branches focused
   - Delete merged branches
   - Regularly update from main

3. **Content Organization**
   - Follow directory structure
   - Use consistent naming
   - Maintain clean history

4. **Review Process**
   - Use pull requests
   - Include review checklist
   - Document changes

## Content Lifecycle

### 1. Planning
- Create issue/ticket
- Assign to team member
- Define requirements

### 2. Development
- Create feature branch
- Write/update content
- Add metadata

### 3. Review
- Technical review
- Editorial review
- Peer review

### 4. Publication
- Merge to staging
- Final verification
- Deploy to production

## Tools and Integration

### 1. Git Tools
- Git command line
- Visual Git clients
- IDE integration

### 2. CI/CD Integration
```yaml
name: Content Pipeline
on:
  push:
    branches: [main, staging]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate DITA
        run: dita-ot validate
```

## Troubleshooting

1. **Merge Conflicts**
   - Pull latest changes
   - Resolve conflicts carefully
   - Verify content integrity

2. **Lost Changes**
   - Check git reflog
   - Use git stash
   - Review commit history

3. **Branch Issues**
   - Verify current branch
   - Check remote status
   - Review branch history

## Next Steps

- Review [Content Reuse Features](content-reuse.mdita)
- Explore [Templates and Examples](templates/index.mdita)
- Check [Planned Improvements](roadmap.mdita) 