import { Suspense } from 'react'
import { SignIn } from '~/components/ui/wallet/SignIn'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <SignIn />
        </Suspense>
      </div>
    </div>
  )
}
