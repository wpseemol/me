# Seemol Chakroborti · Full-Stack Developer Portfolio

> A premium, production-ready, one-page personal portfolio website built with pure HTML, CSS, and JavaScript. Designed to attract high-value clients for Laravel, MERN, and Next.js development services.

![Portfolio Screenshot](https://via.placeholder.com/1200x600/070b12/00d4ff?text=wpseemol+Portfolio)

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Core Features](#core-features)
- [Design System & Theme Colors](#design-system--theme-colors)
    - [Color Palette](#color-palette)
    - [Typography](#typography)
    - [Spacing & Radius](#spacing--radius)
- [File Structure](#file-structure)
- [Customization Guide](#customization-guide)
    - [Changing Theme Colors](#changing-theme-colors)
    - [Updating the Tech Stack](#updating-the-tech-stack)
    - [Changing GitHub Username](#changing-github-username)
    - [Updating Personal Details](#updating-personal-details)
- [Technologies Used](#technologies-used)
- [Deployment](#deployment)
- [Credits & Attribution](#credits--attribution)
- [License](#license)

---

## Overview

This portfolio is tailored for **Seemol Chakroborti** (wpseemol), a Full-Stack Developer specializing in:

- **Laravel** (Backend / API)
- **MERN Stack** (MongoDB, Express, React, Node.js)
- **Next.js** (Advanced Frontend)

The site is built to convert visitors into clients by showcasing expertise, social proof, and an easy-to-use contact mechanism.

## Live Demo

Visit the live site: [https://wpseemol.com](https://wpseemol.com) _(Replace with your actual URL)_

---

## Core Features

- **Dynamic GitHub Projects**: Fetches the latest 3 repositories from `wpseemol`'s GitHub API with a beautiful static fallback.
- **Animated Tech Stack**: Skill-level progress bars that animate when you scroll into view.
- **Fully Responsive**: Mobile-first design that adapts perfectly to desktops, tablets, and smartphones (no Bootstrap or Tailwind).
- **High-Converting Hero**: Clear call-to-action for "Hire Me" with social proof stats.
- **Native Contact Form**: Validates inputs and opens a formatted `mailto:wpseemol@gmail.com` link.
- **Custom Favicon**: Inline SVG `>_` symbol in neon cyan.
- **SEO Ready**: Includes meta description, Open Graph tags, and Twitter cards.

---

## Design System & Theme Colors

This project uses a **high-end dark mode aesthetic** (Slate/Navy/Charcoal) with **neon cyan and emerald accents**. Use these references when creating additional UI components.

### Color Palette

All colors are defined as CSS Custom Properties in the `:root` selector. Reference them directly in your CSS.

| Role                     | CSS Variable        | Hex Value              | Usage                                     |
| :----------------------- | :------------------ | :--------------------- | :---------------------------------------- |
| **Primary Background**   | `--bg-primary`      | `#070b12`              | Page body, tech section background        |
| **Secondary Background** | `--bg-secondary`    | `#0d1524`              | Services, Projects section background     |
| **Card Background**      | `--bg-card`         | `#111c2e`              | Cards, form containers, code blocks       |
| **Input Background**     | `--bg-input`        | `#0d1524`              | Form input fields                         |
| **Border Subtle**        | `--border-subtle`   | `#1e2d45`              | Card borders, dividers                    |
| **Text Primary**         | `--text-primary`    | `#e8edf5`              | Headings, main body text                  |
| **Text Secondary**       | `--text-secondary`  | `#9aaec9`              | Subheadings, descriptions                 |
| **Text Muted**           | `--text-muted`      | `#6a7f9e`              | Metadata, helper text, stats labels       |
| **Primary Accent**       | `--accent-cyan`     | `#00d4ff`              | Buttons, links, highlights, progress bars |
| **Accent Dim**           | `--accent-cyan-dim` | `rgba(0,212,255,0.08)` | Badge backgrounds, subtle hover states    |
| **Secondary Accent**     | `--accent-emerald`  | `#10b981`              | Secondary accent, gradient partner        |
| **Success / Feedback**   | _inline_            | `#10b981`              | Form success state (Email opened)         |
| **Error / Danger**       | _inline_            | `#f87171`              | Form validation errors                    |

### Typography

- **Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Code Font**: `'JetBrains Mono', 'Fira Code', monospace` (Used in hero code block)
- **Weights**: 300, 400, 500, 600, 700, 800

### Spacing & Radius

| Token               | Value                             |
| :------------------ | :-------------------------------- |
| `--radius`          | `16px` (Cards, containers)        |
| `--radius-sm`       | `10px` (Tech items, inputs)       |
| `--radius-full`     | `9999px` (Badges, pills, buttons) |
| `--shadow-card`     | `0 8px 32px rgba(0,0,0,0.45)`     |
| `--shadow-glow`     | `0 0 40px rgba(0,212,255,0.06)`   |
| Container Max-Width | `1200px`                          |

---

## File Structure

Since this is a **single HTML file** for easy deployment, the structure is consolidated but logically organized:
