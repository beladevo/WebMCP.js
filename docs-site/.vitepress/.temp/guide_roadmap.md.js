import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Roadmap","description":"","frontmatter":{},"headers":[],"relativePath":"guide/roadmap.md","filePath":"guide/roadmap.md","lastUpdated":null}');
const _sfc_main = { name: "guide/roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="roadmap" tabindex="-1">Roadmap <a class="header-anchor" href="#roadmap" aria-label="Permalink to &quot;Roadmap&quot;">​</a></h1><p>This list tracks work that directly improves WebMCP tool registration, approvals, safety, or tests.</p><h2 id="core" tabindex="-1">Core <a class="header-anchor" href="#core" aria-label="Permalink to &quot;Core&quot;">​</a></h2><ul><li>Add more JSON Schema conversion tests.</li><li>Add runtime validation support for non-Zod JSON Schema input.</li><li>Add approval-provider and audit hook assertions to <code>@webmcp-js/testing</code>.</li><li>Add execution-error assertions to <code>@webmcp-js/testing</code>.</li></ul><h2 id="frameworks" tabindex="-1">Frameworks <a class="header-anchor" href="#frameworks" aria-label="Permalink to &quot;Frameworks&quot;">​</a></h2><ul><li>Add a Next.js example.</li><li>Add Vue and Svelte adapters if the React API proves useful.</li></ul><h2 id="runtime" tabindex="-1">Runtime <a class="header-anchor" href="#runtime" aria-label="Permalink to &quot;Runtime&quot;">​</a></h2><ul><li>Track WebMCP browser API changes.</li><li>Add integration tests against a real WebMCP runtime when a stable test target is available.</li><li>Add form-to-tool helpers only after the core registration API is stable.</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/roadmap.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const roadmap = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  roadmap as default
};
