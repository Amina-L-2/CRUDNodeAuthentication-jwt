import express from 'express';
import fs from 'fs';
import { pickFields, validateMagazine } from '../validators.js';

const router = express.Router();

// Fields a magazine is allowed to have (anything else sent by the client is ignored)
const MAGAZINE_FIELDS = ['name', 'issue', 'publisher', 'category', 'publication_date'];

// Same db.json as the books (it has a "magazines" list too)
const readData = () => JSON.parse(fs.readFileSync('./db/db.json'));
const writeData = (data) => fs.writeFileSync('./db/db.json', JSON.stringify(data));


//Creem un endpoint per obtenir totes les revistes
router.get("/magazines",(req,res)=>{
    const data=readData();
    res.render("magazines", { magazines: data.magazines });
})

//endpoint to display new_magazine.ejs file
router.get("/magazines/new", (req,res)=> {
    res.render("new_magazine")
});

//Pàgina per editar UNA revista
router.get("/magazines/:id/edit", (req, res) => {
    const data = readData();
    const magazine = data.magazines.find(m => m.id === parseInt(req.params.id));
    if (!magazine) return res.status(404).send("Magazine not found");
    res.render("edit_magazines", { magazine });
});

//Creem un endpoint per obtenir una revista per un id
router.get("/magazines/:id",(req,res)=>{
    const data=readData();
    const id=parseInt(req.params.id);
    const magazine=data.magazines.find((magazine)=>magazine.id===id);
    if (!magazine) return res.status(404).send("Magazine not found");
    res.json(magazine);
})


//Creem un endpoint del tipus post per afegir una revista
router.post("/magazines",(req,res)=>{
    const data=readData();
    // New: validate the data before saving it. Errors are sent back as a 400.
    const fields = pickFields(req.body, MAGAZINE_FIELDS);
    const errors = validateMagazine(fields);
    if (errors.length) return res.status(400).send(errors.join('; '));

    const newMagazine={
        id:Math.max(0, ...data.magazines.map(m => m.id)) + 1,
        ...fields,
        issue: Number(fields.issue), // forms send text, we store a number
    };
    data.magazines.push(newMagazine);
    writeData(data);
    res.redirect("/magazines");
});


//Creem un endpoint per modificar una revista
router.put("/magazines/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const magazineIndex = data.magazines.findIndex((magazine) => magazine.id === id);
    if (magazineIndex === -1) return res.status(404).send("Magazine not found");

    // New: the update is validated as the full magazine (old values + new values)
    const fields = pickFields(req.body, MAGAZINE_FIELDS);
    const merged = { ...data.magazines[magazineIndex], ...fields };
    const errors = validateMagazine(merged);
    if (errors.length) return res.status(400).send(errors.join('; '));

    data.magazines[magazineIndex] = { ...merged, issue: Number(merged.issue) };
    writeData(data);
    // Form -> back to the list. Postman (real PUT) -> JSON.
    if (req.originalMethod === "POST") return res.redirect("/magazines");
    res.json({ message: "Magazine updated successfully" });
});


//Creem un endpoint per eliminar una revista (only admins, checked in server.js)
router.delete("/magazines/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const magazineIndex = data.magazines.findIndex((magazine) => magazine.id === id);
    if (magazineIndex === -1) return res.status(404).send("Magazine not found");
    data.magazines.splice(magazineIndex, 1);
    writeData(data);
    if (req.originalMethod === "POST") return res.redirect("/magazines");
    res.json({ message: "Magazine deleted successfully" });
});

export default router;
