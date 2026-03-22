import { initializeApp }                                                    from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signOut, onAuthStateChanged, updateProfile }                       from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs,
         updateDoc, deleteDoc, query, orderBy, serverTimestamp }            from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js"
import { getStorage, ref, uploadString, getDownloadURL }                   from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js"

const app = initializeApp({
  apiKey:            "AIzaSyBMZd-mo5SifK8s6krV6Tm5LUKY0SWJy70",
  authDomain:        "ironmode-54e30.firebaseapp.com",
  projectId:         "ironmode-54e30",
  storageBucket:     "ironmode-54e30.firebasestorage.app",
  messagingSenderId: "71739083110",
  appId:             "1:71739083110:web:50a4ec104b0cf6b2f460a7"
})

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)

export const Auth = {
  async register(name, email, pw) {
    const c = await createUserWithEmailAndPassword(auth, email, pw)
    await updateProfile(c.user, { displayName: name })
    const ini = name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
    await setDoc(doc(db,'users',c.user.uid), { name, email, initials:ini, weight:null, height:null, goal:'Hipertrofia', avatarUrl:null, createdAt:serverTimestamp() })
    return c.user
  },
  async login(email, pw)  { return (await signInWithEmailAndPassword(auth,email,pw)).user },
  async logout()          { await signOut(auth) },
  onState(cb)             { return onAuthStateChanged(auth, cb) }
}

export const DB = {
  async getUser(uid) {
    let s = await getDoc(doc(db,'users',uid))
    if (!s.exists()) {
      const u = auth.currentUser
      const name = u?.displayName || 'Atleta'
      await setDoc(doc(db,'users',uid), { name, email:u?.email||'', initials:name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), weight:null, height:null, goal:'Hipertrofia', avatarUrl:null, createdAt:serverTimestamp() })
      s = await getDoc(doc(db,'users',uid))
    }
    return { uid, ...s.data() }
  },
  updateUser(uid, data)   { return updateDoc(doc(db,'users',uid), data) },
  async uploadAvatar(uid, dataUrl) {
    const r = ref(storage, `avatars/${uid}.jpg`)
    await uploadString(r, dataUrl, 'data_url')
    const url = await getDownloadURL(r)
    await updateDoc(doc(db,'users',uid), { avatarUrl:url })
    return url
  },

  async getPlans(uid)       { const q=query(collection(db,'users',uid,'plans'),orderBy('createdAt','asc')); return (await getDocs(q)).docs.map(d=>({id:d.id,...d.data()})) },
  async addPlan(uid,data)   { const r=await addDoc(collection(db,'users',uid,'plans'),{...data,createdAt:serverTimestamp()}); return {id:r.id,...data} },
  updatePlan(uid,id,data)   { return updateDoc(doc(db,'users',uid,'plans',id), data) },
  deletePlan(uid,id)        { return deleteDoc(doc(db,'users',uid,'plans',id)) },

  async getSessions(uid)    { const q=query(collection(db,'users',uid,'sessions'),orderBy('date','desc')); return (await getDocs(q)).docs.map(d=>({id:d.id,...d.data(),date:d.data().date?.toDate?.()?.toISOString()?.split('T')[0]||new Date().toISOString().split('T')[0]})) },
  async addSession(uid,data){ const r=await addDoc(collection(db,'users',uid,'sessions'),{...data,date:serverTimestamp()}); return {id:r.id,...data} },

  async getCustomEx(uid)    { return (await getDocs(collection(db,'users',uid,'customExercises'))).docs.map(d=>({id:d.id,...d.data(),custom:true})) },
  async addCustomEx(uid,d)  { const r=await addDoc(collection(db,'users',uid,'customExercises'),{...d,createdAt:serverTimestamp()}); return {id:r.id,...d,custom:true} },
  deleteCustomEx(uid,id)    { return deleteDoc(doc(db,'users',uid,'customExercises',id)) }
}
