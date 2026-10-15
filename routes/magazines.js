import express from 'express';
import fs from 'fs';

const router = express.Router();

// Same db.json as the books (it has a "magazines" list too)
const readData = () => JSON.parse(fs.readFileSync('./db/db.json'));
const writeData = (data) => fs.writeFileSync('./db/db.json', JSON.stringify(data));


//Creem un endpoint per obtenir totes les revistes
router.get("/magazines",(req,res)=>{
    const data=readData();
    res.render("magazines", { magazines: data.magazines });
})

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
    const body=req.body;
    const newMagazine={
        id:Math.max(0, ...data.magazines.map(m => m.id)) + 1,
        ...body,
    };
    if (newMagazine.issue !== undefined) newMagazine.issue = Number(newMagazine.issue);
    data.magazines.push(newMagazine);
    writeData(data);
    res.json(newMagazine);
});


//Creem un endpoint per modificar una revista
router.put("/magazines/:id", (req, res) => {
    const data = readData();
    const body = req.body;
    const id = parseInt(req.params.id);
    const magazineIndex = data.magazines.findIndex((magazine) => magazine.id === id);
    if (magazineIndex === -1) return res.status(404).send("Magazine not found");
    if (body.issue !== undefined) body.issue = Number(body.issue); // el formulari envia text
    data.magazines[magazineIndex] = {
      ...data.magazines[magazineIndex],
      ...body,
    };
    writeData(data);
    // Form -> back to the list. Postman (real PUT) -> JSON.
    if (req.originalMethod === "POST") return res.redirect("/magazines");
    res.json({ message: "Magazine updated successfully" });
});


//Creem un endpoint per eliminar una revista
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
