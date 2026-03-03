/**
 * Testimonials carousel with auto-rotation and star ratings
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Testimonial {
    name: string;
    role: string;
    content: string;
    avatar?: string;
    rating: number;
}

interface TestimonialsProps {
    testimonials: Testimonial[];
}

export function TestimonialsCarousel({ testimonials }: TestimonialsProps) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    return (
        <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
                <motion.div
                    className="flex"
                    animate={{ x: `-${current * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="w-full flex-shrink-0 px-4">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 sm:p-8 md:p-12 text-center">
                                <div className="flex justify-center gap-1 mb-6">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`w-5 h-5 ${i < testimonial.rating ? 'text-amber-400' : 'text-zinc-700'}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-xl md:text-2xl text-zinc-300 italic mb-8 leading-relaxed">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                                        {testimonial.avatar ? (
                                            <img
                                                src={testimonial.avatar}
                                                alt={testimonial.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            testimonial.name.charAt(0)
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white">{testimonial.name}</p>
                                        <p className="text-sm text-zinc-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className="p-2 -m-1 touch-manipulation"
                        aria-label={`Go to testimonial ${index + 1}`}
                    >
                        <span className={`block rounded-full transition-all ${index === current ? 'bg-emerald-500 w-6 h-2' : 'bg-zinc-700 w-2 h-2'
                            }`} />
                    </button>
                ))}
            </div>
        </div>
    );
}
