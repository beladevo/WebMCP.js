import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Examples","description":"","frontmatter":{},"headers":[],"relativePath":"guide/examples.md","filePath":"guide/examples.md","lastUpdated":null}');
const _sfc_main = { name: "guide/examples.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="examples" tabindex="-1">Examples <a class="header-anchor" href="#examples" aria-label="Permalink to &quot;Examples&quot;">​</a></h1><p>The repository includes runnable examples under <code>examples/</code>.</p><h2 id="vanilla-typescript" tabindex="-1">Vanilla TypeScript <a class="header-anchor" href="#vanilla-typescript" aria-label="Permalink to &quot;Vanilla TypeScript&quot;">​</a></h2><p>The vanilla example registers product search, product details, and cart tools.</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">pnpm</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> --filter</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ./examples/vanilla</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> dev</span></span></code></pre></div><p>Key behavior:</p><ul><li><code>products.search</code> is a read tool with Zod input validation.</li><li><code>products.get_details</code> returns a single product or <code>null</code>.</li><li><code>cart.add</code> is a high-risk tool with explicit approval.</li><li>The page also uses the local tool handle to run search from normal UI.</li></ul><h2 id="react-vite" tabindex="-1">React Vite <a class="header-anchor" href="#react-vite" aria-label="Permalink to &quot;React Vite&quot;">​</a></h2><p>The React example demonstrates <code>WebMCPProvider</code> and <code>useWebMCPTool</code>.</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">pnpm</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> --filter</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ./examples/react-vite</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> dev</span></span></code></pre></div><p>Use it as the starting point when tools are tied to component lifecycle.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/examples.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const examples = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  examples as default
};
