import { TopNavbar } from '@/components/layout/top-navbar';

export default function IncognitoChatPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopNavbar title="Incognito ChatGPT" />
      
      <main className="flex-1 relative overflow-y-auto focus:outline-none bg-background">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex flex-col items-center justify-center h-[80vh]">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Incognito ChatGPT
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  This page is currently under development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}