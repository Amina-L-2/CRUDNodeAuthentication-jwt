import bcrypt from 'bcryptjs'
import DBLocal from 'db-local'
import crypto from 'node:crypto'
import { SALT_ROUNDS } from './config.js'
const {Schema}=new DBLocal({path:'./db'})

//Creem un esquema per les dades amb els camps especificats.
const User = Schema('User',{
    _id:{type:String,required:true},
    username:{type:String,required:true},
    password:{type:String,required:true}
})

// exportem en una classe per crear usuaris i fer login
export class UserRepository{
    static async create({username,password}){
        //1. Validació opcional usar zod(biblioteca de validaciones)
        //S'haria de fer mes estricte
        Validation.username(username)
        Validation.password(password)
        //2. Asegurarse que el username noooo existe
        const user=User.findOne({username})
        if (user) throw new Error('username already exists')

        //3.Creamos un id si fuera base de datos normal, 
        // mejor que lo genere la base de datos
        const id=crypto.randomUUID()
        //salt row el valor 10 se utiliza para encryptar, más valor añade complejidad i mas tiempo
        //const hashedPassword=bcrypt.hashSync(password,10);
        //const hashedPassword=bcrypt.hashSync(password,SALT_ROUNDS); //bloquea el hilo principal osea tiempo de ejecucion por eso cambiams a hash
        const hashedPassword=await bcrypt.hash(password,SALT_ROUNDS); //como hash devuelve una promesa hay que utilizar await delante y como un async no puede ir sin await lo incluimos en la cabecera static create
        //4. Creamos el usario
        User.create({
            _id:id,
            username,
            password:hashedPassword
        }).save()
        return id
    }
    static async login({username,password}){
        Validation.username(username)
        Validation.password(password)
        //2. Asegurarse que el username existe
        const user=User.findOne({username})
        // Si no existe error
        if(!user) throw new Error('username does not exist')
        //no lo desencripta para compararlo    
        const isValid=await bcrypt.compare(password,user.password)
        
        if (!isValid) throw new Error('password is invalid')
        //Per no enviar el password copiem tot el contingut menys el password
        const {password:_,...publicUser}=user

        return publicUser
    }
   
}
class Validation {
    static username(username){
        if(typeof username != 'string') throw new Error('username must be a string');
        if(username.length < 3) throw new Error('Username superior a 3 caracteres');

    }
    static password(password){
        if(typeof password != 'string') throw new Error('sdfjkl must be a string');
        if(password.length < 6) throw new Error('password superior a 5 caracteres');


    }

}