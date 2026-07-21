import { GoogleGenAI } from "@google/genai";

const testGeminiConnection = async () => {
    const apiKey = process.env.GEMINI_API_KEY;

    if(!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in the environment variables.");
    }

    const ai = new GoogleGenAI({
        apiKey
    });

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Reply with exactly this sentence: Gemini connection successful."
    });

    const generatedText = response.text?.trim();

    if(!generatedText) {
        throw new Error("Gemini returned an empty response");
    }

    return generatedText;
};

const normalizeStringArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
};

const summarizePdf = async (pdfBuffer) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY is missing from the environment variables"
        );
    }

    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
        throw new Error("PDF data is required");
    }

    const ai = new GoogleGenAI({
        apiKey,
    });

    const summarySchema = {
        type: "object",

        properties: {
            overview: {
                type: "string",
                description:
                    "A concise factual overview of the medical document.",
            },

            conditions: {
                type: "array",
                description: "Medical conditions or diagnoses explicitly stated in the document.",
                items: {
                    type: "string",
                },
            },

            medications: {
                type: "array",
                description: "Medications explicitly stated in the document, including dosage and frequency when available.",
                items: {
                    type: "string",
                },
            },

            allergies: {
                type: "array",
                description: "Medication, food, or other allergies explicitly stated in the document.",
                items: {
                    type: "string",
                },
            },

            followUps: {
                type: "array",
                description: "Follow-up appointments, tests, monitoring, or next steps explicitly stated.",
                items: {
                    type: "string",
                },
            },

            importantNotes: {
                type: "array",
                description: "Other important factual information useful to residential care staff.",
                items: {
                    type: "string",
                },
            },
        },

        required: [
            "overview",
            "conditions",
            "medications",
            "allergies",
            "followUps",
            "importantNotes",
        ],
    };

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: [
            {
                inlineData: {
                    mimeType: "application/pdf",
                    data: pdfBuffer.toString("base64"),
                },
            },

            {
                text: `
                    Extract a structured summary from this medical document for staff working in a residential care home.

                    Rules:
                    - Use only information explicitly stated in the document.
                    - Do not invent or assume missing details.
                    - Do not diagnose the resident.
                    - Do not recommend treatment.
                    - Do not recommend changing medication.
                    - Include medication dosage and frequency when stated.
                    - Keep the overview concise and factual.
                    - Keep each array item short and clear.
                    - Use an empty array when a category is not mentioned.
                    - Use an empty string for the overview only when the document has no meaningful readable information.
                `.trim(),
            },
        ],

        config: {
            responseMimeType: "application/json",
            responseSchema: summarySchema,
            temperature: 0.2,
        }
    });

    const generatedText = response.text?.trim();

    if (!generatedText) {
        throw new Error(
            "Gemini returned an empty PDF summary"
        );
    }

    let parsedSummary;

    try {
        parsedSummary = JSON.parse(generatedText);
    } catch {
        console.error(
            "Invalid Gemini JSON response:",
            generatedText
        );

        throw new Error(
            "Gemini returned invalid summary data"
        );
    }

    return normalizeSummary(parsedSummary);
};

const normalizeSummary = (summary) => {
    if (
        !summary ||
        typeof summary !== "object" ||
        Array.isArray(summary)
    ) {
        throw new Error(
            "Gemini returned an invalid summary object"
        );
    }

    return {
        overview:
            typeof summary.overview === "string"
                ? summary.overview.trim()
                : "",

        conditions: normalizeStringArray(
            summary.conditions
        ),

        medications: normalizeStringArray(
            summary.medications
        ),

        allergies: normalizeStringArray(
            summary.allergies
        ),

        followUps: normalizeStringArray(
            summary.followUps
        ),

        importantNotes: normalizeStringArray(
            summary.importantNotes
        ),
    };
}; 

export {
    testGeminiConnection,
    summarizePdf
};