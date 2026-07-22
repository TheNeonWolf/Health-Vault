import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY is not set in the environment variables."
        );
    }

    return new GoogleGenAI({
        apiKey,
    });
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

const sleep = (milliseconds) => {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
};

const getGeminiErrorStatus = (error) => {
    return (
        error?.status ||
        error?.code ||
        error?.error?.code ||
        null
    );
};

const isRetryableGeminiError = (error) => {
    const status = getGeminiErrorStatus(error);

    return (
        status === 429 ||
        status === 500 ||
        status === 503
    );
};

const generateWithRetry = async (
    request,
    maxAttempts = 3
) => {
    const ai = getGeminiClient();

    let lastError;

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt += 1
    ) {
        try {
            return await ai.models.generateContent(
                request
            );
        } catch (error) {
            lastError = error;

            const shouldRetry =
                isRetryableGeminiError(error) &&
                attempt < maxAttempts;

            if (!shouldRetry) {
                throw error;
            }

            const delay =
                1000 * 2 ** (attempt - 1);

            console.warn(
                `Gemini request failed with status ${
                    getGeminiErrorStatus(error) ||
                    "unknown"
                }. Retrying in ${delay}ms...`
            );

            await sleep(delay);
        }
    }

    throw lastError;
};

const testGeminiConnection = async () => {
    const response = await generateWithRetry({
        model: "gemini-3.5-flash",

        contents:
            "Reply with exactly this sentence: Gemini connection successful.",
    });

    const generatedText =
        response.text?.trim();

    if (!generatedText) {
        throw new Error(
            "Gemini returned an empty response"
        );
    }

    return generatedText;
};

const summarizePdf = async (pdfBuffer) => {
    if (
        !pdfBuffer ||
        !Buffer.isBuffer(pdfBuffer)
    ) {
        throw new Error(
            "PDF data is required"
        );
    }

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
                description:
                    "Medical conditions or diagnoses explicitly stated in the document.",
                items: {
                    type: "string",
                },
            },

            medications: {
                type: "array",
                description:
                    "Medications explicitly stated in the document, including dosage and frequency when available.",
                items: {
                    type: "string",
                },
            },

            allergies: {
                type: "array",
                description:
                    "Medication, food, or other allergies explicitly stated in the document.",
                items: {
                    type: "string",
                },
            },

            followUps: {
                type: "array",
                description:
                    "Follow-up appointments, tests, monitoring, or next steps explicitly stated.",
                items: {
                    type: "string",
                },
            },

            importantNotes: {
                type: "array",
                description:
                    "Other important factual information useful to residential care staff.",
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

    const response =
        await generateWithRetry({
            model: "gemini-3.5-flash",

            contents: [
                {
                    inlineData: {
                        mimeType:
                            "application/pdf",

                        data: pdfBuffer.toString(
                            "base64"
                        ),
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
                responseMimeType:
                    "application/json",

                responseSchema:
                    summarySchema,

                temperature: 0.2,
            },
        });

    const generatedText =
        response.text?.trim();

    if (!generatedText) {
        throw new Error(
            "Gemini returned an empty PDF summary"
        );
    }

    let parsedSummary;

    try {
        parsedSummary =
            JSON.parse(generatedText);
    } catch (error) {
        console.error(
            "Gemini JSON parsing error:",
            error
        );

        console.error(
            "Gemini raw response:",
            generatedText
        );

        throw new Error(
            "Gemini returned an invalid JSON summary"
        );
    }

    return normalizeSummary(
        parsedSummary
    );
};

export {
    testGeminiConnection,
    summarizePdf,
};