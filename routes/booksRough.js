import express from 'express';
import fs from 'fs';

const router = express.Router();

const readData = () => JSON.parse(fs.readFileSync('./db/db.json'));
const writeData = (data) => fs.writeFileSync('./db/db.json', JSON.stringify(data));


//Creem un endpoint per obtenir tots els llibres
router.get("/books",(req,res)=>{
    const data=readData();
    res.json(data.books);
})

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
    const body=req.body;
    //todo lo que viene en ...body se agrega al nuevo libro
    const newBook={
        id:data.books.length+1,
        ...body,
    };
    data.books.push(newBook);
    writeData(data);
    res.json(newBook);
});


//Creem un endpoint per modificar un llibre
router.put("/books/:id", (req, res) => {
    const data = readData();
    const body = req.body;
    const id = parseInt(req.params.id);
    const bookIndex = data.books.findIndex((book) => book.id === id);
    data.books[bookIndex] = {
      ...data.books[bookIndex],
      ...body,
    };
    writeData(data);
    res.json({ message: "Book updated successfully" });
});


//Creem un endpoint per eliminar un llibre
router.delete("/books/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const bookIndex = data.books.findIndex((book) => book.id === id);
    //splice esborra a partir de bookIndex, el número de elements 
    // que li indiqui al segon argument, en aquest cas 1
    data.books.splice(bookIndex, 1);
    writeData(data);
    res.json({ message: "Book deleted successfully" });
});

export default router;