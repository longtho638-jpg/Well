// Word-by-word staggered text reveal animation on scroll
import { motion } from 'framer-motion';

interface StaggeredTextProps {
    text: string;
    className?: string;
    tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function StaggeredText({ text, className = '', tag: Tag = 'h2' }: StaggeredTextProps) {
    const words = text.split(' ');

    return (
        <Tag className={className}>
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    className="inline-block mr-2"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{
                        delay: index * 0.1,
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    {word}
                </motion.span>
            ))}
        </Tag>
    );
}
