import { defineConfig } from "vitepress";

export default defineConfig({
  title: "webmcp.js",
  description: "Typed, validated, approval-aware WebMCP tools for TypeScript apps.",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: "/webmcp_logo.png",
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/reference/api" },
      { text: "Examples", link: "/guide/examples" },
      { text: "Roadmap", link: "/guide/roadmap" }
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Core Concepts", link: "/guide/core-concepts" },
          { text: "Approvals", link: "/guide/approvals" },
          { text: "Security", link: "/guide/security" },
          { text: "React", link: "/guide/react" },
          { text: "Testing", link: "/guide/testing" },
          { text: "Architecture", link: "/guide/architecture" },
          { text: "Examples", link: "/guide/examples" },
          { text: "Roadmap", link: "/guide/roadmap" }
        ]
      },
      {
        text: "Reference",
        items: [
          { text: "API Reference", link: "/reference/api" },
          { text: "Configuration", link: "/reference/configuration" }
        ]
      }
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/webmcp-js/webmcp-js" }],
    search: {
      provider: "local"
    },
    footer: {
      message:
        "webmcp.js is not an official W3C, Chrome, Google, Microsoft, MCP, or MCP-B project.",
      copyright: "Released under the MIT License."
    }
  }
});
