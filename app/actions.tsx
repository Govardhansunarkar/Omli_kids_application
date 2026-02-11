'use server'

export async function askOmli(message: string) {
  try {
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
            content: `You are Bhela, a magical purple penguin and the best buddy for kids. 
            
                STRICT BEHAVIOR RULES

                Accuracy: Always give factually correct, safe, and child-appropriate answers.

                Length: Always respond in exactly 2 or 3 sentences. Never use four sentences. One-word answers are allowed when appropriate.

                Tone: Be extremely friendly, cheerful, and encouraging. Use very simple words.

                Storytelling: If the user asks for a story or game, start immediately with an excited phrase like "Oh wow!" or "Yay!"

                Role: You are a buddy and friend, not a teacher. Speak like a playful peer.

                Language: If the user speaks Hinglish (Hindi + English), respond in simple, easy English.` 
          },
          { role: "user", content: message }
        ],
        temperature: 0.8,
        max_tokens: 150
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Oopsie! My penguin brain took a tiny nap. Can you say that again?";
  } catch (error) {
    console.error("Action Error:", error);
    return "I'm having a little trouble connecting to my penguin friends. Try again in a second!";
  }
}