import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, X } from "lucide-react";
import { callAI } from "@/lib/chatgpt";
import { chatWithGemini } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatGPTAssistantProps {
  language?: string;
  topic?: string;
  onClose?: () => void;
}

const ChatGPTAssistant = ({ language, topic, onClose }: ChatGPTAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with a welcome message
    const welcomeMessage: Message = {
      role: "assistant",
      content: language
        ? `Hello! I'm your ${language} learning assistant. I can help you with translations, grammar, pronunciation, and practice exercises. What would you like to learn today?`
        : "Hello! I'm your language learning assistant. How can I help you today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [language]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const systemPrompt = language
        ? `You are a helpful ${language} language tutor. Provide clear, encouraging, and educational responses. Help with grammar, vocabulary, pronunciation, and cultural context. Keep responses concise (2-4 sentences) unless the user asks for more detail.`
        : `You are a helpful language learning assistant. Provide clear, encouraging, and educational responses about language learning.`;

      const contextPrompt = topic
        ? `The user is currently studying: ${topic}. `
        : "";

      // Try Gemini first (free), then ChatGPT
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      let response;
      
      if (geminiKey) {
        try {
          const conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          response = await chatWithGemini(conversationHistory, language, topic);
        } catch (error) {
          console.log('Gemini not available, using ChatGPT...');
          const fullPrompt = `${contextPrompt}${userMessage.content}`;
          response = await callAI(fullPrompt, systemPrompt);
        }
      } else {
        const fullPrompt = `${contextPrompt}${userMessage.content}`;
        response = await callAI(fullPrompt, systemPrompt);
      }

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm sorry, I encountered an error. Please check your OpenAI API key configuration.",
            timestamp: new Date(),
          },
        ]);
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content: response.message || "I'm sorry, I couldn't generate a response.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from ChatGPT",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Language Assistant
          {language && <span className="text-sm font-normal text-muted-foreground">({language})</span>}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about language learning..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatGPTAssistant;

