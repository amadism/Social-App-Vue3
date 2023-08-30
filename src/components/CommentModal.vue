<script setup>
import { computed, ref, watchEffect } from "vue";
import { useTweetStore } from "@/stores/tweets";
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";
import { auth, db, storage } from "../firebaseConfig";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "@firebase/firestore";
import { getDownloadURL, uploadString, ref as storageRef } from "@firebase/storage";
import { PhotoIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { format } from "timeago.js";
import { toast } from "vue3-toastify";

const tweetReply = ref("");
const selectedFile = ref(null);

const user = computed(() => {
  return auth.currentUser;
});

const store = useTweetStore();

const isModal = computed(() => {
  return store.isCommentModalOpen;
});

const tweet = ref(null);
watchEffect(() => {
  tweet.value = store?.tweetSelected;
});

function closeModal() {
  store.openCommentModal();
}

const commentOnPost = async () => {
  try {
    const trimmedComment = tweetReply.value.trim();

    if (trimmedComment.length >= 2) {
      const docRef = await addDoc(collection(db, "tweets", tweet?.value.id, "comments"), {
        comment: trimmedComment,
        user: {
          uid: user.value.uid,
          name: user.value.displayName,
          photoURL: user.value.photoURL,
        },
        timestamp: serverTimestamp(),
      });

      const imageRef = storageRef(
        storage,
        `tweets/${tweet?.value.id}/comments/${docRef.id}/images`
      );
      if (selectedFile.value) {
        await uploadString(imageRef, selectedFile.value, "data_url").then(async () => {
          const downloadURL = await getDownloadURL(imageRef);
          await updateDoc(doc(db, "tweets", tweet?.value.id, "comments", docRef.id), {
            image: downloadURL,
          });
        });
      }

      tweetReply.value = "";
      selectedFile.value = null;

      store.openCommentModal();
      toast("Comment Uploaded!", {
        type: "success",
        theme: "dark",
        position: toast.POSITION.TOP_CENTER,
      });
    } else {
      toast.error("Comment should be at least 2 characters long.", {
        theme: "colored",
      });
    }
  } catch (error) {
    toast.error(error.message, {
      theme: "dark",
    });
  }
};

const commentAddImageToPost = (e) => {
  const reader = new FileReader();
  if (e.target.files[0]) {
    reader.readAsDataURL(e.target.files[0]);
  }
  reader.onload = (readerEvent) => {
    selectedFile.value = readerEvent.target.result;
  };
};

const timeAgo = ref("");
watchEffect(() => {
  const tweetTime = format(tweet?.value.timestamp?.toDate());
  timeAgo.value = tweetTime;
});
</script>

<template>
  <TransitionRoot appear :show="isModal" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-30" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-[var(--bg-light)] p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle
                as="h3"
                class="text-lg font-medium leading-6 text-gray-300 absolute bg-slate-800 rounded-full top-3 right-3 cursor-pointer"
                @click="store.openCommentModal"
              >
                <XMarkIcon class="w-4 text-slate-400" />
              </DialogTitle>
              <div class="flex gap-x-3 relative my-2">
                <span
                  class="w-0.5 h-full z-[-1] absolute left-5 top-11 bg-slate-700"
                ></span>
                <img
                  :src="tweet?.user?.photoURL"
                  :alt="tweet?.user?.name"
                  class="h-11 w-11 rounded-full"
                />
                <div>
                  <div class="inline-block group">
                    <div class="flex items-center space-x-2">
                      <h4 class="font-bold text-base text-slate-300">
                        {{ tweet?.user?.name }}
                      </h4>
                      <div class="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <span class="text-xs italic text-slate-500">
                        {{ timeAgo }}
                      </span>
                    </div>
                    <div>
                      <p class="text-slate-400 my-2">{{ tweet?.tweet }}</p>
                      <div v-if="tweet.image" class="my-2">
                        <img
                          :src="tweet?.image"
                          :alt="tweet?.id"
                          class="object-contain rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex mt-4 space-x-3 w-full">
                <img
                  :src="user?.photoURL"
                  :alt="user?.displayName"
                  class="h-11 w-11 rounded-full"
                />
                <form @submit.prevent="commentOnPost" class="flex-grow">
                  <textarea
                    placeholder="Reply tweet..."
                    rows="2"
                    v-model="tweetReply"
                    class="outline-none tracking-wide min-h-[80px] bg-transparent w-full rounded-md border-slate-700 shadow-sm focus:border-slate-600 focus:ring-0 text-slate-300"
                    required
                  ></textarea>
                  <div v-if="selectedFile" class="relative my-2">
                    <div
                      class="w-8 h-8 left-1 cursor-pointer"
                      @click="selectedFile = null"
                    >
                      <XMarkIcon class="text-slate-300 h-5" />
                    </div>
                    <img
                      v-if="selectedFile"
                      :src="selectedFile"
                      :alt="user.displayName"
                      class="rounded-2xl max-h-80 object-contain mb-2"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <div class="flex items-center" @click="pickFile">
                        <label for="commentImageFile" class="cursor-pointer">
                          <PhotoIcon class="w-8 text-slate-300" />
                        </label>
                        <input
                          type="file"
                          id="commentImageFile"
                          hidden
                          @change="commentAddImageToPost"
                        />
                      </div>
                    </div>
                    <button
                      class="bg-emerald-600 text-white py-1 px-2 my-2 rounded"
                      type="submit"
                    >
                      Comment
                    </button>
                  </div>
                </form>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
