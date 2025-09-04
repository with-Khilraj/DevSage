const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    }),
);
app.use(express.json());


const PORT = process.env.PORT || 5000;


// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => {
            console.log(`server is running on port ${PORT}`)
        });
    })
    .catch((err) => {
        console.error('Error connecting to mongoDB', err);
    });