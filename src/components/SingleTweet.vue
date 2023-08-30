<script setup>
import { computed, watchEffect, ref } from 'vue'
import { collection, deleteDoc, doc, onSnapshot, setDoc } from '@firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { format } from 'timeago.js'
import { useTweetStore } from '@/stores/tweets'

const props = defineProps({
    tweet: Object
})

const textDirection = computed(() => {
  return containsArabicCharacters(props.tweet.tweet) ? 'rtl' : 'ltr';
});

function containsArabicCharacters(text) {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
}

const store = useTweetStore()

const user = computed(() => {
    return auth.currentUser
})

const tweet = computed(() => {
    return props.tweet
})

const comments = ref([])
watchEffect(() => {
    const unsub = onSnapshot(collection(db, "tweets", tweet?.value.id, "comments"), (querySnapshot) => {
        const myComments = []
        querySnapshot.forEach(doc => {
            myComments?.push({ ...doc.data(), id: doc.id })
        })
        comments.value = myComments
    })
    return () => unsub()
})

const likes = ref([])
watchEffect(() => {
    const unsub = onSnapshot(collection(db, "tweets", tweet?.value.id, "likes"), (querySnapshot) => {
        const userLikes = []
        querySnapshot.forEach(doc => {
            userLikes?.push({ ...doc.data(), id: doc.id })
        })
        likes.value = userLikes
    })
    return () => unsub()
})

const retweets = ref([])
watchEffect(() => {
    const unsub = onSnapshot(collection(db, "tweets", tweet?.value.id, "retweets"), (querySnapshot) => {
        let userRetweets = []
        querySnapshot.forEach(doc => {
            userRetweets?.push({ ...doc.data(), id: doc.id })
        })
        retweets.value = userRetweets
    })
    return () => unsub()
})

const liked = ref(null)
watchEffect(() => {
    const isLiked = likes?.value.filter((like) => like?.id === user?.value.uid);
    if (isLiked?.length > 0) {
        liked.value = true
    } else {
        liked.value = false
    }
})

const isRetweeted = ref(null)
watchEffect(() => {
    const isRetweet = retweets?.value.filter((retweet) => retweet?.id === user?.value.uid);
    if (isRetweet?.length > 0) {
        isRetweeted.value = true
    } else {
        isRetweeted.value = false
    }
})

const tagName = ref('')
watchEffect(() => {
    const newTagName = tweet.value.user.name.split(" ").join("-").toLowerCase()
    tagName.value = newTagName
})

const likePost = async () => {
    if (liked.value) {
        await deleteDoc(doc(db, "tweets", tweet.value.id, "likes", user.value.uid));
    } else {
        await setDoc(doc(db, "tweets", tweet.value.id, "likes", user.value.uid), {
            id: tweet.value.user.uid,
            name: tweet.value.user.name,
        });
    }
};

const retweetPost = async () => {
    if (isRetweeted.value) {
      await deleteDoc(doc(db, "tweets", tweet.value.id, "retweets", user.value.uid));
    } else {
      await setDoc(doc(db, "tweets", tweet.value.id, "retweets", user.value.uid), {
        id: tweet.value.user.uid,
        name: tweet.value.user.name,
      });
    }
  };

const commentPost = () => {
    store.openCommentModal(tweet.value)
}

const timeAgo = ref('')
watchEffect(() => {
    const tweetTime = format(tweet?.value.timestamp?.toDate())
    timeAgo.value = tweetTime
})

const deleteModal = () => {
    store.openDeleteModal(tweet.value)
}

</script>

<script>
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiImageArea, mdiClose, mdiChatOutline, mdiThumbUpOutline, mdiThumbUp, mdiThumbDownOutline, mdiThumbDown, mdiTrashCanOutline } from '@mdi/js';

export default {
  components: {
    SvgIcon
  },
  data() {
    return {
       imageICON: mdiImageArea,
       closeICON: mdiClose,
       commentICON: mdiChatOutline,
       likeICON: mdiThumbUpOutline,
       likeSolid: mdiThumbUp,
       dislikeICON: mdiThumbDownOutline,
       dislikeSolid: mdiThumbDown,
       deleteICON: mdiTrashCanOutline,
    }
  }
}
</script>

<template>
    <div class=" shadow-lg shadow-black rounded bg-[var(--bg-light)] p-2 my-4">
        <router-link :to="`/tweet/@${tagName}/${tweet.id}`">
            <div class="flex space-x-2">
                <img :src="tweet?.user?.photoURL" :lt="tweet?.user?.name"
                    class="w-16 h-16 border border-slate-800 rounded-full" />
                <div>
                    <div class="mt-2">
                        <div class="flex items-center space-x-2">
                            <h4 class="font-bold text-sm text-slate-300">
                                {{ tweet?.user.name }}
                            </h4>
                            <div class="w-1 h-1 rounded-full bg-slate-300"></div>
                            <p class="text-slate-500 font-semibold text-xs italic">{{ timeAgo }}</p>
                        </div>
                        <h5 class="text-xs text-emerald-600">
                            @<span class=" text-emerald-600">{{tagName}}</span>
                        </h5>
                    </div>
                    <p :style="{ direction: textDirection }" class="text-slate-400 my-2 whitespace-pre-line">{{ tweet?.tweet }}</p>
                    <div v-if="tweet?.image">
                        <div class="my-2">
                            <img :src="tweet?.image" :alt="tweet?.id" class="object-contain rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </router-link>
        <div class="flex justify-around m-2">
           
            <div class="flex items-center space-x-1 cursor-pointer" @click="likePost">
                <svg-icon v-if="liked" class=" text-emerald-600"  type="mdi" :path="likeSolid"></svg-icon>

                <svg-icon v-else class="text- w-6"  type="mdi" :path="likeICON"></svg-icon>
                <p v-if="likes.length > 0" class="text-slate-300">{{ likes.length }}</p>
            </div>

            <div class="flex items-center space-x-1 cursor-pointer" @click="commentPost">
                
                <svg-icon class="text-sky-600" type="mdi" :path="commentICON"></svg-icon>

                <p v-if="comments.length > 0" class="text-slate-300">
                    {{ comments?.length }}
                </p>
            </div>

            <div class="flex items-center space-x-1 cursor-pointer" @click="retweetPost">
                
                <svg-icon v-if="isRetweeted" type="mdi" :path="dislikeSolid" class="text-red-800"></svg-icon>
                
                <svg-icon v-else type="mdi" :path="dislikeICON" class="text-slate-300"></svg-icon>
                <p v-if="retweets.length > 0" class="text-slate-300">{{ retweets?.length }}</p>
            </div>

            <svg-icon @click="deleteModal" v-if="tweet?.user?.uid === user?.uid" type="mdi" :path="deleteICON" class="text-pink-600 cursor-pointer"></svg-icon>
        </div>
    </div>
</template>
