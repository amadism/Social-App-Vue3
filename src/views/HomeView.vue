<script setup>
import SideBar from '../components/SideBar.vue';
import { RouterView } from "vue-router";
</script>

<template>
  <main class="">
    <SideBar />
    <RouterView />
  </main>
</template>
