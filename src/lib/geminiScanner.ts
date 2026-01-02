// src/lib/geminiScanner.ts
// ============================================================================
// GEMINI AI SCANNER - Bridge to Google Cloud Function
// ============================================================================

// Use the exact URL from your deployment (with endpoint!)
const FUNCTION_URL = 'https://grantbrain-712720285960.us-central1.run.app/analyzeFinancials';

export interface AIAnalysis {
    estimated_value: number;
    risk_score: number;
    findings: string[];
}

export async function analyzeDocumentWithAI(text: string): Promise<AIAnalysis> {
    console.log("🚀 SENDING TO AI...", text.slice(0, 50));

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ RAW AI DATA:", data);

        // MAPPING FIX: Check for the specific fields our Cloud Function sends
        // The Cloud Function sends: { totalCredit, riskScore, findings }
        const creditValue = data.totalCredit || data.estimated_value || 0;
        const riskValue = data.riskScore || data.risk_score || 50;

        return {
            estimated_value: Number(creditValue), // Force it to be a number
            risk_score: Number(riskValue),
            findings: data.findings || ["AI Analysis Complete"]
        };

    } catch (err) {
        console.error("❌ AI FAILURE:", err);
        // Return a dummy object so the UI doesn't crash, but make it obvious it failed
        return { estimated_value: 0, risk_score: 0, findings: ["Error connecting to AI"] };
    }
}
