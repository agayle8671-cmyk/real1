import { GoogleGenerativeAI } from 'google-genai';
import { execSync } from 'child_process';

const MODEL_ID = 'gemini-3-flash-preview';
const PROJECT_ID = 'gen-lang-client-0241457047';
const LOCATION = 'global';

function getAccessToken() {
    try {
        return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    } catch (e) {
        console.error("Failed to get gcloud token:", e.message);
        return null;
    }
}

async function verifyConnection() {
    console.log(`Verifying connection to ${MODEL_ID} in ${LOCATION}...`);

    const token = getAccessToken();
    if (!token) {
        console.error("No access token available. Please ensure gcloud is authenticated.");
        return;
    }

    try {
        // Attempting to initialize with what might be the Vertex-compatible signature 
        // or passing token as key if supported by the specific version.
        // Since we can't be sure of the exact SDK version signature for Vertex, 
        // we will try to pass the token and project details.

        // NOTE: This assumes the SDK can handle OAuth tokens in place of API keys 
        // or has a specific Vertex constructor. 
        // If this fails, it confirms the SDK version or usage needs adjustment.

        const genAI = new GoogleGenerativeAI(token);

        const model = genAI.getGenerativeModel({
            model: MODEL_ID,
            generationConfig: {
                thinking_level: "medium"
            }
        }, {
            baseUrl: `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models`
        });

        const result = await model.generateContent("What is your internal model version?");
        const response = await result.response;
        console.log("Response:", response.text());

    } catch (error) {
        console.error("Connection attempt failed.");
        console.error("Error details:", error);
        if (error.response) {
            console.error("API Response:", error.response);
        }
    }
}

verifyConnection();
