<template>
  <div class="flex bg-gray-50" style="position: fixed; inset: 0;">
    <Sidebar />
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <Topbar />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import Sidebar from '../components/layout/Sidebar.vue';
import Topbar from '../components/layout/Topbar.vue';
</script>
