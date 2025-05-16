import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { TopNavbar } from '@/components/layout/top-navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Folder, FolderPlus, FileText, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

type Message = {
  id?: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
};

type DataStoreFile = {
  id: number;
  name: string;
  path: string;
  type: 'file' | 'folder';
  parentId?: number;
};

export default function IncognitoChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    { 
      content: "Hello! I'm the Incognito ChatGPT assistant. How can I help you today?", 
      role: 'assistant', 
      timestamp: new Date() 
    }
  ]);
  const [prompt, setPrompt] = useState('');
  const [currentFolder, setCurrentFolder] = useState<number | undefined>(undefined);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsNewFileDialogOpen(open);
    // Clear the form when closing the dialog
    if (!open) {
      setNewFileName('');
      setNewFileContent('');
      setUploadedFile(null);
    }
  };
  const [newFileType, setNewFileType] = useState<'file' | 'folder'>('file');
  const [selectedFile, setSelectedFile] = useState<DataStoreFile | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Fetch data store files
  const { 
    data: files, 
    isLoading: isLoadingFiles,
    refetch: refetchFiles
  } = useQuery<DataStoreFile[]>({
    queryKey: ['/api/data-store', currentFolder],
    queryFn: async () => {
      const url = currentFolder 
        ? `/api/data-store?parentId=${currentFolder}` 
        : '/api/data-store';
      const res = await apiRequest('GET', url);
      return await res.json();
    },
    enabled: !!user
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      let requestBody: any = { prompt };
      
      // Include selected file if any
      if (selectedFile && selectedFile.type === 'file') {
        requestBody.fileId = selectedFile.id;
      }
      
      // Add a temporary "thinking" message
      setMessages(prev => [
        ...prev,
        {
          content: "Thinking...",
          role: 'assistant',
          timestamp: new Date(),
          isLoading: true
        }
      ]);
      
      const res = await apiRequest('POST', '/api/mock-chat', requestBody);
      return res.json();
    },
    onSuccess: (data) => {
      // Remove the temporary thinking message and add the real response
      setMessages(prev => {
        const newMessages = [...prev];
        // Remove the last message if it was a loading message
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].isLoading) {
          newMessages.pop();
        }
        // Add the actual response
        newMessages.push({
          content: data.response,
          role: 'assistant',
          timestamp: new Date()
        });
        return newMessages;
      });
      setPrompt('');
    },
    onError: (error) => {
      // Remove the temporary thinking message
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].isLoading) {
          newMessages.pop();
        }
        return newMessages;
      });
      
      toast({
        title: 'Error sending message',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: async (fileData: { name: string; content: string; type: 'file' | 'folder'; parentId?: number }) => {
      const res = await apiRequest('POST', '/api/data-store', fileData);
      return res.json();
    },
    onSuccess: () => {
      setNewFileName('');
      setNewFileContent('');
      setIsNewFileDialogOpen(false);
      refetchFiles();
      toast({
        title: 'Success',
        description: `${newFileType === 'file' ? 'File' : 'Folder'} created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: `Error creating ${newFileType}`,
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  const handleSendMessage = () => {
    if (!prompt.trim()) return;
    
    // Add user message
    setMessages(prev => [
      ...prev,
      {
        content: prompt,
        role: 'user',
        timestamp: new Date()
      }
    ]);
    
    // Send to API
    sendMessageMutation.mutate(prompt);
    
    // Save to prompt_answers table (this happens in the backend automatically)
    // The API will save both the prompt and the response
  };
  
  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name',
        variant: 'destructive'
      });
      return;
    }
    
    // If we have an uploaded file, read its contents
    if (uploadedFile && newFileType === 'file') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string || '';
        createFileMutation.mutate({
          name: newFileName || uploadedFile.name,
          content: content,
          type: 'file',
          parentId: currentFolder
        });
      };
      reader.readAsText(uploadedFile);
    } else {
      createFileMutation.mutate({
        name: newFileName,
        content: newFileContent,
        type: newFileType,
        parentId: currentFolder
      });
    }
  };
  
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
      setNewFileName(files[0].name);
    }
  };
  
  // Clear all temporary files and chat history
  const clearAllData = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/data-store');
      return res.json();
    },
    onSuccess: () => {
      setMessages([
        { 
          content: "Hello! I'm the Incognito ChatGPT assistant. How can I help you today?", 
          role: 'assistant', 
          timestamp: new Date() 
        }
      ]);
      if (selectedFile) {
        setSelectedFile(null);
      }
      refetchFiles();
      toast({
        title: 'Chat cleared',
        description: 'All chat history and temporary files have been deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error clearing data',
        description: error instanceof Error ? error.message : 'Failed to clear data',
        variant: 'destructive'
      });
    }
  });
  
  const handleFileClick = (file: DataStoreFile) => {
    if (file.type === 'folder') {
      setCurrentFolder(file.id);
    } else {
      setSelectedFile(file);
      toast({
        title: 'File selected',
        description: `Selected file: ${file.name}`,
      });
    }
  };
  
  const handleNavigateUp = () => {
    setCurrentFolder(undefined);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <TopNavbar title="Incognito ChatGPT" />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for Data Store */}
        <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Local Data Store</h3>
              <Button variant="outline" size="sm" onClick={() => refetchFiles()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  setNewFileType('file');
                  handleDialogOpenChange(true);
                }}
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                File
              </Button>
              <Button 
                onClick={() => {
                  setNewFileType('folder');
                  handleDialogOpenChange(true);
                }}
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                <FolderPlus className="h-4 w-4 mr-1" />
                Folder
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {isLoadingFiles ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {currentFolder && (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start pl-2"
                      onClick={handleNavigateUp}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      ../ (Up a level)
                    </Button>
                  )}
                  
                  {files && files.length > 0 ? (
                    files.map(file => (
                      <Button 
                        key={file.id}
                        variant="ghost" 
                        className={cn(
                          "w-full justify-start pl-2",
                          selectedFile?.id === file.id && "bg-muted"
                        )}
                        onClick={() => handleFileClick(file)}
                      >
                        {file.type === 'folder' ? (
                          <Folder className="h-4 w-4 mr-2" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        {file.name}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {currentFolder 
                        ? "This folder is empty" 
                        : "No files found. Create one to get started."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex flex-col h-full rounded-none border-0">
            <CardHeader className="px-4 py-3 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    Chat
                  </CardTitle>
                  <CardDescription>
                    {selectedFile ? (
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-primary" /> 
                        Using file: {selectedFile.name}
                      </span>
                    ) : (
                      "Ask anything or select a file to chat about"
                    )}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => clearAllData.mutate()}
                  disabled={clearAllData.isPending}
                >
                  {clearAllData.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Clear All Data
                </Button>
                {selectedFile && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Clear selection
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-4 overflow-auto">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "flex",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div 
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.role === 'user' 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center">
                            <span className="mr-2">{message.content}</span>
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter className="p-4 border-t">
              <div className="flex w-full space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!prompt.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* New File/Folder Dialog */}
      <Dialog open={isNewFileDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newFileType === 'file' ? 'Create New File' : 'Create New Folder'}
            </DialogTitle>
            <DialogDescription>
              {newFileType === 'file' 
                ? 'Add a new file to your local data store.' 
                : 'Create a new folder to organize your files.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                placeholder={newFileType === 'file' ? "File name" : "Folder name"}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </div>
            
            {newFileType === 'file' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="fileUpload" className="text-sm font-medium">
                    Upload File
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fileUpload"
                      type="file"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a file or enter content manually below
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <textarea
                    id="content"
                    placeholder={uploadedFile ? "Content will be loaded from uploaded file" : "Enter file content"}
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    className="w-full h-32 px-3 py-2 border rounded-md"
                    disabled={!!uploadedFile}
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsNewFileDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFile}
              disabled={!newFileName.trim() || createFileMutation.isPending}
            >
              {createFileMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                newFileType === 'file' ? (
                  <FileText className="h-4 w-4 mr-2" />
                ) : (
                  <Folder className="h-4 w-4 mr-2" />
                )
              )}
              Create {newFileType === 'file' ? 'File' : 'Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}