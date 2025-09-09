// Configurazione Supabase con variabili d'ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase configuration missing");
    document.body.innerHTML = `
        <div class="container">
            <h1>Errore di Configurazione</h1>
            <p>Il servizio non è al momento disponibile. Contatta l'amministratore.</p>
        </div>
    `;
    return;
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

// Il resto del codice JavaScript qui...