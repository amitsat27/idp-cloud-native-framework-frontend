import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface ChatContextType {
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  pendingPlan: any | null;
  setPendingPlan: React.Dispatch<React.SetStateAction<any | null>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<any[]>([
    { role: "ai", text: "Systems online. Specify your infrastructure intent." },
  ]);
  const [pendingPlan, setPendingPlan] = useState<any | null>(null);

  return (
    <ChatContext.Provider value={{ messages, setMessages, pendingPlan, setPendingPlan }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};