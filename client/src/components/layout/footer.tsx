import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { Github, Mail, Book } from 'lucide-react';

export function Footer() {
  const { user } = useAuth();
  
  // Only show footer for admin users
  const isAdmin = user?.role?.permissions?.includes('admin:all');
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <footer className="bg-muted/30 mt-auto">
      <Separator />
      <div className="container py-6 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <div className="bg-primary text-white font-bold rounded-lg p-1 flex items-center justify-center text-sm">
                <span>AURA AI</span>
              </div>
              <div className="ml-2 text-base font-semibold text-gray-900">Govern</div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              A comprehensive multi-tenant SaaS platform for AI governance that provides advanced risk management, compliance monitoring, and organizational control mechanisms.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <Book className="h-4 w-4 mr-2" />
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Version 1.0.0 | Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-border px-4 py-3">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Aura AI Govern. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}