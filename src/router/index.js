import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import HomeTweets from '../components/HomeTweets.vue';
import LoginView from '../views/LoginView.vue'
import { auth } from "@/firebaseConfig"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      component: HomeView,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: '/tweet/:tagName/:tweetID',
          component: () => import("../views/TweetPost.vue")
        },
        {
          path: '/home',
          component: HomeTweets,
        }
      ]
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue')
    }
  ],
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = auth.currentUser;

  if (requiresAuth && !isAuthenticated) {
    next({ name: "login" });
  } else if (isAuthenticated && to.path === "/") {
    // Redirect authenticated users from root URL to /home
    next({ path: "/home" });
  } else {
    next();
  }
});

export default router;
