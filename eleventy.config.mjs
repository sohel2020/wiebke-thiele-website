import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import { HtmlBasePlugin } from "@11ty/eleventy";

// html: false keeps raw HTML typed into YAML or Markdown from reaching the page
const md = new MarkdownIt({ html: false, breaks: false });

function loadLegal(dir) {
  const pages = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const meta = match ? yaml.load(match[1], { schema: yaml.CORE_SCHEMA }) : {};
    pages[path.basename(file, ".md")] = { title: meta.title, html: md.render(match ? match[2] : raw) };
  }
  return pages;
}

export default function (eleventyConfig) {
  // Dates like 2026-10-25 stay plain text instead of becoming Date objects
  eleventyConfig.addDataExtension("yml", (contents) => yaml.load(contents, { schema: yaml.CORE_SCHEMA }));
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true, throwOnUndefined: true });
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("content/");

  eleventyConfig.addFilter("md", (text) => md.renderInline(String(text ?? "")));
  // JSON safe to embed inside <script type="application/json">
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value).replace(/</g, "\\u003c"));
  eleventyConfig.addGlobalData("legal", () => loadLegal("content/legal"));
  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());

  return {
    dir: { input: "src", includes: "_includes", data: "../content", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
  };
}
