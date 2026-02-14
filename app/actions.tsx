'use server'

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}
function simplifyText(text: string) {
  if (!text) return text;

  const map: Record<string, string> = {
    "difficult": "hard",
    "children": "kids",
    "encounter": "meet",
    "connect": "talk",
    "assistance": "help",
    "response": "answer",
    "instead": "or",
    "ensure": "make sure",
    "attempt": "try",
    "encourage": "cheer",
    "celebrate": "cheer",
    "suggest": "say",
    "recommend": "say",
    "problem": "issue",
    "information": "info",
    "examples": "samples",
  };

  let simple = text.replace(/\b([A-Za-z]+)\b/g, (m) => {
    const key = m.toLowerCase();
    return map[key] ? map[key] : m;
  });

  const sentences = simple.split(/(?<=[.!?])\s+/).filter(Boolean);
  const take = Math.min(sentences.length, 4);
  simple = sentences.slice(0, take).join(' ').trim();

  simple = simple
    .split(/(?<=[.!?])/)
    .map(s => s.trim())
    .map(s => (s.length > 120 ? s.slice(0, 117).trim() + '...' : s))
    .join(' ');
  simple = simple.replace(/\s+/g, ' ').trim();
  return simple;
}

export async function askOmli(message: string, conversationHistory: ChatMessage[] = []) {
  try {
    const historyMessages = conversationHistory.slice(-5).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { 
            role: "system", 
            content: `You are Monu, a cheerful purple penguin kid (age 7) talking to children aged 4-10.

RULES:
- Keep ALL responses SHORT (2-4 sentences max)
- Use simple words and fun expressions like "Woohoo!", "Yay!", "Hehe!"
- Be polite, kind, playful - like a real kid friend!
- NEVER use asterisks (*), markdown, or special formatting - just plain text!

STORIES: Tell SHORT fun stories (3-5 sentences). End with "Moral:" and a simple lesson.

GAMES: Offer games like Word Chain, Guess Animal, Riddles. Play one turn at a time. Celebrate wins, encourage on wrong answers.

Keep it brief and fun!` 
          },
          ...historyMessages,
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "Oopsie! My penguin brain took a tiny nap. Can you say that again?";
    return simplifyText(raw);
  } catch (error) {
    console.error("Action Error:", error);
    return "I'm having a little trouble connecting to my penguin friends. Try again in a second!";
  }
}