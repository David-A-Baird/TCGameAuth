const express = require('express');
const jwt = require('jsonwebtoken');
const { expressjwt } = require('express-jwt');

const auth = expressjwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const port = 3000;
const users = require("./users.json");
const cards = require("./cards.json");

app.get('/getToken', (req, res) => {
    res.send(console.log('GET request received at /getToken'));
});

app.post('/getToken', (req, res) => {
    const formData = req.body;
    console.log('Recieved form data:', formData);
    const firstName = formData.firstName;
    const password = formData.password;
    const user = users.find((user) => user.firstName === firstName);
    if(!user || user.password !== password){
        return(res.status(401).json({errorMessage: 'Invalid Information'}));
    }

    const token = jwt.sign({userId: user.userId}, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '600m'
    });

    res.json({ token });
});

app.get('/cards', auth, (req, res) => {
    res.send(JSON.stringify(cards));
});

// Return all cards with exactly matching details
app.get('/cards/search', auth, (req, res) => {
    const { rarity, type, set } = req.query;
    let filteredCards = cards;
    // Filter by rarity
    if (rarity) {
        filteredCards = filteredCards.filter((card) => card.rarity.toLowerCase() === rarity.toLowerCase());
    }
    // Filter by type
    if (type) {
        filteredCards = filteredCards.filter((card) => card.type.toLowerCase() === type.toLowerCase());
    }
    // Filter by set
    if (set) {
        filteredCards = filteredCards.filter((card) => card.set.toLowerCase() === set.toLowerCase());
    }
    // If no cards show up from this search:
    if (filteredCards.length == 0) {
        res.json("No cards match that search.")
        return;
    }
    res.json({ cards: filteredCards });
});

// Get the length of the cards array
app.get('/cards/count', auth, (req, res) => {
    res.json({ count: cards.length });
});

// Get a random card
app.get('/cards/random', auth, (req, res) => {
    const randomIndex = Math.floor(Math.random() * cards.length);
    res.json({ card: cards[randomIndex] });
});

// Get cards by ID
app.get(
    "/cards/:cardId",
    auth,
    (req, res) => {
        const { cardId } = req.params;
        if (cardId) {
            const card = cards.find((card) => card.cardId === parseInt(cardId));
            if (!card) {
                return res.status(404).json({ errorMessage: "Card not found" });
            }
            return res.json({ cards: [card] });
        }
        res.json({ cards });
    }
);

app.put("/cards", auth, (req, res) => {
    const { cardId, name, description } = req.body;
    const cardIndex = cards.findIndex((card) => card.cardId === cardId);
    if (cardIndex === -1) {
        return res.status(404).json({ errorMessage: "Card not found" });
    }
    cards[cardIndex].cardName = name;
    cards[cardIndex].cardDescription = description;
    res.json({ message: "Card updated successfully", card: cards[cardIndex] });
});

app.get("/cards/create", auth, (req, res) => {
    res.send(console.log('GET request received at /cards/create'));
});

app.post("/cards/create", auth, (req, res) => {
    const { name, description } = req.body;
    const newCard = {
        cardId: cards.length + 1,
        cardName: name,
        cardDescription: description
    }
    cards.push(newCard);
    res.json({ message: "Card created successfully", card: newCard });
});

app.delete("/cards", auth, (req, res) => {
    const { cardId } = req.body;
    const cardIndex = cards.findIndex((card) => card.cardId === cardId);
    if (cardIndex === -1) {
        return res.status(404).json({ errorMessage: "Attempted to delete a non-existent card" });
    }
    const deletedCard = cards.splice(cardIndex, 1);
    res.json({ message: "Card deleted successfully", card: deletedCard[0] });
});

app.get("/cards", auth, (req, res) => {
    const { cardId } = req.query;
    const card = cards.find((card) => card.cardId === parseInt(cardId));
    if (!card) {
        return res.status(404).json({ errorMessage: "Card not found" });
    }
    res.json({ card });
});

app.get("/users/:userId", (req, res) => {
    const user = users.find((user) => user.userId === req.params.userId);
    res.json(user);
});
app.get("/users/", (req, res) => {
    const user = users.find((user) => user.userId === req.query.userId);
    res.json(user);
})

app.use((err, req, res, next) => {
    if(err.name === "UnauthorizedError") {
        res.status(401).json({ errorMessage: err.message })
    }
    else {
        res.status(500).json({ errorMessage: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});