<script setup>
import { useAuthentification } from "@/stores/auth";
import { GoogleAuthProvider, signInWithPopup } from "@firebase/auth";
import { useRouter } from "vue-router";
import { auth } from "../firebaseConfig";
import { toast } from "vue3-toastify";

const autheticated = useAuthentification();
const provider = new GoogleAuthProvider();
const router = useRouter();

const googleSignin = () => {
  signInWithPopup(auth, provider)
    .then(() => {
      autheticated.setAuthentication();
      router.push({ path: "/home" });
      toast("Login Successfull!", {
        type: "success",
        theme: "dark",
        position: toast.POSITION.TOP_CENTER,
      });
    })
    .catch((err) => {
      toast(err.message, {
        type: "error",
        theme: "dark",
        position: toast.POSITION.TOP_CENTER,
      });
    });
};
</script>

<script>
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiWhatsapp, mdiTwitter, mdiFacebook, mdiInstagram } from "@mdi/js";

export default {
  name: "my-component",
  components: {
    SvgIcon,
  },
  data() {
    return {
      whatsapp: mdiWhatsapp,
      fb: mdiFacebook,
      twitter: mdiTwitter,
      insta: mdiInstagram,
    };
  },
};
</script>

<template>
  <div
    class="bg-[#111010] rounded-lg border-[#2a2828] border flex justify-center flex-col items-center h-[100dvh] pb-16"
  >
    <div class="flex items-center justify-center flex-col">
      <img src="../../public/favicon.png" class="h-32 w-32 mb-4" alt="" />
    <h1 class="text-center text-2xl">
      Social App - <span class="text-emerald-600 font-bold">Vue.js</span> and
      <span class="text-orange-400 font-bold">Firebase</span>
    </h1>
      <div
        @click="googleSignin"
        class="w-max flex justify-center mt-4 items-center gap-10 cursor-pointer bg-[var(--bg-light)] py-2 px-6 rounded"
      >
        <div>
          <img
            src="https://tailus.io/sources/blocks/social/preview/images/google.svg"
            class="w-8"
            alt="google logo"
          />
        </div>
        <h1 class="text-slate-300 text-lg">Continue with Google</h1>
      </div>
    </div>
  </div>
</template>
