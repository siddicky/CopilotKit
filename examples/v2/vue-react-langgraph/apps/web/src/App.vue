<template>
  <div class="app-root">
    <div class="badge">
      <span class="badge-vue">Vue.js Host</span>
      <span class="badge-separator">+</span>
      <span class="badge-react">React Micro-Frontend</span>
    </div>
    <ProverbsList
      :proverbs="agentState.proverbs"
      @remove="removeProverb"
    />
    <CopilotKitWrapper
      :vue-to-react-bridge="vueToReactBridge"
      :state-bridge="bridge"
    />
  </div>
</template>

<script setup lang="ts">
import ProverbsList from "./components/ProverbsList.vue";
import CopilotKitWrapper from "./components/CopilotKitWrapper.vue";
import { useStateBridge } from "./composables/useStateBridge";

const { agentState, bridge, vueToReactBridge, removeProverb } =
  useStateBridge();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body,
html {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
}

.app-root {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #6366f1;
  transition: background-color 0.3s;
}

.badge {
  position: fixed;
  top: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-vue {
  color: #42b883;
  font-weight: 600;
}

.badge-react {
  color: #61dafb;
  font-weight: 600;
}

.badge-separator {
  opacity: 0.6;
}
</style>
