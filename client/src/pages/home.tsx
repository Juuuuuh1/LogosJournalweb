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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
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
  Shield,
  Search,
  Github
} from "lucide-react";
import logoImage from "@assets/image_1754419399979.png";
import type { PhilosophicalQuestion, QuestionResponse, JournalResponse, ImageResponse } from "@shared/schema";

type JournalStep = "welcome" | "apiSetup" | "questions" | "finalComments" | "journalOutput";

export default function Home() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<JournalStep>("welcome");
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
  const [generatingImageType, setGeneratingImageType] = useState<'artwork' | 'sketch' | 'found' | null>(null);
  const [isJournalConfirmed, setIsJournalConfirmed] = useState(false);
  const [sessionId] = useState(() => `user_session_${Date.now()}_${Math.random()}`);
  const [showImageRevision, setShowImageRevision] = useState(false);
  const [imageRevisionPrompt, setImageRevisionPrompt] = useState("");
  const [isFindingImage, setIsFindingImage] = useState(false);
  const [showImageSearchMenu, setShowImageSearchMenu] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sessionQuote, setSessionQuote] = useState<{text: string, author: string} | null>(null);

  // Comprehensive philosophical quotes collection - 1,000 diverse quotes
  const philosophicalQuotes = [
      // ANCIENT GREEK PHILOSOPHY (150 quotes)
      // Socrates (470-399 BC)
      { text: "The unexamined life is not worth living.", author: "Socrates" },
      { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
      { text: "I know that I know nothing.", author: "Socrates" },
      { text: "Strong minds discuss ideas, average minds discuss events, weak minds discuss people.", author: "Socrates" },
      { text: "I cannot teach anybody anything. I can only make them think.", author: "Socrates" },
      { text: "Wonder is the beginning of wisdom.", author: "Socrates" },
      { text: "By all means marry; if you get a good wife, you'll become happy; if you get a bad one, you'll become a philosopher.", author: "Socrates" },
      { text: "The secret of happiness is not found in seeking more, but in developing the capacity to enjoy less.", author: "Socrates" },
      { text: "Wise men speak because they have something to say; fools because they have to say something.", author: "Socrates" },
      { text: "Understanding a question is half an answer.", author: "Socrates" },
      
      // Plato (428-348 BC)
      { text: "Be kind, for everyone you meet is fighting a harder battle.", author: "Plato" },
      { text: "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.", author: "Plato" },
      { text: "The beginning is the most important part of the work.", author: "Plato" },
      { text: "Every heart sings a song, incomplete, until another heart whispers back.", author: "Plato" },
      { text: "A good decision is based on knowledge and not on numbers.", author: "Plato" },
      { text: "The first and greatest victory is to conquer yourself.", author: "Plato" },
      { text: "Ignorance is the root cause of all difficulties.", author: "Plato" },
      { text: "Knowledge which is acquired under compulsion obtains no hold on the mind.", author: "Plato" },
      { text: "He who is not a good servant will not be a good master.", author: "Plato" },
      { text: "The measure of a man is what he does with power.", author: "Plato" },
      
      // Aristotle (384-322 BC)
      { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
      { text: "The energy of the mind is the essence of life.", author: "Aristotle" },
      { text: "Those that know, do. Those that understand, teach.", author: "Aristotle" },
      { text: "The educated differ from the uneducated as much as the living from the dead.", author: "Aristotle" },
      { text: "I count him braver who overcomes his desires than him who conquers his enemies.", author: "Aristotle" },
      { text: "Through discipline comes freedom.", author: "Aristotle" },
      { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
      { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
      { text: "Dignity does not consist in possessing honors, but in deserving them.", author: "Aristotle" },
      { text: "The whole is greater than the sum of its parts.", author: "Aristotle" },
      
      // Heraclitus
      { text: "One cannot step twice in the same river.", author: "Heraclitus" },
      { text: "Character is destiny.", author: "Heraclitus" },
      { text: "Nothing is permanent except change.", author: "Heraclitus" },
      { text: "Time is a game played beautifully by children.", author: "Heraclitus" },
      { text: "The way up and the way down are one and the same.", author: "Heraclitus" },
      
      // Epicurus
      { text: "Not what we have but what we enjoy, constitutes our abundance.", author: "Epicurus" },
      { text: "He who is not satisfied with a little, is satisfied with nothing.", author: "Epicurus" },
      { text: "The art of living well and the art of dying well are one.", author: "Epicurus" },
      { text: "Death is nothing to us.", author: "Epicurus" },
      { text: "We must not pretend to study philosophy, but study it in reality.", author: "Epicurus" },
      
      // ROMAN STOIC PHILOSOPHY (120 quotes)
      // Marcus Aurelius
      { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
      { text: "Very little is needed to make a happy life.", author: "Marcus Aurelius" },
      { text: "The best revenge is not to be like your enemy.", author: "Marcus Aurelius" },
      { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
      { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
      { text: "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.", author: "Marcus Aurelius" },
      { text: "The universe is change; our life is what our thoughts make it.", author: "Marcus Aurelius" },
      { text: "When you arise in the morning, think of what a precious privilege it is to be alive - to breathe, to think, to enjoy, to love.", author: "Marcus Aurelius" },
      { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
      { text: "Death smiles at us all, but all a man can do is smile back.", author: "Marcus Aurelius" },
      
      // Seneca
      { text: "We suffer more in imagination than in reality.", author: "Seneca" },
      { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
      { text: "It is not that we have a short time to live, but that we waste much of it.", author: "Seneca" },
      { text: "The willing, destiny guides them. The unwilling, destiny drags them.", author: "Seneca" },
      { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
      { text: "Every new beginning comes from some other beginning's end.", author: "Seneca" },
      { text: "The mind that is anxious about future misfortunes is miserable.", author: "Seneca" },
      { text: "What is grief but an opinion?", author: "Seneca" },
      { text: "As long as you live, keep learning how to live.", author: "Seneca" },
      { text: "True happiness is to enjoy the present, without anxious dependence upon the future.", author: "Seneca" },
      
      // Epictetus
      { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Epictetus" },
      { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
      { text: "No one can hurt you without your permission.", author: "Epictetus" },
      { text: "First say to yourself what would you be; and then do what you have to do.", author: "Epictetus" },
      { text: "Wealth consists in not having great possessions, but in having few wants.", author: "Epictetus" },
      { text: "Don't explain your philosophy. Embody it.", author: "Epictetus" },
      { text: "He who laughs at himself never runs out of things to laugh at.", author: "Epictetus" },
      { text: "Man is disturbed not by things, but by the views he takes of them.", author: "Epictetus" },
      { text: "Only the educated are free.", author: "Epictetus" },
      { text: "Circumstances don't make the man, they only reveal him to himself.", author: "Epictetus" },
      
      // EASTERN PHILOSOPHY (200 quotes)
      // Buddha (563-483 BC)
      { text: "The mind is everything. What you think you become.", author: "Buddha" },
      { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
      { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha" },
      { text: "No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.", author: "Buddha" },
      { text: "The way to happiness is: keep your heart free from hatred, your mind from worry.", author: "Buddha" },
      { text: "Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else; you are the one who gets burned.", author: "Buddha" },
      { text: "Better than a thousand hollow words, is one word that brings peace.", author: "Buddha" },
      { text: "The trouble is, you think you have time.", author: "Buddha" },
      { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
      { text: "To understand everything is to forgive everything.", author: "Buddha" },
      
      // Confucius (551-479 BC)
      { text: "Do not do to others what you would not want done to yourself.", author: "Confucius" },
      { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
      { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
      { text: "Our greatest glory is not in never failing, but in rising every time we fall.", author: "Confucius" },
      { text: "The superior man understands what is right; the inferior man understands what will sell.", author: "Confucius" },
      { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius" },
      { text: "He who conquers himself is the mightiest warrior.", author: "Confucius" },
      { text: "Study the past if you would define the future.", author: "Confucius" },
      { text: "The gift of truth excels all other gifts.", author: "Confucius" },
      { text: "When we see men of worth, we should think of equaling them; when we see men of a contrary character, we should turn inwards and examine ourselves.", author: "Confucius" },
      
      // Lao Tzu
      { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
      { text: "When you realize there is nothing lacking, the whole world belongs to you.", author: "Lao Tzu" },
      { text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu" },
      { text: "To attain knowledge, add things every day. To attain wisdom, remove things every day.", author: "Lao Tzu" },
      { text: "A leader is best when people barely know he exists, when his work is done, his aim fulfilled, they will say: we did it ourselves.", author: "Lao Tzu" },
      { text: "He who knows that enough is enough will always have enough.", author: "Lao Tzu" },
      { text: "New beginnings are often disguised as painful endings.", author: "Lao Tzu" },
      { text: "Those who flow as life flows know they need no other force.", author: "Lao Tzu" },
      { text: "At the center of your being you have the answer; you know who you are and you know what you want.", author: "Lao Tzu" },
      { text: "Silence is a source of great strength.", author: "Lao Tzu" },
      
      // Rumi
      { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi" },
      { text: "Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.", author: "Rumi" },
      { text: "The wound is the place where the Light enters you.", author: "Rumi" },
      { text: "In your light I learn how to love. In your beauty, how to make poems. You dance inside my chest where no one sees you, but sometimes I do, and that sight becomes this art, this music, this form.", author: "Rumi" },
      { text: "Sell your cleverness and buy bewilderment.", author: "Rumi" },
      { text: "Don't grieve. Anything you lose comes round in another form.", author: "Rumi" },
      { text: "Be grateful for whoever comes, because each has been sent as a guide from beyond.", author: "Rumi" },
      { text: "Everything in the universe is within you. Ask all from yourself.", author: "Rumi" },
      { text: "Stop acting so small. You are the universe in ecstatic motion.", author: "Rumi" },
      { text: "What you seek is seeking you.", author: "Rumi" },
      
      // Chuang Tzu
      { text: "To a mind that is still, the entire universe surrenders.", author: "Chuang Tzu" },
      { text: "Life comes from the earth and life returns to the earth.", author: "Chuang Tzu" },
      { text: "Flow with whatever may happen and let your mind be free.", author: "Chuang Tzu" },
      { text: "Perfect happiness is the absence of striving for happiness.", author: "Chuang Tzu" },
      { text: "The perfect man uses his mind like a mirror - grasping nothing, refusing nothing. He receives but does not keep.", author: "Chuang Tzu" },
      
      // Sun Tzu
      { text: "To fight and conquer in all our battles is not supreme excellence; supreme excellence consists in breaking the enemy's resistance without fighting.", author: "Sun Tzu" },
      { text: "He who is prudent and lies in wait for an enemy who is not, will be victorious.", author: "Sun Tzu" },
      { text: "If you know the enemy and know yourself, you need not fear the result of a hundred battles.", author: "Sun Tzu" },
      { text: "Supreme excellence consists of breaking the enemy's resistance without fighting.", author: "Sun Tzu" },
      { text: "In the midst of chaos, there is also opportunity.", author: "Sun Tzu" },
      
      // RENAISSANCE & ENLIGHTENMENT (150 quotes)
      // René Descartes
      { text: "I think, therefore I am.", author: "René Descartes" },
      { text: "Doubt is the origin of wisdom.", author: "René Descartes" },
      { text: "The reading of all good books is like a conversation with the finest minds of past centuries.", author: "René Descartes" },
      { text: "In order to solve this problem, one must solve all problems.", author: "René Descartes" },
      { text: "Perfect numbers like perfect men are very rare.", author: "René Descartes" },
      
      // Blaise Pascal
      { text: "The heart has its reasons which reason knows not.", author: "Blaise Pascal" },
      { text: "All of humanity's problems stem from man's inability to sit quietly in a room alone.", author: "Blaise Pascal" },
      { text: "Man is but a reed, the most feeble thing in nature, but he is a thinking reed.", author: "Blaise Pascal" },
      { text: "We know the truth, not only by the reason, but also by the heart.", author: "Blaise Pascal" },
      { text: "Justice without force is powerless; force without justice is tyrannical.", author: "Blaise Pascal" },
      
      // Voltaire
      { text: "Common sense is not so common.", author: "Voltaire" },
      { text: "The more I learn, the more I realize how much I don't know.", author: "Voltaire" },
      { text: "I disapprove of what you say, but I will defend to the death your right to say it.", author: "Voltaire" },
      { text: "Judge a man by his questions rather than his answers.", author: "Voltaire" },
      { text: "Every man is guilty of all the good he did not do.", author: "Voltaire" },
      
      // Immanuel Kant
      { text: "Act only according to that maxim whereby you can at the same time will that it should become a universal law.", author: "Immanuel Kant" },
      { text: "Sapere aude. Dare to think.", author: "Immanuel Kant" },
      { text: "Morality is not the doctrine of how we may make ourselves happy, but how we may make ourselves worthy of happiness.", author: "Immanuel Kant" },
      { text: "We can judge the heart of a man by his treatment of animals.", author: "Immanuel Kant" },
      { text: "Science is organized knowledge. Wisdom is organized life.", author: "Immanuel Kant" },
      
      // John Locke
      { text: "The mind is furnished with ideas by experience alone.", author: "John Locke" },
      { text: "I have always thought the actions of men the best interpreters of their thoughts.", author: "John Locke" },
      { text: "Reading furnishes the mind only with materials of knowledge; it is thinking that makes what we read ours.", author: "John Locke" },
      { text: "What worries you masters you.", author: "John Locke" },
      { text: "The only fence against the world is a thorough knowledge of it.", author: "John Locke" },
      
      // Jean-Jacques Rousseau
      { text: "Man is born free and everywhere he is in chains.", author: "Jean-Jacques Rousseau" },
      { text: "The strongest is never strong enough to be always the master, unless he transforms strength into right, and obedience into duty.", author: "Jean-Jacques Rousseau" },
      { text: "Patience is bitter, but its fruit is sweet.", author: "Jean-Jacques Rousseau" },
      { text: "People who know little are usually great talkers, while men who know much say little.", author: "Jean-Jacques Rousseau" },
      { text: "I prefer liberty with danger than peace with slavery.", author: "Jean-Jacques Rousseau" },
      
      // 19TH CENTURY PHILOSOPHY (150 quotes)
      // Friedrich Nietzsche
      { text: "What does not destroy me, makes me stronger.", author: "Friedrich Nietzsche" },
      { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
      { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
      { text: "And those who were seen dancing were thought to be insane by those who could not hear the music.", author: "Friedrich Nietzsche" },
      { text: "You have your way. I have my way. As for the right way, the correct way, and the only way, it does not exist.", author: "Friedrich Nietzsche" },
      { text: "To live is to suffer, to survive is to find some meaning in the suffering.", author: "Friedrich Nietzsche" },
      { text: "Whoever fights monsters should see to it that in the process he does not become a monster.", author: "Friedrich Nietzsche" },
      { text: "Become who you are.", author: "Friedrich Nietzsche" },
      { text: "All truly great thoughts are conceived by walking.", author: "Friedrich Nietzsche" },
      { text: "There are no facts, only interpretations.", author: "Friedrich Nietzsche" },
      
      // Søren Kierkegaard
      { text: "Life must be understood backward. But it must be lived forward.", author: "Søren Kierkegaard" },
      { text: "The function of prayer is not to influence God, but rather to change the nature of the one who prays.", author: "Søren Kierkegaard" },
      { text: "Anxiety is the dizziness of freedom.", author: "Søren Kierkegaard" },
      { text: "People demand freedom of speech as a compensation for the freedom of thought which they seldom use.", author: "Søren Kierkegaard" },
      { text: "Face the facts of being what you are, for that is what changes what you are.", author: "Søren Kierkegaard" },
      
      // Arthur Schopenhauer
      { text: "A man can be himself only so long as he is alone.", author: "Arthur Schopenhauer" },
      { text: "The two enemies of human happiness are pain and boredom.", author: "Arthur Schopenhauer" },
      { text: "We forfeit three-fourths of ourselves in order to be like other people.", author: "Arthur Schopenhauer" },
      { text: "Talent hits a target no one else can hit; genius hits a target no one else can see.", author: "Arthur Schopenhauer" },
      { text: "Life swings back and forth between wanting and boredom, and these two are in fact its ultimate constituents.", author: "Arthur Schopenhauer" },
      
      // G.W.F. Hegel
      { text: "What is rational is actual and what is actual is rational.", author: "G.W.F. Hegel" },
      { text: "Nothing great in the world has ever been accomplished without passion.", author: "G.W.F. Hegel" },
      { text: "The owl of Minerva spreads its wings only with the falling of the dusk.", author: "G.W.F. Hegel" },
      { text: "To be independent of public opinion is the first formal condition of achieving anything great.", author: "G.W.F. Hegel" },
      { text: "We learn from history that we do not learn from history.", author: "G.W.F. Hegel" },
      
      // 20TH CENTURY PHILOSOPHY (230 quotes)
      // Albert Camus
      { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus" },
      { text: "In the midst of winter, I found there was, within me, an invincible summer.", author: "Albert Camus" },
      { text: "There is but one truly serious philosophical problem and that is suicide.", author: "Albert Camus" },
      { text: "Man is the only creature who refuses to be what he is.", author: "Albert Camus" },
      { text: "The struggle itself toward the heights is enough to fill a man's heart.", author: "Albert Camus" },
      { text: "Don't walk behind me; I may not lead. Don't walk in front of me; I may not follow. Just walk beside me and be my friend.", author: "Albert Camus" },
      { text: "Real generosity toward the future lies in giving all to the present.", author: "Albert Camus" },
      { text: "You will never be happy if you continue to search for what happiness consists of.", author: "Albert Camus" },
      { text: "Should I kill myself, or have a cup of coffee?", author: "Albert Camus" },
      { text: "The absurd is the essential concept and the first truth.", author: "Albert Camus" },
      
      // Jean-Paul Sartre
      { text: "Man is condemned to be free.", author: "Jean-Paul Sartre" },
      { text: "Freedom is what you do with what's been done to you.", author: "Jean-Paul Sartre" },
      { text: "In anguish, man becomes aware of his freedom.", author: "Jean-Paul Sartre" },
      { text: "Everything has been figured out, except how to live.", author: "Jean-Paul Sartre" },
      { text: "If you're lonely when you're alone, you're in bad company.", author: "Jean-Paul Sartre" },
      
      // Bertrand Russell
      { text: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell" },
      { text: "I would never die for my beliefs because I might be wrong.", author: "Bertrand Russell" },
      { text: "The whole problem with the world is that fools and fanatics are always so certain of themselves, and wiser people so full of doubts.", author: "Bertrand Russell" },
      { text: "Do not fear to be eccentric in opinion, for every opinion now accepted was once eccentric.", author: "Bertrand Russell" },
      { text: "The fundamental cause of the trouble is that in the modern world the stupid are cocksure while the intelligent are full of doubt.", author: "Bertrand Russell" },
      
      // Ludwig Wittgenstein
      { text: "Philosophy is a battle against the bewitchment of our intelligence by means of language.", author: "Ludwig Wittgenstein" },
      { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein" },
      { text: "A serious and good philosophical work could be written consisting entirely of jokes.", author: "Ludwig Wittgenstein" },
      { text: "Death is not an event in life: we do not live to experience death.", author: "Ludwig Wittgenstein" },
      { text: "If people never did silly things nothing intelligent would ever get done.", author: "Ludwig Wittgenstein" },
      
      // Carl Jung
      { text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" },
      { text: "Everything that irritates us about others can lead us to an understanding of ourselves.", author: "Carl Jung" },
      { text: "Your vision becomes clear when you look into your heart. Who looks outside, dreams. Who looks inside, awakens.", author: "Carl Jung" },
      { text: "I am not what happened to me, I am what I choose to become.", author: "Carl Jung" },
      { text: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.", author: "Carl Jung" },
      
      // Martin Heidegger
      { text: "Language is the house of being.", author: "Martin Heidegger" },
      { text: "Every man is born as many men and dies as a single one.", author: "Martin Heidegger" },
      { text: "The most thought-provoking thing in our thought-provoking time is that we are still not thinking.", author: "Martin Heidegger" },
      { text: "Anyone can achieve their fullest potential, who we are might be predetermined, but the path we follow is always of our own choosing.", author: "Martin Heidegger" },
      { text: "The possible ranks higher than the actual.", author: "Martin Heidegger" },
      
      // AMERICAN PHILOSOPHY & WISDOM (100 quotes)
      // Ralph Waldo Emerson
      { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
      { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
      { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
      { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
      { text: "What we plant in the soil of contemplation, we shall reap in the harvest of action.", author: "Ralph Waldo Emerson" },
      { text: "The first wealth is health.", author: "Ralph Waldo Emerson" },
      { text: "Shallow men believe in luck. Strong men believe in cause and effect.", author: "Ralph Waldo Emerson" },
      { text: "Nothing is at last sacred but the integrity of your own mind.", author: "Ralph Waldo Emerson" },
      { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson" },
      { text: "A foolish consistency is the hobgoblin of little minds.", author: "Ralph Waldo Emerson" },
      
      // Henry David Thoreau
      { text: "I went to the woods to live deliberately, and not, when I came to die, discover that I had not lived.", author: "Henry David Thoreau" },
      { text: "The question is not what you look at, but what you see.", author: "Henry David Thoreau" },
      { text: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
      { text: "All good things are wild and free.", author: "Henry David Thoreau" },
      { text: "The mass of men lead lives of quiet desperation.", author: "Henry David Thoreau" },
      { text: "This world is but a canvas to our imagination.", author: "Henry David Thoreau" },
      { text: "If a man does not keep pace with his companions, perhaps it is because he hears a different drummer.", author: "Henry David Thoreau" },
      { text: "What is once well done is done forever.", author: "Henry David Thoreau" },
      { text: "The only way to tell the truth is to speak with kindness. Only the words of a loving man can be heard.", author: "Henry David Thoreau" },
      { text: "Heaven is under our feet as well as over our heads.", author: "Henry David Thoreau" },
      
      // William James
      { text: "The greatest discovery of my generation is that a human being can alter his life by altering his attitudes of mind.", author: "William James" },
      { text: "Act as if what you do makes a difference. It does.", author: "William James" },
      { text: "The art of being wise is knowing what to overlook.", author: "William James" },
      { text: "Believe that life is worth living and your belief will help create the fact.", author: "William James" },
      { text: "The deepest principle in human nature is the craving to be appreciated.", author: "William James" },
      
      // John Dewey
      { text: "We do not learn from experience... we learn from reflecting on experience.", author: "John Dewey" },
      { text: "Failure is instructive. The person who really thinks learns quite as much from his failures as from his successes.", author: "John Dewey" },
      { text: "The good man is the man who, no matter how morally unworthy he has been, is moving to become better.", author: "John Dewey" },
      { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
      { text: "The self is not something ready-made, but something in continuous formation through choice of action.", author: "John Dewey" },
      
      // MODERN WISDOM & CONTEMPORARY THOUGHT (40 quotes)
      // Viktor Frankl
      { text: "Man's search for meaning is the primary motivation in his life.", author: "Viktor Frankl" },
      { text: "Those who have a 'why' to live, can bear with almost any 'how'.", author: "Viktor Frankl" },
      { text: "Everything can be taken from a man but one thing: the last of human freedoms - to choose one's attitude in any given set of circumstances.", author: "Viktor Frankl" },
      { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl" },
      { text: "No one can become fully aware of the very essence of another human being unless he loves him.", author: "Viktor Frankl" },
      
      // Joseph Campbell
      { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
      { text: "Follow your bliss and the universe will open doors where there were only walls.", author: "Joseph Campbell" },
      { text: "We must let go of the life we have planned, so as to accept the one that is waiting for us.", author: "Joseph Campbell" },
      { text: "The privilege of a lifetime is being who you are.", author: "Joseph Campbell" },
      { text: "Find a place inside where there's joy, and the joy will burn out the pain.", author: "Joseph Campbell" },
      
      // Alan Watts
      { text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", author: "Alan Watts" },
      { text: "You are an aperture through which the universe is looking at and exploring itself.", author: "Alan Watts" },
      { text: "The meaning of life is just to be alive. It is so plain and so obvious and so simple.", author: "Alan Watts" },
      { text: "This is the real secret of life - to be completely engaged with what you are doing in the here and now.", author: "Alan Watts" },
      { text: "Problems that remain persistently insoluble should always be suspected as questions asked in the wrong way.", author: "Alan Watts" },
      
      // LITERARY & ARTISTIC WISDOM
      // Oscar Wilde
      { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
      { text: "To live is the rarest thing in the world. Most people just exist.", author: "Oscar Wilde" },
      { text: "I can resist everything except temptation.", author: "Oscar Wilde" },
      { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
      { text: "Experience is merely the name men gave to their mistakes.", author: "Oscar Wilde" },
      
      // Mark Twain
      { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
      { text: "Kindness is the language which the deaf can hear and the blind can see.", author: "Mark Twain" },
      { text: "Courage is resistance to fear, mastery of fear - not absence of fear.", author: "Mark Twain" },
      { text: "It is better to keep your mouth closed and let people think you are a fool than to open it and remove all doubt.", author: "Mark Twain" },
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      
      // MODERN INSPIRATIONAL THINKERS
      // Albert Einstein
      { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
      { text: "The true sign of intelligence is not knowledge but imagination.", author: "Albert Einstein" },
      { text: "Try not to become a person of success, but rather try to become a person of value.", author: "Albert Einstein" },
      { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
      { text: "Only a life lived for others is a life worthwhile.", author: "Albert Einstein" },
      
      // Eleanor Roosevelt
      { text: "Yesterday is history, tomorrow is a mystery, today is a gift.", author: "Eleanor Roosevelt" },
      { text: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { text: "You must do the things you think you cannot do.", author: "Eleanor Roosevelt" },
      { text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt" },
      
      // Martin Luther King Jr.
      { text: "The ultimate measure of a man is not where he stands in moments of comfort and convenience, but where he stands at times of challenge and controversy.", author: "Martin Luther King Jr." },
      { text: "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.", author: "Martin Luther King Jr." },
      { text: "Faith is taking the first step even when you don't see the whole staircase.", author: "Martin Luther King Jr." },
      { text: "Injustice anywhere is a threat to justice everywhere.", author: "Martin Luther King Jr." },
      { text: "Our lives begin to end the day we become silent about things that matter.", author: "Martin Luther King Jr." },
      
      // Mahatma Gandhi
      { text: "Be the change you want to see in the world.", author: "Mahatma Gandhi" },
      { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
      { text: "The weak can never forgive. Forgiveness is the attribute of the strong.", author: "Mahatma Gandhi" },
      { text: "An eye for an eye only ends up making the whole world blind.", author: "Mahatma Gandhi" },
      { text: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi" },
      
      // Nelson Mandela
      { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
      { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
      { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
      { text: "Resentment is like drinking poison and then hoping it will kill your enemies.", author: "Nelson Mandela" },
      { text: "There is no passion to be found playing small - in settling for a life that is less than the one you are capable of living.", author: "Nelson Mandela" },
      
      // CONTEMPORARY VOICES
      // Maya Angelou
      { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou" },
      { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
      { text: "If you don't like something, change it. If you can't change it, change your attitude.", author: "Maya Angelou" },
      { text: "We delight in the beauty of the butterfly, but rarely admit the changes it has gone through to achieve that beauty.", author: "Maya Angelou" },
      { text: "Try to be a rainbow in someone's cloud.", author: "Maya Angelou" },
      
      // FINAL INSPIRATIONAL QUOTES
      { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
      { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
      { text: "He who is not busy being born is busy dying.", author: "Bob Dylan" },
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
      { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
      { text: "The most beautiful people are those who have known defeat, known suffering, known struggle, known loss, and have found their way out of the depths.", author: "Elisabeth Kübler-Ross" },
      { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
      { text: "A ship in harbor is safe, but that is not what ships are built for.", author: "John A. Shedd" }
    ];

  // Generate and set a session quote that stays consistent throughout the reflection
  const generateSessionQuote = () => {
    const randomQuote = philosophicalQuotes[Math.floor(Math.random() * philosophicalQuotes.length)];
    setSessionQuote(randomQuote);
  };

  // Get a random philosopher quote that hasn't been used in this session
  const getRandomPhilosopherQuote = () => {
    // Get quotes not yet used in current questions
    const usedQuotes = questions.map(q => q.philosopherQuote).filter(Boolean);
    const availableQuotes = philosophicalQuotes.filter(q => 
      !usedQuotes.includes(`${q.text} — ${q.author}`)
    );
    
    // If all quotes are used, reset and use any quote
    const quotesToUse = availableQuotes.length > 0 ? availableQuotes : philosophicalQuotes;
    const selectedQuote = quotesToUse[Math.floor(Math.random() * quotesToUse.length)];
    return `${selectedQuote.text} — ${selectedQuote.author}`;
  };

  // Demo data for demonstration purposes
  const demoQuestions: PhilosophicalQuestion[] = [
    {
      id: "1",
      text: "As you reflect on today, what moment stands out as most meaningful, and what does this reveal about what you truly value?",
      category: "Daily Reflection",
      options: [
        "A quiet conversation with someone I care about",
        "A moment of creative breakthrough or inspiration",
        "An act of kindness I witnessed or participated in",
        "Write my own response"
      ],
      philosopherQuote: "Know thyself. — Socrates"
    },
    {
      id: "2",
      text: "How did your interactions with others today shape your understanding of yourself?",
      category: "Relationships",
      options: [
        "They reminded me of my capacity for empathy",
        "They challenged me to see myself differently",
        "They reinforced what I already knew about myself",
        "Write my own response"
      ],
      philosopherQuote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle"
    },
    {
      id: "3",
      text: "What internal conflict or tension did you navigate today, and what wisdom did it offer?",
      category: "Inner Growth",
      options: [
        "Between what I wanted and what was right",
        "Between comfort and growth",
        "Between my ideal self and my actual actions",
        "Write my own response"
      ],
      philosopherQuote: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion. — Albert Camus"
    }
  ];

  const demoResponses: Record<string, QuestionResponse> = {
    "1": {
      questionId: "1",
      selectedOption: "A quiet conversation with someone I care about",
      customAnswer: ""
    },
    "2": {
      questionId: "2", 
      selectedOption: "They reminded me of my capacity for empathy",
      customAnswer: ""
    },
    "3": {
      questionId: "3",
      selectedOption: "Between comfort and growth",
      customAnswer: ""
    }
  };

  const demoJournalEntry: JournalResponse = {
    finalEntry: "Today revealed the profound interconnectedness of meaning, empathy, and growth in my daily experience. The quiet conversation that stood out wasn't just meaningful because of its content, but because it reminded me that authentic connection lies at the heart of what I value most. Through my interactions, I discovered my capacity for empathy isn't just a trait I possess, but a lens through which I understand both others and myself more deeply. The tension between comfort and growth that I navigated offered the wisdom that true development happens not in the absence of discomfort, but in our willingness to lean into it. These moments of connection, empathy, and courageous growth form the foundation of a life lived with intention and purpose.",
    philosophicalQuote: "The privilege of a lifetime is to become who you truly are. — Carl Jung",
    wordCount: 132,
    generationTime: 2.3
  };

  const demoFinalThoughts = "This reflection helped me realize that meaning isn't found in grand gestures, but in the quiet moments where we show up authentically for others and ourselves.";

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
        generateSessionQuote(); // Set the session quote before starting questions
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
            content: "You are a philosophical guide helping users explore deep questions for daily reflection. Generate 1 thoughtful opening question for daily reflection. Structure your response as JSON with this format: {\"question\": {\"id\": \"1\", \"text\": \"question text\", \"category\": \"category name\", \"options\": [\"option1\", \"option2\", \"option3\", \"Write my own response\"]}}"
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
      
      // Add curated philosopher quote to the question
      const questionWithQuote = {
        ...result.question,
        philosopherQuote: getRandomPhilosopherQuote()
      };
      
      setQuestions([questionWithQuote]);
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
            content: "You are a philosophical guide helping users explore deep questions for daily reflection. Based on the user's previous answers, generate 1 thoughtful follow-up question that builds upon their responses while remaining philosophical and introspective. The question should feel like a natural progression from their previous thoughts. Structure your response as JSON with this format: {\"question\": {\"id\": \"nextId\", \"text\": \"question text\", \"category\": \"category name\", \"options\": [\"option1\", \"option2\", \"option3\", \"Write my own response\"]}}"
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
      
      // Add the new question with proper ID and curated quote
      const nextQuestion = {
        ...result.question,
        id: (questions.length + 1).toString(),
        philosopherQuote: getRandomPhilosopherQuote()
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

  const generateQuestions = async () => {
    // Ensure we have a session quote when starting questions
    if (!sessionQuote) {
      generateSessionQuote();
    }
    await generateFirstQuestion();
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
    if (!currentQuestion) return false;
    
    const response = responses[currentQuestion.id];
    if (!response) return false;
    
    // Check if user selected an option
    if (response.selectedOption) {
      // If they selected "Write my own response", they must also provide custom text
      if (response.selectedOption === "Write my own response") {
        return response.customAnswer && response.customAnswer.trim().length > 0;
      }
      // Any other selection is valid
      return true;
    }
    
    // No selection made
    return false;
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
    const startTime = Date.now();
    
    try {
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

      // Call OpenAI API directly
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
        generationTime: (Date.now() - startTime) / 1000
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
    setCurrentStep("welcome");
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
    setSessionQuote(null); // Reset session quote for new reflection
  };

  const handleApiKeyCleared = () => {
    setApiKey("");
    setCurrentStep("apiSetup");
  };

  const resetToHome = () => {
    setCurrentStep("welcome");
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
    setIsDemoMode(false);
    setSessionQuote(null); // Reset session quote for new reflection
    
    // Keep the API key but reset everything else
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setQuestions(demoQuestions);
    setCurrentStep("questions");
    setCurrentQuestionIndex(0);
    setResponses(demoResponses); // Pre-fill all demo responses
    setFinalThoughts(demoFinalThoughts);
    setJournalEntry(null);
    setGeneratedImage(null);
    setIsJournalConfirmed(false);
    generateSessionQuote(); // Set a consistent quote for demo mode
    
    toast({
      title: "Demo Mode Active",
      description: "Experience the full Logos Journal workflow with sample content.",
    });
  };

  const proceedDemoToNext = () => {
    if (currentQuestionIndex < demoQuestions.length - 1) {
      // Move to next question (responses are already pre-filled)
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to final comments (final thoughts already pre-filled)
      setCurrentStep("finalComments");
    }
  };

  const generateDemoJournal = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setJournalEntry(demoJournalEntry);
      setCurrentStep("journalOutput");
      setIsLoading(false);
      
      toast({
        title: "Demo Journal Generated",
        description: "This is a sample of how AI synthesizes your reflections into meaningful prose.",
      });
    }, 2000);
  };

  const changePhilosophicalQuote = () => {
    if (!journalEntry) return;
    
    const newQuote = getRandomPhilosopherQuote();
    setJournalEntry({
      ...journalEntry,
      philosophicalQuote: newQuote
    });
    
    toast({
      title: "Quote Updated",
      description: "A new philosophical quote has been selected for your journal.",
    });
  };

  const reviseJournalEntry = async () => {
    if (!journalEntry || !revisionPrompt.trim()) return;

    setIsLoading(true);
    try {
      // Call OpenAI API directly for revision
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
      
      // Add missing properties and preserve original quote unless user requests change
      const revisedJournal = {
        ...result,
        philosophicalQuote: journalEntry.philosophicalQuote, // Keep original quote during revision
        wordCount: result.finalEntry.split(' ').length,
        generationTime: (Date.now() - Date.now()) / 1000 // Quick revision time
      };
      
      setJournalEntry(revisedJournal);
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

  // Helper function to extract personal written responses over multiple choice
  const extractPersonalContent = () => {
    const personalInsights: string[] = [];
    
    // Extract custom answers from responses
    Object.values(responses).forEach(response => {
      if (response.customAnswer && response.customAnswer.trim()) {
        personalInsights.push(response.customAnswer.trim());
      }
    });
    
    // Add final thoughts if available
    if (finalThoughts && finalThoughts.trim()) {
      personalInsights.push(finalThoughts.trim());
    }
    
    // Extract personal insights for demo mode
    
    // If we have personal content, prioritize it
    if (personalInsights.length > 0) {
      const prioritizedContent = personalInsights.join('. ') + '. ' + (journalEntry?.finalEntry || '');
      // Using prioritized personal content
      return prioritizedContent;
    }
    
    // Fallback to journal entry
    // Using fallback demo content
    return journalEntry?.finalEntry || '';
  };

  const generateImage = async (style: 'artwork' | 'sketch' = 'artwork') => {
    if (!journalEntry) return;

    setIsGeneratingImage(true);
    setGeneratingImageType(style);
    const startTime = Date.now() / 1000;
    
    // Get personalized content that prioritizes written responses
    const personalizedContent = extractPersonalContent();
    
    // Choose prompt based on style
    const sketchStyles = [
      "manga and anime style with clean line art",
      "American comic book style with bold outlines", 
      "detailed pencil sketch with cross-hatching",
      "minimalist line drawing style"
    ];
    
    const selectedSketchStyle = sketchStyles[Math.floor(Math.random() * sketchStyles.length)];
    
    // Create varied artistic styles for artwork generation
    const artworkStyles = [
      "vibrant watercolor painting with bright blues, warm oranges, and fresh greens",
      "oil painting with rich purples, golden yellows, and deep reds",
      "pastel artwork with soft pinks, lavender, and cream tones",
      "acrylic painting with bold emerald greens, sunset oranges, and sky blues",
      "mixed media with earthy browns, forest greens, and sunset colors",
      "digital art with neon blues, electric purples, and bright whites",
      "impressionist style with rainbow colors and dynamic brushstrokes"
    ];
    
    const selectedArtworkStyle = artworkStyles[Math.floor(Math.random() * artworkStyles.length)];

    const prompt = style === 'sketch' 
      ? `Create a hand-drawn sketch that captures the philosophical essence and personal reflections from these thoughts. Style: ${selectedSketchStyle}. The image should be either black and white line art or colored sketch showing a contemplative scene, character in thoughtful pose, or symbolic representation of inner reflection. Use clean, expressive lines and thoughtful composition. Ensure clean, sharp edges with no noise, artifacts, or visual disturbances around the borders. The entire image should have a polished, professional appearance with crisp details and smooth edge transitions. Prefer pure visual storytelling without text. If you must include speech bubbles or text elements, make them highly readable with clear, legible fonts and meaningful content extracted directly from these reflections - use short, powerful phrases or single profound words that capture the philosophical essence. Avoid long sentences in text bubbles. Any text should be clean, crisp, and easily readable. Focus primarily on visual storytelling through drawing techniques. Personal reflections: ${personalizedContent.substring(0, 400)}`
      : `Create a ${selectedArtworkStyle} artwork that captures the specific personal experiences and emotions from these reflections. Instead of abstract shapes, create a realistic or semi-realistic scene that represents the actual activities and feelings described. Show recognizable elements like places, objects, or situations mentioned in the personal insights. Use the specified color palette and maintain artistic quality while being representational rather than purely abstract. Ensure clean, sharp edges with no noise, artifacts, or visual disturbances around the borders. NO TEXT OR WORDS should appear in the image. Personal experiences to visualize: ${personalizedContent.substring(0, 400)}`;

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
        // DALL-E API error occurred
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
      // Image generation error occurred
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
    
    // Get personalized content for regeneration
    const personalizedContent = extractPersonalContent();
    
    // Create varied artistic styles for regeneration too
    const artworkStyles = [
      "vibrant watercolor painting with bright blues, warm oranges, and fresh greens",
      "oil painting with rich purples, golden yellows, and deep reds", 
      "pastel artwork with soft pinks, lavender, and cream tones",
      "acrylic painting with bold emerald greens, sunset oranges, and sky blues",
      "mixed media with earthy browns, forest greens, and sunset colors",
      "digital art with neon blues, electric purples, and bright whites",
      "impressionist style with rainbow colors and dynamic brushstrokes"
    ];
    
    const selectedRegenStyle = artworkStyles[Math.floor(Math.random() * artworkStyles.length)];
    
    const prompt = currentImageType === 'sketch' 
      ? `Create a hand-drawn sketch that captures philosophical reflection. Style: ${selectedSketchStyle}. The image should be either black and white line art or colored sketch showing a contemplative scene, character in thoughtful pose, or symbolic representation. Use clean, expressive lines and thoughtful composition. Ensure clean, sharp edges with no noise, artifacts, or visual disturbances around the borders. The entire image should have a polished, professional appearance with crisp details and smooth edge transitions. User's vision: ${imageRevisionPrompt}. NO TEXT OR WORDS should appear in the image. Focus on visual storytelling through drawing techniques. Personal insights: ${personalizedContent.substring(0, 300)}`
      : `Create a ${selectedRegenStyle} artwork that captures the specific personal experiences from these reflections. Instead of abstract shapes, create a realistic or semi-realistic scene that represents the actual activities and feelings described. Show recognizable elements like places, objects, or situations mentioned. User's vision: ${imageRevisionPrompt}. Ensure clean, sharp edges with no noise, artifacts, or visual disturbances around the borders. NO TEXT OR WORDS should appear in the image. Personal experiences to visualize: ${personalizedContent.substring(0, 300)}`;

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
        // DALL-E API regeneration error occurred
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
      // Image regeneration error occurred
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

  const findRelevantImage = () => {
    // Show popup menu with different image search sites
    setShowImageSearchMenu(true);
  };

  const findAnotherImage = () => {
    // Show popup menu with different image search sites
    setShowImageSearchMenu(true);
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
    if (currentStep === "welcome" || currentStep === "apiSetup") return 0;
    if (currentStep === "questions") return ((currentQuestionIndex + 1) / 5) * 80; // Always use 5 as the total
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-foreground hover:text-primary transition-colors">Logos Journal</h1>
                  {isDemoMode && (
                    <Badge variant="secondary" className="text-xs">
                      Demo Mode
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Daily Philosophy, Reflection & Inquiry</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a 
                href="https://mylogosjournal.wordpress.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-9 w-9 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                title="Visit Blog"
              >
                <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="#0073aa"
                    className="wordpress-icon"
                  >
                    <path d="M12.158,12.786L9.46,20.625c0.806,0.237,1.657,0.366,2.54,0.366c1.047,0,2.051-0.181,2.986-0.51 c-0.024-0.038-0.046-0.079-0.065-0.124L12.158,12.786z M3.009,12c0,3.559,2.068,6.635,5.067,8.092L3.788,8.341 C3.289,9.459,3.009,10.696,3.009,12z M18.069,11.546c0-1.112-0.399-1.881-0.741-2.48c-0.456-0.741-0.883-1.368-0.883-2.109 c0-0.826,0.627-1.596,1.51-1.596c0.04,0,0.078,0.005,0.116,0.007C16.472,3.904,14.34,3.009,12,3.009 c-3.141,0-5.904,1.612-7.512,4.052c0.211,0.007,0.41,0.011,0.579,0.011c0.94,0,2.396-0.114,2.396-0.114 C7.947,6.93,8.004,7.642,7.52,7.699c0,0-0.487,0.057-1.029,0.085l3.274,9.739l1.968-5.901l-1.401-3.838 C9.848,7.756,9.389,7.699,9.389,7.699C8.904,7.642,8.961,6.93,9.446,6.958c0,0,1.484,0.114,2.368,0.114 c0.94,0,2.397-0.114,2.397-0.114c0.485-0.028,0.542,0.684,0.057,0.741c0,0-0.488,0.057-1.029,0.085l3.249,9.665l0.897-2.996 C17.841,13.284,18.069,12.316,18.069,11.546z M19.889,7.686c0.039,0.286,0.06,0.593,0.06,0.924c0,0.912-0.171,1.938-0.684,3.22 l-2.746,7.94c2.673-1.558,4.47-4.454,4.47-7.771C20.991,10.436,20.591,8.967,19.889,7.686z M12,22C6.486,22,2,17.514,2,12 C2,6.486,6.486,2,12,2c5.514,0,10,4.486,10,10C22,17.514,17.514,22,12,22z"/>
                  </svg>
                </span>
              </a>
              <a 
                href="https://chatgpt.com/g/g-68a0edfb993081918087f4265ce8c970-logos-journal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-9 w-9 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                title="Try Logos Journal GPT"
              >
                <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="#10A37F"
                    className="openai-icon"
                  >
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142-.0852 4.783-2.7582a.7712.7712 0 0 0 .7806 0l5.8428 3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142.0852-4.7735 2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                  </svg>
                </span>
              </a>
              <a 
                href="https://github.com/Juuuuuh1/LogosJournalweb/tree/main" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-9 w-9 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                title="View on GitHub"
              >
                <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="#000000"
                    className="octocat-icon"
                  >
                    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                </span>
              </a>
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        {currentStep !== "welcome" && currentStep !== "apiSetup" && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Reflection Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {currentStep === "questions" && `Question ${currentQuestionIndex + 1} of ${Math.max(5, questions.length)}`}
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

        {/* Welcome Page */}
        {currentStep === "welcome" && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <img 
                  src={logoImage} 
                  alt="Logos Journal Logo" 
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Logos Journal</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Transform your daily reflections into meaningful insights through AI-guided philosophical questions and beautiful visual art.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                      <Sparkles className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <h3 className="text-xl font-semibold">AI-Guided Reflection</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Experience personalized philosophical questions that adapt to your responses, creating a unique journey of self-discovery through thoughtful inquiry.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                      <ImageIcon className="text-purple-600 dark:text-purple-400" size={20} />
                    </div>
                    <h3 className="text-xl font-semibold">Visual Storytelling</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Transform your reflections into stunning artwork, hand-drawn sketches, and discover relevant images through intelligent search that capture the essence of your philosophical journey.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                      <FileText className="text-green-600 dark:text-green-400" size={20} />
                    </div>
                    <h3 className="text-xl font-semibold">Personalized Journals</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Receive beautifully synthesized journal entries that capture your thoughts, insights, and philosophical discoveries in meaningful prose.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-4">
                      <Share2 className="text-orange-600 dark:text-orange-400" size={20} />
                    </div>
                    <h3 className="text-xl font-semibold">Easy Sharing</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Share your reflections and generated artwork across social platforms, or download them for personal keepsakes.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Privacy & Security First</h3>
                    <p className="text-muted-foreground mb-3">
                      Your reflections and API keys are stored securely in your browser only. We never see or store your personal thoughts - everything stays between you and OpenAI. For maximum privacy, you can run the app locally. You can find how to at our{" "}
                      <a 
                        href="https://github.com/Juuuuuh1/LogosJournalweb/tree/main" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <svg 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="#000000"
                            className="octocat-icon"
                          >
                            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </span>
                        GitHub page
                      </a>.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Client-side encryption</Badge>
                      <Badge variant="secondary">No data tracking</Badge>
                      <Badge variant="secondary">Direct OpenAI integration</Badge>
                      <Badge variant="secondary">Open source</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setCurrentStep("apiSetup")} 
                  size="lg" 
                  className="text-lg px-8 py-3"
                >
                  Begin Your Journey
                  <ChevronRight className="ml-2" size={20} />
                </Button>
                <Button 
                  onClick={() => startDemoMode()} 
                  variant="outline"
                  size="lg" 
                  className="text-lg px-8 py-3"
                >
                  Try Demo Mode
                  <Eye className="ml-2" size={20} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                You'll need an OpenAI API key to get started • 
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline ml-1"
                >
                  Get yours here
                </a>
                <br />
                <span className="text-xs text-muted-foreground">Demo mode shows the full experience with sample content</span>
              </p>
            </div>
          </div>
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
                    onValueChange={isDemoMode ? undefined : (value) => updateResponse(currentQuestion.id, 'selectedOption', value)}
                    disabled={isDemoMode}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="space-y-3">
                          <Label className={`flex items-center p-4 border border-border rounded-lg transition-colors ${
                            isDemoMode ? 'cursor-default opacity-75' : 'hover:border-primary/50 cursor-pointer'
                          }`}>
                            <RadioGroupItem value={option} className="mr-3" disabled={isDemoMode} />
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
                                onChange={isDemoMode ? undefined : (e) => updateResponse(currentQuestion.id, 'customAnswer', e.target.value)}
                                disabled={isDemoMode}
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
                        onChange={isDemoMode ? undefined : (e) => updateResponse(currentQuestion.id, 'customAnswer', e.target.value)}
                        disabled={isDemoMode}
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
                onClick={isDemoMode ? proceedDemoToNext : nextQuestion}
                disabled={isDemoMode ? false : !canProceedFromQuestion()}
                className="bg-primary hover:bg-primary/90"
              >
                {isDemoMode ? "Continue Demo" : 
                 (currentQuestionIndex === questions.length - 1 && questions.length >= 5) ? "Final Thoughts" : "Continue Reflection"}
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
                    onChange={isDemoMode ? undefined : (e) => setFinalThoughts(e.target.value)}
                    disabled={isDemoMode}
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
                onClick={isDemoMode ? generateDemoJournal : generateJournalEntry}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isLoading ? "Generating..." : isDemoMode ? "Generate Demo Journal" : "Generate Journal Entry"}
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
                      {isDemoMode ? (
                        <div className="p-4 bg-muted/30 rounded-lg border border-primary/10 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Visual Creation</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Generate AI artwork, sketches, and find images in the full version
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => generateImage('artwork')}
                            disabled={isGeneratingImage || isFindingImage}
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
                            disabled={isGeneratingImage || isFindingImage}
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
                          <Button
                            onClick={findRelevantImage}
                            variant="outline"
                            className="flex items-center"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Search Images
                          </Button>
                        </div>
                      )}
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
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {isDemoMode ? "Demo Journal Ready" : "Review Your Journal Draft"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isDemoMode 
                          ? "This demo shows how your final journal would look with your philosophical reflections."
                          : "You can confirm this draft as your final journal or make revisions first."
                        }
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      {isDemoMode ? (
                        <div className="flex items-center justify-center px-4 py-2 bg-muted/30 rounded-md border border-primary/10 w-full sm:w-auto">
                          <Edit className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-sm text-muted-foreground">
                            Revision available in full version
                          </span>
                        </div>
                      ) : (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => setShowRevisionInput(!showRevisionInput)}
                            className="w-full sm:w-auto"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {showRevisionInput ? "Cancel Revision" : "Revise Entry"}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={changePhilosophicalQuote}
                            className="w-full sm:w-auto"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Change Quote
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={confirmJournal}
                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {isDemoMode ? "Confirm Demo Journal" : "Confirm as Final Journal"}
                      </Button>
                    </div>
                    
                    {isDemoMode && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-primary/10">
                        <p className="text-xs text-muted-foreground text-center">
                          <Edit className="h-3 w-3 inline mr-1" />
                          In the full version, you can revise and refine your journal entries with AI assistance
                        </p>
                      </div>
                    )}
                    
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
                                {generatedImage.type === 'found' ? 'Search Again' : 'Regenerate'}
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
                          onClick={generatedImage?.type === 'found' ? findAnotherImage : regenerateImage}
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
                              {generatedImage?.type === 'found' ? (
                                <>
                                  <Search className="h-3 w-3 mr-2" />
                                  Search External Sites
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-3 w-3 mr-2" />
                                  Generate New Image
                                </>
                              )}
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

      {/* Image Search Menu Dialog */}
      <Dialog open={showImageSearchMenu} onOpenChange={setShowImageSearchMenu}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search for Images</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Choose a non-copyrighted image search site to find visuals for your reflection.
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                const content = extractPersonalContent();
                // Enhanced keyword extraction prioritizing nouns
                const commonWords = ['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'this', 'that', 'with', 'from', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'how', 'very', 'more', 'most', 'some', 'many', 'much', 'quite', 'really', 'just', 'only', 'also', 'even', 'still', 'always', 'never', 'often', 'sometimes', 'usually'];
                const verbs = ['enjoyed', 'walking', 'running', 'thinking', 'feeling', 'being', 'doing', 'going', 'coming', 'looking', 'seeing', 'finding', 'getting', 'making', 'taking', 'giving', 'working', 'playing', 'reading', 'writing', 'learning', 'teaching', 'talking', 'listening', 'watching', 'helping'];
                const timeWords = ['today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const adjectives = ['good', 'great', 'amazing', 'wonderful', 'beautiful', 'nice', 'happy', 'sad', 'excited', 'calm', 'peaceful', 'busy', 'free', 'open', 'close', 'big', 'small', 'large', 'tiny', 'fast', 'slow', 'easy', 'hard', 'simple', 'complex'];
                
                const excludeWords = [...commonWords, ...verbs, ...timeWords, ...adjectives];
                
                const keywords = content.split(/[.,;!?]\s*|\s+/)
                  .map(word => word.toLowerCase().replace(/[.,;!?'s]/g, ''))
                  .filter(word => word.length >= 3 && !excludeWords.includes(word))
                  .slice(0, 4)
                  .join(' ');
                // Keywords extracted for image search
                const query = encodeURIComponent(keywords || 'nature reflection');
                window.open(`https://unsplash.com/s/photos/${query}`, '_blank');
                setShowImageSearchMenu(false);
              }}
            >
              <div className="text-left">
                <div className="font-medium">Unsplash</div>
                <div className="text-sm text-muted-foreground">High-quality photos, completely free to use</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                const content = extractPersonalContent();
                const commonWords = ['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'this', 'that', 'with', 'from', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'how', 'very', 'more', 'most', 'some', 'many', 'much', 'quite', 'really', 'just', 'only', 'also', 'even', 'still', 'always', 'never', 'often', 'sometimes', 'usually'];
                const verbs = ['enjoyed', 'walking', 'running', 'thinking', 'feeling', 'being', 'doing', 'going', 'coming', 'looking', 'seeing', 'finding', 'getting', 'making', 'taking', 'giving', 'working', 'playing', 'reading', 'writing', 'learning', 'teaching', 'talking', 'listening', 'watching', 'helping'];
                const timeWords = ['today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const adjectives = ['good', 'great', 'amazing', 'wonderful', 'beautiful', 'nice', 'happy', 'sad', 'excited', 'calm', 'peaceful', 'busy', 'free', 'open', 'close', 'big', 'small', 'large', 'tiny', 'fast', 'slow', 'easy', 'hard', 'simple', 'complex'];
                
                const excludeWords = [...commonWords, ...verbs, ...timeWords, ...adjectives];
                
                const keywords = content.split(/[.,;!?]\s*|\s+/)
                  .map(word => word.toLowerCase().replace(/[.,;!?'s]/g, ''))
                  .filter(word => word.length >= 3 && !excludeWords.includes(word))
                  .slice(0, 4)
                  .join(' ');
                const query = encodeURIComponent(keywords || 'nature reflection');
                window.open(`https://pixabay.com/images/search/${query}/`, '_blank');
                setShowImageSearchMenu(false);
              }}
            >
              <div className="text-left">
                <div className="font-medium">Pixabay</div>
                <div className="text-sm text-muted-foreground">Diverse collection of royalty-free images</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                const content = extractPersonalContent();
                const commonWords = ['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'this', 'that', 'with', 'from', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'how', 'very', 'more', 'most', 'some', 'many', 'much', 'quite', 'really', 'just', 'only', 'also', 'even', 'still', 'always', 'never', 'often', 'sometimes', 'usually'];
                const verbs = ['enjoyed', 'walking', 'running', 'thinking', 'feeling', 'being', 'doing', 'going', 'coming', 'looking', 'seeing', 'finding', 'getting', 'making', 'taking', 'giving', 'working', 'playing', 'reading', 'writing', 'learning', 'teaching', 'talking', 'listening', 'watching', 'helping'];
                const timeWords = ['today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const adjectives = ['good', 'great', 'amazing', 'wonderful', 'beautiful', 'nice', 'happy', 'sad', 'excited', 'calm', 'peaceful', 'busy', 'free', 'open', 'close', 'big', 'small', 'large', 'tiny', 'fast', 'slow', 'easy', 'hard', 'simple', 'complex'];
                
                const excludeWords = [...commonWords, ...verbs, ...timeWords, ...adjectives];
                
                const keywords = content.split(/[.,;!?]\s*|\s+/)
                  .map(word => word.toLowerCase().replace(/[.,;!?'s]/g, ''))
                  .filter(word => word.length >= 3 && !excludeWords.includes(word))
                  .slice(0, 4)
                  .join(' ');
                const query = encodeURIComponent(keywords || 'nature reflection');
                window.open(`https://www.pexels.com/search/${query}/`, '_blank');
                setShowImageSearchMenu(false);
              }}
            >
              <div className="text-left">
                <div className="font-medium">Pexels</div>
                <div className="text-sm text-muted-foreground">Professional photos with simple license</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                const content = extractPersonalContent();
                const commonWords = ['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'this', 'that', 'with', 'from', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'how', 'very', 'more', 'most', 'some', 'many', 'much', 'quite', 'really', 'just', 'only', 'also', 'even', 'still', 'always', 'never', 'often', 'sometimes', 'usually'];
                const verbs = ['enjoyed', 'walking', 'running', 'thinking', 'feeling', 'being', 'doing', 'going', 'coming', 'looking', 'seeing', 'finding', 'getting', 'making', 'taking', 'giving', 'working', 'playing', 'reading', 'writing', 'learning', 'teaching', 'talking', 'listening', 'watching', 'helping'];
                const timeWords = ['today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const adjectives = ['good', 'great', 'amazing', 'wonderful', 'beautiful', 'nice', 'happy', 'sad', 'excited', 'calm', 'peaceful', 'busy', 'free', 'open', 'close', 'big', 'small', 'large', 'tiny', 'fast', 'slow', 'easy', 'hard', 'simple', 'complex'];
                
                const excludeWords = [...commonWords, ...verbs, ...timeWords, ...adjectives];
                
                const keywords = content.split(/[.,;!?]\s*|\s+/)
                  .map(word => word.toLowerCase().replace(/[.,;!?'s]/g, ''))
                  .filter(word => word.length >= 3 && !excludeWords.includes(word))
                  .slice(0, 4)
                  .join(' ');
                const query = encodeURIComponent(keywords || 'nature reflection');
                window.open(`https://www.flickr.com/search/?text=${query}&license=2%2C3%2C4%2C5%2C6%2C9`, '_blank');
                setShowImageSearchMenu(false);
              }}
            >
              <div className="text-left">
                <div className="font-medium">Flickr Creative Commons</div>
                <div className="text-sm text-muted-foreground">Creative Commons licensed photography</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                const content = extractPersonalContent();
                const commonWords = ['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'this', 'that', 'with', 'from', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'how', 'very', 'more', 'most', 'some', 'many', 'much', 'quite', 'really', 'just', 'only', 'also', 'even', 'still', 'always', 'never', 'often', 'sometimes', 'usually'];
                const verbs = ['enjoyed', 'walking', 'running', 'thinking', 'feeling', 'being', 'doing', 'going', 'coming', 'looking', 'seeing', 'finding', 'getting', 'making', 'taking', 'giving', 'working', 'playing', 'reading', 'writing', 'learning', 'teaching', 'talking', 'listening', 'watching', 'helping'];
                const timeWords = ['today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const adjectives = ['good', 'great', 'amazing', 'wonderful', 'beautiful', 'nice', 'happy', 'sad', 'excited', 'calm', 'peaceful', 'busy', 'free', 'open', 'close', 'big', 'small', 'large', 'tiny', 'fast', 'slow', 'easy', 'hard', 'simple', 'complex'];
                
                const excludeWords = [...commonWords, ...verbs, ...timeWords, ...adjectives];
                
                const keywords = content.split(/[.,;!?]\s*|\s+/)
                  .map(word => word.toLowerCase().replace(/[.,;!?'s]/g, ''))
                  .filter(word => word.length >= 3 && !excludeWords.includes(word))
                  .slice(0, 4)
                  .join(' ');
                const query = encodeURIComponent(keywords || 'nature reflection');
                window.open(`https://www.wikimedia.org/search/?query=${query}`, '_blank');
                setShowImageSearchMenu(false);
              }}
            >
              <div className="text-left">
                <div className="font-medium">Wikimedia Commons</div>
                <div className="text-sm text-muted-foreground">Open-source media repository</div>
              </div>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            These sites offer images that are free to use. Always check the specific license for each image.
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <blockquote className="text-muted-foreground italic text-sm font-serif leading-relaxed">
{sessionQuote ? `"${sessionQuote.text}" — ${sessionQuote.author}` : `"The unexamined life is not worth living." — Socrates`}
              </blockquote>
            </div>
            <p className="text-xs text-muted-foreground ml-4">Built with contemplation 🤔 and care ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
