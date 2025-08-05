import { Shield, Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { Separator } from "./separator";
import { maskApiKey, clearStoredApiKey, getApiKeyStoredDate } from "@/lib/security";

interface SecurityBadgeProps {
  apiKey: string;
  onKeyCleared: () => void;
}

export function SecurityBadge({ apiKey, onKeyCleared }: SecurityBadgeProps) {
  const [showKey, setShowKey] = useState(false);
  const storedDate = getApiKeyStoredDate();

  const handleClearKey = () => {
    if (confirm('Are you sure you want to remove your stored API key? You\'ll need to enter it again next time.')) {
      clearStoredApiKey();
      onKeyCleared();
    }
  };

  return (
    <Card className="mb-6 border-green-200 bg-green-50/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-100">
                  Secure Storage
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Keys stored locally only
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">API Key:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {showKey ? apiKey : maskApiKey(apiKey)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                    className="h-6 w-6 p-0"
                  >
                    {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                
                {storedDate && (
                  <p className="text-xs text-muted-foreground">
                    Stored: {storedDate.toLocaleDateString()} at {storedDate.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearKey}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator className="my-3" />
        
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Shield className="h-3 w-3 text-green-600" />
            <span>Your API key is encrypted and stored only in your browser</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-3 w-3 text-green-600" />
            <span>Keys are never sent to our servers - only directly to OpenAI</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-3 w-3 text-green-600" />
            <span>You can clear your key anytime using the trash button above</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}