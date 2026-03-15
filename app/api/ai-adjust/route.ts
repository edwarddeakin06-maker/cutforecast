import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {

  const { message } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "Convert fitness statements into JSON adjustments."
      },
      {
        role: "user",
        content: message
      }
    ]
  });

  return Response.json({
    result: completion.choices[0].message.content
  });

}