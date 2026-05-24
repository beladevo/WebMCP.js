import DefaultTheme from "vitepress/theme";
import WebMCPDemo from "./components/WebMCPDemo.vue";
import "./styles.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("WebMCPDemo", WebMCPDemo);
  }
};
