# MyChat_Firebase_Ionic

El proyecto esta desarrollado en ionic y en firebase como base de datos.
<br>Link de la explicación el video: https://youtu.be/0VY9H-KACPk
<br>Acontinuacion se muestra el detalle de la funcionalidad y explicación del proyecto

## Paginas
- Login
En esta sección tenemos la funcionalidad de ingresar y registrarse en la aplicacion

```python
async signUp() {
    const loading = await this.loadingController.create();
    await loading.present();
    this.chatService
      .signup(this.credentialForm.value)
      .then(
        (user) => {
          loading.dismiss();
          this.router.navigateByUrl('/chat', { replaceUrl: true });
        },
        async (err) => {
          loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Sign up failed',
            message: err.message,
            buttons: ['OK'],
          });

          await alert.present();
        }
      );
  }

  async signIn() {
    const loading = await this.loadingController.create();
    await loading.present();

    this.chatService
      .signIn(this.credentialForm.value)
      .then(
        (res) => {
          loading.dismiss();
          this.router.navigateByUrl('/chat', { replaceUrl: true });
        },
        async (err) => {
          loading.dismiss();
          const alert = await this.alertController.create({
            header: ':(',
            message: err.message,
            buttons: ['OK'],
          });

          await alert.present();
        }
      );
  }

```

- Chat
* Enviar mensaje 
Se puede enviar los mensajes que se vayan creando 


```python
sendMessage() {
    
    this.chatService.addChatMessage(this.newMsg).then(() => {
      this.newMsg = '';
      this.content.scrollToBottom();
    });
  }
```
## Servicios

- Chat service
tendremos las siguientes interfaces
-Mensajes
```python
export interface Message {
  createdAt: firebase.firestore.Timestamp;
  id: string;
  from: string;
  message: string;
  fromName: string;
  myMsg: boolean;
}

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

```

- Añadir mensajes al chat 
aqui encriptaremos los mensajes usando **CryptoJs** y los guardaremos a una collecion llamada **messages**
```python
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
```
Desencriptamos mediante.

```python
getMessageDecrypt(messageForDecrypt){
    return   CryptoJS.AES.decrypt(messageForDecrypt, this.secretEncrypt.trim()).toString(CryptoJS.enc.Utf8);  
  }
```

