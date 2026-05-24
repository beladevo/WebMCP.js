import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","hero":{"name":"webmcp.js","text":"Typed WebMCP tools for web apps","tagline":"Register validated, approval-aware browser tools with TypeScript, Zod, React bindings, and testing utilities.","image":{"src":"/webmcp_logo.png","alt":"webmcp.js logo"},"actions":[{"theme":"brand","text":"View Demo","link":"/demo"},{"theme":"alt","text":"Get Started","link":"/guide/getting-started"},{"theme":"alt","text":"API Reference","link":"/reference/api"}]},"features":[{"title":"Typed tool definitions","details":"Define named tools with descriptions, input schemas, risk levels, and strongly typed run functions."},{"title":"Validation and JSON Schema","details":"Use Zod as the developer-facing schema API while registering JSON Schema-compatible metadata."},{"title":"Approval-aware execution","details":"Require human or agent approval for high-impact actions through browser dialogs or custom providers."},{"title":"React and tests","details":"Register tools from React components and test validation, approval, rejection, and execution behavior in memory."}]},"headers":[],"relativePath":"index.md","filePath":"index.md","lastUpdated":null}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h2 id="status" tabindex="-1">Status <a class="header-anchor" href="#status" aria-label="Permalink to &quot;Status&quot;">​</a></h2><p>WebMCP is an emerging browser API proposal. This library is an execution and safety layer around <code>navigator.modelContext</code> when that API exists. It does not define a protocol, ship a browser runtime, or create <code>navigator.modelContext</code>.</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">pnpm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> add</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> @webmcp-js/core</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> zod</span></span></code></pre></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
