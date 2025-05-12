import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  const { user, isLoading } = useAuth();

  // Redirect to dashboard if already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              <div className="bg-primary text-white font-bold rounded-lg p-2 flex items-center justify-center">
                <span>A<span className="lowercase">ura</span> AI</span>
              </div>
              <div className="ml-2 text-xl font-bold text-gray-900">Govern</div>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Welcome to Aura AI Govern
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The Complete AI Governance Platform for Responsible Innovation
            </p>
          </div>

          <AuthForm />
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:block w-1/2 bg-gradient-to-tr from-primary-700 to-primary-900 p-12">
        <div className="h-full flex flex-col justify-center max-w-lg mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-white">
            Responsible AI Governance Made Simple
          </h1>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">🔍</span>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-xl text-white">MAP</h3>
                <p className="mt-1 text-white">
                  Discover and document your AI footprint across the organization
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-xl text-white">MEASURE</h3>
                <p className="mt-1 text-white">
                  Evaluate compliance, risks, bias, and potential data leaks
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">🛠️</span>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-xl text-white">MANAGE</h3>
                <p className="mt-1 text-white">
                  Take control of your AI governance from development to deployment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}