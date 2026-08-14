import { Children, cloneElement, isValidElement, useEffect, useState, type CSSProperties, type ElementType, type ReactElement, type ReactNode } from 'react';

interface BlurTextProps {
  text: ReactNode;
  delay?: number;
  animateBy?: 'words';
  direction?: 'top' | 'bottom';
  as?: ElementType;
  className?: string;
  onAnimationComplete?: () => void;
}

const getTextContent = (content: ReactNode): string =>
  Children.toArray(content).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    if (isValidElement<{ children?: ReactNode }>(child)) return getTextContent(child.props.children);
    return '';
  }).join('');

const splitIntoWords = (content: ReactNode, wordIndex: { current: number }, style: CSSProperties, delay: number): ReactNode =>
  Children.map(content, (child) => {
    if (typeof child === 'string') {
      return child.split(/(\s+)/).map((part) => {
        if (/^\s+$/.test(part)) return part;

        const index = wordIndex.current++;
        return (
          <span
            key={`${part}-${index}`}
            aria-hidden="true"
            style={{ ...style, transitionDelay: `${index * delay}ms` }}
          >
            {part}
          </span>
        );
      });
    }

    if (isValidElement(child)) {
      const element = child as ReactElement<{ children?: ReactNode }>;
      return cloneElement(element, undefined, splitIntoWords(element.props.children, wordIndex, style, delay));
    }

    return child;
  });

export const BlurText = ({
  text,
  delay = 200,
  animateBy = 'words',
  direction = 'top',
  as: Component = 'span',
  className,
  onAnimationComplete,
}: BlurTextProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const wordCount = { current: 0 };
  const wordStyle = {
    display: 'inline-block',
    filter: isVisible ? 'blur(0)' : 'blur(8px)',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : `translateY(${direction === 'top' ? '-10px' : '10px'})`,
    transition: 'filter 700ms ease-out, opacity 600ms ease-out, transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'filter, opacity, transform',
  } as CSSProperties;
  const animatedText = splitIntoWords(text, wordCount, wordStyle, delay);
  const animationDuration = Math.max(0, wordCount.current - 1) * delay + 700;

  useEffect(() => {
    if (!isVisible || !onAnimationComplete) return;
    const timer = window.setTimeout(onAnimationComplete, animationDuration);
    return () => window.clearTimeout(timer);
  }, [animationDuration, isVisible, onAnimationComplete]);

  return (
    <Component className={className} aria-label={getTextContent(text)} data-animate-by={animateBy}>
      {animatedText}
    </Component>
  );
};
