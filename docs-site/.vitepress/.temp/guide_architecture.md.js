import { ssrRenderAttrs, ssrRenderAttr, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const _imports_0 = "/architecture.png";
const __pageData = JSON.parse('{"title":"Architecture","description":"","frontmatter":{},"headers":[],"relativePath":"guide/architecture.md","filePath":"guide/architecture.md","lastUpdated":null}');
const _sfc_main = { name: "guide/architecture.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="architecture" tabindex="-1">Architecture <a class="header-anchor" href="#architecture" aria-label="Permalink to &quot;Architecture&quot;">​</a></h1><p>webmcp.js is an execution and safety layer around WebMCP tool registration. It does not define a protocol.</p><p><img${ssrRenderAttr("src", _imports_0)} alt="webmcp.js architecture diagram"></p><h2 id="adapter" tabindex="-1">Adapter <a class="header-anchor" href="#adapter" aria-label="Permalink to &quot;Adapter&quot;">​</a></h2><p>The default adapter checks for:</p><div class="language-ts vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ts</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">globalThis.navigator?.modelContext?.registerTool;</span></span></code></pre></div><p>When present, webmcp.js passes a registered tool to that function. When absent, behavior follows the <code>unavailable</code> option: <code>silent</code>, <code>warn</code>, or <code>throw</code>.</p><p>The adapter is replaceable because WebMCP runtime APIs are still subject to change.</p><h2 id="registry" tabindex="-1">Registry <a class="header-anchor" href="#registry" aria-label="Permalink to &quot;Registry&quot;">​</a></h2><p><code>createWebMCP</code> keeps local handles for registered tools. The registry supports tests, React cleanup, explicit unregister calls, and local execution when native WebMCP is unavailable.</p><h2 id="execution-flow" tabindex="-1">Execution Flow <a class="header-anchor" href="#execution-flow" aria-label="Permalink to &quot;Execution Flow&quot;">​</a></h2><ol><li>Validate input.</li><li>Decide whether approval is required from risk defaults, approval rules, and tool overrides.</li><li>Ask the approval provider when required.</li><li>Run the tool function.</li><li>Return <code>{ ok: true, data }</code> or <code>{ ok: false, error }</code>.</li></ol><h2 id="packages" tabindex="-1">Packages <a class="header-anchor" href="#packages" aria-label="Permalink to &quot;Packages&quot;">​</a></h2><ul><li><code>@webmcp-js/core</code>: core registration, validation, approvals, audit hooks, badge, and native adapter.</li><li><code>@webmcp-js/react</code>: React provider and tool registration hook.</li><li><code>@webmcp-js/testing</code>: in-memory adapter and assertion helpers.</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/architecture.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const architecture = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  architecture as default
};
