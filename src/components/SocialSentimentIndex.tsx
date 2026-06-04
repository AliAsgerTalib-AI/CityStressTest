/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  ThumbsUp, 
  ThumbsDown, 
  Search,
  Activity,
  User,
  ExternalLink
} from 'lucide-react';
import { SpecialistVerdict } from '../types';

interface SocialSentimentIndexProps {
  location: string;
  horizon: number;
  policySensitivity: number;
  verdict: SpecialistVerdict;
}

export function SocialSentimentIndex({
  location,
  horizon,
  policySensitivity,
  verdict
}: SocialSentimentIndexProps) {
  const norm = location.toLowerCase();
  
  // Classify Location Typology
  const isDesert = norm.includes("phoenix") || norm.includes("vegas") || norm.includes("dubai") || norm.includes("desert") || norm.includes("arizona") || norm.includes("texas") || norm.includes("houston") || norm.includes("austin");
  const isCoastal = norm.includes("miami") || norm.includes("beach") || norm.includes("florida") || norm.includes("fl") || norm.includes("ny") || norm.includes("york") || norm.includes("hk") || norm.includes("hong") || norm.includes("kong") || norm.includes("london") || norm.includes("coast") || norm.includes("sea") || norm.includes("san fran") || norm.includes("tokyo") || norm.includes("singapore") || norm.includes("sydney");
  const isCold = norm.includes("nordic") || norm.includes("munich") || norm.includes("canada") || norm.includes("seattle") || norm.includes("chicago") || norm.includes("boston") || norm.includes("sweden") || norm.includes("norway");

  const locationType = isDesert ? 'DESERT' : isCoastal ? 'COASTAL' : isCold ? 'TEMPERATE' : 'STANDARD';

  // Compute simulated NLP metrics dynamically
  const { fearFactor, sentimentSplit, keywords, discourseFeed } = useMemo(() => {
    // Fear Factor increases with horizon, and significantly scales with high policySensitivity (representing climate risk realization)
    // Low policy sensitivity (cooperative action) mitigates the fear factor
    let baseFear = 10;
    if (horizon <= 10) baseFear = 15;
    else if (horizon <= 25) baseFear = 35;
    else if (horizon <= 50) baseFear = 65;
    else if (horizon <= 75) baseFear = 85;
    else baseFear = 95;

    // Adjust for policy sensitivity (Climate Sensitivity Scale)
    // 50 is default baseline. < 50 mitigates, > 50 makes it much worse
    const sensitivityMultiplier = policySensitivity / 50; 
    let finalFear = Math.round(baseFear * (0.5 + sensitivityMultiplier * 0.5));
    
    // Caps
    if (policySensitivity < 25) {
      // Prompt drawdowns
      finalFear = Math.max(8, Math.round(finalFear * 0.35));
    } else if (policySensitivity < 45) {
      finalFear = Math.max(12, Math.round(finalFear * 0.65));
    } else if (policySensitivity > 75) {
      finalFear = Math.min(100, Math.round(finalFear * 1.25));
    }
    
    finalFear = Math.min(99, Math.max(5, finalFear));

    // Derive Sentiment Split based on fear factor
    const negative = finalFear;
    const positive = Math.max(1, Math.round((100 - negative) * (0.35 - (policySensitivity - 50) / 200)));
    const neutral = Math.max(1, 100 - negative - positive);

    // Dynamic Keywords based on Location and Horizon
    let kwList: { word: string; count: number; sentiment: 'pos' | 'neu' | 'neg' }[] = [];
    if (isCoastal) {
      kwList = [
        { word: 'reinsurance premium', count: Math.round(finalFear * 1.3), sentiment: 'neg' },
        { word: 'elevation code', count: Math.round((100 - finalFear) * 0.8), sentiment: 'neu' },
        { word: 'seawall tax', count: Math.round(finalFear * 0.9), sentiment: 'neg' },
        { word: 'tidal pluvial', count: Math.round(finalFear * 0.75), sentiment: 'neg' },
        { word: 'luxury buy', count: Math.round((100 - finalFear) * 1.5), sentiment: 'pos' }
      ];
    } else if (isDesert) {
      kwList = [
        { word: 'HVAC stress', count: Math.round(finalFear * 1.2), sentiment: 'neg' },
        { word: 'water bill', count: Math.round(finalFear * 1.4), sentiment: 'neg' },
        { word: 'dust storm', count: Math.round(finalFear * 0.65), sentiment: 'neu' },
        { word: 'grid reliability', count: Math.round(finalFear * 0.8), sentiment: 'neg' },
        { word: 'shade canopy', count: Math.round((100 - finalFear) * 0.9), sentiment: 'pos' }
      ];
    } else {
      kwList = [
        { word: 'stormwater tax', count: Math.round(finalFear * 1.1), sentiment: 'neg' },
        { word: 'basement flood', count: Math.round(finalFear * 0.95), sentiment: 'neg' },
        { word: 'mild winters', count: Math.round((100 - finalFear) * 1.2), sentiment: 'pos' },
        { word: 'infrastructure update', count: Math.round((100 - finalFear) * 0.7), sentiment: 'neu' },
        { word: 'utility surcharge', count: Math.round(finalFear * 1.05), sentiment: 'neg' }
      ];
    }

    // Sort keywords by mention count
    kwList.sort((a, b) => b.count - a.count);

    // Create a feed of simulated social media posts parsed by typical NLP classifier
    const feedTemplates = getDiscourseTemplates(location, horizon, finalFear, locationType);

    return {
      fearFactor: finalFear,
      sentimentSplit: { positive, neutral, negative },
      keywords: kwList,
      discourseFeed: feedTemplates
    };
  }, [location, horizon, policySensitivity, isCoastal, isDesert, locationType]);

  // Visual status based on Fear Factor
  let fearBadgeColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30';
  let fearLabel = 'Low';
  if (fearFactor > 75) {
    fearBadgeColor = 'text-red-400 bg-red-950/40 border-red-500/30 animate-pulse';
    fearLabel = 'Very High';
  } else if (fearFactor > 50) {
    fearBadgeColor = 'text-orange-400 bg-orange-950/30 border-orange-500/30';
    fearLabel = 'High';
  } else if (fearFactor > 25) {
    fearBadgeColor = 'text-yellow-400 bg-yellow-950/20 border-yellow-500/30';
    fearLabel = 'Moderate';
  }

  return (
    <div className="flex flex-col gap-5 mt-4 p-4 border border-[#2d2d2d] bg-[#0c0c0c] text-white">
      {/* Title block with NLP status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#222] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#121212] border border-[#333]">
            <Activity size={16} className="text-accent-gold" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold tracking-tight text-white font-sans uppercase">
              Community Sentiment
            </h4>
          </div>
        </div>
        <div className={`text-[9px] font-mono font-bold border px-2 py-1 select-none tracking-wider self-start sm:self-center ${fearBadgeColor}`}>
          Sentiment: {fearLabel}
        </div>
      </div>

      {/* Main Core Sentiment Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Column: Dial Indicator & Sentiment Bars (5-cols) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="bg-[#121212] border border-[#222] p-4 flex flex-col items-center justify-center relative min-h-[170px]">
            {/* Background circular tracker */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="#1a1a1a" strokeWidth="8" fill="transparent" 
                />
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  stroke={fearFactor > 70 ? "#ef4444" : fearFactor > 40 ? "#f97316" : "#10b981"} 
                  strokeWidth="8" fill="transparent" 
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * fearFactor) / 100 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black font-mono tracking-tighter text-white">
                  {fearFactor}%
                </span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                  Sentiment Index
                </span>
              </div>
            </div>
            <p className="text-[9px] font-mono text-zinc-400 text-center mt-3">
              Data sources: {discourseFeed.length} records
            </p>
          </div>

          {/* Sentiment Polarity Proportioned Stack */}
          <div className="bg-[#121212] border border-[#222] p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-400">
              <span>Sentiment Distribution</span>
            </div>
            
            {/* The multi-stacked linear bar */}
            <div className="h-3.5 w-full flex overflow-hidden border border-black select-none">
              <div 
                style={{ width: `${sentimentSplit.positive}%` }} 
                className="h-full bg-emerald-500 flex items-center justify-center text-[8px] text-zinc-950 font-black font-mono"
                title={`Positive Sentiment: ${sentimentSplit.positive}%`}
              >
                {sentimentSplit.positive > 12 && `${sentimentSplit.positive}%`}
              </div>
              <div 
                style={{ width: `${sentimentSplit.neutral}%` }} 
                className="h-full bg-zinc-500 flex items-center justify-center text-[8px] text-zinc-950 font-black font-mono"
                title={`Neutral Sentiment: ${sentimentSplit.neutral}%`}
              >
                {sentimentSplit.neutral > 12 && `${sentimentSplit.neutral}%`}
              </div>
              <div 
                style={{ width: `${sentimentSplit.negative}%` }} 
                className="h-full bg-red-500 flex items-center justify-center text-[8px] text-zinc-950 font-black font-mono animate-pulse"
                title={`Negative/Fear Sentiment: ${sentimentSplit.negative}%`}
              >
                {sentimentSplit.negative > 12 && `${sentimentSplit.negative}%`}
              </div>
            </div>

            {/* Micro Legended Block */}
            <div className="grid grid-cols-3 gap-1 mt-1 text-[9px] font-mono">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500" />
                <span className="text-emerald-400">POS // {sentimentSplit.positive}%</span>
              </div>
              <div className="flex items-center gap-1 justify-center">
                <span className="w-2 h-2 bg-zinc-500" />
                <span className="text-zinc-400">NEU // {sentimentSplit.neutral}%</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span className="w-2 h-2 bg-red-500" />
                <span className="text-red-400">NEG // {sentimentSplit.negative}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Keyword cloud & Live Scraped Posts Feed (7-cols) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          
          {/* Tag Cloud / Highlights */}
          <div className="bg-[#121212] border border-[#222] p-3">
            <h5 className="text-[10px] font-mono font-bold text-accent-gold pb-1.5 border-b border-[#222] uppercase tracking-wider">
              Trending Topics
            </h5>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {keywords.map((kw, idx) => (
                <span 
                  key={idx}
                  className={`text-[9px] font-mono px-2 py-0.5 border select-none tracking-tight flex items-center gap-1 ${
                    kw.sentiment === 'neg' 
                      ? 'border-red-950 bg-red-950/10 text-red-400' 
                      : kw.sentiment === 'pos' 
                      ? 'border-emerald-950 bg-emerald-950/10 text-emerald-400' 
                      : 'border-[#333] bg-[#1a1a1a] text-zinc-400'
                  }`}
                >
                  <span className="opacity-40 font-bold">#</span>
                  {kw.word} 
                  <span className={`text-[8px] opacity-60 ml-0.5 px-0.5 bg-black/40`}>
                    x{kw.count}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Social Scraped Discourse Feed (Simulated active crawler) */}
          <div className="bg-[#121212] border border-[#222] p-3 flex-1 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex justify-between items-center pb-1.5 border-b border-[#222] text-[10px] font-mono">
                <span className="text-accent-gold font-bold uppercase tracking-wider">
                  Recent Comments
                </span>
              </div>
              
              <div className="flex flex-col gap-2 mt-2 max-h-[140px] overflow-y-auto pr-1">
                {discourseFeed.map((post, idx) => (
                  <div key={idx} className="border-b border-[#202020]/60 pb-1.5 text-[10.5px]">
                    <div className="flex items-center justify-between text-zinc-500 font-mono text-[9px] mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <User size={10} className="text-zinc-600" />
                        <span className="text-zinc-400 hover:text-white cursor-pointer font-bold">{post.user}</span>
                        <span className="text-zinc-600 bg-zinc-950 py-0.2 px-1 text-[8px] border border-[#1b1b1b] rounded-xs select-none">
                          {post.platform}
                        </span>
                      </div>
                      <span className="text-zinc-600 font-normal">{post.time}</span>
                    </div>
                    <p className="text-zinc-300 italic pl-1 leading-relaxed">
                      "{post.text}"
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[8.5px] font-mono pl-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-600">NLP POLARITY:</span>
                        <span className={`font-semibold ${
                          post.sentiment === 'neg' ? 'text-red-400' : post.sentiment === 'pos' ? 'text-emerald-400' : 'text-zinc-400'
                        }`}>
                          {post.sentiment.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-zinc-600 hover:text-accent-gold transition-colors flex items-center gap-0.5 cursor-pointer">
                        VERIFY DEED
                        <ExternalLink size={8} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Synthesis Diagnostic explanation */}
      <div className="p-3 bg-bg-dark border border-zinc-800/40 text-[11px] text-zinc-300 leading-relaxed font-sans">
        <strong className="text-accent-gold mr-1 uppercase font-mono text-[10px] tracking-wider block sm:inline">
          SPECIALIST INTERPRETATION //
        </strong>
        {verdict.narrative}
      </div>
    </div>
  );
}

// Simulated active forum/social platform scraping data based on location categories & years
function getDiscourseTemplates(
  location: string, 
  horizon: number, 
  fear: number, 
  type: 'DESERT' | 'COASTAL' | 'TEMPERATE' | 'STANDARD'
) {
  const shortLoc = location.split(',')[0];
  
  if (type === 'COASTAL') {
    if (horizon <= 15) {
      return [
        {
          user: '@Florida_Cap_Alloc',
          platform: 'X / REDDIT',
          text: `Despite the premium tides, luxury buying velocity continues in ${shortLoc}. Demand from Northeastern flight portfolios is structurally shielding current yields.`,
          sentiment: 'pos' as const,
          time: '14 mins ago'
        },
        {
          user: '@Zone3_Homeowner',
          platform: 'NEXTDOOR_CIVIC',
          text: `Anyone else's standard home insurance quote jump 32% this morning? The structural elevation codes are good but the reinsurance premium hikes are serious.`,
          sentiment: 'neg' as const,
          time: '1 hour ago'
        },
        {
          user: '@TaxObserverMiami',
          platform: 'LOCAL_BLOG_CRAWL',
          text: `County planning board has authorized special bond assessments for sand-pumping. Retaining stable rating, but homeowners will bear the cost structure.`,
          sentiment: 'neu' as const,
          time: '3 hours ago'
        }
      ];
    } else if (horizon <= 50) {
      return [
        {
          user: '@Beachside_Refugee',
          platform: 'REDDIT / LOCAL',
          text: `High tide street pooling is no longer just a nuisance. Standard flood dikes are getting overwhelmed during King Tides. Thinking of liquidating before the 2060s.`,
          sentiment: 'neg' as const,
          time: '32 mins ago'
        },
        {
          user: '@Speculator_88',
          platform: 'X / PREMIUM',
          text: `All-cash institutional buyers are still snap-buying distressed waterfront properties for luxury retrofits. If you hold a standard mortgage, you're priced out.`,
          sentiment: 'neu' as const,
          time: '3 hours ago'
        },
        {
          user: '@ActuarialWatch',
          platform: 'CITIZEN_ALERT',
          text: `Most national carriers completely withdrew from coverage in low sections of ${shortLoc}. Relying strictly on state-backed pools with limited payout caps. Existential risk!`,
          sentiment: 'neg' as const,
          time: '1 day ago'
        }
      ];
    } else {
      return [
        {
          user: '@Managed_Retreat_2100',
          platform: 'CIVIC_FORUM',
          text: `There is zero active municipal utility support left for single-estate developments on the outer bay. Clean water is fully barge-imported. Total abandonment.`,
          sentiment: 'neg' as const,
          time: '10 mins ago'
        },
        {
          user: '@Sovereign_Claims_Proxy',
          platform: 'LEGAL_DISCORD',
          text: `Our deeds are physically underwater. The state high-tide legal boundaries migrated inland, rendering properties state property. This portfolio asset is $0.`,
          sentiment: 'neg' as const,
          time: '4 hours ago'
        }
      ];
    }
  } else if (type === 'DESERT') {
    if (horizon <= 15) {
      return [
        {
          user: '@Az_Developer_Hub',
          platform: 'X / FORUM',
          text: `Demographics in ${shortLoc} are still highly positive because of job markets. But summer temperature streaks are making HVAC energy bills our #1 operational expense.`,
          sentiment: 'neu' as const,
          time: '42 mins ago'
        },
        {
          user: '@GreenConservancy',
          platform: 'NEXTDOOR_CIVIC',
          text: `Groundwater levels are dropping. The micro-climate planning codes need to enforce extreme desert-scape plants immediately, standard lawns are a crime!`,
          sentiment: 'neg' as const,
          time: '2 hours ago'
        },
        {
          user: '@Oasis_Investor',
          platform: 'REDDIT_INVEST',
          text: `Added custom solar paneled awnings and automated deep-well cisterns. Totally off-grid utility setup protects standard appraisal values. Bullish!`,
          sentiment: 'pos' as const,
          time: '5 hours ago'
        }
      ];
    } else if (horizon <= 50) {
      return [
        {
          user: '@Desert_Grid_Tech',
          platform: 'REDDIT_ALERTS',
          text: `Another rolling brownout during the 48°C heat dome. Substation transformers are failing under peak AC. Water rate surcharges are growing quarterly. Stressed!`,
          sentiment: 'neg' as const,
          time: '11 mins ago'
        },
        {
          user: '@Realty_Exit_Plan',
          platform: 'X_RE_INTELLIGENCE',
          text: `Listing search interest for homes without private water allocations is down 80%. Panic selling has transitioned to early migration queries to the Midwest.`,
          sentiment: 'neg' as const,
          time: '2 hours ago'
        }
      ];
    } else {
      return [
        {
          user: '@DryRun_Survivor',
          platform: 'CIVIC_BOARDS',
          text: `The Colorado allocation has dried up completely. No public city water connection available. Home is a dry shell, worth nothing except as off-grid salvage.`,
          sentiment: 'neg' as const,
          time: '1 hour ago'
        },
        {
          user: '@Grid_Decommission_Watch',
          platform: 'REDDIT / LOCAL',
          text: `Utility grid has officially isolated this branch. Decommissioning utility lines due to high maintenance costs. Highly dangerous to step outside without active cooling.`,
          sentiment: 'neg' as const,
          time: '1 day ago'
        }
      ];
    }
  } else {
    // Temporary/Cold climates
    if (horizon <= 15) {
      return [
        {
          user: '@Temperate_Realty',
          platform: 'NEST_TALK',
          text: `${shortLoc} is showing stable migration indices. Winters are shorter and milder, which actually decreases standard heating bills significantly. No major panic yet.`,
          sentiment: 'pos' as const,
          time: '8 mins ago'
        },
        {
          user: '@Stormwater_Fee_Watch',
          platform: 'LOCAL_CIVIC',
          text: `County passed a 15% surcharge for storm sewer dredging. Wildfire haze valleys are a rising summer nuisance but physically manageable.`,
          sentiment: 'neu' as const,
          time: '3 hours ago'
        }
      ];
    } else if (horizon <= 50) {
      return [
        {
          user: '@Haze_Resist_101',
          platform: 'NEXTDOOR',
          text: `Basement flooding during rapid spring rain melt is becoming chronic. Municipal drainage backup has damaged three houses on our cul-de-sac. Insurance premiums spiking.`,
          sentiment: 'neg' as const,
          time: '30 mins ago'
        },
        {
          user: '@EcoRealtyTrend',
          platform: 'X_INTELLIGENCE',
          text: `Local property listings are exhibiting increased mention frequency of 'sealed basement systems' and 'wildfire air filtrations'. Buyers are cautious.`,
          sentiment: 'neu' as const,
          time: '6 hours ago'
        }
      ];
    } else {
      return [
        {
          user: '@Bailout_Group_2100',
          platform: 'CIVIC_DISCORD',
          text: `Local structures are dealing with structural rot due to high humidity levels and continuous pluvial inundation. Local municipal rating downgraded to junk state.`,
          sentiment: 'neg' as const,
          time: '2 hours ago'
        },
        {
          user: '@Northern_Haven_Tracker',
          platform: 'REDDIT',
          text: `The whole zone is listed as elevated hazard buffer. Demolition orders have been issued for low-elevation creek plots. Shifting assets north.`,
          sentiment: 'neg' as const,
          time: '5 hours ago'
        }
      ];
    }
  }
}
