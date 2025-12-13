'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AnalyticsIllustrationProps {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Width of the illustration
   * @default 400
   */
  width?: number;
  /**
   * Height of the illustration
   * @default 300
   */
  height?: number;
}

/**
 * Hero illustration for analytics pages
 * Features a modern dashboard visualization with charts and metrics
 */
export const AnalyticsHeroIllustration = React.forwardRef<
  SVGSVGElement,
  AnalyticsIllustrationProps
>(({ className, width = 800, height = 400, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox="0 0 800 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-primary', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="800" height="400" fill="url(#heroGradient)" rx="12" />

      {/* Chart bars */}
      <g transform="translate(100, 200)">
        {[60, 80, 45, 90, 70, 85, 95, 75].map((height, index) => (
          <rect
            key={index}
            x={index * 70}
            y={-height}
            width="50"
            height={height}
            fill="url(#chartGradient)"
            rx="4"
            className="motion-safe:transition-all motion-safe:duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </g>

      {/* Line chart overlay */}
      <polyline
        points="120,180 190,140 260,200 330,120 400,160 470,100 540,150 610,80 680,130"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
        className="text-secondary"
      />

      {/* Data points */}
      {[
        { x: 120, y: 180 },
        { x: 190, y: 140 },
        { x: 260, y: 200 },
        { x: 330, y: 120 },
        { x: 400, y: 160 },
        { x: 470, y: 100 },
        { x: 540, y: 150 },
        { x: 610, y: 80 },
        { x: 680, y: 130 },
      ].map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="6"
          fill="currentColor"
          className="text-accent"
        />
      ))}

      {/* Metric cards */}
      <g transform="translate(500, 50)">
        <rect
          x="0"
          y="0"
          width="120"
          height="80"
          rx="8"
          fill="white"
          className="dark:fill-gray-800"
          opacity="0.9"
        />
        <text
          x="60"
          y="35"
          textAnchor="middle"
          className="text-sm font-semibold fill-gray-700 dark:fill-gray-200"
        >
          Win Rate
        </text>
        <text
          x="60"
          y="55"
          textAnchor="middle"
          className="text-2xl font-bold fill-primary"
        >
          72%
        </text>
      </g>

      <g transform="translate(500, 150)">
        <rect
          x="0"
          y="0"
          width="120"
          height="80"
          rx="8"
          fill="white"
          className="dark:fill-gray-800"
          opacity="0.9"
        />
        <text
          x="60"
          y="35"
          textAnchor="middle"
          className="text-sm font-semibold fill-gray-700 dark:fill-gray-200"
        >
          ELO Rating
        </text>
        <text
          x="60"
          y="55"
          textAnchor="middle"
          className="text-2xl font-bold fill-secondary"
        >
          1,245
        </text>
      </g>
    </svg>
  );
});

AnalyticsHeroIllustration.displayName = 'AnalyticsHeroIllustration';

/**
 * Empty state illustration for analytics pages
 * Shows a friendly empty state when no data is available
 */
export const AnalyticsEmptyStateIllustration = React.forwardRef<
  SVGSVGElement,
  AnalyticsIllustrationProps
>(({ className, width = 400, height = 300, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-muted-foreground', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Background circle */}
      <circle cx="200" cy="150" r="100" fill="currentColor" opacity="0.05" />

      {/* Chart icon */}
      <g transform="translate(150, 100)">
        {/* Bar chart */}
        <rect
          x="20"
          y="40"
          width="12"
          height="40"
          fill="currentColor"
          opacity="0.3"
          rx="2"
        />
        <rect
          x="40"
          y="20"
          width="12"
          height="60"
          fill="currentColor"
          opacity="0.3"
          rx="2"
        />
        <rect
          x="60"
          y="30"
          width="12"
          height="50"
          fill="currentColor"
          opacity="0.3"
          rx="2"
        />
        <rect
          x="80"
          y="10"
          width="12"
          height="70"
          fill="currentColor"
          opacity="0.3"
          rx="2"
        />

        {/* Magnifying glass */}
        <circle
          cx="120"
          cy="50"
          r="25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.4"
        />
        <line
          x1="140"
          y1="70"
          x2="155"
          y2="85"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />
      </g>

      {/* Decorative elements */}
      <circle cx="100" cy="80" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="300" cy="220" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="320" cy="100" r="2" fill="currentColor" opacity="0.2" />
    </svg>
  );
});

AnalyticsEmptyStateIllustration.displayName = 'AnalyticsEmptyStateIllustration';

/**
 * Performance metrics illustration
 * Shows performance indicators and statistics
 */
export const PerformanceMetricsIllustration = React.forwardRef<
  SVGSVGElement,
  AnalyticsIllustrationProps
>(({ className, width = 500, height = 300, ...props }, ref) => {
  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox="0 0 500 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-primary', className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="metricGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Circular progress indicator */}
      <g transform="translate(100, 150)">
        <circle
          cx="0"
          cy="0"
          r="60"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          opacity="0.1"
        />
        <circle
          cx="0"
          cy="0"
          r="60"
          fill="none"
          stroke="url(#metricGradient)"
          strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 60 * 0.75} ${2 * Math.PI * 60}`}
          strokeDashoffset={2 * Math.PI * 60 * 0.25}
          transform="rotate(-90)"
        />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          className="text-2xl font-bold fill-primary"
        >
          75%
        </text>
      </g>

      {/* Trend line */}
      <g transform="translate(250, 50)">
        <polyline
          points="0,200 30,180 60,160 90,140 120,120 150,100 180,80 210,60"
          fill="none"
          stroke="url(#metricGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210].map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={200 - i * 20}
            r="4"
            fill="currentColor"
            className="text-accent"
          />
        ))}
      </g>
    </svg>
  );
});

PerformanceMetricsIllustration.displayName = 'PerformanceMetricsIllustration';
