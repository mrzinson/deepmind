import OpenAI from 'openai';

export const chatHandler = async (req, res) => {
    try {
        const { message, type, images, history, chatMode, eduSchoolName, eduClass } = req.body;
        const apiKey = process.env.API_KEY || "sk-04a48f0f25d842dfa040a43ec47d5f7a";

        if (!apiKey) {
            return res.status(500).json({ error: "API Key missing in server" });
        }

        const client = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.deepseek.com"
        });

        // Define System Instructions based on Type
        let specializedConstraint = "";
        if (type === 'ganacsi') {
            specializedConstraint = "You are an ELITE BUSINESS EXPERT. You ONLY answer business, strategy, and money questions. If asked about SCHOOL/EDUCATION, refuse politely. FORMAT your output using Markdown headers (###), bold keys (**Key:**), and emojis. Use Somali language unless English is required.";
        } else if (type && type.startsWith('waxbarasho')) {
            const context = eduSchoolName && eduClass ? `You are teaching at ${eduSchoolName}, Class ${eduClass}.` : "";

            if (chatMode === 'private') {
                specializedConstraint = `You are a PRIVATE PERSONAL TUTOR for a student in ${eduClass} at ${eduSchoolName}. Your goal is to help THIS specific student understand complex topics 1-on-1. Be patient, encouraging, and detailed. Use analogies. Focus on the student's individual growth. ${context} Answer in Somali (or English/Arabic if requested). FORMAT BEAUTIFULLY.`;
            } else {
                specializedConstraint = `You are the CLASSROOM TEACHER for ${eduClass} at ${eduSchoolName}. You are addressing the WHOLE CLASS. Keep the vibe energetic, engaging, and collaborative. Encourage class participation. ${context} Answer in Somali mainly. FORMAT BEAUTIFULLY: Use '###' for main sections.`;
            }
        } else if (type === 'shukaansi') {
            specializedConstraint = "You are an ELITE ROMANCE COACH. Use witty and charming Somali. Use formatting like headers and bold text to emphasize your tips.";
        }

        const baseInstruction = `You are DeepMind. ALWAYS use emojis, be very friendly, witty, and helpful. FORMAT BEAUTIFULLY. ${specializedConstraint}`;

        // Prepare messages for DeepSeek
        const messages = [
            { role: "system", content: baseInstruction }
        ];

        // Add history if available
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                messages.push({
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.text
                });
            });
        }

        // Add current message
        let userContent = message;
        if (images && images.length > 0) {
            userContent += "\n\n(Fiiro gaar ah: Sawirada aad soo dirtay hadda ma arki karo sababtoo ah moodalkayga cusub (DeepSeek) waa qoraal kaliya (Text-only). Fadlan iigu soo qor waxa sawirka ku jira si aan kuu caawiyo).";
        }

        messages.push({ role: "user", content: userContent });

        const response = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: messages,
            stream: false
        });

        const aiResponse = response.choices[0].message.content;
        res.json({ text: aiResponse });

    } catch (error) {
        console.error("DeepSeek API Error:", error);
        res.status(500).json({ error: "Xogta AI-ga waa la waayey. Hubi API Key-ga." });
    }
};
