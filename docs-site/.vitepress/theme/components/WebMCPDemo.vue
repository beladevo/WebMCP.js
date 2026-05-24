<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { createWebMCP, z, type RegisteredToolHandle, type WebMCPInstance } from "@webmcp-js/core";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type LogEntry = {
  type: "success" | "error" | "info";
  title: string;
  body: string;
};

const products: Product[] = [
  { id: "p_1", name: "Mechanical Keyboard", price: 129, category: "Desk" },
  { id: "p_2", name: "USB-C Dock", price: 89, category: "Desk" },
  { id: "p_3", name: "Noise Cancelling Headphones", price: 199, category: "Audio" },
  { id: "p_4", name: "Portable Monitor", price: 219, category: "Display" }
];

const query = ref("keyboard");
const limit = ref(3);
const approvalMode = ref<"allow" | "reject">("allow");
const searchResults = ref<Product[]>([]);
const cart = ref<Array<{ productId: string; quantity: number }>>([]);
const log = ref<LogEntry[]>([]);
const runtimeAvailable = ref(false);
const mcp = ref<WebMCPInstance | null>(null);
const registered = ref<RegisteredToolHandle[]>([]);

const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));

function pushLog(entry: LogEntry) {
  log.value = [entry, ...log.value].slice(0, 8);
}

function findProduct(id: string) {
  return products.find((product) => product.id === id);
}

onMounted(() => {
  const instance = createWebMCP({
    appName: "webmcp.js Demo Store",
    showSupportWebMCP: true,
    supportWebMCPBadgeText: "WebMCP demo tools",
    unavailable: "silent",
    approval: {
      mode: "custom",
      approve: async ({ tool, reason }) => {
        pushLog({
          type: "info",
          title: `Approval requested: ${tool}`,
          body: `${reason} Decision: ${approvalMode.value}.`
        });
        return approvalMode.value === "allow";
      }
    },
    audit: {
      onToolCallStart: (event) => {
        pushLog({ type: "info", title: `Tool started: ${event.tool}`, body: `Risk: ${event.risk}` });
      },
      onToolCallDenied: (event) => {
        pushLog({
          type: "error",
          title: `Tool denied: ${event.tool}`,
          body: `${event.error.code}: ${event.error.message}`
        });
      },
      onToolCallError: (event) => {
        pushLog({
          type: "error",
          title: `Tool failed: ${event.tool}`,
          body: `${event.error.code}: ${event.error.message}`
        });
      }
    }
  });

  instance.tool("products.search", {
    description: "Search products in the catalog",
    input: z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(20).default(10)
    }),
    risk: "read",
    run: ({ query, limit }) =>
      products
        .filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
  });

  instance.tool("cart.add", {
    description: "Add a product to the current cart",
    input: z.object({
      productId: z.string(),
      quantity: z.number().min(1).default(1)
    }),
    risk: "high",
    approval: {
      required: true,
      reason: "Adding to cart changes user-visible state."
    },
    run: ({ productId, quantity }) => {
      cart.value = [...cart.value, { productId, quantity }];
      return { cartSize: cart.value.length, itemCount: cartCount.value };
    }
  });

  mcp.value = instance;
  registered.value = instance.listTools();
  runtimeAvailable.value = typeof navigator.modelContext?.registerTool === "function";
  pushLog({
    type: "success",
    title: "Demo tools registered",
    body: `${registered.value.length} tools are available on this page.`
  });
});

async function runSearch() {
  const tool = mcp.value?.getTool("products.search");
  const result = await tool?.execute({ query: query.value, limit: Number(limit.value) });
  if (!result) return;

  if (result.ok) {
    searchResults.value = result.data as Product[];
    pushLog({
      type: "success",
      title: "products.search returned data",
      body: `${searchResults.value.length} product result(s).`
    });
  } else {
    pushLog({
      type: "error",
      title: "products.search failed",
      body: `${result.error.code}: ${result.error.message}`
    });
  }
}

async function addToCart(productId: string) {
  const product = findProduct(productId);
  const tool = mcp.value?.getTool("cart.add");
  const result = await tool?.execute({ productId, quantity: 1 });
  if (!result) return;

  if (result.ok) {
    pushLog({
      type: "success",
      title: "cart.add completed",
      body: `${product?.name ?? productId} was added after approval.`
    });
  } else {
    pushLog({
      type: "error",
      title: "cart.add did not run",
      body: `${result.error.code}: ${result.error.message}`
    });
  }
}
</script>

<template>
  <section class="demo-shell">
    <div class="demo-hero">
      <div>
        <p class="demo-kicker">Interactive demo</p>
        <h1>Register and run WebMCP tools in the browser</h1>
        <p>
          This page uses <code>@webmcp-js/core</code> to register a read tool and a high-risk
          cart tool. Run the tools, reject approval, and inspect the structured results.
        </p>
      </div>
      <div class="runtime-panel" aria-label="Runtime status">
        <span :class="['status-dot', runtimeAvailable ? 'online' : 'offline']"></span>
        <strong>{{ runtimeAvailable ? "Native runtime detected" : "Local demo mode" }}</strong>
        <span>
          {{ runtimeAvailable ? "navigator.modelContext is available." : "Tools run through local handles." }}
        </span>
      </div>
    </div>

    <div class="demo-grid">
      <section class="demo-panel">
        <div class="panel-heading">
          <p class="demo-kicker">Tool</p>
          <h2>products.search</h2>
        </div>
        <label>
          Search query
          <input v-model="query" type="text" placeholder="keyboard" />
        </label>
        <label>
          Limit
          <input v-model="limit" type="number" min="1" max="20" />
        </label>
        <button type="button" class="primary-button" @click="runSearch">Run read tool</button>

        <div class="results-list" aria-live="polite">
          <article v-for="product in searchResults" :key="product.id" class="result-card">
            <div>
              <strong>{{ product.name }}</strong>
              <span>{{ product.category }} - ${{ product.price }}</span>
            </div>
            <button type="button" @click="addToCart(product.id)">Add</button>
          </article>
          <p v-if="searchResults.length === 0" class="empty-state">
            Run search to show product results.
          </p>
        </div>
      </section>

      <section class="demo-panel">
        <div class="panel-heading">
          <p class="demo-kicker">Approval</p>
          <h2>cart.add</h2>
        </div>
        <div class="segmented-control" aria-label="Approval decision">
          <button
            type="button"
            :class="{ active: approvalMode === 'allow' }"
            @click="approvalMode = 'allow'"
          >
            Allow
          </button>
          <button
            type="button"
            :class="{ active: approvalMode === 'reject' }"
            @click="approvalMode = 'reject'"
          >
            Reject
          </button>
        </div>

        <div class="cart-summary">
          <strong>{{ cartCount }}</strong>
          <span>cart item(s)</span>
        </div>

        <div class="cart-items">
          <article v-for="(item, index) in cart" :key="`${item.productId}-${index}`">
            <strong>{{ findProduct(item.productId)?.name ?? item.productId }}</strong>
            <span>Qty {{ item.quantity }}</span>
          </article>
          <p v-if="cart.length === 0" class="empty-state">Approved cart additions appear here.</p>
        </div>
      </section>
    </div>

    <section class="demo-panel">
      <div class="panel-heading">
        <p class="demo-kicker">Registered tools</p>
        <h2>Page capabilities</h2>
      </div>
      <div class="tool-list">
        <article v-for="tool in registered" :key="tool.name">
          <strong>{{ tool.name }}</strong>
          <span>{{ tool.definition.description }}</span>
          <code>risk: {{ tool.definition.risk ?? "read" }}</code>
        </article>
      </div>
    </section>

    <section class="demo-panel">
      <div class="panel-heading">
        <p class="demo-kicker">Execution log</p>
        <h2>Structured behavior</h2>
      </div>
      <div class="log-list" aria-live="polite">
        <article v-for="(entry, index) in log" :key="`${entry.title}-${index}`" :class="entry.type">
          <strong>{{ entry.title }}</strong>
          <span>{{ entry.body }}</span>
        </article>
      </div>
    </section>
  </section>
</template>
