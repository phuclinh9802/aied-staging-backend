const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

// Slack Webhook URL (Replace with your actual webhook URL)
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
if (!SLACK_WEBHOOK_URL) {
    console.error("Error: SLACK_WEBHOOK_URL is missing in .env file.");
    process.exit(1); // Stop execution if the webhook is missing
}

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

    try {
        await axios.post(SLACK_WEBHOOK_URL, { text: message });
        console.log("Quiz result sent to Slack!");
    } catch (error) {
        console.error("Error sending message to Slack:", error);
    }
}

// Connect to MongoDB and watch for changes in the user collection
async function watchQuizUpdates() {
    try {
        const db = mongoose.connection;
        const userCollection = db.collection("users");
        const changeStream = userCollection.watch([
            { $match: { "updateDescription.updatedFields": { $exists: true } } }
        ]);

        console.log("Watching for quiz updates...");

        changeStream.on("change", async (change) => {
            if (change.operationType === "update") {
                if (!change.documentKey || !change.documentKey._id) {
                    console.error("Missing userId in change event.");
                    return;
                }
                const userId = change.documentKey._id.toString();
                const updatedFields = change.updateDescription.updatedFields;

                console.log("Change detected:", updatedFields);
                if (Object.keys(updatedFields).length === 1 && updatedFields.quizAttempts) {
                    console.log("Ignoring isolated quizAttempts update...");
                    return;
                }
                // Fetch user details
                const user = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
                if (!user) {
                    console.error("User not found for ID:", userId);
                    return;
}

                const quizTypes = [
                    "decompositionScore", "patternScore", "abstractionScore", "algorithmScore",
                    "introScore", "pythonOneScore", "pythonTwoScore", "pythonThreeScore",
                    "pythonFiveScore", "pythonSixScore", "pythonSevenScore",
                    "reviewScore", "emailScore", "beyondScore"
                ];
                
                // Extract quiz type and score from the update
                for (const field in updatedFields) {
                    if (quizTypes.includes(field) && updatedFields[field] > 0) { // Check if score is > 0
                        const quizType = field.replace("Score", ""); // Extract quiz type
                        const score = updatedFields[field];
                        await sendToSlack(user, quizType, score);
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error watching MongoDB changes:", error);
    }
}

module.exports = watchQuizUpdates;
