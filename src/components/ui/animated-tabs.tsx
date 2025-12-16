'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';

type Tab = {
  title: string;
  value: string;
  content?: string | React.ReactNode;
};

const tabsContainerVariants = tv({
  base: 'flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full',
});

const tabButtonVariants = tv({
  base: 'relative px-4 py-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors',
  variants: {
    active: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    active: false,
  },
});

const activeTabIndicatorVariants = tv({
  base: 'absolute inset-0 bg-gray-200 dark:bg-zinc-800 rounded-full',
});

const tabContentVariants = tv({
  base: 'w-full h-full absolute top-0 left-0',
});

export interface AnimatedTabsProps
  extends VariantProps<typeof tabsContainerVariants> {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
  'aria-label'?: string;
  defaultTab?: string;
}

export const AnimatedTabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
  'aria-label': ariaLabel,
  defaultTab,
}: AnimatedTabsProps) => {
  const initialTab =
    propTabs.find((tab) => tab.value === defaultTab) || propTabs[0];
  const [active, setActive] = useState<Tab>(initialTab);
  const [tabs, setTabs] = useState<Tab[]>(propTabs);
  const [hovering, setHovering] = useState(false);
  const [_focusedIndex, setFocusedIndex] = useState<number>(
    propTabs.findIndex((tab) => tab.value === initialTab.value)
  );

  const moveSelectedTabToTop = useCallback(
    (idx: number) => {
      const newTabs = [...propTabs];
      const selectedTab = newTabs.splice(idx, 1);
      newTabs.unshift(selectedTab[0]);
      setTabs(newTabs);
      setActive(newTabs[0]);
      setFocusedIndex(0);
    },
    [propTabs]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (idx + 1) % propTabs.length;
        moveSelectedTabToTop(nextIndex);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (idx - 1 + propTabs.length) % propTabs.length;
        moveSelectedTabToTop(prevIndex);
      } else if (e.key === 'Home') {
        e.preventDefault();
        moveSelectedTabToTop(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        moveSelectedTabToTop(propTabs.length - 1);
      }
    },
    [propTabs, moveSelectedTabToTop]
  );

  return (
    <>
      <div
        className={cn(tabsContainerVariants(), containerClassName)}
        role="tablist"
        aria-label={ariaLabel || 'Animated tabs'}
        aria-orientation="horizontal"
      >
        {propTabs.map((tab, idx) => {
          const isActive = active.value === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.value}`}
              id={`tab-${tab.value}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                moveSelectedTabToTop(idx);
              }}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onFocus={() => setFocusedIndex(idx)}
              className={cn(
                tabButtonVariants({ active: isActive }),
                tabClassName
              )}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="clickedbutton"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  className={cn(
                    activeTabIndicatorVariants(),
                    activeTabClassName
                  )}
                  aria-hidden="true"
                />
              )}

              <span className="relative block text-black dark:text-white">
                {tab.title}
              </span>
            </button>
          );
        })}
      </div>
      <FadeInDiv
        tabs={tabs}
        active={active}
        key={active.value}
        hovering={hovering}
        className={cn('mt-32', contentClassName)}
      />
    </>
  );
};

const FadeInDiv = ({
  className,
  tabs,
  hovering,
  active: _active,
}: {
  className?: string;
  key?: string;
  tabs: Tab[];
  active: Tab;
  hovering?: boolean;
}) => {
  const isActive = (tab: Tab) => {
    return tab.value === tabs[0].value;
  };
  return (
    <div className="relative w-full h-full">
      {tabs.map((tab, idx) => {
        const isTabActive = isActive(tab);
        return (
          <motion.div
            key={tab.value}
            id={`tabpanel-${tab.value}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.value}`}
            tabIndex={isTabActive ? 0 : -1}
            hidden={!isTabActive}
            layoutId={tab.value}
            style={{
              scale: 1 - idx * 0.1,
              top: hovering ? idx * -50 : 0,
              zIndex: -idx,
              opacity: idx < 3 ? 1 - idx * 0.1 : 0,
            }}
            animate={{
              y: isTabActive ? [0, 40, 0] : 0,
            }}
            className={cn(tabContentVariants(), className)}
          >
            {tab.content}
          </motion.div>
        );
      })}
    </div>
  );
};
