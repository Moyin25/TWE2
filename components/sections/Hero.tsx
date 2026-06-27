"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Activity,
  CloudSun,
  Compass,
  Leaf,
  Play,
  Radio,
  Sprout,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import WeatherWidget from "@/components/features/WeatherWidget";

const impactStats = [
  { value: "50K+", label: "community members", icon: Users },
  { value: "150+", label: "active campaigns", icon: Activity },
  { value: "1M+", label: "trees planted", icon: Sprout },
];

const signalItems = [
  { label: "Field reports", value: "Live", icon: Radio },
  { label: "Climate action", value: "Global", icon: Compass },
  { label: "Local readiness", value: "Weather-led", icon: CloudSun },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
};

function AtmosphericLines() {
  const paths = [
    "M-80 145 C190 18 355 278 610 132 C850 -5 1030 170 1230 78 C1390 4 1535 86 1640 34",
    "M-120 292 C130 194 310 372 520 258 C790 112 925 350 1190 214 C1360 126 1510 206 1640 164",
    "M-100 458 C145 360 320 552 555 410 C820 252 995 510 1235 374 C1390 286 1518 338 1645 300",
    "M-70 620 C180 518 348 704 590 574 C816 452 1028 658 1258 534 C1410 452 1528 496 1650 456",
  ];

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1600 760"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {paths.map((path, index) => (
        <motion.path
          key={path}
          d={path}
          fill="none"
          stroke={index % 2 === 0 ? "#a3e494" : "#ffffff"}
          strokeOpacity={index % 2 === 0 ? 0.26 : 0.16}
          strokeWidth="1.4"
          strokeDasharray="10 22"
          animate={{ strokeDashoffset: [0, -160] }}
          transition={{
            duration: 18 + index * 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      ))}
    </svg>
  );
}

function RadarField() {
  return (
    <div className="pointer-events-none absolute right-[-18rem] top-[8rem] hidden h-[46rem] w-[46rem] lg:block">
      <div className="absolute inset-0 rounded-full border border-[#a3e494]/15" />
      <div className="absolute inset-[12%] rounded-full border border-[#a3e494]/15" />
      <div className="absolute inset-[24%] rounded-full border border-[#a3e494]/15" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#a3e494]/10" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#a3e494]/10" />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(163, 228, 148, 0.28), rgba(163, 228, 148, 0.04) 18%, transparent 32%)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 18,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0c2b2d] text-white">
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.12, x: -18, y: -8 }}
          transition={{
            duration: 22,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <Image
            src="/hero_img.jpg"
            alt="TW&E volunteers collecting weather data and planting trees"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,43,45,0.96)_0%,rgba(12,43,45,0.82)_38%,rgba(19,113,76,0.42)_68%,rgba(0,0,0,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(163,228,148,0.2),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.15),rgba(12,43,45,0.72))]" />
      </div>

      <AtmosphericLines />
      <RadarField />

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#a3e494]/70 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.7fr)]">
          <div className="max-w-4xl">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.7 }}
              className="mb-7 inline-flex items-center gap-3 border border-[#a3e494]/30 bg-white/[0.07] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#a3e494] backdrop-blur-md"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a3e494] opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#a3e494]" />
              </span>
              Live climate action network
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="max-w-5xl text-balance font-hartone text-5xl font-bold leading-[0.96] text-white sm:text-6xl lg:text-7xl xl:text-[6.9rem]"
            >
              Understand the weather.
              <span className="block text-[#a3e494]">Change everything.</span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-7 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl"
            >
              TW&E turns local weather awareness into community action,
              environmental education, and measurable climate impact.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-9 flex flex-col gap-4 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="group h-14 bg-[#a3e494] px-7 text-base font-bold text-[#0c2b2d] shadow-[0_18px_60px_rgba(163,228,148,0.28)] transition-all duration-300 hover:bg-white hover:text-[#13714c]"
              >
                <Link href="/join">
                  Join the movement
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group h-14 border-white/24 bg-white/[0.06] px-7 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:border-[#a3e494] hover:bg-[#a3e494]/10 hover:text-[#a3e494]"
              >
                <Link href="/campaigns">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Explore campaigns
                </Link>
              </Button>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 grid max-w-3xl grid-cols-1 border-y border-white/12 sm:grid-cols-3"
            >
              {impactStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 border-white/12 py-5 sm:border-r sm:px-5 last:sm:border-r-0"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#a3e494]/30 bg-[#13714c]/30 text-[#a3e494]">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-helvetica text-2xl font-black leading-none text-white">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-white/58">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="relative mx-auto w-full max-w-md lg:ml-auto"
          >
            <div className="absolute -inset-4 border border-[#a3e494]/10" />
            <div className="relative border border-white/16 bg-[#0c2b2d]/64 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-white/12 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a3e494]">
                    Climate command
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white">
                    Local conditions
                  </h2>
                </div>
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#a3e494]/35 text-[#a3e494]"
                  animate={{ boxShadow: ["0 0 0 0 rgba(163,228,148,0.28)", "0 0 0 12px rgba(163,228,148,0)"] }}
                  transition={{
                    duration: 2.2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeOut",
                  }}
                >
                  <Leaf className="h-5 w-5" />
                </motion.div>
              </div>

              <div className="grid gap-4">
                <div className="flex justify-center border border-white/10 bg-white/[0.045] p-3">
                  <WeatherWidget />
                </div>

                <div className="grid gap-3">
                  {signalItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: 0.55 + index * 0.1 }}
                      className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 border border-white/10 bg-white/[0.045] p-3 transition-colors duration-300 hover:border-[#a3e494]/35 hover:bg-[#13714c]/25"
                    >
                      <div className="flex h-10 w-10 items-center justify-center bg-[#13714c]/40 text-[#a3e494]">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {item.label}
                        </div>
                        <div className="text-xs text-white/54">
                          Synchronized with community response
                        </div>
                      </div>
                      <div className="font-helvetica text-sm font-black uppercase text-[#a3e494]">
                        {item.value}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
