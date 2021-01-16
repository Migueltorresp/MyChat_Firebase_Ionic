import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { switchMap, map, timestamp } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';

export interface User {
  uid: string;
  email: string;
}
export interface Message {
  createdAt: firebase.firestore.Timestamp;
  id: string;
  from: string;
  message: string;
  fromName: string;
  myMsg: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  secretEncrypt = "ThisIsSecret";
  currentUser: User = null;
  newFile: '';
  textEncrypt:string;
  textenc:string;
  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.afAuth.onAuthStateChanged((user) => {
      this.currentUser = user;      
    });
  }

//Añadir mensajes al chat 
addChatMessage(msg) {
  const messageEncrypt=CryptoJS.AES.encrypt(msg, this.secretEncrypt.trim()).toString();
  console.log('Message Encrypt',messageEncrypt);
  return this.afs.collection('messages').add({
    message: messageEncrypt,
    from: this.currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}



//Obtener los mensajes de los usuarios 
  getChatMessages() {
    let users = [];
    return this.getUsers().pipe(
      switchMap(res => {
        users = res;
        return this.afs.collection('messages', ref => ref.orderBy('createdAt')).valueChanges({ idField: 'id' }) as Observable<Message[]>;
      }),
      map(messages => {
        // Get the real name for each user
        for (let m of messages) {          
          m.fromName = this.getUserForMsg(m.from, users);
          m.myMsg = this.currentUser.uid === m.from;
          m.message=this.getMessageDecrypt(m.message);
          console.log('Message Decrypt',m.message);
        }        
        return messages
      })
    )
  }

  //Desencriptar mensajes
  getMessageDecrypt(messageForDecrypt){
    return   CryptoJS.AES.decrypt(messageForDecrypt, this.secretEncrypt.trim()).toString(CryptoJS.enc.Utf8);  
  }


  //Recibiendo los datos del usuario 
  private getUsers() {
    return this.afs.collection('users').valueChanges({ idField: 'uid' }) as Observable<User[]>;
  }
  //Recibiendo los mensajes por cada usuario
  private getUserForMsg(msgFromId, users: User[]): string {    
    for (let usr of users) {
      if (usr.uid == msgFromId) {
        return usr.email;
      }
    }
    return 'Deleted';
  }

  //Formas de ingresar a la aplicacion login, registro y salir 
  async signup({ email, password, userName }): Promise<any> {
    const credential = await this.afAuth.createUserWithEmailAndPassword(
      email,
      password,
    );

    const uid = credential.user.uid;

    return this.afs.doc(
      `users/${uid}`
    ).set({
      uid,
      email: credential.user.email,
    })
  }

  signIn({ email, password }) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  signOut(): Promise<void> {
    return this.afAuth.signOut();
  }
}
