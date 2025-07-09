const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));

// Ensure output directory exists
const OUTPUT_DIR = path.join(__dirname, "Render Images");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

app.post("/render", async (req, res) => {
  const { diagram } = req.body;
  if (typeof diagram !== "string") {
    return res.status(400).send("`diagram` must be a string");
  }

  // Generate a unique filename
  const id = crypto.randomBytes(8).toString("hex");
  const inputPath = path.join(__dirname, "code", `${id}.mmd`);
  const outputPath = path.join(OUTPUT_DIR, `${id}.svg`);

  // Write the .mmd file
  fs.writeFileSync(inputPath, diagram, "utf8");

  // Run Mermaid CLI
  exec(
    `npx mmdc -i "${inputPath}" -o "${outputPath}"`,
    (err, stdout, stderr) => {
      // Clean up input file
      fs.unlinkSync(inputPath);

      if (err) {
        console.error(stderr);
        return res.status(500).send("Error rendering diagram");
      }

      // Read the SVG back
      const svg = fs.readFileSync(outputPath, "utf8");

      // Optional: delete the SVG after reading, or keep for caching
      // fs.unlinkSync(outputPath);

      // Wrap in a scrollable container with toolbar
      const html = `
<div style="max-width:100%; overflow:auto; border:1px solid #ddd; padding:8px; border-radius:4px;">
  <div style="margin-bottom:4px;">
    <button onclick="copySVG()">Copy</button>
    <button onclick="openFull()">View Full Size</button>
  </div>
  ${svg}
</div>
<script>
  function copySVG() {
    navigator.clipboard.writeText(\`${svg.replace(/`/g, "\\`")}\`);
    alert('SVG copied to clipboard');
  }
  function openFull() {
    const w = window.open();
    w.document.write(\`${svg}\`);
  }
</script>
      `;

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mermaid-render service listening on port ${PORT}`);
});
