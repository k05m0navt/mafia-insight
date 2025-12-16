'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';

type Card = {
  id: number;
  content: React.ReactNode;
  className?: string;
  thumbnail: string;
  title?: string;
  description?: string;
};

const layoutGridVariants = tv({
  base: 'w-full h-full p-10 grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto gap-4 relative',
});

const cardVariants = tv({
  base: 'relative overflow-hidden bg-white rounded-xl h-full w-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  variants: {
    state: {
      default: 'bg-white rounded-xl h-full w-full',
      selected:
        'rounded-lg cursor-pointer absolute inset-0 h-1/2 w-full md:w-1/2 m-auto z-50 flex justify-center items-center flex-wrap flex-col',
      lastSelected: 'z-40 bg-white rounded-xl h-full w-full',
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

const overlayVariants = tv({
  base: 'absolute h-full w-full left-0 top-0 bg-black opacity-0 z-10',
  variants: {
    visible: {
      true: 'pointer-events-auto',
      false: 'pointer-events-none',
    },
  },
  defaultVariants: {
    visible: false,
  },
});

export interface LayoutGridProps
  extends VariantProps<typeof layoutGridVariants> {
  cards: Card[];
  className?: string;
  'aria-label'?: string;
}

export const LayoutGrid = ({
  cards,
  className,
  'aria-label': ariaLabel,
}: LayoutGridProps) => {
  const [selected, setSelected] = useState<Card | null>(null);
  const [lastSelected, setLastSelected] = useState<Card | null>(null);
  const [_focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleClick = useCallback(
    (card: Card) => {
      setLastSelected(selected);
      setSelected(card);
    },
    [selected]
  );

  const handleOutsideClick = useCallback(() => {
    setLastSelected(selected);
    setSelected(null);
    setFocusedIndex(null);
  }, [selected]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, card: Card, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(card);
      } else if (e.key === 'Escape' && selected) {
        e.preventDefault();
        handleOutsideClick();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (index + 1) % cards.length;
        setFocusedIndex(nextIndex);
        cardRefs.current[nextIndex]?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (index - 1 + cards.length) % cards.length;
        setFocusedIndex(prevIndex);
        cardRefs.current[prevIndex]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
        cardRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastIndex = cards.length - 1;
        setFocusedIndex(lastIndex);
        cardRefs.current[lastIndex]?.focus();
      }
    },
    [cards, handleClick, handleOutsideClick, selected]
  );

  // Close on outside click when overlay is visible
  useEffect(() => {
    if (selected) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleOutsideClick();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [selected, handleOutsideClick]);

  return (
    <div
      ref={gridRef}
      className={cn(layoutGridVariants(), className)}
      role="grid"
      aria-label={ariaLabel || 'Interactive grid layout'}
      aria-rowcount={Math.ceil(cards.length / 3)}
      aria-colcount={3}
    >
      {cards.map((card, i) => {
        const isSelected = selected?.id === card.id;
        const isLastSelected = lastSelected?.id === card.id;
        const state = isSelected
          ? 'selected'
          : isLastSelected
            ? 'lastSelected'
            : 'default';

        return (
          <div
            key={card.id}
            className={cn(card.className)}
            role="gridcell"
            aria-rowindex={Math.floor(i / 3) + 1}
            aria-colindex={(i % 3) + 1}
            aria-selected={isSelected}
          >
            <motion.div
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              tabIndex={0}
              onClick={() => handleClick(card)}
              onKeyDown={(e) => handleKeyDown(e, card, i)}
              className={cn(cardVariants({ state }))}
              layoutId={`card-${card.id}`}
              aria-label={card.title || `Card ${i + 1}`}
              aria-describedby={
                card.description ? `card-desc-${card.id}` : undefined
              }
              role="button"
            >
              {selected?.id === card.id && <SelectedCard selected={selected} />}
              <ImageComponent card={card} />
              {card.description && (
                <span id={`card-desc-${card.id}`} className="sr-only">
                  {card.description}
                </span>
              )}
            </motion.div>
          </div>
        );
      })}
      <motion.div
        onClick={handleOutsideClick}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleOutsideClick();
          }
        }}
        className={cn(overlayVariants({ visible: !!selected }))}
        animate={{ opacity: selected ? 0.3 : 0 }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};

const ImageComponent = ({ card }: { card: Card }) => {
  return (
    <motion.img
      layoutId={`image-${card.id}-image`}
      src={card.thumbnail}
      height="500"
      width="500"
      className={cn(
        'object-cover object-top absolute inset-0 h-full w-full transition duration-200'
      )}
      alt={card.title || `Card ${card.id} thumbnail`}
      aria-hidden={!card.title ? 'true' : undefined}
    />
  );
};

const SelectedCard = ({ selected }: { selected: Card | null }) => {
  return (
    <div className="bg-transparent h-full w-full flex flex-col justify-end rounded-lg shadow-2xl relative z-[60]">
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 0.6,
        }}
        className="absolute inset-0 h-full w-full bg-black opacity-60 z-10"
      />
      <motion.div
        layoutId={`content-${selected?.id}`}
        initial={{
          opacity: 0,
          y: 100,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 100,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        className="relative px-8 pb-4 z-[70]"
      >
        {selected?.content}
      </motion.div>
    </div>
  );
};
