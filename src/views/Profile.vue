<template>
  <div>
    <h2>Your Profile</h2>
    <img :src="user.photoURL + '?v=' + Date.now()" />
    <input type="file" @change="handlePictureUpload" />
    <button @click="updateProfilePicture">Update Profile Picture</button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { db, auth } from "../firebaseConfig"; // Make sure to import the db object
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { doc, collection, updateDoc } from "firebase/firestore"; // Import the Firestore functions

const user = auth.currentUser;
const newProfilePicFile = ref(null);
console.log(user)
const handlePictureUpload = (event) => {
  newProfilePicFile.value = event.target.files[0];
};

const updateProfilePicture = async () => {
  if (!user || !newProfilePicFile.value) {
    console.log("No user signed in or no new profile picture selected.");
    return;
  }

  try {
    const storage = getStorage(); // Get the storage instance
    const storageReference = storageRef(storage, `profile_pictures/${user.uid}`);
    const uploadTask = uploadBytes(storageReference, newProfilePicFile.value);

    // Get the download URL after upload completes
    const snapshot = await uploadTask;
    const newProfilePicUrl = await getDownloadURL(snapshot.ref);

    // Update the user's photoURL in Firestore collection
    try {
      // Get a reference to the user's document in the "users" collection
      const userDocRef = doc(collection(db, "users"), user.uid);

      // Update the user's photoURL field in the document
      await updateDoc(userDocRef, { photoURL: newProfilePicUrl });
      console.log("Profile picture updated successfully.");
    } catch (error) {
      console.error("Error updating profile picture in Firestore:", error);
    }
  } catch (error) {
    console.error("Error updating profile picture:", error);
  }
};
</script>

