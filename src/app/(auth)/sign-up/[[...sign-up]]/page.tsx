import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
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
          <h2 className='text-3xl font-bold'>Start Your Journey</h2>
          <p className='text-lg text-emerald-100'>
            Join thousands of dairy farmers who trust MTK Dairy for their farm management.
          </p>
          <ul className='space-y-3 text-emerald-100'>
            <li className='flex items-center gap-3'>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm'>
                ✓
              </span>
              Track animals, milk production & health
            </li>
            <li className='flex items-center gap-3'>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm'>
                ✓
              </span>
              Real-time analytics & reports
            </li>
            <li className='flex items-center gap-3'>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm'>
                ✓
              </span>
              Multi-user team management
            </li>
            <li className='flex items-center gap-3'>
              <span className='flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm'>
                ✓
              </span>
              Works offline on mobile
            </li>
          </ul>
        </div>

        <p className='text-sm text-emerald-200'>
          © {new Date().getFullYear()} MTK Dairy. All rights reserved.
        </p>
      </div>

      {/* Right side - Sign Up Form */}
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

          <SignUp
            signInUrl='/sign-in'
            fallbackRedirectUrl='/apply'
            forceRedirectUrl='/apply'
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
