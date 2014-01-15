# Chat/Notes for Node.js 

Chat desarrollado con Node.js y MongoDB. Programado con el fin de introducirme y aprender todo de este hermoso y para mi desconocido lenguaje.

Actualmente está corriendo en Heroku: http://chatnotesjs.herokuapp.com/

## Características

Paso a detallar puntos importantes sobre las librerías utilizadas, middlewares, y código escrito, así facilitar la compresión.
- Express.io: framework que une Express (un poderoso servidor web) y Socket.io (establece una comunicación asíncrona entre cliente/servidor), con el fin de simplificar la configuración entre estos dos.
- MongoDB: como base de datos del chat.
- Redis: para almacenar las sesiones de los usuarios.
- Swig: como el motor de plantillas.
- Passport: para controlar la autenticación (inicio de sesión) con redes sociales. (Trabaja sobre el middleware de sesiones configurado en Express).

- Dotenv: para manejar/separar las variables de entorno entre el servidor de desarrollo y el de producción.
* Se debe crear en la raíz un archivo ".env" en el cual se definan las variables de entorno que utiliza la aplicación:
```
#NODE_ENV = 'production'
MONGOHQ_URL = "mongodb://<user>:<password>@server.mongohq.com:<port>/<database>" #https://www.mongohq.com/
REDISTOGO_URL = "redis://redistogo:<password>@server.redistogo.com:<port>/" #https://redistogo.com/
```
De lo contrario se entenderá que el "localhost" es el servidor de MongoDB y Redis.

* Importante: Esta aplicación sólo lee ciertos datos del perfil de usuario cuando se inicia sesión a través de una red social, y únicamente con el fin de conceder el acceso al chat. La información obtenida está segura y nunca se utilizará con otro fin. ;)