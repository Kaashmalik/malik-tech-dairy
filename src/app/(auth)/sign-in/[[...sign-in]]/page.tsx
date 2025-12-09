import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className='flex min-h-screen'>
      {/* Left side - Branding */}
      <div className='hidden flex-col justify-between bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 text-white lg:flex lg:w-1/2'>
        <div>
          <div className='mb-8 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white/20'>
              <span className='text-2xl'>🐄</span>
            </div>
            <div>
              <h1 className='text-2xl font-bold'>MTK Dairy</h1>
              <p className='text-sm text-emerald-200'>Smart Farm Management</p>
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          <h2 className='text-3xl font-bold'>Welcome Back!</h2>
          <p className='text-lg text-emerald-100'>
            Sign in to manage your dairy farm efficiently with our comprehensive tools.
          </p>
          <div className='mt-8 grid grid-cols-2 gap-4'>
            <div className='rounded-lg bg-white/10 p-4'>
              <p className='text-2xl font-bold'>500+</p>
              <p className='text-sm text-emerald-200'>Active Farms</p>
            </div>
            <div className='rounded-lg bg-white/10 p-4'>
              <p className='text-2xl font-bold'>10K+</p>
              <p className='text-sm text-emerald-200'>Animals Managed</p>
            </div>
          </div>
        </div>

        <p className='text-sm text-emerald-200'>
          © {new Date().getFullYear()} MTK Dairy. All rights reserved.
        </p>
      </div>

      {/* Right side - Sign In Form */}
      <div className='flex w-full items-center justify-center bg-gray-50 p-8 lg:w-1/2 dark:bg-slate-900'>
        <div className='w-full max-w-md'>
          {/* Mobile logo */}
          <div className='mb-8 flex items-center justify-center gap-3 lg:hidden'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600'>
              <span className='text-xl'>🐄</span>
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900 dark:text-white'>MTK Dairy</h1>
              <p className='text-xs text-gray-500'>Smart Farm Management</p>
            </div>
          </div>

          <SignIn
            signUpUrl='/sign-up'
            fallbackRedirectUrl='/api/auth/redirect'
            appearance={{
              variables: {
                colorPrimary: '#059669',
                colorBackground: '#ffffff',
                borderRadius: '0.75rem',
              },
              elements: {
                rootBox: 'w-full',
                card: 'shadow-xl border-0 rounded-2xl bg-white',
                formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-700',
                footerActionLink: 'text-emerald-600 hover:text-emerald-700',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
