import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Upload, Mic, Zap, Search, Share2, CheckCircle, Users, Clock, ListTodo } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">SummarizeAI</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#hero" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Home</a>
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </nav>
            <Button variant="ghost" size="icon" className="md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Turn meetings into{" "}
                <span className="text-primary">actionable insights</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Upload your meeting recordings and get AI-powered summaries with key decisions, action items, and bullet points. Perfect for remote teams and agencies.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg px-8 py-4">
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  Watch Demo
                  <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </Button>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-accent mr-2" />
                  Free 14-day trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-accent mr-2" />
                  No credit card required
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              {/* Dashboard Preview */}
              <Card className="shadow-2xl">
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">SummarizeAI Dashboard</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Standup - March 15</h3>
                    <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">Completed</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Decisions</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 mr-2" />
                          Move to new deployment pipeline by end of week
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 mr-2" />
                          Prioritize mobile app bug fixes
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Action Items</h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <input type="checkbox" readOnly className="rounded border-gray-300 text-primary mr-3" />
                          <span className="text-gray-600 dark:text-gray-300">Sarah: Update API documentation</span>
                          <span className="ml-auto text-xs text-gray-400">Due: Mar 18</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <input type="checkbox" checked readOnly className="rounded border-gray-300 text-primary mr-3" />
                          <span className="text-gray-600 dark:text-gray-300 line-through">Mike: Review pull requests</span>
                          <span className="ml-auto text-xs text-accent">Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Everything you need to summarize meetings</h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">Powerful AI tools designed for modern remote teams</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Easy Upload</h3>
              <p className="text-gray-600 dark:text-gray-300">Drop your Zoom, Google Meet, or any audio/video files. Supports .mp3, .mp4, .m4a, and .wav formats up to 100MB.</p>
            </Card>
            <Card className="p-8">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                <Mic className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Transcription</h3>
              <p className="text-gray-600 dark:text-gray-300">Powered by OpenAI Whisper for accurate transcription in multiple languages with speaker identification.</p>
            </Card>
            <Card className="p-8">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Smart Summaries</h3>
              <p className="text-gray-600 dark:text-gray-300">GPT-4 Turbo extracts key decisions, action items, and creates structured bullet-point summaries.</p>
            </Card>
            <Card className="p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Team Integration</h3>
              <p className="text-gray-600 dark:text-gray-300">Auto-send summaries to Slack channels or team emails. Keep everyone aligned effortlessly.</p>
            </Card>
            <Card className="p-8">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Smart Search</h3>
              <p className="text-gray-600 dark:text-gray-300">Find specific meetings, decisions, or action items instantly with powerful search and filtering.</p>
            </Card>
            <Card className="p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Easy Sharing</h3>
              <p className="text-gray-600 dark:text-gray-300">Generate shareable links for meeting summaries. Perfect for stakeholder updates and client reports.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Ready to transform your meetings?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of teams already using SummarizeAI to make their meetings more productive.
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-4">
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-semibold text-gray-900 dark:text-white">SummarizeAI</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 SummarizeAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
