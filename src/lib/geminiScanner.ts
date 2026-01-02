// src/lib/geminiScanner.ts
const FUNCTION_URL = 'https://grantbrain-712720285960.us-central1.run.app';

export interface AIAnalysis {
    risk_score: number;
    estimated_value: number;
    findings: string[];
}

export async function analyzeDocumentWithAI(text: string): Promise<AIAnalysis> {
    console.log("SENDING TO GEMINI...", text.slice(0, 100));

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('AI Brain Connection Failed');

        const data = await response.json();

        // The Cloud Function returns structured JSON. Let's adapt it.
        // Note: Adjust these fields based on exactly what your index.js returns
        // For now we assume the structure from the Opus prompt.
        // The backend returns: { analysis: { risk_score, eligibility: { estimated_credit, ... }, rd_activities: [] } }
        return {
            risk_score: data.analysis?.risk_score || 50,
            estimated_value: data.analysis?.eligibility?.estimated_credit || 0,
            findings: data.analysis?.rd_activities || []
        };
    } catch (err) {
        console.error("AI Error:", err);
        // Fallback for demo if AI fails
        return { risk_score: 10, estimated_value: 0, findings: ["Error connecting to AI"] };
    }
}
