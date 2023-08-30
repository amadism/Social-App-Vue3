<script setup>

import { watchEffect, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from '@firebase/firestore';
import { auth, db, storage } from '../firebaseConfig';
import { format } from 'timeago.js';
import { getDownloadURL, uploadString, ref as storageRef } from '@firebase/storage';
import { toast } from 'vue3-toastify';

const user = computed(() => {
  return auth.currentUser
})

const route = useRoute()
const tweetReply = ref('')
const selectedFile = ref(null)

const tweetID = computed(() => {
  return route?.params?.tweetID
})
const tagName = computed(() => {
  return route?.params?.tagName
})
const tweet = ref(null)

watchEffect(() => {
  const unsub = onSnapshot(doc(db, "tweets", tweetID.value), (doc) => {
    tweet.value = { ...doc.data(), id: doc.id }
  });
  return () => unsub()
})

const comments = ref([])
watchEffect(() => {
  const unsub = onSnapshot(collection(db, "tweets", tweetID.value, "comments"), (querySnapshot) => {
    const myComments = [];
    querySnapshot.forEach(doc => {
      myComments.push({ ...doc.data(), id: doc.id });
    });

    // Sort comments in descending order based on timestamp
    myComments.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());

    comments.value = myComments;
  });
  return () => unsub();
});


const likes = ref([])
watchEffect(() => {
  const unsub = onSnapshot(collection(db, "tweets", tweetID.value, "likes"), (querySnapshot) => {
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
  const unsub = onSnapshot(collection(db, "tweets", tweetID.value, "retweets"), (querySnapshot) => {
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

const timeAgo = computed(() => {
  let tweetTime = ''
  if (tweet.value) {
    tweetTime = format(tweet?.value.timestamp?.toDate())
  }
  return tweetTime
})


const commentOnPost = async () => {
  const trimmedComment = tweetReply.value.trim(); // Trim the input
    if (trimmedComment.length < 2) {
      toast('comment should be at least 2 characters', {
        type: 'error',
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      });
        return;
    }
    const docRef = await addDoc(
        collection(db, "tweets", tweetID.value, "comments"),
        {
            comment: tweetReply.value,
            user: {
                uid: user.value.uid,
                name: user.value.displayName,
                photoURL: user.value.photoURL,
            },
            timestamp: serverTimestamp(),
        }
    );
    const imageRef = storageRef(storage, `tweets/${tweetID.value}/comments/${docRef.id}/images`);
    if (selectedFile.value) {
      await uploadString(imageRef, selectedFile.value, "data_url").then(async () => {
        const downloadURL = await getDownloadURL(imageRef);
        await updateDoc(doc(db, "tweets", tweetID.value, "comments", docRef.id), {
          image: downloadURL,
        });
      });
    }
    tweetReply.value = ''
    selectedFile.value = null
}


const commentAddImageToPost = (e) => {
    const reader = new FileReader();
    if (e.target.files[0]) {
        reader.readAsDataURL(e.target.files[0]);
    }
    reader.onload = (readerEvent) => {
        selectedFile.value = readerEvent.target.result;
    };
};

const timeOfUpdate = (time) => {
  let updateTime = ''
  updateTime = format(time?.toDate())
  return updateTime
}

const textDirection = computed(() => {
  return containsArabicCharacters(tweet.value.tweet) ? 'rtl' : 'ltr';
});

function containsArabicCharacters(text) {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
}

</script>

<script>
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiImageArea, mdiClose, mdiChatOutline, mdiThumbUpOutline, mdiThumbUp, mdiThumbDownOutline, mdiThumbDown, mdiTrashCanOutline, mdiStepBackward } from '@mdi/js';

export default {
  components: {
    SvgIcon
  },
  data() {
    return {
      backICON: mdiStepBackward,
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
  <section className="w-full scrollbar-hide overflow-scroll col-span-5 sm:col-span-4">
    <div className="sticky top-0 p-2 flex space-x-2 items-center text-lg">
      <router-link to='/home' class="flex gap-1 items-center bg-[var(--bg-light)] text-slate-400 p-1 pr-2 rounded">
        <svg-icon type="mdi" class="w-4" :path="backICON"></svg-icon>
        <h3 class="text-sm">Feeds</h3>
      </router-link>
      
    </div>
    <div class="border-b border-black">
      <div class="p-3">
        <div>
          <div class="flex space-x-2">
            <img :src="tweet?.user?.photoURL" :alt="tagName" className="h-11 w-11 rounded-full border-white border" />
            <div>
              <div class="flex items-center space-x-2">
                <h4 class="font-bold text-base">
                  {{ tweet?.user.name }}
                </h4>
                <div class="w-1 h-1 rounded-full bg-slate-400"></div>
                <div class="text-slate-500 text-xs italic">{{ timeAgo }}</div>
              </div>
              <h5 class="text-[15px] sm:text-base">
                <span class=" text-emerald-600 text-xs">{{ tagName }}</span>
              </h5>
            </div>
          </div>
          <p :style="{ direction: textDirection }" class="text-slate-300 my-2 whitespace-pre-line">{{ tweet?.tweet }}</p>
          <div v-if="tweet?.image" class="my-2">
            <img :src="tweet?.image" :alt="tagName" class="object-contain rounded-xl " />
          </div>
        </div>
        <div class="text-sm flex items-center justify-between px-3">
          <div class="flex space-x-2">
            <p>{{ comments.length }}</p>
            <p>Comments</p>
          </div>
          <div class="flex space-x-2">
            <p>{{ likes.length }}</p>
            <p>Likes</p>
          </div>
          <div class="flex space-x-2">
            <p>{{ retweets.length }}</p>
            <p>Dislikes</p>
          </div>
        </div>
        <div class="flex my-3 justify-between w-full px-3">
          <div class="flex items-center space-x-1">
            <svg-icon type="mdi" :path="commentICON" class="w-6 h-6 text-sky-600 opacity-40"></svg-icon>

          </div>
          <div class="flex items-center space-x-1 cursor-pointer">
            <svg-icon v-if="liked" type="mdi" :path="likeSolid" class=" text-emerald-600 opacity-40"></svg-icon>
            <svg-icon v-else type="mdi" :path="likeICON" class=" opacity-40"></svg-icon>

          </div>
          <div class="flex items-center space-x-1 cursor-pointer">
            <svg-icon v-if="isRetweeted" type="mdi" :path="dislikeSolid" class=" text-red-800 opacity-40"></svg-icon>

            <svg-icon v-else type="mdi" :path="dislikeICON" class="text-slate-300 opacity-40"></svg-icon>
          </div>
        </div>
      </div>
    </div>
    <div class="border-b border-black p-2 px-4">
      <div class="flex mt-4 space-x-3 w-full">
        <img :src="user?.photoURL" :alt="user?.displayName" class="h-11 w-11 rounded-full border-slate-800 border" />
        <form @submit.prevent="commentOnPost" class="flex-grow">
          <textarea :placeholder="'Replying to ' + tagName" rows="2" required v-model="tweetReply"
            class="outline-none tracking-wide min-h-[80px] bg-transparent w-full rounded-md border-slate-700 shadow-sm focus:border-slate-600 focus:ring-0 trxt-slate-300"></textarea>
          <div v-if="selectedFile" class="relative my-2">
            <div class="w-8 h-8 left-1 cursor-pointer">
              <svg-icon @click="selectedFile = null" type="mdi" :path="closeICON"></svg-icon>

            </div>
            <img :src="selectedFile" :alt="user?.displayName" class="rounded-2xl max-h-80 object-contain mb-2" />
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center" @click="pickFile">
              <label for="commentImageFile" class="cursor-pointer">
                <svg-icon class="w-8 h-auto text-slate-300 opacity-90" type="mdi" :path="imageICON"></svg-icon>

              </label>
              <input type="file" id="commentImageFile" hidden @change="commentAddImageToPost" />
            </div>
            <button class="bg-emerald-600 text-sm text-white py-[1px] px-1 my-2 rounded" type="submit">
              Comment
            </button>
          </div>
        </form>
      </div>
    </div>
    <div class="p-3 mb-10">
      <div class="relative">
        <div v-for="comment in comments" :key="comment.id" class="flex space-x-2 my-4 border-b border-black">
          <img :src="comment?.user?.photoURL" :alt="comment?.user?.displayName" class="h-11 w-11 rounded-full" />
          <div>
            <div class="flex items-center space-x-2">
              <h4 class="font-bold text-base">
                {{ comment?.user.name }}
              </h4>
              <div class="w-1 h-1 rounded-full bg-slate-400"></div>
              <div class="text-slate-500 text-xs italic">{{ timeOfUpdate(comment?.timestamp)}}</div>
            </div>
            <h5 class="text-xs">
              Replying to
              <span class=" text-emerald-600 mx-1">{{ tagName }}</span>
            </h5>
            <p  class="text-slate-300 my-2 whitespace-pre-line">{{ comment?.comment }}</p>
            <div v-if="comment?.image" className="my-2">
              <img :src="comment?.image" :alt="comment?.id" class="object-contain rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
