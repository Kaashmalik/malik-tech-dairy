import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🐄</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">MTK Dairy</h1>
              <p className="text-emerald-200 text-sm">Smart Farm Management</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Start Your Journey</h2>
          <p className="text-emerald-100 text-lg">
            Join thousands of dairy farmers who trust MTK Dairy for their farm management.
          </p>
          <ul className="space-y-3 text-emerald-100">
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-sm">✓</span>
              Track animals, milk production & health
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-sm">✓</span>
              Real-time analytics & reports
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-sm">✓</span>
              Multi-user team management
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-sm">✓</span>
              Works offline on mobile
            </li>
          </ul>
        </div>
        
        <p className="text-emerald-200 text-sm">
          © {new Date().getFullYear()} MTK Dairy. All rights reserved.
        </p>
      </div>

      {/* Right side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🐄</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">MTK Dairy</h1>
              <p className="text-gray-500 text-xs">Smart Farm Management</p>
            </div>
          </div>
          
          <SignUp
            signInUrl="/sign-in"
            fallbackRedirectUrl="/apply"
            forceRedirectUrl="/apply"
            appearance={{
              variables: {
                colorPrimary: "#059669",
                colorBackground: "#ffffff",
                borderRadius: "0.75rem",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-xl border-0 rounded-2xl bg-white",
                formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700",
                footerActionLink: "text-emerald-600 hover:text-emerald-700",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

