import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';

const AnimatedLetter = ({ letter, index }: { letter: string; index: number }) => (
  <motion.span
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.5, 
      delay: index * 0.1
    }}
    className="inline-block text-6xl font-bold text-primary"
  >
    {letter}
  </motion.span>
);

export default function Liora() {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Call the AI API with proper authentication
      const response = await fetch('/api/liora/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((() => {
            const authData = localStorage.getItem('authData');
            return authData ? { Authorization: `Bearer ${JSON.parse(authData).token}` } : {};
          })())
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setConversation(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again or contact support if the issue persists.` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Add error boundary for animations and promises
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Runtime error caught:', event.error);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const letterVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.9 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" />
            Liora AI Assistant
          </h1>
          <p className="text-muted-foreground">Get intelligent recommendations for your loan management company</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Assistant Interface */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* Animated Liora Logo */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="relative inline-block"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg"
                  >
                    <Bot className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <div className="flex justify-center space-x-1">
                    {'LIORA'.split('').map((letter, index) => (
                      <motion.span
                        key={index}
                        variants={letterVariants}
                        whileHover="hover"
                        whileTap="tap"
                        className="cursor-pointer"
                      >
                        <AnimatedLetter letter={letter} index={index} />
                      </motion.span>
                    ))}
                  </div>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-muted-foreground mt-2"
                  >
                    Loan Intelligence & Optimization Recommendation Assistant
                  </motion.p>
                </motion.div>
              </div>

              {/* Chat Interface */}
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                  {conversation.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Welcome to Liora!</h3>
                        <p className="text-muted-foreground">
                          Ask me anything about loan management, portfolio optimization, 
                          risk assessment, or financial recommendations for your company.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversation.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-background text-foreground border'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-background border p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles className="w-4 h-4 text-primary" />
                              </motion.div>
                              <span className="text-sm text-muted-foreground">Liora is analyzing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask Liora for loan management recommendations..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 min-h-[100px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isTyping}
                    className="self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setMessage("How can I optimize my loan portfolio?")}
              >
                Portfolio Optimization
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setMessage("What's the risk assessment for my current loans?")}
              >
                Risk Assessment
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setMessage("How can I improve my loan approval process?")}
              >
                Process Improvement
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setMessage("What are the market trends for loan interest rates?")}
              >
                Market Analysis
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Capabilities */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Portfolio Analysis</p>
                  <p className="text-sm text-muted-foreground">Deep insights into loan performance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Risk Prediction</p>
                  <p className="text-sm text-muted-foreground">Identify potential defaults early</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Optimization</p>
                  <p className="text-sm text-muted-foreground">Improve operational efficiency</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Market Intelligence</p>
                  <p className="text-sm text-muted-foreground">Stay ahead of industry trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}