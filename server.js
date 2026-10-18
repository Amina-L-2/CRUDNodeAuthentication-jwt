import express from 'express';
import methodOverride from 'method-override';
import {UserRepository} from './user-repository.js';
import {PORT, SECRET_JWT_KEY} from './config.js'
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import booksRouter from './routes/books.js';
import magazinesRouter from './routes/magazines.js';

const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(express.static("public")); // Carrega CSS i altres fitxers públics
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs'); // Motor de plantilles
app.set('views', './views'); // Ubicació de les plantilles

//inicio middleware
app.use((req,res,next) => {
    const token = req.cookies.access_token
    req.session = {user:null}
    try{
        const data = jwt.verify(token, SECRET_JWT_KEY)
        req.session.user = data
        
    } catch(error){
        req.session.user = null
    }
    res.locals.user = req.session.user // disponible en todas las plantillas EJS
    next() // seguir a la siguiente ruta o middleware.
})

// Only logged-in users can use the books and magazines CRUD
// (the routers go AFTER the middleware above, so req.session.user is already loaded)
app.use(['/books', '/magazines'], (req, res, next) => {
    if (!req.session.user) return res.status(403).send("Access not authorized")
    // Business rules:
    //  - any logged-in user can list, create and edit
    //  - only admins can delete
    // (the HTML forms send POST + _method=DELETE; methodOverride has already turned it into DELETE here)
    if (req.method === 'DELETE' && req.session.user.role !== 'admin') {
        return res.status(403).send("Only admins can delete")
    }
    next()
})
app.use(booksRouter);
app.use(magazinesRouter);

app.post('/register', async (req,res)=>{
    //aqui el body es el cuerpo de la petición
    const {username,password}=req.body
    try{
        const id= await UserRepository.create({username,password});
        // log the new user in right away, because register.js sends them to /protected
        // new accounts are always normal users; admins are set manually in db/User.json
        const token = jwt.sign({id, username, role:'user'}, SECRET_JWT_KEY, {expiresIn:'1h'})
        res.cookie('access_token',token,{
            httpOnly:true,
            secure: process.env.NODE_ENV==='production',
            sameSite:'strict',
            maxAge:1000*60*60
        })
        res.send({id})
    }catch(error){
        //No es buena idea mandar el error del repositorio
        res.status(400).send(error.message)
    }
});

app.post('/login', async (req,res)=>{
    try{
        const {username,password}=req.body
        console.log("llego aqui")
        const user = await UserRepository.login({username,password})
        console.log("llego aqui 1")
        const token = jwt.sign(
            {id: user._id, username: user.username, role: user.role || 'user'},
            SECRET_JWT_KEY, 
            {
            expiresIn:'1h'
            })
            console.log("llego aqui 2")
        res
        .cookie('access_token',token,{
            httpOnly:true, //la cookie solo se puede acceder en el servidor, no podrem fer un document.cookie
            //secure:true, //la cookie solo funciona en https
            secure: process.env.NODE_ENV==='production',
            sameSite:'strict', //la cookie es pot accedir dins del domini
            maxAge:1000*60*60 //la cookie te un temps de validesa d'una hora
        })
        .send({ user,token })
    }catch (error){
        //401 = no autorització
        res.status(401).send(error.message)
    }
});

app.post('/logout',(req,res)=>{
    res
    .clearCookie('access_token')
    .json({message:'logout successfull'})
    //.send('logout');
})

//To make the endpoints of /login and /logout work in URL
app.get('/login', (req, res) => {
    res.render("login");
});
app.get('/logout', (req, res) => {
    res.clearCookie('access_token').redirect('/');
});

app.get('/protected',(req,res) => {
    const {user} = req.session;
    if (!user) return res.status(403).send("Access not authorized")
    res.render("protected", {user})

})

// Profile page: shows the data of the logged-in user (read from the token)
app.get('/profile', (req, res) => {
    const {user} = req.session;
    if (!user) return res.status(403).send("Access not authorized")
    res.render("profile", {user})
})

app.get('/',(req,res) => {
    //const {user} = req.session;
    const username = "" 
    res.render("login", username)
})



app.listen(PORT,() => {
    console.log(`server running on ${PORT}`)
})