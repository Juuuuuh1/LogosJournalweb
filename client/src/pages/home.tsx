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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [generatingImageType, setGeneratingImageType] = useState<'artwork' | 'sketch' | null>(null);
  const [isJournalConfirmed, setIsJournalConfirmed] = useState(false);
  const [showImageRevision, setShowImageRevision] = useState(false);
  const [imageRevisionPrompt, setImageRevisionPrompt] = useState("");

  // Load API key from secure storage on mount
  useEffect(() => {
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
      // If user already has a stored API key, they can skip directly to questions
      // but still allow them to see the API setup screen to manage their key
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

  const generateFirstQuestion = async () => {
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
            content: "You are a philosophical guide helping users explore deep questions for daily reflection. Generate 1 thoughtful opening question for daily reflection. Structure your response as JSON with this format: {\"question\": {\"id\": \"1\", \"text\": \"question text\", \"category\": \"category name\", \"options\": [\"option1\", \"option2\", \"option3\", \"Write my own response\"], \"philosopherQuote\": \"quote text\"}}"
          }, {
            role: "user",
            content: "Generate the first philosophical question for daily reflection. Start with something about how their day went, but make it philosophical and introspective. Include 3 multiple choice options plus 'Write my own response'."
          }],
          response_format: { type: "json_object" },
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate question');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      setQuestions([result.question]);
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

  const generateNextQuestion = async () => {
    if (questions.length >= 5) return; // Limit to 5 questions total
    
    setIsLoading(true);
    try {
      // Build context from previous questions and answers
      const previousQA = questions.slice(0, currentQuestionIndex + 1).map((q, i) => {
        const response = responses[q.id];
        const answer = response?.customAnswer || response?.selectedOption || "No response";
        return `Q${i + 1}: ${q.text}\nA${i + 1}: ${answer}`;
      }).join('\n\n');

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
            content: "You are a philosophical guide helping users explore deep questions for daily reflection. Based on the user's previous answers, generate 1 thoughtful follow-up question that builds upon their responses while remaining philosophical and introspective. The question should feel like a natural progression from their previous thoughts. Structure your response as JSON with this format: {\"question\": {\"id\": \"nextId\", \"text\": \"question text\", \"category\": \"category name\", \"options\": [\"option1\", \"option2\", \"option3\", \"Write my own response\"], \"philosopherQuote\": \"quote text\"}}"
          }, {
            role: "user",
            content: `Based on the user's previous responses, generate the next philosophical question that builds upon their answers:\n\n${previousQA}\n\nCreate a follow-up question that explores deeper themes from their responses while maintaining philosophical depth. Include 3 relevant multiple choice options plus 'Write my own response'.`
          }],
          response_format: { type: "json_object" },
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate next question');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      // Add the new question with proper ID
      const nextQuestion = {
        ...result.question,
        id: (questions.length + 1).toString()
      };
      
      setQuestions(prev => [...prev, nextQuestion]);
      
      toast({
        title: "Next Question Ready",
        description: "Your next reflection question has been generated.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate next question. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestions = generateFirstQuestion;

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

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (questions.length < 5) {
      // Generate next question based on previous answers
      await generateNextQuestion();
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
    setGeneratingImageType(null);
  };

  const handleApiKeyCleared = () => {
    setApiKey("");
    setCurrentStep("apiSetup");
  };

  const resetToHome = () => {
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
    setGeneratingImageType(null);
    
    // Keep the API key but reset everything else
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    }
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

  const generateImage = async (style: 'artwork' | 'sketch' = 'artwork') => {
    if (!journalEntry) return;

    setIsGeneratingImage(true);
    setGeneratingImageType(style);
    const startTime = Date.now() / 1000;
    
    // Choose prompt based on style
    const sketchStyles = [
      "manga and anime style with clean line art",
      "American comic book style with bold outlines", 
      "detailed pencil sketch with cross-hatching",
      "minimalist line drawing style"
    ];
    
    const selectedSketchStyle = sketchStyles[Math.floor(Math.random() * sketchStyles.length)];
    
    const prompt = style === 'sketch' 
      ? `Create a hand-drawn sketch that captures the philosophical essence of this journal entry. Style: ${selectedSketchStyle}. The image should be either black and white line art or colored sketch showing a contemplative scene, character in thoughtful pose, or symbolic representation of inner reflection. Use clean, expressive lines and thoughtful composition. Ensure clean, sharp edges with no noise, artifacts, or visual disturbances around the borders. The entire image should have a polished, professional appearance with crisp details and smooth edge transitions. NO TEXT OR WORDS should appear in the image. Focus on visual storytelling through drawing techniques. Journal essence: ${journalEntry.finalEntry.substring(0, 300)}`
      : `Create a contemplative, abstract artwork that captures the philosophical essence of this journal entry through colors, shapes, and mood. Use warm, contemplative colors like soft blues, gentle golds, and muted earth tones. The composition should evoke feelings of reflection, inner peace, and philosophical depth. Style: impressionistic brushwork with flowing, organic forms. Ensure clean, sharp edges with no noise, artifacts, or visual disturbances around the borders. The image should have smooth color transitions and crisp edge definition without any grainy or pixelated areas. NO TEXT OR WORDS should appear in the image. Focus purely on abstract visual elements that convey emotion and contemplation. Journal essence: ${journalEntry.finalEntry.substring(0, 300)}`;

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DALL-E API error:", response.status, errorText);
        throw new Error(`Failed to generate image: ${response.status} - ${errorText}`);
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
        prompt: style === 'sketch' ? `Hand-drawn ${selectedSketchStyle} sketch` : `Abstract contemplative artwork`,
        generationTime: Date.now() / 1000 - startTime,
        artistStyle: style === 'sketch' ? selectedSketchStyle : selectedStyle,
        type: style
      };
      setGeneratedImage(imageResponse);
      
      toast({
        title: "Image Generated",
        description: "A visual representation of your journal has been created.",
      });
    } catch (error) {
      console.error("Image generation error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your API key and try again.';
      toast({
        title: "Image Generation Failed",
        description: `Unable to generate image: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
      setGeneratingImageType(null);
    }
  };

  const regenerateImage = async () => {
    if (!journalEntry || !isJournalConfirmed || !imageRevisionPrompt.trim() || !generatedImage) return;

    setIsGeneratingImage(true);
    const startTime = Date.now() / 1000;
    
    // Determine the current image type and use the same style
    const currentImageType = generatedImage.type || 'artwork';
    setGeneratingImageType(currentImageType);
    
    const sketchStyles = [
      "manga and anime style with clean line art",
      "American comic book style with bold outlines", 
      "detailed pencil sketch with cross-hatching",
      "minimalist line drawing style"
    ];
    
    const selectedSketchStyle = sketchStyles[Math.floor(Math.random() * sketchStyles.length)];
    
    const prompt = currentImageType === 'sketch' 
      ? `Create a hand-drawn sketch that captures philosophical reflection. Style: ${selectedSketchStyle}. The image should be either black and white line art or colored sketch showing a contemplative scene, character in thoughtful pose, or symbolic representation. Use clean, expressive lines and thoughtful composition. Ensure clean, sharp edges with no noise, artifacts, or visual disturbances around the borders. The entire image should have a polished, professional appearance with crisp details and smooth edge transitions. User's vision: ${imageRevisionPrompt}. NO TEXT OR WORDS should appear in the image. Focus on visual storytelling through drawing techniques. Journal essence: ${journalEntry.finalEntry.substring(0, 250)}`
      : `Create a contemplative, abstract artwork that captures philosophical reflection through colors, shapes, and mood. Use warm, reflective tones and flowing, organic compositions. The image should evoke feelings of inner peace and thoughtful contemplation. Style: modern abstract expressionism with gentle brushwork. Ensure clean, sharp edges with no noise, artifacts, or visual disturbances around the borders. The image should have smooth color transitions and crisp edge definition without any grainy or pixelated areas. User's vision: ${imageRevisionPrompt}. NO TEXT OR WORDS should appear in the image. Focus on abstract visual elements that convey emotion and meaning. Journal essence: ${journalEntry.finalEntry.substring(0, 250)}`;

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DALL-E API regeneration error:", response.status, errorText);
        throw new Error(`Failed to regenerate image: ${response.status} - ${errorText}`);
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
        prompt: currentImageType === 'sketch' ? `Hand-drawn ${selectedSketchStyle} sketch with custom vision` : `Abstract contemplative artwork with custom user vision`,
        generationTime: Date.now() / 1000 - startTime,
        artistStyle: currentImageType === 'sketch' ? selectedSketchStyle : selectedStyle,
        type: currentImageType
      };
      setGeneratedImage(imageResponse);
      setShowImageRevision(false);
      setImageRevisionPrompt("");
      
      toast({
        title: "New Image Generated",
        description: "A new visual representation has been created.",
      });
    } catch (error) {
      console.error("Image regeneration error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your API key and try again.';
      toast({
        title: "Image Generation Failed",
        description: `Unable to generate new image: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
      setGeneratingImageType(null);
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
            <div className="flex items-center space-x-3 cursor-pointer" onClick={resetToHome}>
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src={logoImage} 
                  alt="Logos Journal Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground hover:text-primary transition-colors">Logos Journal</h1>
                <p className="text-sm text-muted-foreground">Daily Philosophy, Reflection & Inquiry</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setCurrentStep("apiSetup")}>
                  <Key className="h-4 w-4 mr-2" />
                  Manage API Key
                </DropdownMenuItem>
                {journalEntry && (
                  <DropdownMenuItem onClick={downloadJournal}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Journal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  toast({
                    title: "About Logos Journal",
                    description: "A philosophical journaling app that uses AI to guide daily reflection and create personalized artwork.",
                  });
                }}>
                  <Shield className="h-4 w-4 mr-2" />
                  About
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  toast({
                    title: "How to Use",
                    description: "1. Add your OpenAI API key 2. Answer philosophical questions 3. Generate your journal entry 4. Create artwork or sketches",
                  });
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Help
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {hasStoredApiKey() && apiKey ? "Continue Your Journey" : "Configure Your Journey"}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {hasStoredApiKey() && apiKey 
                    ? "Your API key is securely stored. Ready to begin a new philosophical reflection?"
                    : "To begin your philosophical reflection, please provide your OpenAI API key for personalized question generation."
                  }
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
                    <div className="flex items-center space-x-2 text-xs text-blue-600">
                      <Key className="h-3 w-3" />
                      <span>
                        <a 
                          href="https://platform.openai.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          How to get an OpenAI API key →
                        </a>
                      </span>
                    </div>
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
                  {!hasStoredApiKey() && (
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Need an API key? Get one here →
                    </a>
                  )}
                  {hasStoredApiKey() && apiKey && (
                    <div className="text-sm text-muted-foreground">
                      Using your securely stored API key
                    </div>
                  )}
                  <Button 
                    onClick={hasStoredApiKey() && apiKey ? generateQuestions : validateAndSaveApiKey}
                    disabled={isLoading || (!hasStoredApiKey() && !apiKey.trim())}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? "Validating..." : hasStoredApiKey() && apiKey ? "Start New Reflection" : "Begin Reflection"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Show security badge below the main card if API key exists */}
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
                {(currentQuestionIndex === questions.length - 1 && questions.length >= 5) ? "Final Thoughts" : "Continue Reflection"}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" title="Share Journal">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => {
                          if (journalEntry) {
                            const text = `${journalEntry.finalEntry}\n\n${journalEntry.philosophicalQuote ? `"${journalEntry.philosophicalQuote}"` : ''}`;
                            navigator.clipboard.writeText(text);
                            toast({
                              title: "Copied to Clipboard",
                              description: "Your journal entry has been copied to clipboard.",
                            });
                          }
                        }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (journalEntry) {
                            const text = encodeURIComponent(`Check out my philosophical reflection: ${journalEntry.finalEntry.substring(0, 100)}...`);
                            window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                          }
                        }}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share on Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (journalEntry) {
                            const subject = encodeURIComponent("My Daily Philosophical Reflection");
                            const body = encodeURIComponent(`${journalEntry.finalEntry}\n\n${journalEntry.philosophicalQuote ? `"${journalEntry.philosophicalQuote}"` : ''}\n\nShared from Logos Journal`);
                            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                          }
                        }}>
                          <Download className="h-4 w-4 mr-2" />
                          Share via Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (journalEntry) {
                            const text = `${journalEntry.finalEntry.substring(0, 200)}...\n\n${journalEntry.philosophicalQuote ? `"${journalEntry.philosophicalQuote}"` : ''}\n\n#Philosophy #Reflection #LogosJournal`;
                            navigator.clipboard.writeText(text);
                            toast({
                              title: "Copied for Instagram",
                              description: "Text copied to clipboard. Open Instagram and paste in your story or post.",
                            });
                          }
                        }}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share on Instagram
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={downloadJournal}>
                          <Download className="h-4 w-4 mr-2" />
                          Download as Text
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    <div className="flex flex-col space-y-3">
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => generateImage('artwork')}
                          disabled={isGeneratingImage}
                          variant="outline"
                          className="flex items-center"
                        >
                          {isGeneratingImage && generatingImageType === 'artwork' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ImageIcon className="h-4 w-4 mr-2" />
                          )}
                          Generate Artwork
                        </Button>
                        <Button
                          onClick={() => generateImage('sketch')}
                          disabled={isGeneratingImage}
                          variant="outline"
                          className="flex items-center"
                        >
                          {isGeneratingImage && generatingImageType === 'sketch' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4 mr-2" />
                          )}
                          Generate Sketch
                        </Button>
                      </div>
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
                            {generatedImage.type === 'sketch' ? 'Style:' : 'Inspired by'} {generatedImage.artistStyle}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Generated in {generatedImage.generationTime.toFixed(1)}s
                            </div>
                            <div className="flex items-center space-x-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Download Image">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={async () => {
                                    if (generatedImage) {
                                      try {
                                        const response = await fetch(generatedImage.imageUrl);
                                        const blob = await response.blob();
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `philosophical-${generatedImage.type || 'artwork'}-${new Date().toISOString().split('T')[0]}.png`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                        toast({
                                          title: "Image Downloaded",
                                          description: "Your image has been saved to your device.",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Download Failed",
                                          description: "Unable to download image. Please try again.",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }}>
                                    <Download className="h-3 w-3 mr-2" />
                                    Save Image
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Share Image">
                                    <Share2 className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => {
                                    if (generatedImage && journalEntry) {
                                      const text = `Check out my philosophical ${generatedImage.type || 'artwork'} inspired by my daily reflection. Created with Logos Journal.`;
                                      navigator.clipboard.writeText(`${text}\n\nImage: ${generatedImage.imageUrl}`);
                                      toast({
                                        title: "Copied to Clipboard",
                                        description: "Image link and description copied to clipboard.",
                                      });
                                    }
                                  }}>
                                    <FileText className="h-3 w-3 mr-2" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    if (generatedImage && journalEntry) {
                                      const text = encodeURIComponent(`Check out my philosophical ${generatedImage.type || 'artwork'} created from my daily reflection! 🎨✨`);
                                      const url = encodeURIComponent(generatedImage.imageUrl);
                                      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                                    }
                                  }}>
                                    <Share2 className="h-3 w-3 mr-2" />
                                    Share on Twitter
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    if (generatedImage && journalEntry) {
                                      const subject = encodeURIComponent(`My Philosophical ${generatedImage.type === 'sketch' ? 'Sketch' : 'Artwork'}`);
                                      const body = encodeURIComponent(`I wanted to share this ${generatedImage.type || 'artwork'} created from my daily philosophical reflection.\n\nStyle: ${generatedImage.artistStyle}\n\nImage: ${generatedImage.imageUrl}\n\nCreated with Logos Journal`);
                                      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                                    }
                                  }}>
                                    <Share2 className="h-3 w-3 mr-2" />
                                    Share via Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    if (generatedImage && journalEntry) {
                                      const caption = `My philosophical ${generatedImage.type || 'artwork'} inspired by today's reflection ✨\n\nStyle: ${generatedImage.artistStyle}\n\n#Philosophy #Art #Reflection #LogosJournal #AI${generatedImage.type === 'sketch' ? ' #Sketch' : 'Art'}`;
                                      navigator.clipboard.writeText(caption);
                                      toast({
                                        title: "Caption Copied",
                                        description: "Caption copied to clipboard. Save the image and share on Instagram with this caption.",
                                      });
                                    }
                                  }}>
                                    <Share2 className="h-3 w-3 mr-2" />
                                    Share on Instagram
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
            <div className="flex-1">
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
            <p className="text-xs text-muted-foreground ml-4">Built with contemplation 🤔 and care ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
