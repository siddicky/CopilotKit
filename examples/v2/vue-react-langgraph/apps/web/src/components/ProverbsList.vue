<template>
  <div class="proverbs-container">
    <h1>Proverbs</h1>
    <p class="subtitle">
      This Vue.js component renders proverbs from CopilotKit agent shared state.
    </p>
    <hr />
    <div class="proverbs-list">
      <div
        v-for="(proverb, index) in proverbs"
        :key="index"
        class="proverb-card"
      >
        <p>{{ proverb }}</p>
        <button class="delete-btn" @click="$emit('remove', index)">
          &#10005;
        </button>
      </div>
    </div>
    <p v-if="proverbs.length === 0" class="empty-message">
      No proverbs yet. Ask the assistant to add some!
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  proverbs: string[];
}>();

defineEmits<{
  remove: [index: number];
}>();
</script>

<style scoped>
.proverbs-container {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 42rem;
  width: 100%;
}

h1 {
  color: white;
  font-size: 2.25rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #e5e7eb;
  text-align: center;
  font-style: italic;
  margin-bottom: 1.5rem;
}

hr {
  border-color: rgba(255, 255, 255, 0.2);
  margin: 1.5rem 0;
}

.proverbs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.proverb-card {
  background: rgba(255, 255, 255, 0.15);
  padding: 1rem;
  border-radius: 0.75rem;
  color: white;
  position: relative;
  transition: background 0.2s;
}

.proverb-card:hover {
  background: rgba(255, 255, 255, 0.2);
}

.proverb-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn {
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  opacity: 0;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.delete-btn:hover {
  background: #dc2626;
}

.empty-message {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
  margin: 2rem 0;
}
</style>
