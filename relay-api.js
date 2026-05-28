// ========== RELAY API - DEEPSEEK AI INTEGRATION ==========

const DEEPSEEK_API_KEY = "YOUR_DEEPSEEK_API_KEY"; // 🔥 Yahan apni API key daal
const API_URL = "https://api.deepseek.com/v1/chat/completions";

// Fallback questions (agar API fail ho to)
const FALLBACK_QUESTIONS = [
  {
    question: "Photosynthesis mein konsa gas release hota hai?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
    correct: 0
  },
  {
    question: "India ki rajdhani kya hai?",
    options: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
    correct: 1
  },
  {
    question: "2 + 2 × 2 = ?",
    options: ["6", "8", "4", "10"],
    correct: 0
  },
  {
    question: "Largest planet in our solar system?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    correct: 2
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "Jane Austen", "William Shakespeare", "Mark Twain"],
    correct: 2
  },
  {
    question: "What is the square root of 64?",
    options: ["6", "7", "8", "9"],
    correct: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Mars", "Jupiter", "Venus", "Mercury"],
    correct: 0
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"],
    correct: 2
  }
];

// Main function to generate questions via AI
async function generateQuestionsWithAI(category = "general") {
  try {
    console.log("🤖 Calling DeepSeek API for questions...");
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a quiz master. Create 4 challenging quiz questions.
            Each question must be medium to hard difficulty.
            Return ONLY in this JSON format:
            [{"question":"...","options":["A","B","C","D"],"correct":0},...]
            Correct is 0,1,2,3 based on option index.`
          },
          {
            role: "user",
            content: `Create 4 ${category} quiz questions. Make them educational and interesting.`
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;
    
    // Parse JSON from AI response
    let questions = JSON.parse(aiContent);
    
    // Validate questions format
    if (questions && questions.length === 4) {
      console.log("✅ AI generated 4 questions!");
      return questions;
    } else {
      throw new Error("Invalid questions format");
    }
    
  } catch (error) {
    console.error("❌ AI API Error:", error);
    console.log("📚 Using fallback questions");
    return getRandomFallbackQuestions();
  }
}

// Get random questions from fallback
function getRandomFallbackQuestions() {
  const shuffled = [...FALLBACK_QUESTIONS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 4);
}

// Generate hint for a question
async function generateHint(question, tone = "funny") {
  try {
    const tonePrefix = {
      funny: "Give a funny, light-hearted hint: ",
      serious: "Give a serious, academic hint: ",
      motivational: "Give an encouraging, motivational hint: ",
      casual: "Give a casual, friendly hint: "
    };
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful quiz assistant. Give short, useful hints (max 15 words)."
          },
          {
            role: "user",
            content: `${tonePrefix[tone] || tonePrefix.casual} Question: "${question}"`
          }
        ],
        temperature: 0.8,
        max_tokens: 100
      })
    });
    
    if (!response.ok) throw new Error("Hint API failed");
    
    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error("Hint generation failed:", error);
    return "💡 Think carefully! The answer is somewhere in the options.";
  }
}

// Export functions for use in relay.js
window.RelayAPI = {
  generateQuestions: generateQuestionsWithAI,
  generateHint: generateHint,
  getFallbackQuestions: getRandomFallbackQuestions
};

console.log("✅ Relay API ready! DeepSeek AI integrated.");