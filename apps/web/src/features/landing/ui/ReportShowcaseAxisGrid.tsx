"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { staggerContainer, staggerItem } from "@/features/landing/ui/LandingMotion";
import { axisMetrics } from "@/features/landing/ui/reportShowcase.constants";

function AnimatedStatNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let startTime: number | undefined;
    const duration = 1500;

    const update = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.floor(value * eased));
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return <span>{display}</span>;
}

export function ReportShowcaseAxisGrid() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="grid gap-4 sm:grid-cols-2"
    >
      {axisMetrics.map((metric) => (
        <motion.div
          key={metric.label}
          variants={staggerItem}
          className="rounded-2xl border border-im-border/70 bg-white px-4 py-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${metric.colorClass}/10`}>
                <metric.icon className={`h-4 w-4 ${metric.colorClass.replace("bg-", "text-")}`} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-im-text-main">{metric.label}</span>
            </div>
            <span className={`text-sm font-black tabular-nums ${metric.colorClass.replace("bg-", "text-")}`}>
              <AnimatedStatNumber value={metric.score} />점
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${metric.colorClass}`} style={{ width: `${metric.score}%` }} />
          </div>
          <p className="mt-2 text-xs leading-6 text-slate-500">{metric.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
