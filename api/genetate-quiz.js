export default async function handler(request, response) {
    // Abilita CORS
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { topic, level, difficulty, numQuestions } = request.body;
        
        // Implementazione della chiamata a Gemini AI
        // Per ora restituiamo un quiz mock come esempio
        const mockQuiz = {
            title: `Quiz su ${topic}`,
            questions: [
                {
                    id: Date.now(),
                    text: `Domanda esempio su ${topic} (${difficulty})`,
                    answers: [
                        { text: "Risposta corretta", correct: true },
                        { text: "Risposta errata 1", correct: false },
                        { text: "Risposta errata 2", correct: false },
                        { text: "Risposta errata 3", correct: false }
                    ]
                }
            ]
        };
        
        return response.status(200).json(mockQuiz);
    } catch (error) {
        console.error('Error in generate-quiz:', error);
        return response.status(500).json({ error: 'Internal server error' });
    }
}
