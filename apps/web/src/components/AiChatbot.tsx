'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, User } from 'lucide-react';

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I am your BharatSales AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate API delay
    setTimeout(() => {
      let response = "I'm sorry, I couldn't process that request right now.";
      
      const lower = userMessage.toLowerCase();
      if (lower.includes('churn') || lower.includes('risk')) {
        response = "Based on our latest analysis, 'Sri Balaji Stores' and 'Gupta Traders' are at high risk of churn due to a 45-day gap in orders. Would you like me to generate a retention scheme for them?";
      } else if (lower.includes('sales') || lower.includes('revenue')) {
        response = "Your projected revenue for next month is ₹45,00,000, showing a +12.5% growth trend driven by the upcoming festive season.";
      } else if (lower.includes('stock') || lower.includes('inventory')) {
        response = "You have 2 batches of 'Premium Chai' expiring within 7 days. I recommend pushing a 10% discount scheme to clear the stock.";
      } else {
        response = "That's a great question. While I'm currently running in MVP fallback mode without full LLM access, I can help you analyze churn risks, sales forecasts, and inventory alerts. Try asking about those!";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-purple-600 text-white rounded-full shadow-xl hover:bg-purple-700 hover:scale-105 transition-all z-50 flex items-center justify-center group"
        >
          <Sparkles className="w-6 h-6 absolute animate-pulse text-purple-300 opacity-0 group-hover:opacity-100 -top-2 -right-2" />
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-200" />
              <h3 className="font-bold">AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-purple-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px] bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-primary-100 text-primary-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white border border-gray-200 shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about sales, churn, stock..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
