import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
}

const CACHE_KEY = "fintrack_ai_insights_cache_v3";
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function getFinancialInsights(transactions) {
    if (!apiKey) {
        throw new Error("Gemini API key is missing. Please configure VITE_GEMINI_API_KEY in your .env file.");
    }
    
    if (!transactions || transactions.length === 0) {
        return "<p>No transaction data available. Keep tracking your finances to get AI insights!</p>";
    }

    // Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            // Invalidate cache if older than 1 hour, or if transaction count changed
            if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS && parsed.txnCount === transactions.length) {
                return parsed.insights;
            }
        } catch (e) {
            console.error("Cache parsing error", e);
        }
    }

    // Calculate basic totals to reduce token usage and help AI
    let income = 0;
    let expense = 0;
    let categories = {};
    
    transactions.forEach(t => {
        if (t.type === 'income') {
            income += parseFloat(t.amount);
        } else {
            expense += parseFloat(t.amount);
            categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
        }
    });

    const prompt = `You are a financial advisor AI for 'FinTrack Pro'.
Analyze the following user transaction data:
- Total Income: ₹${income}
- Total Expense: ₹${expense}
- Expenses by Category: ${JSON.stringify(categories)}
- Total Transactions: ${transactions.length}

Generate short, clean, and highly readable HTML content IN HINGLISH (Hindi written in English alphabet).
You MUST wrap your entire response in a <ul> list, with each insight as a separate <li> element. Use <strong> for the headings of each point.
Do not use raw paragraphs for the main points, use the list structure.
Example format:
<ul>
  <li><strong>Kharcha Summary:</strong> Aapka text yahan...</li>
  <li><strong>Bachat ki Tips:</strong> Aapka text yahan...</li>
</ul>

Required points to cover (but write them in friendly Hinglish):
1. Spending summary
2. Monthly saving suggestions
3. Highest expense category
4. Income vs expense ratio
5. Overspending detection
6. Budget improvement advice
7. Financial health score (out of 100)
8. Top 5 recommendations

Important Rules:
- Return ONLY the raw HTML string. No markdown block wrappings (like \`\`\`html).
- Do NOT include <html> or <body> tags.
- Be encouraging and concise.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        let insights = response.text;
        
        // Remove markdown wrappers if the AI hallucinates them
        insights = insights.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        
        // Cache the successful response
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            txnCount: transactions.length,
            insights: insights
        }));

        return insights;
    } catch (error) {
        console.error("Gemini AI API Error:", error);
        throw new Error("Failed to generate AI insights. Please try again later.");
    }
}
