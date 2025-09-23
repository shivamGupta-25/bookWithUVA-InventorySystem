import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function NotFound() {
  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-lg mx-auto">
        {/* Book-themed 404 Number */}
        <div className="text-center mb-3">
          <div className="relative inline-block">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400 animate-pulse">
              404
            </h1>
            {/* Book pages flying around */}
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-5 sm:w-5 sm:h-6 bg-gradient-to-b from-amber-200 to-orange-300 dark:from-amber-600 dark:to-orange-700 rounded-sm transform rotate-12 animate-bounce shadow-lg">
              <div className="w-full h-0.5 bg-amber-400 mt-1"></div>
            </div>
            <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 w-3 h-4 sm:w-4 sm:h-5 bg-gradient-to-b from-red-200 to-pink-300 dark:from-red-600 dark:to-pink-700 rounded-sm transform -rotate-12 animate-bounce delay-100 shadow-lg">
              <div className="w-full h-0.5 bg-red-400 mt-1"></div>
            </div>
          </div>
        </div>

        {/* Main Content Card with Book Theme */}
        <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-3 px-4">
            {/* Book SVG Icon */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                <svg 
                  className="w-12 h-12 sm:w-14 sm:h-14 text-amber-600 dark:text-amber-400 animate-pulse" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                {/* Question mark overlay */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce">
                  ?
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mb-3">
              <Badge variant="secondary" className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                🔍 Page Not Found
              </Badge>
            </div>
            
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight">
              This page doesn&apos;t exist in our system!
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              The page you&apos;re looking for may have been moved, deleted, or you may not have permission to access it.
              <br />
              Please check the URL or contact your system administrator for assistance.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 px-4 pb-4">
            {/* Book-themed decorative elements */}
            <div className="flex justify-center space-x-1">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse delay-200"></div>
            </div>

            {/* Single Back to Home Button */}
            <div className="flex justify-center">
              <Button asChild size="default" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 px-6 py-2">
                <Link href="/" className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm font-semibold">Back to Home</span>
                </Link>
              </Button>
            </div>

            {/* Additional helpful text */}
            <div className="text-center mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Need help? Contact your system administrator or check your access permissions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Floating Book Elements - Reduced for better fit */}
        <div className="hidden sm:block absolute top-16 left-6 w-3 h-4 bg-amber-200 dark:bg-amber-800 rounded-sm opacity-60 animate-bounce transform rotate-12 shadow-md">
          <div className="w-full h-0.5 bg-amber-400 mt-1"></div>
        </div>
        <div className="hidden sm:block absolute top-32 right-12 w-2 h-3 bg-orange-200 dark:bg-orange-800 rounded-sm opacity-50 animate-bounce delay-200 transform -rotate-12 shadow-md">
          <div className="w-full h-0.5 bg-orange-400 mt-1"></div>
        </div>
        <div className="hidden sm:block absolute bottom-24 left-16 w-4 h-5 bg-red-200 dark:bg-red-800 rounded-sm opacity-40 animate-bounce delay-300 transform rotate-6 shadow-md">
          <div className="w-full h-0.5 bg-red-400 mt-1"></div>
        </div>
        <div className="hidden sm:block absolute bottom-16 right-8 w-3 h-4 bg-pink-200 dark:bg-pink-800 rounded-sm opacity-30 animate-bounce delay-100 transform -rotate-6 shadow-md">
          <div className="w-full h-0.5 bg-pink-400 mt-1"></div>
        </div>
      </div>
    </div>
  )
}
