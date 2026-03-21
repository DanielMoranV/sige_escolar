<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <Sidebar />
    <div class="flex flex-col flex-1 overflow-hidden">
      <Topbar />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
  <BaseToast />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import Sidebar from '../components/layout/Sidebar.vue';
import Topbar from '../components/layout/Topbar.vue';
import BaseToast from '../components/ui/BaseToast.vue';
</script>
