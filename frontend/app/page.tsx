'use client'

import { SpiralAnimation } from "@/components/ui/spiral-animation"
import { GlowingShadow } from "@/components/ui/glowing-shadow"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Activity, BarChart3, Clock, ArrowRight } from "lucide-react"
import InteractiveHoverButton from "@/components/ui/interactive-hover-button"

export default function RootPage() {
  const router = useRouter()
  const [startVisible, setStartVisible] = useState(false)
  
  // Fade in the start button after animation loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartVisible(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  const services = [
    {
      icon: <ShieldAlert className="w-8 h-8 text-red-500 mb-4" />,
      title: "Incident Tracking",
      description: "Real-time monitoring and logging of system anomalies and security events.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    },
    {
      icon: <Activity className="w-8 h-8 text-blue-500 mb-4" />,
      title: "Risk Analysis",
      description: "AI-driven assessments to predict and mitigate potential vulnerabilities before they escalate.",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-green-500 mb-4" />,
      title: "Performance Metrics",
      description: "Comprehensive dashboards providing actionable insights into operational efficiency.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
    },
    {
      icon: <Clock className="w-8 h-8 text-purple-500 mb-4" />,
      title: "Uptime Analytics",
      description: "Historical data and predictive modeling for system reliability and uptime.",
      image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070&auto=format&fit=crop"
    }
  ]
  
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30">
        
      {/* Hero Section with Spiral Animation */}
      <section className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        {/* Spiral Animation Background */}
        <div className="absolute inset-0 z-0">
          <SpiralAnimation />
        </div>
        
        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 mt-[-10vh]">
            <h1 className="text-5xl md:text-7xl font-extralight tracking-widest uppercase mb-6 drop-shadow-2xl">
                Antigravity
            </h1>
            <p className="text-xl md:text-2xl font-light text-gray-300 max-w-2xl mx-auto tracking-wide mb-12">
                Advanced Incident Management & Risk Intelligence Platform
            </p>
            
             {/* Simple Elegant Text Button with Pulsing Effect */}
            <div 
                className={`
                transition-all duration-[1500ms] ease-out
                ${startVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
            >
                <button 
                    onClick={() => {
                        const servicesElement = document.getElementById('services');
                        servicesElement?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="
                        group flex items-center gap-3 px-8 py-3 rounded-full border border-white/20 
                        backdrop-blur-sm bg-black/20 text-white text-sm tracking-[0.2em] uppercase 
                        transition-all duration-500 hover:bg-white/10 hover:border-white/40
                    "
                >
                    Explore Services
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50 z-10">
            <div className="w-[1px] h-16 bg-gradient-to-b from-white/0 via-white to-white/0"></div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative z-20 py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-light tracking-wider uppercase mb-4">Our Operations</h2>
            <div className="w-24 h-[1px] bg-white/30 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 justify-items-center">
            {services.map((service, index) => (
                <div key={index} className="w-full flex justify-center">
                    <GlowingShadow>
                        <div className="group relative overflow-hidden rounded-2xl w-full h-full bg-black/50 backdrop-blur-md transition-all duration-500">
                            <div className="h-64 overflow-hidden">
                                <img 
                                    src={service.image} 
                                    alt={service.title} 
                                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-80"
                                />
                            </div>
                            <div className="p-8 relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent -mt-20 pt-20">
                                {service.icon}
                                <h3 className="text-2xl font-light tracking-wide mb-3">{service.title}</h3>
                                <p className="text-gray-400 font-light leading-relaxed">
                                    {service.description}
                                </p>
                            </div>
                        </div>
                    </GlowingShadow>
                </div>
            ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative z-20 py-32 border-t border-white/10 text-center">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 pointer-events-none"></div>
         <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-8">Ready to secure your systems?</h2>
         <div className="flex justify-center items-center gap-6">
           <InteractiveHoverButton 
            text="Login / Authorize"
            loadingText="Establishing Connection..."
            successText="Access Granted"
            onComplete={() => router.push('/login')}
            classes="bg-white text-black hover:text-white border-none py-4 px-8 text-sm tracking-[0.15em] uppercase font-medium shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          />
           <InteractiveHoverButton 
            text="Create Account"
            loadingText="Securing Perimeter..."
            successText="Access Granted"
            onComplete={() => router.push('/signup')}
            classes="bg-transparent text-white border border-white/40 hover:bg-white hover:text-black hover:border-transparent py-4 px-8 text-sm tracking-[0.15em] uppercase font-medium shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          />
         </div>
      </section>

    </div>
  )
}
