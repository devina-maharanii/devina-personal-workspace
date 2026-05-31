import { create } from "zustand";
import {
  getConversationsAction,
  getConversationMessagesAction,
  createConversationAction,
  deleteConversationAction,
} from "@/lib/actions/chat";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  fileUrl?: string | null;
  createdAt: Date | string;
}

export interface ConversationItem {
  id: string;
  title: string;
  model: string;
  updatedAt: Date | string;
}

interface ChatStore {
  conversations: ConversationItem[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  creditsExhausted: boolean;
  loadConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => Promise<void>;
  createConversation: (model: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  setCreditsExhausted: (exhausted: boolean) => void;
  sendMessage: (
    content: string,
    model: string,
    fileUrl?: string | null
  ) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  creditsExhausted: false,

  setCreditsExhausted: (exhausted) => set({ creditsExhausted: exhausted }),

  loadConversations: async () => {
    set({ isLoading: true });
    try {
      const data = await getConversationsAction();
      set({ conversations: data });
     
    } catch (_err) {
      toast.error("Failed to load conversations.");
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveConversation: async (id) => {
    set({ activeConversationId: id });
    if (!id) {
      set({ messages: [] });
      return;
    }
    set({ isLoading: true });
    try {
      const history = await getConversationMessagesAction(id);
      set({ messages: history as ChatMessage[] });
     
    } catch (_err) {
      toast.error("Failed to load message history.");
      set({ activeConversationId: null, messages: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createConversation: async (model) => {
    try {
      const newConv = await createConversationAction("New Chat", model);
      set((state) => ({
        conversations: [newConv, ...state.conversations],
        activeConversationId: newConv.id,
        messages: [],
      }));
      return newConv.id;
    } catch (err) {
      toast.error("Failed to start new conversation.");
      throw err;
    }
  },

  deleteConversation: async (id) => {
    try {
      await deleteConversationAction(id);
      set((state) => {
        const filtered = state.conversations.filter((c) => c.id !== id);
        const nextActive = state.activeConversationId === id ? (filtered[0]?.id || null) : state.activeConversationId;
        return {
          conversations: filtered,
          activeConversationId: nextActive,
        };
      });
      // reload history for the next active chat
      const active = get().activeConversationId;
      await get().setActiveConversation(active);
      toast.success("Conversation deleted.");
     
    } catch (_err) {
      toast.error("Failed to delete conversation.");
    }
  },

  sendMessage: async (content, model, fileUrl = null) => {
    let convId = get().activeConversationId;
    
    // Create new conversation on demand if none is active
    if (!convId) {
      try {
        convId = await get().createConversation(model);
       
      } catch (_err) {
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      fileUrl,
      createdAt: new Date(),
    };

    const assistantMessagePlaceholder: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    // Update messages locally before request
    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessagePlaceholder],
      isStreaming: true,
    }));

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: get().messages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model,
          conversationId: convId,
        }),
      });

      if (response.status === 402) {
        set({ creditsExhausted: true, isStreaming: false });
        toast.error("Credit balance exhausted. Upgrade your plan to continue.");
        // Remove placeholder
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== assistantMessagePlaceholder.id),
        }));
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate AI response.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No readable stream reader.");

      let accumText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumText += chunk;
        
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessagePlaceholder.id
              ? { ...m, content: accumText }
              : m
          ),
        }));
      }

      // Finish streaming and sync history list names
      set({ isStreaming: false });
      await get().loadConversations();
     
    } catch (_err) {
      set({ isStreaming: false });
      toast.error("An error occurred during content stream.");
      // Clear placeholder on complete error
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== assistantMessagePlaceholder.id),
      }));
    }
  },
}));
