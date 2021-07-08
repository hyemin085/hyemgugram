import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore"
import "firebase/storage";
import "firebase/database";

const firebaseConfig ={
    apiKey: "AIzaSyCGkaXzh4E5EVd718LJOxhyPwHgKqL-D-Y",
    authDomain: "hyemgu-s.firebaseapp.com",
    projectId: "hyemgu-s",
    storageBucket: "hyemgu-s.appspot.com",
    messagingSenderId: "156772484113",
    appId: "1:156772484113:web:1dd388e6d6886f37179db0",
    measurementId: "G-BXZL7PX2LT"

};

firebase.initializeApp(firebaseConfig);
const apiKey = firebaseConfig.apiKey;
const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();
const realtime = firebase.database();

export{auth, apiKey, firestore, storage, realtime};
