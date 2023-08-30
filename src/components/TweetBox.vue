<script setup>
import { auth } from "@/firebaseConfig";
import { computed, ref } from "vue";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "@firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { getDownloadURL, uploadString, ref as storageRef } from "@firebase/storage";
import { toast } from 'vue3-toastify';

const tweet = ref('')
const selectedFile = ref(null)

const user = computed(() => {
  return auth.currentUser;
});



const handleSubmit = async () => {
  const tweetText = tweet.value.trim(); // Remove leading and trailing spaces
    if (tweetText.length < 3) {
      // Display an error message if the tweet text is too short
      toast('At least 3 characters', {
        type: 'error',
        theme: 'dark'
      });
      return; // Exit the function without proceeding
    }
  try {
    const docRef = await addDoc(collection(db, "tweets"), {
      tweet: tweet.value,
      user: {
        uid: user.value.uid,
        name: user.value.displayName,
        photoURL: user.value.photoURL
      },
      timestamp: serverTimestamp()
    })
    const imageRef = storageRef(storage, `tweets/${docRef.id}/images`);
    if (selectedFile.value) {
      await uploadString(imageRef, selectedFile.value, "data_url").then(async () => {
        const downloadURL = await getDownloadURL(imageRef);
        await updateDoc(doc(db, "tweets", docRef.id), {
          image: downloadURL,
        });
      });
    }
    tweet.value = ''
    selectedFile.value = ''
    toast('Tweet Uploaded!', {
      type: "success",
    theme: "dark",
    position: toast.POSITION.TOP_CENTER,
    })
  } catch (error) {
    toast(error.message, {
      type: 'error',
      theme: 'dark',
    position: toast.POSITION.TOP_CENTER,
    })
  }
}


const addImageToPost = (e) => {
  const reader = new FileReader();
  if (e.target.files[0]) {
    reader.readAsDataURL(e.target.files[0]);
  }
  reader.onload = (readerEvent) => {
    selectedFile.value = readerEvent.target.result;
  };
};

const adjustHeight = () => {
  var textarea = document.getElementById("tweetTextArea");
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
};
</script>

<script>
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiImageArea, mdiClose } from '@mdi/js';

export default {
  components: {
    SvgIcon
  },
  data() {
    return {
       imageICON: mdiImageArea,
       closeICON: mdiClose,
    }
  }
}
</script>


<template>
  <div class="flex mt-4 space-x-3 w-full p-2 px-4">
    <img :src="user.photoURL" alt="" class="h-7 w-7 rounded-full border-white border" />

    <form @submit.prevent="handleSubmit" class="flex-grow">

      <textarea rows="2"  v-model="tweet" @input="adjustHeight" id="tweetTextArea" required placeholder="What's Happening?"
        class="outline-none min-h-[80px] bg-transparent w-full rounded border-black shadow-sm focus:border-slate-600 border
        focus:ring-0 focus:outline-none text-base text-slate-300"></textarea>
      <div v-if="selectedFile" class="relative my-2">
        <div class="w-8 h-8 left-1 cursor-pointer" @click="selectedFile = null">
          <svg-icon class="h-5 w-auto" type="mdi" :path="closeICON"></svg-icon>
        </div>
        <img v-if="selectedFile" :src="selectedFile" alt="" class="rounded-2xl max-h-80 object-contain mb-2" />
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="flex items-center" @click="pickFile">
            <label for="imageFile" class="cursor-pointer">
              <svg-icon class="w-8 h-auto opacity-90" type="mdi" :path="imageICON"></svg-icon>
            </label>
            <input type="file" id="imageFile" hidden @change="addImageToPost" />
          </div>
        </div>
        <button class=" bg-emerald-600 text-sm text-white py-[1px] mr-1 px-2 my-2 rounded" type="submit">
          Post
        </button>
      </div>
    </form>
  </div>
</template>

<style>

#tweetTextArea::-webkit-scrollbar{
  display: none;
}
</style>