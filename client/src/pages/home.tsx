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
  Loader2
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

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
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

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/validate-key", { apiKey });
      const data = await response.json();
      
      if (data.valid) {
        localStorage.setItem("openai_api_key", apiKey);
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
      const response = await apiRequest("POST", "/api/generate-questions", { apiKey });
      const data = await response.json();
      
      setQuestions(data.questions);
      setCurrentStep("questions");
      
      toast({
        title: "Questions Generated",
        description: "Your philosophical reflection questions are ready.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate questions. Please try again.",
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
    try {
      const allResponses = {
        ...responses,
        finalThoughts: finalThoughts || null
      };

      const response = await apiRequest("POST", "/api/generate-journal", {
        apiKey,
        responses: allResponses
      });
      const data = await response.json();
      
      setJournalEntry(data);
      setCurrentStep("journalOutput");
      
      toast({
        title: "Journal Generated",
        description: "Your philosophical reflection has been synthesized into a beautiful journal entry.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate journal entry. Please try again.",
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
  };

  const reviseJournalEntry = async () => {
    if (!journalEntry || !revisionPrompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/revise-journal", {
        apiKey,
        currentEntry: journalEntry.finalEntry,
        revisionPrompt: revisionPrompt.trim()
      });
      const data = await response.json();
      
      setJournalEntry(data);
      setShowRevisionInput(false);
      setRevisionPrompt("");
      
      toast({
        title: "Journal Revised",
        description: "Your journal entry has been updated based on your feedback.",
      });
    } catch (error) {
      toast({
        title: "Revision Failed",
        description: "Unable to revise journal entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (!journalEntry) return;

    setIsGeneratingImage(true);
    try {
      const response = await apiRequest("POST", "/api/generate-image", {
        apiKey,
        journalEntry: journalEntry.finalEntry
      });
      const data = await response.json();
      
      setGeneratedImage(data);
      
      toast({
        title: "Image Generated",
        description: "A visual representation of your journal has been created.",
      });
    } catch (error) {
      toast({
        title: "Image Generation Failed",
        description: "Unable to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const regenerateImage = async () => {
    if (!journalEntry || !isJournalConfirmed) return;

    setIsGeneratingImage(true);
    try {
      const response = await apiRequest("POST", "/api/generate-image", {
        apiKey,
        journalEntry: journalEntry.finalEntry
      });
      const data = await response.json();
      
      setGeneratedImage(data);
      
      toast({
        title: "New Image Generated",
        description: "A new visual representation has been created.",
      });
    } catch (error) {
      toast({
        title: "Image Generation Failed",
        description: "Unable to generate new image. Please try again.",
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
                  <p className="text-xs text-muted-foreground mt-2 flex items-center">
                    <Lock className="h-3 w-3 mr-1" />
                    Your API key is stored locally and never shared
                  </p>
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
        )}

        {/* Questions */}
        {currentStep === "questions" && currentQuestion && (
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 font-semibold text-sm">{currentQuestionIndex + 1}</span>
                    </div>
                    <Badge variant="secondary" className="uppercase tracking-wide">
                      {currentQuestion.category}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-3">{currentQuestion.text}</h2>
                  <p className="text-gray-600 italic">{currentQuestion.philosopherQuote}</p>
                </div>

                <div className="space-y-6">
                  {/* Multiple Choice Options */}
                  <RadioGroup
                    value={responses[currentQuestion.id]?.selectedOption || ""}
                    onValueChange={(value) => updateResponse(currentQuestion.id, 'selectedOption', value)}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <Label
                          key={index}
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-teal-300 cursor-pointer transition-colors"
                        >
                          <RadioGroupItem value={option} className="mr-3" />
                          <span className="text-gray-700">{option}</span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>

                  {/* Custom Answer */}
                  <div>
                    <Label htmlFor={`question-${currentQuestion.id}-custom`} className="block text-sm font-medium text-gray-700 mb-2">
                      Or share your own reflection:
                    </Label>
                    <Textarea
                      id={`question-${currentQuestion.id}-custom`}
                      rows={4}
                      placeholder="Take a moment to describe your thoughts in your own words..."
                      value={responses[currentQuestion.id]?.customAnswer || ""}
                      onChange={(e) => updateResponse(currentQuestion.id, 'customAnswer', e.target.value)}
                      className="resize-none"
                    />
                  </div>
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
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <Heart className="text-teal-600 text-sm" />
                    </div>
                    <Badge variant="secondary" className="uppercase tracking-wide">Final Reflection</Badge>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-3">Any final thoughts?</h2>
                  <p className="text-gray-600">
                    This space is for any additional reflections, insights, or thoughts you'd like to capture from today.
                  </p>
                </div>

                <div>
                  <Textarea
                    rows={6}
                    placeholder="Optional: Share any final thoughts, gratitudes, or insights from your reflection..."
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
                    {!isJournalConfirmed && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowRevisionInput(!showRevisionInput)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Revise Entry
                      </Button>
                    )}
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

                {/* Draft Badge and Revision Section */}
                {journalEntry.isDraft && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        Draft • Ready for revision
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRevisionInput(!showRevisionInput)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {showRevisionInput ? "Cancel Revision" : "Revise Entry"}
                      </Button>
                    </div>

                    {showRevisionInput && (
                      <Card className="border-amber-200 bg-amber-50/30">
                        <CardContent className="p-4">
                          <Label htmlFor="revision-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                            How would you like to revise this entry?
                          </Label>
                          <Textarea
                            id="revision-prompt"
                            rows={3}
                            placeholder="Examples: Make it shorter, change the tone to be more hopeful, add more philosophical depth, focus more on gratitude, etc."
                            value={revisionPrompt}
                            onChange={(e) => setRevisionPrompt(e.target.value)}
                            className="mb-3 bg-white"
                          />
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
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
                              {isLoading ? "Revising..." : "Apply Revision"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

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
                  <div className="flex space-x-3">
                    {isJournalConfirmed ? (
                      <>
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
                      </>
                    ) : (
                      <Button
                        onClick={confirmJournal}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Confirm Final Journal
                      </Button>
                    )}
                  </div>
                </div>

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
                              onClick={regenerateImage}
                              disabled={isGeneratingImage}
                              variant="ghost"
                              size="sm"
                            >
                              {isGeneratingImage ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <ImageIcon className="h-3 w-3 mr-1" />
                              )}
                              Regenerate
                            </Button>
                          </div>
                        </div>
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
            <div className="flex items-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Support</a>
            </div>
            <p className="text-xs text-muted-foreground">Built with contemplation and care</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
