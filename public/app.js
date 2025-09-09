// Configurazione Supabase
const SUPABASE_URL = 'https://creative-parfait-cc90e9.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWF0aXZlLXBhcmZhaXQtY2M5MGU5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDUwMjE5NDMsImV4cCI6MjAyMDU5Nzk0M30.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase configuration missing");
    document.body.innerHTML = `
        <div class="container">
            <h1>Errore di Configurazione</h1>
            <p>Il servizio non è al momento disponibile. Contatta l'amministratore.</p>
        </div>
    `;
    throw new Error("Supabase configuration missing");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;
let currentQuiz = {
    title: '',
    questions: []
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
    // Controlla lo stato di autenticazione
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        showMainContent();
        loadUserQuizzes();
    } else {
        showAuthSection();
    }
    
    // Setup dei tab
    setupTabs();
    
    // Aggiungi la prima domanda
    addQuestion();
    
    // Listener per cambiamenti di autenticazione
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            showMainContent();
            loadUserQuizzes();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showAuthSection();
        }
    });
});

// Funzioni di autenticazione
async function handleAuth() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    
    if (error) {
        console.error('Error signing in:', error.message);
        alert('Errore durante l accesso: ' + error.message);
    }
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
    }
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
}

function showMainContent() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
}

// Gestione tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.tab) {
                // Rimuovi classe active da tutti i tab buttons e panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                
                // Aggiungi classe active al tab button cliccato
                button.classList.add('active');
                
                // Mostra il tab pane corrispondente
                const tabPane = document.getElementById(`${button.dataset.tab}-tab`);
                if (tabPane) {
                    tabPane.classList.add('active');
                }
            }
        });
    });
}

// Gestione domande del quiz
function addQuestion() {
    const questionsContainer = document.getElementById('questions-container');
    const questionId = Date.now();
    
    const questionElement = document.createElement('div');
    questionElement.className = 'question-item';
    questionElement.innerHTML = `
        <button class="question-remove" onclick="removeQuestion(${questionId})">×</button>
        <div class="form-group">
            <label>Domanda</label>
            <textarea placeholder="Inserisci la domanda" oninput="updateQuestionText(${questionId}, this.value)"></textarea>
        </div>
        <div class="form-group">
            <label>Risposte</label>
            <div class="answers-container" id="answers-${questionId}">
                <div class="answer-item">
                    <input type="checkbox" class="answer-checkbox" onchange="updateAnswerCorrect(${questionId}, 0, this.checked)">
                    <input type="text" placeholder="Risposta 1" oninput="updateAnswerText(${questionId}, 0, this.value)">
                </div>
                <div class="answer-item">
                    <input type="checkbox" class="answer-checkbox" onchange="updateAnswerCorrect(${questionId}, 1, this.checked)">
                    <input type="text" placeholder="Risposta 2" oninput="updateAnswerText(${questionId}, 1, this.value)">
                </div>
            </div>
            <button class="btn btn-secondary" onclick="addAnswer(${questionId})">+ Aggiungi Risposta</button>
        </div>
    `;
    
    questionsContainer.appendChild(questionElement);
    
    // Aggiungi la domanda all'oggetto currentQuiz
    currentQuiz.questions.push({
        id: questionId,
        text: '',
        answers: [
            { text: '', correct: false },
            { text: '', correct: false }
        ]
    });
}

function removeQuestion(questionId) {
    const questionElement = document.querySelector(`.question-item:has(#answers-${questionId})`);
    if (questionElement) {
        questionElement.remove();
    }
    
    // Rimuovi la domanda dall'oggetto currentQuiz
    currentQuiz.questions = currentQuiz.questions.filter(q => q.id !== questionId);
}

function updateQuestionText(questionId, text) {
    const question = currentQuiz.questions.find(q => q.id === questionId);
    if (question) {
        question.text = text;
    }
}

function addAnswer(questionId) {
    const question = currentQuiz.questions.find(q => q.id === questionId);
    if (question) {
        question.answers.push({ text: '', correct: false });
        
        const answersContainer = document.getElementById(`answers-${questionId}`);
        const answerIndex = question.answers.length - 1;
        
        const answerElement = document.createElement('div');
        answerElement.className = 'answer-item';
        answerElement.innerHTML = `
            <input type="checkbox" class="answer-checkbox" onchange="updateAnswerCorrect(${questionId}, ${answerIndex}, this.checked)">
            <input type="text" placeholder="Risposta ${answerIndex + 1}" oninput="updateAnswerText(${questionId}, ${answerIndex}, this.value)">
        `;
        
        answersContainer.appendChild(answerElement);
    }
}

function updateAnswerText(questionId, answerIndex, text) {
    const question = currentQuiz.questions.find(q => q.id === questionId);
    if (question && question.answers[answerIndex]) {
        question.answers[answerIndex].text = text;
    }
}

function updateAnswerCorrect(questionId, answerIndex, correct) {
    const question = currentQuiz.questions.find(q => q.id === questionId);
    if (question && question.answers[answerIndex]) {
        question.answers[answerIndex].correct = correct;
    }
}

// Salvataggio quiz
async function saveQuiz() {
    const title = document.getElementById('quiz-title').value.trim();
    
    if (!title) {
        alert('Inserisci un titolo per il quiz');
        return;
    }
    
    if (currentQuiz.questions.length === 0) {
        alert('Aggiungi almeno una domanda al quiz');
        return;
    }
    
    // Verifica che ogni domanda abbia almeno una risposta corretta
    for (const question of currentQuiz.questions) {
        const hasCorrectAnswer = question.answers.some(answer => answer.correct);
        if (!hasCorrectAnswer) {
            alert(`La domanda "${question.text || 'senza testo'}" non ha una risposta corretta`);
            return;
        }
    }
    
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .insert([
                {
                    title: title,
                    questions: currentQuiz.questions,
                    user_id: currentUser.id,
                    created_at: new Date()
                }
            ])
            .select();
        
        if (error) {
            throw error;
        }
        
        alert('Quiz salvato con successo!');
        resetQuizCreator();
        loadUserQuizzes();
    } catch (error) {
        console.error('Error saving quiz:', error);
        alert('Errore durante il salvataggio del quiz: ' + error.message);
    }
}

function resetQuizCreator() {
    document.getElementById('quiz-title').value = '';
    document.getElementById('questions-container').innerHTML = '';
    currentQuiz = {
        title: '',
        questions: []
    };
    addQuestion();
}

// Caricamento quiz
async function loadUserQuizzes() {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const quizList = document.getElementById('quiz-list');
        quizList.innerHTML = '';
        
        if (data.length === 0) {
            quizList.innerHTML = '<p>Non hai ancora creato nessun quiz.</p>';
            return;
        }
        
        data.forEach(quiz => {
            const quizElement = document.createElement('div');
            quizElement.className = 'quiz-item';
            quizElement.innerHTML = `
                <h3>${quiz.title}</h3>
                <p>${quiz.questions.length} domande</p>
                <p>Creato il: ${new Date(quiz.created_at).toLocaleDateString('it-IT')}</p>
                <button class="btn btn-primary" onclick="viewQuiz('${quiz.id}')">Visualizza</button>
                <button class="btn btn-secondary" onclick="editQuiz('${quiz.id}')">Modifica</button>
                <button class="btn btn-secondary" onclick="deleteQuiz('${quiz.id}')">Elimina</button>
            `;
            quizList.appendChild(quizElement);
        });
    } catch (error) {
        console.error('Error loading quizzes:', error);
        alert('Errore durante il caricamento dei quiz: ' + error.message);
    }
}

function viewQuiz(quizId) {
    window.open(`/quiz.html?id=${quizId}`, '_blank');
}

async function editQuiz(quizId) {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();
        
        if (error) {
            throw error;
        }
        
        // Popola il form di modifica
        document.getElementById('quiz-title').value = data.title;
        currentQuiz = {
            title: data.title,
            questions: data.questions
        };
        
        // Ricrea l'interfaccia per le domande
        const questionsContainer = document.getElementById('questions-container');
        questionsContainer.innerHTML = '';
        
        currentQuiz.questions.forEach(question => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question-item';
            questionElement.innerHTML = `
                <button class="question-remove" onclick="removeQuestion(${question.id})">×</button>
                <div class="form-group">
                    <label>Domanda</label>
                    <textarea placeholder="Inserisci la domanda" oninput="updateQuestionText(${question.id}, this.value)">${question.text}</textarea>
                </div>
                <div class="form-group">
                    <label>Risposte</label>
                    <div class="answers-container" id="answers-${question.id}">
                        ${question.answers.map((answer, index) => `
                            <div class="answer-item">
                                <input type="checkbox" class="answer-checkbox" onchange="updateAnswerCorrect(${question.id}, ${index}, this.checked)" ${answer.correct ? 'checked' : ''}>
                                <input type="text" placeholder="Risposta ${index + 1}" oninput="updateAnswerText(${question.id}, ${index}, this.value)" value="${answer.text}">
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary" onclick="addAnswer(${question.id})">+ Aggiungi Risposta</button>
                </div>
            `;
            
            questionsContainer.appendChild(questionElement);
        });
        
        // Passa alla tab di creazione
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        document.querySelector('[data-tab="create"]').classList.add('active');
        document.getElementById('create-tab').classList.add('active');
    } catch (error) {
        console.error('Error loading quiz for edit:', error);
        alert('Errore durante il caricamento del quiz: ' + error.message);
    }
}

async function deleteQuiz(quizId) {
    if (!confirm('Sei sicuro di voler eliminare questo quiz?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', quizId);
        
        if (error) {
            throw error;
        }
        
        alert('Quiz eliminato con successo');
        loadUserQuizzes();
    } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Errore durante l eliminazione del quiz: ' + error.message);
    }
}

function searchQuizzes() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const quizItems = document.querySelectorAll('.quiz-item');
    
    quizItems.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Generatore AI
async function generateQuizWithAI() {
    const topic = document.getElementById('ai-topic').value.trim();
    if (!topic) { 
        alert('Per favore, inserisci un argomento.');
        return;
    }
    
    const generateBtn = document.getElementById('generate-quiz-btn');
    const originalText = generateBtn.textContent;
    
    try {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="loading-spinner"></span> GENERAZIONE...';

        const requestBody = {
            topic: topic,
            level: document.getElementById('ai-level').value,
            difficulty: document.getElementById('ai-difficulty').value,
            numQuestions: document.getElementById('ai-num-questions').value
        };

        const response = await fetch('/api/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const generatedQuiz = await response.json();

        currentQuiz = generatedQuiz;
        document.getElementById('quiz-title').value = currentQuiz.title || '';
        updateCreatorQuestionsList();
        
        // Passa alla tab di creazione
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        document.querySelector('[data-tab="create"]').classList.add('active');
        document.getElementById('create-tab').classList.add('active');

    } catch (error) {
        alert(`Si è verificato un errore: ${error.message}.`);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
    }
}

function updateCreatorQuestionsList() {
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = '';
    
    currentQuiz.questions.forEach(question => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question-item';
        questionElement.innerHTML = `
            <button class="question-remove" onclick="removeQuestion(${question.id})">×</button>
            <div class="form-group">
                <label>Domanda</label>
                <textarea placeholder="Inserisci la domanda" oninput="updateQuestionText(${question.id}, this.value)">${question.text}</textarea>
            </div>
            <div class="form-group">
                <label>Risposte</label>
                <div class="answers-container" id="answers-${question.id}">
                    ${question.answers.map((answer, index) => `
                        <div class="answer-item">
                            <input type="checkbox" class="answer-checkbox" onchange="updateAnswerCorrect(${question.id}, ${index}, this.checked)" ${answer.correct ? 'checked' : ''}>
                            <input type="text" placeholder="Risposta ${index + 1}" oninput="updateAnswerText(${question.id}, ${index}, this.value)" value="${answer.text}">
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary" onclick="addAnswer(${question.id})">+ Aggiungi Risposta</button>
            </div>
        `;
        
        questionsContainer.appendChild(questionElement);
    });
}

function closeAIModal() {
    document.getElementById('ai-generator-modal').classList.remove('active');
}
