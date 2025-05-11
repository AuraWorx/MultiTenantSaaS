import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserWithDetails } from "@/types";

type AuthContextType = {
  user: UserWithDetails | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserWithDetails, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<UserWithDetails, Error, InsertUser>;
  currentOrganization: string | null;
  switchOrganization: (orgId: number) => Promise<void>;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [currentOrganization, setCurrentOrganization] = useState<string | null>(null);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithDetails | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    onSuccess: (data) => {
      if (data) {
        setCurrentOrganization(data.organization.name);
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (user: UserWithDetails) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      setCurrentOrganization(user.organization.name);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return await res.json();
    },
    onSuccess: (user: UserWithDetails) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      setCurrentOrganization(user.organization.name);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.firstName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      setCurrentOrganization(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const switchOrganization = async (orgId: number) => {
    try {
      const res = await apiRequest("POST", "/api/auth/switch-organization", { organizationId: orgId });
      const updatedUser = await res.json();
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      setCurrentOrganization(updatedUser.organization.name);
      
      // Invalidate queries that might be organization-specific
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Organization switched",
        description: `Switched to ${updatedUser.organization.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to switch organization",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        currentOrganization,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
