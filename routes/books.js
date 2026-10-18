import express from 'express';
import fs from 'fs';
import { pickFields, validateBook } from '../validators.js';

const router = express.Router();

// Fields a book is allowed to have (anything else sent by the client is ignored)
const BOOK_FIELDS = ['name', 'author', 'year'];

const readData = () => JSON.parse(fs.readFileSync('./db/db.json'));
const writeData = (data) => fs.writeFileSync('./db/db.json', JSON.stringify(data));


//Creem un endpoint per obtenir tots els llibres
router.get("/books",(req,res)=>{
    const data=readData();
    res.render("books", { books: data.books });
})

//endpoint to display new_book.ejs file
router.get("/books/new", (req,res)=> {
    res.render("new_book")
});

router.get("/books/:id/edit", (req, res) => {
    const data = readData();
    const book = data.books.find(b => b.id === parseInt(req.params.id));
    if (!book) return res.status(404).send("Book not found");
    res.render("edit_books", { book });
});



//Creem un endpoint per obtenir un llibre per un id
router.get("/books/:id",(req,res)=>{
    const data=readData();
    //Extraiem l'id de l'url recordem que req es un objecte tipus requets
    // que conté l'atribut params i el podem consultar
    const id=parseInt(req.params.id);
    const book=data.books.find((book)=>book.id===id);
    res.json(book);
})


//Creem un endpoint del tipus post per afegir un llibre
router.post("/books",(req,res)=>{
    const data=readData();
    // New: validate the data before saving it. Errors are sent back as a 400.
    const fields = pickFields(req.body, BOOK_FIELDS);
    const errors = validateBook(fields);
    if (errors.length) return res.status(400).send(errors.join('; '));

    const newBook={
        id:Math.max(0, ...data.books.map(b => b.id)) + 1,
        ...fields,
        year: Number(fields.year), // forms send text, we store a number
    };
    data.books.push(newBook);
    writeData(data);
    res.redirect("/books");
});



//Creem un endpoint per modificar un llibre
router.put("/books/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const bookIndex = data.books.findIndex((book) => book.id === id);
    if (bookIndex === -1) return res.status(404).send("Book not found");

    // New: the update is validated as the full book (old values + new values)
    const fields = pickFields(req.body, BOOK_FIELDS);
    const merged = { ...data.books[bookIndex], ...fields };
    const errors = validateBook(merged);
    if (errors.length) return res.status(400).send(errors.join('; '));

    data.books[bookIndex] = { ...merged, year: Number(merged.year) };
    writeData(data);
    // A form arrives as POST (method-override turns it into PUT) -> go back to the list.
    // Postman sends a real PUT -> JSON. Only ONE response is allowed per request.
    if (req.originalMethod === "POST") return res.redirect("/books");
    res.json({ message: "Book updated successfully" });
});


//Creem un endpoint per eliminar un llibre (only admins, checked in server.js)
router.delete("/books/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const bookIndex = data.books.findIndex((book) => book.id === id);
    if (bookIndex === -1) return res.status(404).send("Book not found");
    //splice esborra a partir de bookIndex, el número de elements 
    // que li indiqui al segon argument, en aquest cas 1
    data.books.splice(bookIndex, 1);
    writeData(data);
    if (req.originalMethod === "POST") return res.redirect("/books");
    res.json({ message: "Book deleted successfully" });
});

export default router;
