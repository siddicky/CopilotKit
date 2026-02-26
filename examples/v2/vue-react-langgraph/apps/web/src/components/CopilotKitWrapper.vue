<template>
  <div ref="reactContainer" class="copilotkit-react-container"></div>
</template>

<script setup lang="ts">
/**
 * CopilotKitWrapper — The micro-frontend integration point.
 *
 * This Vue component mounts a React root inside a DOM element,
 * rendering the full CopilotKit React component tree (provider,
 * hooks, and CopilotSidebar). Bridge objects are passed as React
 * props for bidirectional state synchronization.
 */
import { ref, onMounted, onBeforeUnmount } from "vue";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { CopilotKitApp } from "../react/CopilotKitApp";
import type { VueToReactBridge, StateBridge } from "../bridge/types";

const props = defineProps<{
  vueToReactBridge: VueToReactBridge;
  stateBridge: StateBridge;
}>();

const reactContainer = ref<HTMLDivElement | null>(null);
let reactRoot: Root | null = null;

onMounted(() => {
  if (reactContainer.value) {
    reactRoot = createRoot(reactContainer.value);
    reactRoot.render(
      React.createElement(CopilotKitApp, {
        vueToReactBridge: props.vueToReactBridge,
        stateBridge: props.stateBridge,
      }),
    );
  }
});

onBeforeUnmount(() => {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
});
</script>

<style scoped>
.copilotkit-react-container {
  /* The CopilotSidebar uses fixed positioning, so this container just needs to exist in the DOM */
  position: relative;
}
</style>
