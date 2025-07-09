# Mermaid Renderer Service

A minimal Node.js project to turn Mermaid `.mmd` files into SVG images on demand, ready for ChatGPT plugin integration.

---

## 📋 Prerequisites

- **Node.js** (v16+ LTS) installed
- **npm** (comes with Node.js)

---

## 🛠 Project Setup

1. **Create the project folder and initialize Git**

   ```bash
   mkdir mermaid-renderer
   cd mermaid-renderer
   git init
   ```

2. **Initialize npm**

   ```
   npm init -y

   ```

   This creates a package.json with defaults:

   ```
       {
           "name": "mermaid-renderer",
           "version": "1.0.0",
           "description": "",
           "main": "index.js",
           "scripts": {
               "test": "echo \"Error: no test specified\" && exit 1"
           },
           "keywords": [],
           "author": "",
           "license": "ISC"
       }

   ```

3. **Install the Mermaid CLI**

   ```
   npm install @mermaid-js/mermaid-cli

   ```

4. **📂 Directory Structure**

   ```
      mermaid-renderer/
       ├─ code/                # Your .mmd source files
       ├─ Render Images/       # Output SVGs
       └─ package.json

   ```

5. **▶️ Testing the CLI Locally**

   ```
      - Add a sample diagram
         - Create code/test.mmd with:
         graph TD
            A[Start] --> B[End]

         - Render to SVG
            > npx mmdc -i ./code/test.mmd -o "./Render Images/test.svg"

         - Verify Output
            - Render Images/test.svg should appear.
            - Open it in a browser; you’ll see the rendered graph:

         - Directory now looks like
            mermaid-renderer/
            ├─ code/
            │   └─ test.mmd
            ├─ Render Images/
            │   └─ test.svg
            └─ package.json
   ```

**Note**

1. Using Mermaid Library for converting code to svg
2. Front end: ReactJs
3. Back end: Nodejs
