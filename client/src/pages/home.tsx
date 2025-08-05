import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  storeApiKey, 
  getStoredApiKey, 
  hasStoredApiKey, 
  clearStoredApiKey 
} from "@/lib/security";
import { SecurityBadge } from "@/components/ui/security-badge";
import { 
  Feather, 
  Settings, 
  Key, 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Sparkles,
  Download,
  Share2,
  Edit,
  Clock,
  FileText,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Shield
} from "lucide-react";
import logoImage from "@assets/image_1754419399979.png";
import type { PhilosophicalQuestion, QuestionResponse, JournalResponse, ImageResponse } from "@shared/schema";

type JournalStep = "apiSetup" | "questions" | "finalComments" | "journalOutput";

export default function Home() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<JournalStep>("apiSetup");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [questions, setQuestions] = useState<PhilosophicalQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [finalThoughts, setFinalThoughts] = useState("");
  const [journalEntry, setJournalEntry] = useState<JournalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<ImageResponse | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isJournalConfirmed, setIsJournalConfirmed] = useState(false);
  const [showImageRevision, setShowImageRevision] = useState(false);
  const [imageRevisionPrompt, setImageRevisionPrompt] = useState("");

  // Load API key from secure storage on mount
  useEffect(() => {
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const validateAndSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to continue.",
        variant: "destructive",
      });
      return;
    }

    // Basic API key format validation
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      toast({
        title: "Invalid API Key Format",
        description: "OpenAI API keys start with 'sk-' and are longer. Please check your key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test the API key by making a direct call to OpenAI
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (testResponse.ok) {
        storeApiKey(apiKey);
        await generateQuestions();
      } else {
        toast({
          title: "Invalid API Key",
          description: "The provided API key is not valid. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Unable to validate API key. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "system",
            content: "You are a philosophical guide helping users explore deep questions for daily reflection. Generate 5 thoughtful philosophical questions that encourage introspection. Each question should be accompanied by a brief quote from a relevant philosopher. Structure your response as JSON with this format: {\"questions\": [{\"id\": \"1\", \"text\": \"question text\", \"category\": \"category name\", \"options\": [\"option1\", \"option2\", \"option3\", \"Write my own response\"], \"philosopherQuote\": \"quote text\"}]}"
          }, {
            role: "user",
            content: "Generate 5 diverse philosophical questions for daily reflection, starting with 'How was your day?' Each should have 3 multiple choice options plus 'Write my own response'."
          }],
          response_format: { type: "json_object" },
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      setQuestions(result.questions);
      setCurrentStep("questions");
      
      toast({
        title: "Questions Generated",
        description: "Your philosophical reflection questions are ready.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate questions. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateResponse = (questionId: string, field: 'selectedOption' | 'customAnswer', value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        [field]: value,
      }
    }));
  };

  const canProceedFromQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const response = responses[currentQuestion?.id];
    return response && (response.selectedOption || response.customAnswer);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStep("finalComments");
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setCurrentStep("apiSetup");
    }
  };

  const generateJournalEntry = async () => {
    setIsLoading(true);
    const startTime = Date.now() / 1000;
    try {
      const allResponses = {
        ...responses,
        finalThoughts: finalThoughts || null
      };

      // Format responses for the journal prompt
      const responseText = questions.map(q => {
        const response = responses[q.id];
        let answer = 'No response';
        
        if (response?.selectedOption && response?.customAnswer) {
          // Both selection and custom input exist
          answer = `${response.selectedOption} - ${response.customAnswer}`;
        } else if (response?.selectedOption) {
          // Only selection exists
          answer = response.selectedOption;
        } else if (response?.customAnswer) {
          // Only custom answer exists
          answer = response.customAnswer;
        }
        
        return `Question: ${q.text}\nAnswer: ${answer}`;
      }).join('\n\n');

      const finalThoughtsText = finalThoughts ? `\n\nFinal Thoughts: ${finalThoughts}` : '';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "system",
            content: "You are a philosophical journal writer. Create a concise, thoughtful journal entry based on the user's responses to philosophical questions. Keep the entry under 200 words while maintaining depth and insight. Include relevant philosophical quotes and insights. Structure your response as JSON with: {\"finalEntry\": \"the journal entry text (under 200 words)\", \"philosophicalQuote\": \"a relevant quote with attribution\", \"keyInsights\": [\"insight1\", \"insight2\", \"insight3\"]}"
          }, {
            role: "user",
            content: `Please create a concise philosophical journal entry (under 200 words) based on these responses:\n\n${responseText}${finalThoughtsText}\n\nSynthesize these into a coherent, meaningful reflection that captures the philosophical themes and personal insights in a concise format.`
          }],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate journal entry');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      // Add missing properties that the UI expects
      const journalWithMetrics = {
        ...result,
        wordCount: result.finalEntry.split(' ').length,
        generationTime: Date.now() / 1000 - startTime
      };
      
      setJournalEntry(journalWithMetrics);
      setCurrentStep("journalOutput");
      
      toast({
        title: "Journal Generated",
        description: "Your philosophical reflection has been synthesized into a beautiful journal entry.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate journal entry. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewReflection = () => {
    setCurrentStep("apiSetup");
    setCurrentQuestionIndex(0);
    setResponses({});
    setFinalThoughts("");
    setJournalEntry(null);
    setQuestions([]);
    setShowRevisionInput(false);
    setRevisionPrompt("");
    setGeneratedImage(null);
    setIsJournalConfirmed(false);
    setShowImageRevision(false);
    setImageRevisionPrompt("");
  };

  const handleApiKeyCleared = () => {
    setApiKey("");
    setCurrentStep("apiSetup");
  };

  const reviseJournalEntry = async () => {
    if (!journalEntry || !revisionPrompt.trim()) return;

    setIsLoading(true);
    const startTime = Date.now() / 1000;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "system",
            content: "You are a philosophical journal writer. Revise the given journal entry based on the user's feedback while maintaining the philosophical depth and insights. Structure your response as JSON with: {\"finalEntry\": \"the revised journal entry text\", \"philosophicalQuote\": \"a relevant quote with attribution\", \"keyInsights\": [\"insight1\", \"insight2\", \"insight3\"]}"
          }, {
            role: "user",
            content: `Please revise this journal entry based on my feedback:\n\nCurrent Entry: ${journalEntry.finalEntry}\n\nRevision Request: ${revisionPrompt.trim()}\n\nPlease make the requested changes while maintaining the philosophical depth and personal insights.`
          }],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to revise journal entry');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      // Add missing properties that the UI expects
      const journalWithMetrics = {
        ...result,
        wordCount: result.finalEntry.split(' ').length,
        generationTime: Date.now() / 1000 - startTime
      };
      
      setJournalEntry(journalWithMetrics);
      setShowRevisionInput(false);
      setRevisionPrompt("");
      
      toast({
        title: "Journal Revised",
        description: "Your journal entry has been updated based on your feedback.",
      });
    } catch (error) {
      toast({
        title: "Revision Failed",
        description: "Unable to revise journal entry. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (!journalEntry) return;

    setIsGeneratingImage(true);
    const startTime = Date.now() / 1000;
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Create a contemplative, artistic image inspired by famous artists like Van Gogh, Monet, Picasso, or Kandinsky that captures the philosophical essence of this journal entry: ${journalEntry.finalEntry.substring(0, 500)}... NO TEXT OR WORDS should appear in the image. Focus on colors, emotions, and abstract representations.`,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      // Randomly select an artist style for variety
      const artistStyles = [
        "Van Gogh's Post-Impressionist Style",
        "Monet's Impressionist Technique", 
        "Picasso's Cubist Approach",
        "Kandinsky's Abstract Expressionism",
        "Turner's Romantic Landscape Style",
        "Rothko's Color Field Painting",
        "Cézanne's Post-Impressionist Method",
        "Dalí's Surrealist Vision"
      ];
      const selectedStyle = artistStyles[Math.floor(Math.random() * artistStyles.length)];
      
      const imageResponse = {
        imageUrl: data.data[0].url,
        prompt: `Create a contemplative, artistic image inspired by famous artists like Van Gogh, Monet, Picasso, or Kandinsky that captures the philosophical essence of this journal entry: ${journalEntry.finalEntry.substring(0, 500)}... NO TEXT OR WORDS should appear in the image. Focus on colors, emotions, and abstract representations.`,
        generationTime: Date.now() / 1000 - startTime,
        artistStyle: selectedStyle
      };
      setGeneratedImage(imageResponse);
      
      toast({
        title: "Image Generated",
        description: "A visual representation of your journal has been created.",
      });
    } catch (error) {
      toast({
        title: "Image Generation Failed",
        description: "Unable to generate image. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const regenerateImage = async () => {
    if (!journalEntry || !isJournalConfirmed || !imageRevisionPrompt.trim()) return;

    setIsGeneratingImage(true);
    const startTime = Date.now() / 1000;
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Create a contemplative, artistic image inspired by famous artists like Van Gogh, Monet, Picasso, or Kandinsky that captures the philosophical essence of this journal entry: ${journalEntry.finalEntry.substring(0, 400)}... User's specific request: ${imageRevisionPrompt}. NO TEXT OR WORDS should appear in the image. Focus on colors, emotions, and abstract representations.`,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      // Randomly select an artist style for variety in regenerated images
      const artistStyles = [
        "Van Gogh's Post-Impressionist Style",
        "Monet's Impressionist Technique", 
        "Picasso's Cubist Approach",
        "Kandinsky's Abstract Expressionism",
        "Turner's Romantic Landscape Style",
        "Rothko's Color Field Painting",
        "Cézanne's Post-Impressionist Method",
        "Dalí's Surrealist Vision"
      ];
      const selectedStyle = artistStyles[Math.floor(Math.random() * artistStyles.length)];
      
      const imageResponse = {
        imageUrl: data.data[0].url,
        prompt: `Create a contemplative, artistic image inspired by famous artists like Van Gogh, Monet, Picasso, or Kandinsky that captures the philosophical essence of this journal entry: ${journalEntry.finalEntry.substring(0, 400)}... User's specific request: ${imageRevisionPrompt}. NO TEXT OR WORDS should appear in the image. Focus on colors, emotions, and abstract representations.`,
        generationTime: Date.now() / 1000 - startTime,
        artistStyle: selectedStyle
      };
      setGeneratedImage(imageResponse);
      setShowImageRevision(false);
      setImageRevisionPrompt("");
      
      toast({
        title: "New Image Generated",
        description: "A new visual representation has been created.",
      });
    } catch (error) {
      toast({
        title: "Image Generation Failed",
        description: "Unable to generate new image. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const confirmJournal = () => {
    setIsJournalConfirmed(true);
    setShowRevisionInput(false);
    toast({
      title: "Journal Confirmed",
      description: "Your journal entry has been finalized.",
    });
  };

  const downloadJournal = () => {
    if (!journalEntry) return;
    
    let content = `Philosophical Daily Journal\n${new Date().toLocaleDateString()}\n\n${journalEntry.finalEntry}`;
    
    if (journalEntry.philosophicalQuote) {
      content += `\n\n---\n${journalEntry.philosophicalQuote}`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProgressPercentage = () => {
    if (currentStep === "apiSetup") return 0;
    if (currentStep === "questions") return ((currentQuestionIndex + 1) / questions.length) * 80;
    if (currentStep === "finalComments") return 90;
    return 100;
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src={logoImage} 
                  alt="Logos Journal Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Logos Journal</h1>
                <p className="text-sm text-muted-foreground">Daily Philosophy, Reflection & Inquiry</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        {currentStep !== "apiSetup" && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Reflection Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {currentStep === "questions" && `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                  {currentStep === "finalComments" && "Final Thoughts"}
                  {currentStep === "journalOutput" && "Complete"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Key Setup */}
        {currentStep === "apiSetup" && (
          <div>            
            <Card className="shadow-lg">
              <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="text-primary text-xl" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Configure Your Journey</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  To begin your philosophical reflection, please provide your OpenAI API key for personalized question generation.
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="api-key" className="text-sm font-medium text-foreground mb-2 block">
                    OpenAI API Key <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-green-600">
                      <Shield className="h-3 w-3" />
                      <span>Encrypted and stored only in your browser</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-green-600">
                      <Shield className="h-3 w-3" />
                      <span>Never sent to our servers - only directly to OpenAI</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-6">
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Need an API key? Get one here →
                  </a>
                  <Button 
                    onClick={validateAndSaveApiKey}
                    disabled={isLoading || !apiKey.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? "Validating..." : "Begin Reflection"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Show security badge if API key is already stored */}
          {hasStoredApiKey() && apiKey && (
            <SecurityBadge 
              apiKey={apiKey} 
              onKeyCleared={handleApiKeyCleared}
            />
          )}
          </div>
        )}

        {/* Questions */}
        {currentStep === "questions" && currentQuestion && (
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">{currentQuestionIndex + 1}</span>
                    </div>
                    <Badge variant="secondary" className="uppercase tracking-wide">
                      {currentQuestion.category}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-3">{currentQuestion.text}</h2>
                  <p className="text-muted-foreground italic">{currentQuestion.philosopherQuote}</p>
                </div>

                <div className="space-y-6">
                  {/* Multiple Choice Options */}
                  <RadioGroup
                    value={responses[currentQuestion.id]?.selectedOption || ""}
                    onValueChange={(value) => updateResponse(currentQuestion.id, 'selectedOption', value)}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="space-y-3">
                          <Label className="flex items-center p-4 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                            <RadioGroupItem value={option} className="mr-3" />
                            <span className="text-foreground">{option}</span>
                          </Label>
                          
                          {/* Show input for selected option (except "Write my own response") */}
                          {responses[currentQuestion.id]?.selectedOption === option && 
                           option !== "Write my own response" && (
                            <div className="ml-6">
                              <Textarea
                                rows={2}
                                placeholder="Any specific keywords or short description to add to this choice?"
                                value={responses[currentQuestion.id]?.customAnswer || ""}
                                onChange={(e) => updateResponse(currentQuestion.id, 'customAnswer', e.target.value)}
                                className="resize-none text-sm"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {/* Show full custom answer input only when "Write my own response" is selected */}
                  {responses[currentQuestion.id]?.selectedOption === "Write my own response" && (
                    <div>
                      <Textarea
                        rows={4}
                        placeholder="Take a moment to describe your thoughts in your own words..."
                        value={responses[currentQuestion.id]?.customAnswer || ""}
                        onChange={(e) => updateResponse(currentQuestion.id, 'customAnswer', e.target.value)}
                        className="resize-none"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={!canProceedFromQuestion()}
                className="bg-primary hover:bg-primary/90"
              >
                {currentQuestionIndex === questions.length - 1 ? "Final Thoughts" : "Continue Reflection"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Final Comments */}
        {currentStep === "finalComments" && (
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <Heart className="text-primary text-sm" />
                    </div>
                    <Badge variant="secondary" className="uppercase tracking-wide">Final Reflection</Badge>
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-3">Additional Reflections</h2>
                  <p className="text-muted-foreground">
                    Capture any final insights, gratitudes, or specific events from your day that you'd like to include in your journal.
                  </p>
                </div>

                <div>
                  <Textarea
                    rows={6}
                    placeholder="Optional: Share any additional insights, gratitudes, or specific events from your day..."
                    value={finalThoughts}
                    onChange={(e) => setFinalThoughts(e.target.value)}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("questions")}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={generateJournalEntry}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isLoading ? "Generating..." : "Generate Journal Entry"}
              </Button>
            </div>
          </div>
        )}

        {/* Generated Journal */}
        {currentStep === "journalOutput" && journalEntry && (
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {isJournalConfirmed ? "Your Daily Journal" : "Journal Draft"}
                    </h2>
                    <p className="text-muted-foreground">
                      {new Date().toLocaleDateString()}
                      {!isJournalConfirmed && " • Draft"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadJournal}
                      disabled={!isJournalConfirmed}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-accent rounded-xl p-6 border-l-4 border-primary mb-6">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {journalEntry.finalEntry}
                    </p>
                  </div>
                  
                  {/* Philosophical Quote */}
                  {journalEntry.philosophicalQuote && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <blockquote className="italic text-muted-foreground text-center">
                        {journalEntry.philosophicalQuote}
                      </blockquote>
                    </div>
                  )}
                </div>



                <Separator />

                <div className="flex items-center justify-between pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Generated in {journalEntry.generationTime.toFixed(1)}s
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {journalEntry.wordCount} words
                    </div>
                  </div>
                  {isJournalConfirmed && (
                    <div className="flex space-x-3">
                      <Button
                        onClick={generateImage}
                        disabled={isGeneratingImage}
                        variant="outline"
                        className="flex items-center"
                      >
                        {isGeneratingImage ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4 mr-2" />
                        )}
                        Generate Artwork
                      </Button>
                      <Button
                        onClick={startNewReflection}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Start New Reflection
                      </Button>
                    </div>
                  )}
                </div>

                {/* Draft Confirmation Section */}
                {!isJournalConfirmed && (
                  <div className="mt-8 p-6 bg-accent/50 rounded-xl border border-primary/20">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium text-foreground mb-2">Review Your Journal Draft</h3>
                      <p className="text-sm text-muted-foreground">
                        You can confirm this draft as your final journal or make revisions first.
                      </p>
                    </div>
                    <div className="flex justify-center space-x-4">
                      <Button 
                        variant="outline"
                        onClick={() => setShowRevisionInput(!showRevisionInput)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {showRevisionInput ? "Cancel Revision" : "Revise Entry"}
                      </Button>
                      <Button
                        onClick={confirmJournal}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Confirm as Final Journal
                      </Button>
                    </div>
                    
                    {/* Revision Input Area */}
                    {showRevisionInput && (
                      <div className="mt-6 p-6 bg-accent rounded-xl border">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="revision-prompt" className="block text-sm font-medium text-foreground mb-2">
                              How would you like to revise your journal entry?
                            </Label>
                            <Textarea
                              id="revision-prompt"
                              rows={3}
                              placeholder="e.g., 'Make it more hopeful', 'Add more depth about gratitude', 'Shorten it to focus on key insights'..."
                              value={revisionPrompt}
                              onChange={(e) => setRevisionPrompt(e.target.value)}
                              className="resize-none"
                            />
                          </div>
                          <div className="flex justify-end space-x-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowRevisionInput(false);
                                setRevisionPrompt("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={reviseJournalEntry}
                              disabled={isLoading || !revisionPrompt.trim()}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {isLoading ? "Revising..." : "Apply Changes"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Generated Image Display */}
                {generatedImage && (
                  <div className="mt-8">
                    <Separator className="mb-6" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Visual Reflection</h3>
                      <div className="bg-accent rounded-xl p-6 border">
                        <img
                          src={generatedImage.imageUrl}
                          alt="Generated artwork representing your journal reflection"
                          className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                        />
                        <div className="mt-4 space-y-1">
                          <div className="text-sm text-muted-foreground font-medium">
                            Inspired by {generatedImage.artistStyle}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Generated in {generatedImage.generationTime.toFixed(1)}s
                            </div>
                            <Button
                              onClick={() => setShowImageRevision(!showImageRevision)}
                              disabled={isGeneratingImage}
                              variant="ghost"
                              size="sm"
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Regeneration Prompt */}
                {showImageRevision && generatedImage && isJournalConfirmed && (
                  <div className="mt-6 p-6 bg-accent rounded-xl border">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="image-revision-prompt" className="block text-sm font-medium text-foreground mb-2">
                          How would you like to modify the artwork?
                        </Label>
                        <Textarea
                          id="image-revision-prompt"
                          rows={3}
                          placeholder="e.g., 'More vibrant colors', 'Make it a landscape instead', 'In Van Gogh style', 'Add more warmth'..."
                          value={imageRevisionPrompt}
                          onChange={(e) => setImageRevisionPrompt(e.target.value)}
                          className="resize-none"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowImageRevision(false);
                            setImageRevisionPrompt("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={regenerateImage}
                          disabled={isGeneratingImage || !imageRevisionPrompt.trim()}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-3 w-3 mr-2" />
                              Generate New Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <blockquote className="text-muted-foreground italic text-sm font-serif leading-relaxed">
                {(() => {
                  const quotes = [
                    { text: "The unexamined life is not worth living.", author: "Socrates" },
                    { text: "I think, therefore I am.", author: "René Descartes" },
                    { text: "Man is condemned to be free.", author: "Jean-Paul Sartre" },
                    { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
                    { text: "Life must be understood backward. But it must be lived forward.", author: "Søren Kierkegaard" },
                    { text: "What does not destroy me, makes me stronger.", author: "Friedrich Nietzsche" },
                    { text: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell" },
                    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
                    { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
                    { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
                    { text: "The mind is everything. What you think you become.", author: "Buddha" },
                    { text: "He who is not busy being born is busy dying.", author: "Bob Dylan" },
                    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
                    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
                    { text: "Yesterday is history, tomorrow is a mystery, today is a gift.", author: "Eleanor Roosevelt" }
                  ];
                  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                  return `"${randomQuote.text}" — ${randomQuote.author}`;
                })()}
              </blockquote>
            </div>
            <p className="text-xs text-muted-foreground ml-4">Built with contemplation and care</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
