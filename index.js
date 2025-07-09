const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));

// Logger
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/render", (_, res) => {
  res.send(
    'Mermaid-render service is up! POST to /render with {"diagram":"..."}'
  );
});

app.post("/render", (req, res) => {
  const { diagram } = req.body;
  if (typeof diagram !== "string") {
    return res.status(400).send("`diagram` must be a string");
  }

  // Temp file paths
  const tmp = os.tmpdir();
  const id = crypto.randomBytes(8).toString("hex");
  const inF = path.join(tmp, `${id}.mmd`);
  const outF = path.join(tmp, `${id}.svg`);

  // Write diagram to temp file
  fs.writeFileSync(inF, diagram, "utf8");

  // Build the shell command
  // Note the quotes around paths to handle spaces on Windows
  const cmd = `npx mmdc -i "${inF}" -o "${outF}"`;

  // Execute in a shell
  exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    // Clean up the input file
    try {
      fs.unlinkSync(inF);
    } catch {}

    if (err) {
      console.error("Mermaid CLI error:", stderr || err.message);
      return res
        .status(500)
        .send("Error rendering diagram:\n" + (stderr || err.message));
    }

    // Read and remove the SVG
    let svg;
    try {
      svg = fs.readFileSync(outF, "utf8");
      fs.unlinkSync(outF);
    } catch (e) {
      console.error("SVG read error:", e);
      return res.status(500).send("Error reading SVG");
    }

    // Wrap in scrollable container + toolbar
    const html = `
<div style="max-width:100%; overflow:auto; border:1px solid #ddd; padding:8px; border-radius:4px;">
  <div style="margin-bottom:4px;">
    <button onclick="navigator.clipboard.writeText(\`${svg.replace(
      /`/g,
      "\\`"
    )}\`)" style="margin-right:8px;">Copy</button>
    <button onclick="window.open().document.write(\`${svg}\`)">View Full Size</button>
  </div>
  ${svg}
</div>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mermaid-render service listening on port ${PORT}`);
});
