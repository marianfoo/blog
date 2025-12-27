# Marian Zeis Blog

A personal blog built with [Hugo](https://gohugo.io/) and the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme, deployed to GitHub Pages.

🌐 **Live site:** [blog.zeis.de](https://blog.zeis.de)

## Features

- ⚡ Fast static site generation with Hugo
- 🎨 Clean, responsive design with PaperMod theme
- 🔍 Full-text search
- 🏷️ Tags and categories
- 📱 Mobile-friendly
- 🌙 Dark/Light mode (auto-switching)
- 📰 RSS feed
- 🚀 Automatic deployment via GitHub Actions

## Local Development

### Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) (v0.123.0 or later)
- Git

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone --recurse-submodules https://github.com/marianfoo/blog.git
   cd blog
   ```

2. **Start the development server:**
   ```bash
   hugo server -D
   ```

3. **Open your browser:**
   Navigate to [http://localhost:1313](http://localhost:1313)

### Creating New Posts

```bash
hugo new posts/my-new-post.md
```

This creates a new post in `content/posts/` with front matter pre-filled.

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions deployment workflow
├── content/
│   ├── about.md            # About page
│   ├── search.md           # Search page
│   └── posts/              # Blog posts (Markdown)
├── static/
│   └── CNAME               # Custom domain configuration
├── themes/
│   └── PaperMod/           # Hugo theme (git submodule)
├── hugo.toml               # Hugo configuration
└── README.md
```

## Deployment

The site is automatically built and deployed to GitHub Pages whenever you push to the `main` branch.

### Manual Deployment

1. Push your changes to the `main` branch
2. GitHub Actions will automatically build and deploy the site
3. The site will be available at [blog.zeis.de](https://blog.zeis.de)

### Custom Domain Setup

The custom domain `blog.zeis.de` is configured via:
1. The `CNAME` file in the `static/` directory
2. DNS settings pointing to GitHub Pages

## Writing Posts

Posts are written in Markdown and stored in `content/posts/`. Each post should have front matter like:

```yaml
---
title: "Your Post Title"
date: 2024-12-27T10:00:00+01:00
draft: false
tags: ["tag1", "tag2"]
categories: ["Category"]
author: "Marian Zeis"
description: "A brief description of your post"
showToc: true
---

Your content here...
```

## License

Content © Marian Zeis. Theme: [PaperMod](https://github.com/adityatelange/hugo-PaperMod) (MIT License).
