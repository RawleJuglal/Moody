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

const displayNameInputEl = document.getElementById("display-name-input")
const photoURLInputEl = document.getElementById("photo-url-input")
const updateProfileButtonEl = document.getElementById("update-profile-btn")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)

signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)

signOutButtonEl.addEventListener("click", authSignOut)

updateProfileButtonEl.addEventListener("click", authUpdateProfile)

/* === Main Code === */
onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInView()
    showProfilePicture(userProfilePictureEl, user)
    showUserGreeting(userGreetingEl, user)
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

  console.log(email)
  console.log(password)
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

/* == Functions - UI Functions == */

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