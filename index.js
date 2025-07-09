const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("Mermaid render service is alive!");
});

app.post("/render", async (req, res) => {
  try {
    const { diagram } = req.body;
    if (typeof diagram !== "string") {
      return res.status(400).send("`diagram` must be a string");
    }

    const id = crypto.randomBytes(6).toString("hex");
    const outPath = `/tmp/${id}.svg`; // Railway-compatible temporary location

    const mmdc = spawn("npx", [
      "mmdc",
      "-i",
      "-",
      "-o",
      outPath,
      "--puppeteerConfigFile",
      "puppeteer-config.json",
    ]);

    let errorOutput = "";

    mmdc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    mmdc.on("close", (code) => {
      if (code !== 0 || !fs.existsSync(outPath)) {
        console.error("Mermaid CLI error:", errorOutput);
        return res.status(500).send("Error rendering diagram");
      }

      const svgOutput = fs.readFileSync(outPath, "utf8");
      fs.unlinkSync(outPath); // clean up

      const html = `
<div style="max-width:100%; overflow:auto; border:1px solid #ddd; padding:8px; border-radius:4px;">
  <div style="margin-bottom:4px;">
    <button onclick="copySVG()">Copy</button>
    <button onclick="openFull()">View Full Size</button>
  </div>
  ${svgOutput}
</div>
<script>
  function copySVG() {
    navigator.clipboard.writeText(\`${svgOutput.replace(/`/g, "\\`")}\`);
    alert('SVG copied to clipboard');
  }
  function openFull() {
    const w = window.open();
    w.document.write(\`${svgOutput}\`);
  }
</script>
      `;

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    });

    mmdc.stdin.write(diagram);
    mmdc.stdin.end();
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mermaid-render service listening on port ${PORT}`);
});
