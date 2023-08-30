<script setup>
import { collection, onSnapshot, orderBy, query } from "@firebase/firestore"
import { watchEffect, ref, computed } from 'vue'
import { db } from "../firebaseConfig";
import SingleTweet from './SingleTweet.vue'
import CommentModal from "./CommentModal.vue";
import { useTweetStore } from '@/stores/tweets'
import DeleteTweet from "./DeleteTweet.vue";

const tweets = ref([])
const loadingTweets = ref(true)
const store = useTweetStore()

const isModal = computed(() => {
  return store.isCommentModalOpen
})

watchEffect(() => {
  const q = query(collection(db, "tweets"), orderBy("timestamp", "desc"));
  const unsub = onSnapshot(q, (querySnapshot) => {
    const myTweets = []
    querySnapshot.forEach(doc => {
      myTweets.push({ ...doc.data(), id: doc.id })
    })
    tweets.value = myTweets
    loadingTweets.value = false
  })
  return () => unsub()
})
</script>

<template>
  <div class="mx-4">
    <div v-if="loadingTweets" className="mx-auto my-12 w-10 h-10 border-emerald-600 rounded-full border-[5px] border-r-transparent animate-spin">
    </div>
    <div v-else>
      <SingleTweet v-for="tweet in tweets" :key="tweet.id" :tweet="tweet" />
    </div>
    <CommentModal v-if="isModal" />
    <DeleteTweet />
  </div>
</template>
