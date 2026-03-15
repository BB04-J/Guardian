'use client'

import * as React from 'react'
import { useState, FormEvent } from 'react'
import Image from 'next/image'
import { Github, Twitter, Chrome } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const AppInput = (props: InputProps) => {
  const { label, icon, ...rest } = props;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="w-full min-w-[200px] relative">
      { label && 
        <label className='block mb-2 text-sm text-[var(--color-text-secondary)]'>
          {label}
        </label>
      }
      <div className="relative w-full">
        <input
          className="peer relative z-10 border-2 border-[var(--color-border)] h-12 w-full rounded-md bg-[var(--color-surface)] px-4 font-light text-white outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-[var(--color-bg)] placeholder:font-medium placeholder:text-[#596773]"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-md overflow-hidden"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-md overflow-hidden"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-[#596773]">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface LoginProps {
  onSubmit: (email: string, pass: string) => void;
  loading: boolean;
  error: string;
}

const Login1 = ({ onSubmit, loading, error }: LoginProps) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const socialIcons = [
    { icon: <Github className="w-6 h-6" />, href: '#', gradient: 'bg-[#1D2125]' },
    { icon: <Twitter className="w-6 h-6" />, href: '#', bg: 'bg-[#1D2125]' },
    { icon: <Chrome className="w-6 h-6" />, href: '#', bg: 'bg-[#1D2125]' }
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  }

  return (
    <div className="h-screen w-full bg-[var(--color-bg)] flex items-center justify-center p-4 text-white">
      <div className='card w-[90%] lg:w-[75%] xl:w-[65%] flex justify-between h-[600px] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-2xl bg-[var(--color-surface)]'>
      
        {/* Left Form Section */}
        <div
          className='w-full lg:w-1/2 px-6 sm:px-12 lg:px-16 h-full relative overflow-hidden flex flex-col justify-center'
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-gray-500/10 via-white/5 to-gray-500/10 rounded-full blur-3xl transition-opacity duration-200 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />
          
          <div className="form-container relative z-10 h-full flex flex-col justify-center py-10">
            <form className='text-center grid gap-6 h-auto' onSubmit={handleSubmit}>
              
              <div className='grid gap-4 mb-2'>
                <h1 className='text-3xl md:text-4xl font-extrabold text-[var(--color-heading)] tracking-wider uppercase' onClick={(e) => {e.preventDefault()}}>System Access</h1>
                <div className="social-container mt-4">
                  <div className="flex items-center justify-center">
                    <ul className="flex gap-4">
                      {socialIcons.map((social, index) => (
                        <li key={index} className="list-none">
                          <a
                            href={social.href}
                            className={`w-12 h-12 bg-[var(--color-bg)] rounded-full flex justify-center items-center relative z-[1] border border-[var(--color-border)] overflow-hidden group hover:border-gray-500 transition-colors`}
                          >
                            <div
                              className={`absolute inset-0 w-full h-full ${
                                social.gradient || social.bg
                              } scale-y-0 origin-bottom transition-transform duration-500 ease-in-out group-hover:scale-y-100`}
                            />
                            <span className="text-[var(--color-text-secondary)] transition-all duration-500 ease-in-out z-[2] group-hover:text-white group-hover:rotate-y-360">
                              {social.icon}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <span className='text-sm text-[var(--color-text-secondary)] mt-2 block'>or use your designated credentials</span>
              </div>
              
              <div className='grid gap-4 items-center'>
                <AppInput 
                  placeholder="admin@company.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <AppInput 
                  placeholder="••••••••••••" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 mt-2">
                  <p className="font-mono text-[10px] text-red-400">{error}</p>
                </div>
              )}
              
              <a href="#" className='font-light text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors block mt-2 text-right'>Forgot your password?</a>
              
              <div className='flex justify-center items-center mt-4'>
                 <button disabled={loading} type="submit"
                  className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--color-border)] px-4 py-3 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:bg-gray-700 hover:shadow-lg hover:shadow-black/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 tracking-widest uppercase">{loading ? 'Authenticating...' : 'Sign In'}</span>
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                    <div className="relative h-full w-8 bg-white/10" />
                  </div>
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Image Section */}
        <div className='hidden lg:block w-1/2 relative right h-full overflow-hidden bg-black'>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface)] to-transparent z-10 w-32" />
          <Image
            src='/data_center_rack.png'
            width={1000}
            height={1000}
            priority
            alt="Server racks in a data center with blue and green lights"
            className="w-full h-full object-cover opacity-60"
          />
        </div>

      </div>
    </div>
  )
}

export default Login1;
