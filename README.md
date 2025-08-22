# Personal Portfolio powered by AI
## Overview
* Purpose: a fast, accessible, read-only public portfolio with owner-only local editing and easy publishing.
* Core sections: About, Experience, Projects, Education, Certifications, Skills, Contact.
* Edit workflow: owner edits locally in the browser (file uploads supported), exports content.json, commits to Git, deploys to server. Public site is static and read-only.
## Tech stack and languages
* AI Agent: Cursor AI
* AI model: gpt-5
* Frontend: HTML5, CSS3, vanilla JavaScript (no frameworks).
* Data: one JSON file (assets/data/content.json) that the app reads to render content.
* Assets: images (assets/img/), resume (assets/resume.pdf), icons as needed.
* Web server: Nginx on Ubuntu (EC2).
## Key features
* Owner-only editing (local-only): hidden on public site; enabled only on localhost.
* Upload support (stored as data URLs in local edits and export):
* Headshot: JPG/PNG, <= 2MB.
* Resume: PDF/DOC/DOCX.
* Certification badges: JPG/PNG, <= 2MB.
* Read-only public site: external visitors cannot edit.
* Accessibility: semantic structure, focus states, color contrast, prefers-reduced-motion respected.
* Performance: small JS, responsive layout, lazy-loaded images, smooth anchor scrolling.
## Repository layout
* index.html: main page.
* assets/css/styles.css: styles (pastel theme, responsive grid, hover transitions).
* assets/js/app.js: rendering logic for all sections.
* assets/js/edit-mode.js: owner-only edit mode (local-only), dialogs, file uploads, JSON export/import.
* assets/js/storage.js: content load/save helpers.
* assets/data/content.json: source content the public site reads.
* assets/resume.pdf: downloadable resume file (or use URL in profile settings).
* assets/img/: images for profile, certifications, projects, etc.
## Local development and editing
Serve locally (example):

Linux/macOS:

```bash
python3 -m http.server 8000
Open http://localhost:8000
```
#### Editing:
At bottom footer, click Owner login (only visible on localhost), enter code (changeable in assets/js/edit-mode.js).

Click Edit → use “✏️ Edit Profile” and section “➕ Add” buttons.

File uploads are read in the browser and embedded as data URLs in the exported JSON.

#### Publish:
Click Export to download content.json.

Replace assets/data/content.json in your repo with the exported one.

Commit and push.
## Deployment on AWS EC2 (Ubuntu)
#### Prerequisites
AWS account, SSH key pair, security group open to:

TCP 22 (SSH), TCP 80 (HTTP), TCP 443 (HTTPS).

### Step-by-step

Launch EC2

AMI: Ubuntu 22.04 LTS.

Instance type: t3.micro or better.

Attach security group with 22/80/443 open.

Allocate and attach an Elastic IP (recommended).

SSH into the instance
```bash
ssh -i /path/to/key.pem ubuntu@YOUR_EC2_IP
```

Update and install Nginx
```bash
sudo apt update
sudo apt install -y nginx git
sudo systemctl enable --now nginx
```
### Deploy site files 
Option A: Git (recommended)
```bash
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
```
### Move project files to nginx web root
```bash
sudo rm -rf /var/www/html/*
sudo cp -r * /var/www/html/
```
### Restart nginx
```bash
sudo systemctl restart nginx
```

Visit http://YOUR_EC2_IP

If updating later:
```bash
git pull
```

## Summary

* Stack: HTML/CSS/JS static site; content in assets/data/content.json.
* Local owner-only edits; public site is read-only.
* Deployment: Nginx on Ubuntu EC2 with optional domain + HTTPS.

