/* === Imports === */
import './style.css'
import { initializeApp } from "firebase/app";
import { getAuth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile 
} from "firebase/auth";
import {  getFirestore,
          collection, 
          addDoc,
          serverTimestamp,
          getDocs,
          onSnapshot,
          QuerySnapshot,
          query, 
          where,
          orderBy,
          updateDoc,
          doc,
          deleteDoc,
} from "firebase/firestore";
/* === Firebase Setup === */
const firebaseConfig = {
  apiKey: "AIzaSyBEiqHhHs0u5auiqPFwuTBMZuZ45pIAo5Q",
  authDomain: "moody-82080.firebaseapp.com",
  projectId: "moody-82080",
  storageBucket: "moody-82080.appspot.com",
  messagingSenderId: "661576090290",
  appId: "1:661576090290:web:aa800ef1879ac83b93bfab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view")
const viewLoggedIn = document.getElementById("logged-in-view")

const signInWithGoogleButtonEl = document.getElementById("sign-in-with-google-btn")

const emailInputEl = document.getElementById("email-input")
const passwordInputEl = document.getElementById("password-input")

const signInButtonEl = document.getElementById("sign-in-btn")
const createAccountButtonEl = document.getElementById("create-account-btn")

const signOutButtonEl = document.getElementById("sign-out-btn")

const userProfilePictureEl = document.getElementById("user-profile-picture")
const userGreetingEl = document.getElementById("user-greeting")

const updateContainerEl = document.getElementById('display-update')
const displayNameInputEl = document.getElementById("display-name-input")
const photoURLInputEl = document.getElementById("photo-url-input")
const updateProfileButtonEl = document.getElementById("update-profile-btn")

const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn")
const textareaEl = document.getElementById("post-input")
const postButtonEl = document.getElementById("post-btn")

const allFilterButtonEl = document.getElementById("all-filter-btn")

const filterButtonEls = document.getElementsByClassName("filter-btn")

//Was used to fetch post once but removed with real time snapshot
// const fetchPostsButtonEl = document.getElementById("fetch-posts-btn")

const postsEl = document.getElementById("posts")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)

signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)

signOutButtonEl.addEventListener("click", authSignOut)

updateProfileButtonEl.addEventListener("click", authUpdateProfile)

for (let moodEmojiEl of moodEmojiEls) {
  moodEmojiEl.addEventListener("click", selectMood)
}

for (let filterButtonEl of filterButtonEls) {
  filterButtonEl.addEventListener("click", selectFilter)
}

postButtonEl.addEventListener("click", postButtonPressed)

//Was used with the commented fetch post button before realtime update
// fetchPostsButtonEl.addEventListener("click", fetchOnceAndRenderPostsFromDB)

/* === State === */

let moodState = 0

/* === Global Constants === */

const collectionName = "posts"

/* === Main Code === */
onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInView()
    showProfilePicture(userProfilePictureEl, user)
    showUserGreeting(userGreetingEl, user)
    if(!user.photoURL){
      showView(updateContainerEl)
      
    } else {
      hideView(updateContainerEl)
    }
    updateFilterButtonStyle(allFilterButtonEl)
    fetchAllPosts(user)
  } else {
    showLoggedOutView()
  }
});


/* === Functions === */

/* = Functions - Firebase - Authentication = */

function authSignInWithGoogle() {
  signInWithPopup(auth, provider)
  .then((result) => {
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    // The signed-in user info.
    const user = result.user;
    // IdP data available using getAdditionalUserInfo(result)
    // ...
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    // ...
  });
}

function authSignInWithEmail() {
    const email = emailInputEl.value;
    const password = passwordInputEl.value

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        clearAuthFields()
      })
      .catch((error) =>{
        const errorCode = error.code;
        const errorMessage = error.message;

        console.error(`${errorCode} - ${errorMessage}`)
      })
}

function authCreateAccountWithEmail() {
  const email = emailInputEl.value;
  const password = passwordInputEl.value;
  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    sendEmailVerification(auth.currentUser)
      .then(() => {
        clearAuthFields()
      });
    
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error(errorMessage)
  });
}

function authSignOut() {
 signOut(auth)
  .then(()=>{

  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;

    console.error(`${errorCode} - ${errorMessage}`)
  })
}

function authUpdateProfile(){
  const newDisplayName = displayNameInputEl.value;
  const newPhotoURL = photoURLInputEl.value;
  updateProfile(auth.currentUser, {
    displayName: newDisplayName, photoURL: newPhotoURL
  }).then(() => {
    console.log(`Profile Updated`)
  }).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error(`${errorCode} - ${errorMessage}`)
  });
}

/* = Functions - Firebase - Firestore = */
async function addPostToDB(postBody, user){
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      body:postBody,
      uid:user.uid,
      createdAt: serverTimestamp(),
      mood:moodState
    })
    console.log(`Document written with ${docRef.id}`)
  } catch (error) {
    console.error(`Error trying to save to database - ${error.message}`)
  }
}

async function updatePostInDB(docId, newBody) {
  const postsRef = doc(db, collectionName, docId);
  await updateDoc(postsRef, {body: newBody})
}

async function deletePostFromDB(docId) {
      await deleteDoc(doc(db, collectionName, docId));
}

//Was removed once we added the real time snapshot feature 
// async function fetchOnceAndRenderPostsFromDB() {
//       const querySnapshot = await getDocs(collection(db, collectionName));
//       clearAll(postsEl)
//       querySnapshot.forEach((doc) => {
//         renderPost(postsEl, doc.data())
//       });
// }

function fetchInRealtimeAndRenderPostsFromDB(query, user){
  onSnapshot(query, (querySnapshot) => {
    clearAll(postsEl)
    querySnapshot.forEach((doc) => {
      renderPost(postsEl, doc)
    })
  })
}

function fetchTodayPosts(user){
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)
  
  const postsRef = collection(db, collectionName)
  
  const q = query(postsRef, where("uid", "==", user.uid),
                            where("createdAt", ">=", startOfDay),
                            where("createdAt", "<=", endOfDay),
                            orderBy("createdAt", "desc"))
                            
  fetchInRealtimeAndRenderPostsFromDB(q, user) 
}

function fetchWeekPosts(user) {
  const startOfWeek = new Date()
  startOfWeek.setHours(0, 0, 0, 0)
  
  if (startOfWeek.getDay() === 0) { // If today is Sunday
      startOfWeek.setDate(startOfWeek.getDate() - 6) // Go to previous Monday
  } else {
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
  }
  
  const endOfDay = new Date();
  endOfDay.setHours = (23, 59, 59, 999);

  const postRef = collection(db, collectionName);
  const q = query(postRef, where("uid", "==", user.uid),
                            where("createdAt", ">=", startOfWeek),
                            where("createdAt", "<=", endOfDay),
                            orderBy("createdAt", "desc"))

  fetchInRealtimeAndRenderPostsFromDB(q, user);
}

function fetchMonthPosts(user) {
  const startOfMonth = new Date()
  startOfMonth.setHours(0, 0, 0, 0)
  startOfMonth.setDate(1)

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const postsRef = collection(db, collectionName)
  
  const q = query(postsRef, where("uid", "==", user.uid),
                            where("createdAt", ">=", startOfMonth),
                            where("createdAt", "<=", endOfDay),
                            orderBy("createdAt", "desc"))

  fetchInRealtimeAndRenderPostsFromDB(q, user);
}

function fetchAllPosts(user) {
  const postsRef = collection(db, collectionName);

  const q = query(postsRef, where("uid", "==", user.uid),
                            orderBy("createdAt", "desc"))

  fetchInRealtimeAndRenderPostsFromDB(q, user);
}

/* == Functions - UI Functions == */
function createPostHeader(postData) {
 /* <div class="header"></div> */
 const headerDiv = document.createElement("div")
 headerDiv.className = "header"

   /* <h3>21 Sep </h3> */
   const headerDateEl = document.createElement('h3');
   headerDateEl.textContent = displayDate(postData.createdAt);

   /* <img src='assets/emojis/5.png'> */
   const moodImage = document.createElement("img")
   moodImage.src = `assets/emojis/${postData.mood}.png`
   

  headerDiv.appendChild(headerDateEl); 
  headerDiv.appendChild(moodImage)  

  return headerDiv
}

function createPostBody(postData){ 
  const postBody = document.createElement("p")
    postBody.innerHTML = replaceNewlinesWithBrTags(postData.body)
    
    return postBody
}

function createPostUpdateButton(wholeDoc) {

  const postId = wholeDoc.id;
  const postData = wholeDoc.data();
  /* 
      <button class="edit-color">Edit</button>
  */
  const button = document.createElement("button")
  button.textContent = "Edit"
  button.classList.add("edit-color")
  button.addEventListener("click", function() {
      const newBody = prompt("Edit the post", postData.body)

      if(newBody) { 
        updatePostInDB(postId, newBody) 
      }
  })
  
  return button
}

function createPostDeleteButton(wholeDoc) {
  const postId = wholeDoc.id
  
  /* 
      <button class="delete-color">Delete</button>
  */
  const button = document.createElement('button')
  button.textContent = 'Delete'
  button.classList.add("delete-color")
  button.addEventListener('click', function() {
      deletePostFromDB(postId)
  })
  return button
}

function createPostFooter(wholeDoc) {
  /* 
      <div class="footer">
          <button>Edit</button>
      </div>
  */
  const footerDiv = document.createElement("div")
  footerDiv.className = "footer"
  
  footerDiv.appendChild(createPostUpdateButton(wholeDoc))
  footerDiv.appendChild(createPostDeleteButton(wholeDoc))
  
  return footerDiv
}

function renderPost(postsEl, wholeDoc) {
  //Was Removed when the createElement lesson was introduced
  // postsEl.innerHTML += `<div class="post">
  //   <div class="header">
  //       <h3>${displayDate(postData.createdAt)}</h3>
  //       <img src="assets/emojis/${postData.mood}.png">
  //   </div>
  //   <p>
  //       ${replaceNewlinesWithBrTags(postData.body)}
  //   </p>
  // </div>`
  const postData = wholeDoc.data()

  const postDiv = document.createElement("div");
  postDiv.className = "post";

  postDiv.appendChild(createPostHeader(postData));
  postDiv.appendChild(createPostBody(postData));
  postDiv.appendChild(createPostFooter(wholeDoc ))

  postsEl.appendChild(postDiv);
}

function replaceNewlinesWithBrTags(inputString) {
  return inputString.replace(/\n/g, "<br>")
}

function postButtonPressed() {
  const postBody = textareaEl.value
  const user = auth.currentUser
  
  if (postBody && moodState) {
      addPostToDB(postBody, user)
      clearInputField(textareaEl)
      resetAllMoodElements(moodEmojiEls)
  }
}

function clearAll(element) {
  element.innerHTML = ""
}

function showLoggedOutView() {
    hideView(viewLoggedIn)
    showView(viewLoggedOut)
}

function showLoggedInView() {
    hideView(viewLoggedOut)
    showView(viewLoggedIn)
}

function showView(view) {
    view.style.display = "flex"
}

function hideView(view) {
    view.style.display = "none"
}

function clearInputField(field) {
	field.value = ""
}

function clearAuthFields() {
	clearInputField(emailInputEl)
	clearInputField(passwordInputEl)
}

function showProfilePicture(imgElement, user) {
  const photo = user.photoURL ? user.photoURL : 'assets/images/default-profile-picture.jpeg'
  imgElement.src = photo;
}

function showUserGreeting(element, user) {
  const displayName = user.displayName
    
  if (displayName) {
      const userFirstName = displayName.split(" ")[0]
      
      element.textContent = `Hey ${userFirstName}, how are you?`
  } else {
      element.textContent = `Hey friend, how are you?`
  }    
}

function displayDate(firebaseDate) {
  if (!firebaseDate) {
    return "Date processing..." 
  }

  const date = firebaseDate.toDate()
  
  const day = date.getDate()
  const year = date.getFullYear()
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = monthNames[date.getMonth()]

  let hours = date.getHours()
  let minutes = date.getMinutes()
  hours = hours < 10 ? "0" + hours : hours
  minutes = minutes < 10 ? "0" + minutes : minutes

  return `${day} ${month} ${year} - ${hours}:${minutes}`
}

/* = Functions - UI Functions - Mood = */

function selectMood(event) {
  const selectedMoodEmojiElementId = event.currentTarget.id
  
  changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, moodEmojiEls)
  
  const chosenMoodValue = returnMoodValueFromElementId(selectedMoodEmojiElementId)
  
  moodState = chosenMoodValue
}

function changeMoodsStyleAfterSelection(selectedMoodElementId, allMoodElements) {
  for (let moodEmojiEl of moodEmojiEls) {
      if (selectedMoodElementId === moodEmojiEl.id) {
          moodEmojiEl.classList.remove("unselected-emoji")          
          moodEmojiEl.classList.add("selected-emoji")
      } else {
          moodEmojiEl.classList.remove("selected-emoji")
          moodEmojiEl.classList.add("unselected-emoji")
      }
  }
}

function resetAllMoodElements(allMoodElements) {
  for (let moodEmojiEl of allMoodElements) {
      moodEmojiEl.classList.remove("selected-emoji")
      moodEmojiEl.classList.remove("unselected-emoji")
  }
  
  moodState = 0
}

function returnMoodValueFromElementId(elementId) {
  return Number(elementId.slice(5))
}

/* == Functions - UI Functions - Date Filters == */

function resetAllFilterButtons(allFilterButtons) {
  for (let filterButtonEl of allFilterButtons) {
      filterButtonEl.classList.remove("selected-filter")
  }
}

function updateFilterButtonStyle(element) {
  element.classList.add("selected-filter")
}

function fetchPostsFromPeriod(period, user){
  if(period == 'today'){
    fetchTodayPosts(user)
  } else if(period == 'week'){
    fetchWeekPosts(user)
  } else if(period == 'month'){
    fetchMonthPosts(user)
  } else if(period == 'all'){
    fetchAllPosts(user)
  } else {
    console.log("nothing matches")
  }
}

function selectFilter(event) {
  const user = auth.currentUser
  
  const selectedFilterElementId = event.target.id
  
  const selectedFilterPeriod = selectedFilterElementId.split("-")[0]
  
  const selectedFilterElement = document.getElementById(selectedFilterElementId)
  
  resetAllFilterButtons(filterButtonEls)
  
  updateFilterButtonStyle(selectedFilterElement)

  fetchPostsFromPeriod(selectedFilterPeriod, user)
  
}