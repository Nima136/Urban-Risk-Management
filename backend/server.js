const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const ML_SERVER_URL =
  process.env.ML_SERVER_URL || "http://127.0.0.1:5000";

app.use(cors());
app.use(express.json());


// Health check
app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "UrbanRisk Backend API"
    });
});


// ML prediction route
app.post("/api/predict", async (req, res) => {

    try {

        const { type, features } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                error: "Risk type is required"
            });
        }

        if (!["Flood", "Accident"].includes(type)) {
            return res.status(400).json({
                success: false,
                error: "Invalid risk type"
            });
        }

        const mlResponse = await axios.post(
            `${ML_SERVER_URL}/predict`,
            {
                type,
                features: features || {}
            }
        );

        res.json({
            success: true,
            prediction: mlResponse.data
        });

    } catch (error) {

        console.error(
            "ML Server Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: "Unable to get prediction from ML server"
        });
    }
});


app.listen(PORT, () => {

    console.log(
        `UrbanRisk Backend running on http://127.0.0.1:${PORT}`
    );

    console.log(
        `ML Server: ${ML_SERVER_URL}`
    );

});