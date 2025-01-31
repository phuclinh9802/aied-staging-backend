const mongoose = require("mongoose");
const axios = require("axios");

// Slack Webhook URL (Replace with your actual webhook URL)
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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";

// Function to send a message to Slack
async function sendToSlack(user, type, score) {
    const message = `*Quiz Completed!*  
User: *${user.username}*  
Quiz Type: *${type}*  
Score: *${score}*`;

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

        const changeStream = userCollection.watch();

        console.log("Watching for quiz updates...");

        changeStream.on("change", async (change) => {
            if (change.operationType === "update") {
                const userId = change.documentKey._id;
                const updatedFields = change.updateDescription.updatedFields;

                console.log("Change detected:", updatedFields);

                const quizTypes = [
                    "decompositionScore", "patternScore", "abstractionScore", "algorithmScore",
                    "introScore", "pythonOneScore", "pythonTwoScore", "pythonThreeScore",
                    "pythonFiveScore", "pythonSixScore", "pythonSevenScore",
                    "reviewScore", "emailScore", "beyondScore"
                ];
                
                // Extract quiz type and score from the update
                for (const field in updatedFields) {
                    if (quizTypes.includes(field) && updatedFields[field] > 0) { // Check if score is > 0
                        const type = field.replace("Score", ""); // Extract quiz type
                        const score = updatedFields[field];

                        // Fetch user details
                        const userCollection = mongoose.connection.collection("users");
                        const user = await userCollection.findOne({ _id: userId });

                        if (user) {
                            await sendToSlack(user, type, score);
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error watching MongoDB changes:", error);
    }
}

module.exports = watchQuizUpdates;
