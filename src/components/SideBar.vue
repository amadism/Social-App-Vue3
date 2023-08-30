<script setup>
import { useAuthentification } from "@/stores/auth";
import { auth } from "@/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "vue-router";
import { toast } from "vue3-toastify";
import { computed, ref } from "vue";

const user = computed(() => {
  return auth.currentUser;
});

const authentification = useAuthentification();
const router = useRouter();

const appSignOut = () => {
  authentification.logOut();
  signOut(auth);
  router.push({ path: "/login" });
  toast("Logged Out!", {
    type: "info",
    theme: "dark",
    position: toast.POSITION.TOP_CENTER,
  });
};
</script>
<script>
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiDotsVertical, mdiAccountOutline, mdiLogoutVariant } from "@mdi/js";

export default {
  components: {
    SvgIcon,
  },
  data() {
    return {
      menu: mdiDotsVertical,
      menuOpen: false,
      profileICON: mdiAccountOutline,
      logOutIcon: mdiLogoutVariant,
    };
  },
};
</script>

<template>
  <div
    class="flex w-full justify-between px-6 border-[black] border-b-2 py-3 relative items-center"
  >
    <div class="flex flex-col">
    <span class="text-[5px] leading-none ml-[1px]">Created with <span class=" text-emerald-600 text-[6px]">&#10084;</span> by</span>
      <a href="https://www.amadism.com/" class="font-mono text-sm font-bold text-emerald-600">Amadism</a>
    </div>
    <div @click="appSignOut" class="flex gap-1 items-center cursor-pointer">
      <svg-icon
        class="h-5  text-slate-300"
        type="mdi"
        :path="logOutIcon"
      ></svg-icon>
      <h1>Logout</h1>
    </div>
  </div>
</template>
