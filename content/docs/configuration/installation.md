---
title: Installation Guide
author: Hex21 Setup Team
date: 2024-04-01
tags: [documentation, guide, installation, setup, prerequisites]
description: Step-by-step guide to installing the Hex21 CMS.
id: installation-guide
---

# Installation Guide

Setting up Hex 21 CMS is straightforward. Follow these steps to get started with your scientific content management system.

## Prerequisites

Before installing Hex 21 CMS, ensure you have:

- Node.js 18.0.0 or later
- Git
- DITA Open Toolkit (DITA-OT) 4.0 or later
- Java Runtime Environment (JRE) 11 or later (required for DITA-OT)

## Installation Steps

1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/hex21-cms.git
cd hex21-cms
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure DITA-OT**

Download and install DITA-OT from [dita-ot.org](https://www.dita-ot.org/download). Add the `dita-ot/bin` directory to your system's PATH.

4. **Environment Setup**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DITA_OT_PATH=/path/to/dita-ot
```

5. **Start the Development Server**

```bash
npm run dev
```

Visit `http://localhost:3000` to see your Hex 21 CMS instance running. 