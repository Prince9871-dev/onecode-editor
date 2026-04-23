import { type NextRequest, NextResponse } from "next/server"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ProviderMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface EnhancePromptRequest {
  prompt: string
  context?: {
    fileName?: string
    language?: string
    codeContent?: string
  }
}

function getAIProvider() {
  return process.env.AI_PROVIDER === "ollama" ? "ollama" : "groq"
}

async function generateWithOllama(prompt: string) {
  const ollamaUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "")
  const ollamaModel = process.env.OLLAMA_MODEL || "codellama"

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ollamaModel,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
        num_predict: 1000,
        repeat_penalty: 1.1,
        context_length: 4096,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Error from Ollama API:", errorText)
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (!data.response) {
    throw new Error("No response from Ollama")
  }

  return data.response.trim() as string
}

async function generateWithGroq(messages: ProviderMessage[]) {
  const groqApiKey = process.env.GROQ_API_KEY
  const model = process.env.MODEL_NAME || "llama3-70b-8192"

  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured")
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Error from Groq API:", errorText)
    throw new Error(`Groq API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content || typeof content !== "string") {
    throw new Error("No response from Groq")
  }

  return content.trim()
}

async function generateAIResponse(messages: ChatMessage[]) {
  const systemPrompt = `You are an expert AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers. When showing code, use proper formatting with language-specific syntax.
Keep responses concise but comprehensive. Use code blocks with language specification when providing code examples.`

  const fullMessages: ProviderMessage[] = [{ role: "system", content: systemPrompt }, ...messages]

  const prompt = fullMessages.map((msg) => `${msg.role}: ${msg.content}`).join("\n\n")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const provider = getAIProvider()
    const aiResponse =
      provider === "ollama"
        ? await generateWithOllama(prompt)
        : await generateWithGroq(fullMessages)
    clearTimeout(timeoutId)
    return aiResponse
  } catch (error) {
    clearTimeout(timeoutId)
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout: AI model took too long to respond")
    }
    console.error("AI generation error:", error)
    throw error
  }
}

async function enhancePrompt(request: EnhancePromptRequest) {
  const enhancementPrompt = `You are a prompt enhancement assistant. Take the user's basic prompt and enhance it to be more specific, detailed, and effective for a coding AI assistant.

Original prompt: "${request.prompt}"

Context: ${request.context ? JSON.stringify(request.context, null, 2) : "No additional context"}

Enhanced prompt should:
- Be more specific and detailed
- Include relevant technical context
- Ask for specific examples or explanations
- Be clear about expected output format
- Maintain the original intent

Return only the enhanced prompt, nothing else.`

  try {
    const provider = getAIProvider()
    if (provider === "ollama") {
      const ollamaUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "")
      const ollamaModel = process.env.OLLAMA_MODEL || "codellama"
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: enhancementPrompt,
          stream: false,
          options: {
            temperature: 0.3,
            max_tokens: 500,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to enhance prompt")
      }

      const data = await response.json()
      return data.response?.trim() || request.prompt
    }

    const groqResponse = await generateWithGroq([
      {
        role: "system",
        content: "You rewrite developer prompts to be clearer, more specific, and more actionable. Return only the rewritten prompt.",
      },
      { role: "user", content: enhancementPrompt },
    ])
    return groqResponse || request.prompt
  } catch (error) {
    console.error("Prompt enhancement error:", error)
    return request.prompt // Return original if enhancement fails
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle prompt enhancement
    if (body.action === "enhance") {
      const enhancedPrompt = await enhancePrompt(body as EnhancePromptRequest)
      return NextResponse.json({ enhancedPrompt })
    }

    // Handle regular chat
    const { message, history } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
    }

    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg: unknown) =>
            msg &&
            typeof msg === "object" &&
            typeof (msg as { role?: unknown }).role === "string" &&
            typeof (msg as { content?: unknown }).content === "string" &&
            ["user", "assistant"].includes((msg as { role: string }).role),
        )
      : []

    const recentHistory = validHistory.slice(-10)
    const messages: ChatMessage[] = [...recentHistory, { role: "user", content: message }]

    const aiResponse = await generateAIResponse(messages)

    if (!aiResponse) {
      throw new Error("Empty response from AI model")
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in AI chat route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "AI Chat API is running",
    timestamp: new Date().toISOString(),
    info: "Use POST method to send chat messages or enhance prompts",
  })
}
