const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

// Slack Webhook URL (Replace with your actual webhook URL)
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
if (!SLACK_WEBHOOK_URL) {
    console.error(" Error: SLACK_WEBHOOK_URL is missing in .env file.");
    process.exit(1); // Stop execution if the webhook is missing
}

// Queue to store pending messages & prevent duplicate processing
const pendingUpdates = [];
let isProcessing = false; //  Prevents multiple processes running at the same time

// Function to send a message to Slack
async function sendToSlack(user, type, score) {
    const individualAttempts = user.quizHistory?.[type] || 1; // Get individual attempts for quiz type
    const message = `*Quiz Completed!*  
 User: *${user.username || "Unknown"}*  
 Quiz Type: *${type || "Unknown"}*  
 Score: *${score || 0}*  
 Total Attempts (All Quizzes): *${user.quizAttempts ? user.quizAttempts + 1 : 1}*  
 Attempts for *${type}*: *${individualAttempts}*  
 Last Activity: *${user.lastActivity || "Unknown"}*`;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await axios.post(SLACK_WEBHOOK_URL, { text: message });
            if (response.status === 200) {
                console.log(` Slack message sent successfully (Attempt ${attempt})`);
                return;
            }
        } catch (error) {
            console.error(` Slack message failed (Attempt ${attempt}):`, error.response?.data || error.message);
            if (attempt < 3) {
                console.log("Retrying in 2 seconds...");
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retrying
            } else {
                console.log(" Giving up after 3 failed attempts.");
            }
        }
    }
}

// Watch MongoDB for quiz updates
const processedUpdates = new Set(); //  Prevents duplicate messages for the same quiz update

async function watchQuizUpdates() {
    try {
        const db = mongoose.connection;
        const userCollection = db.collection("users");

        const changeStream = userCollection.watch([
            { $match: { operationType: "update" } }
        ]);

        console.log(" Watching for quiz updates...");

        changeStream.on("change", async (change) => {
            if (!change.documentKey || !change.documentKey._id) {
                console.error(" Missing userId in change event.");
                return;
            }

            const userId = change.documentKey._id.toString();
            const updatedFields = change.updateDescription.updatedFields;
            console.log("🔄 Change detected:", updatedFields);

            //  Ignore duplicate updates
            if (processedUpdates.has(userId)) {
                console.log(" Skipping duplicate update for user:", userId);
                return;
            }
            processedUpdates.add(userId);

            //  Fetch user details
            const user = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });

            if (!user) {
                console.error(" User not found for ID:", userId);
                return;
            }

            const lastActivity = new Date(user.lastActivity).getTime() || Date.now();

            //  Add the quiz update to pending queue
            pendingUpdates.push({ user, updatedFields, lastActivity });

            if (!isProcessing) {
                processUpdates();
            }

            //  Remove processed entry after 5 seconds (prevents unnecessary blocking)
            setTimeout(() => processedUpdates.delete(userId), 5000);
        });
    } catch (error) {
        console.error("Error watching MongoDB changes:", error);
    }
}


//  Process pending quiz updates one by one in order of `lastActivity`
async function processUpdates() {
    if (isProcessing) return; //  Prevent parallel execution
    isProcessing = true;

    console.log(`🔄 Processing ${pendingUpdates.length} pending updates...`);

    while (pendingUpdates.length > 0) {
        //  Sort updates by `lastActivity` (oldest first)
        pendingUpdates.sort((a, b) => a.lastActivity - b.lastActivity);

        const { user, updatedFields } = pendingUpdates.shift(); //  Get the first item

        const quizTypes = [
            "decompositionScore", "patternScore", "abstractionScore", "algorithmScore",
            "introScore", "pythonOneScore", "pythonTwoScore", "pythonThreeScore",
            "pythonFiveScore", "pythonSixScore", "pythonSevenScore",
            "reviewScore", "emailScore", "beyondScore"
        ];

        for (const field in updatedFields) {
            if (quizTypes.includes(field) && updatedFields[field] > 0) {
                const quizType = field.replace("Score", ""); // Extract quiz type
                const score = updatedFields[field];

                await sendToSlack(user, quizType, score);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); //  1s delay to prevent Slack rate limits
    }

    isProcessing = false;
}

module.exports = watchQuizUpdates;
