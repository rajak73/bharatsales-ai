import { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, Sparkles, X } from 'lucide-react';
import { AiFeaturesService } from '@bharatsales/api-client';
import { useCart } from '../contexts/CartContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';

// Extending window for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceOrderButton() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const { addToCartWithQuantity } = useCart();
  const products = useLiveQuery(() => db.products.toArray(), []) ?? [];

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Indian English to catch local product names better

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            setTranscription(event.results[i][0].transcript);
          }
        }
        if (finalTranscript) {
          setTranscription(finalTranscript);
          processVoiceCommand(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
           setError(`Speech error: ${event.error}`);
           setTimeout(() => setError(null), 3000);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [products]);

  const toggleListening = () => {
    setError(null);
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        setError("Your browser doesn't support Voice Recognition.");
        setTimeout(() => setError(null), 3000);
        return;
      }
      setTranscription('');
      setSuccessMsg(null);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const processVoiceCommand = async (text: string) => {
    try {
      setIsListening(false);
      setIsProcessing(true);
      
      // Parse intent using AI backend
      const items = await AiFeaturesService.parseVoice(text);
      
      if (!items || items.length === 0) {
        setError("Couldn't understand any products. Please try again.");
        setTimeout(() => setError(null), 3000);
        setIsProcessing(false);
        return;
      }

      let addedCount = 0;
      let notFound: string[] = [];

      for (const item of items) {
        const normalizedInput = (item.productName || '').toLowerCase();
        
        // Find best match in DB
        const match = products.find(p => p.name.toLowerCase().includes(normalizedInput));
        
        if (match) {
          addToCartWithQuantity(match, item.quantity || 1);
          addedCount++;
        } else {
           notFound.push(item.productName);
        }
      }

      if (addedCount > 0) {
        setSuccessMsg(`Added ${addedCount} product(s) to cart.`);
      } else {
        setError(`No matching products found for: ${notFound.join(', ')}`);
      }
      
      setTimeout(() => {
        setSuccessMsg(null);
        setError(null);
        setTranscription('');
      }, 4000);

    } catch (err) {
      console.error(err);
      setError("Failed to process voice command via AI.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
       {(isListening || transcription || error || successMsg || isProcessing) && (
         <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-100 flex flex-col gap-2 transition-all">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                 <span className="font-bold text-purple-900 text-sm">AI Voice Order</span>
               </div>
               {(!isProcessing && !isListening) && (
                 <button onClick={() => { setTranscription(''); setError(null); setSuccessMsg(null); }} className="text-purple-400 hover:text-purple-700">
                    <X className="w-4 h-4" />
                 </button>
               )}
            </div>
            
            {transcription && (
              <p className="text-sm italic text-gray-700 bg-white p-2 rounded-lg">"{transcription}"</p>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-purple-700 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing order via AI...
              </div>
            )}
            
            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
            
            {successMsg && (
              <p className="text-sm text-green-700 font-medium">{successMsg}</p>
            )}
         </div>
       )}

      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm transition-all ${
          isListening 
            ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
            : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Mic className={`w-6 h-6 ${isListening ? 'animate-bounce' : ''}`} />
        {isListening ? 'Listening... Tap to stop' : 'Tap & Speak to Order'}
      </button>
    </div>
  );
}
