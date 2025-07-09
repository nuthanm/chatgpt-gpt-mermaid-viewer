const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

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

  // Use a temp dir for serverless
  const TMP = os.tmpdir();
  const id = crypto.randomBytes(8).toString("hex");
  const inputPath = path.join(TMP, `${id}.mmd`);
  const outputPath = path.join(TMP, `${id}.svg`);

  // Write the .mmd file
  fs.writeFileSync(inputPath, diagram, "utf8");

  exec(
    `npx mmdc -i "${inputPath}" -o "${outputPath}"`,
    (err, stdout, stderr) => {
      // Always clean up the input file
      fs.unlinkSync(inputPath);

      if (err) {
        console.error("Mermaid CLI error:", stderr);
        return res.status(500).send("Error rendering diagram");
      }

      // Read & clean up the SVG
      const svg = fs.readFileSync(outputPath, "utf8");
      fs.unlinkSync(outputPath);

      // Wrap & return
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
