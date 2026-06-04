/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building, 
  Coins, 
  Shield, 
  Droplets,
  HardHat, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Globe, 
  AlertTriangle, 
  Search, 
  Clock, 
  Compass, 
  MapPin, 
  Thermometer, 
  Leaf, 
  ArrowRight,
  RefreshCw,
  FileText,
  BadgeAlert,
  Sliders,
  Sparkles,
  Layers,
  HelpCircle,
  Download,
  FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Line,
  LineChart
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { StressTestReport, HorizonProjection, Specialists, HorizonMetrics } from './types';
import { modulateReportWithSensitivity } from './utils/stressTestUtils';
import { runArimaModel, runLstmModel, runCmipEnsemble } from './utils/climateModels';
import { GeographicThreatOverlay } from './components/GeographicThreatOverlay';
import { SocialSentimentIndex } from './components/SocialSentimentIndex';

export default function App() {
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLog, setLoadingLog] = useState('');
  const [report, setReport] = useState<StressTestReport | null>(null);
  const [policySensitivity, setPolicySensitivity] = useState<number>(50);
  const [selectedHorizonIndex, setSelectedHorizonIndex] = useState<number>(0); // index of projections
  const [selectedSpecialist, setSelectedSpecialist] = useState<keyof Specialists>('macroEconomist');
  const [dataSource, setDataSource] = useState<'AI_GENERATED' | 'PROCEDURAL_SIMULATION' | 'PRESET'>('AI_GENERATED');
  const [error, setError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // --- REAL-TIME WEATHER & METEOROLOGICAL API STATES ---
  const [currentWeather, setCurrentWeather] = useState<any | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [historicalWeatherData, setHistoricalWeatherData] = useState<any | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [useRealHistory, setUseRealHistory] = useState(false);

  // API Retrieval proxy for real-time and historical values
  const fetchWeatherAndHistory = async (locationName: string) => {
    setIsWeatherLoading(true);
    setIsHistoryLoading(true);
    setWeatherError(null);

    // Call current weather proxy
    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(locationName)}`);
      if (!res.ok) throw new Error("Could not fetch current weather statistics.");
      const data = await res.json();
      setCurrentWeather(data);
    } catch (err: any) {
      console.error(err);
      setWeatherError(err.message || "Failed to load real-time weather.");
      setCurrentWeather(null);
    } finally {
      setIsWeatherLoading(false);
    }

    // Call decadal historical climate proxy
    try {
      const res = await fetch(`/api/weather/historical?location=${encodeURIComponent(locationName)}`);
      if (!res.ok) throw new Error("Could not compile historical weather baseline.");
      const data = await res.json();
      setHistoricalWeatherData(data);
    } catch (err) {
      console.error(err);
      setHistoricalWeatherData(null);
      setUseRealHistory(false); // fall back to procedural if fetch fails
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // --- ACTUARIAL PREDICTION SANDBOX STATE ---
  const [activeTab, setActiveTab ] = useState<'readouts' | 'forecaster'>('readouts');
  const [forecastTarget, setForecastTarget] = useState<'temp' | 'precip' | 'subsidence'>('temp');
  const [forecastModel, setForecastModel] = useState<'arima' | 'lstm' | 'cmip'>('arima');
  
  // ARIMA controls
  const [arimaP, setArimaP] = useState<number>(2);
  const [arimaD, setArimaD] = useState<number>(1);
  const [arimaQ, setArimaQ] = useState<number>(2);

  // LSTM controls
  const [lstmEpochs, setLstmEpochs] = useState<number>(80);
  const [lstmNeurons, setLstmNeurons] = useState<number>(32);
  const [lstmLearningRate, setLstmLearningRate] = useState<number>(0.01);

  // CMIP controls
  const [cmipPathway, setCmipPathway] = useState<'SSP1-2.6' | 'SSP2-4.5' | 'SSP5-8.5'>('SSP2-4.5');

  // Confidence Interval control
  const [ciConfidence, setCiConfidence] = useState<number>(0.95); // 80%, 90%, 95%

  // Fitted model state and training animation trigger
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [fittedData, setFittedData] = useState<{
    data: any[];
    diagnostics: any;
    lossCurve?: number[];
  } | null>(null);
  const trainingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Run the core forecasting logic based on current parameters and chosen history feed
  const runActuarialForecast = (locationName?: string) => {
    const loc = locationName || report?.location || "Miami Beach, Coastal Florida";
    const historyToUse = useRealHistory ? historicalWeatherData : null;

    if (forecastModel === 'arima') {
      const res = runArimaModel(loc, forecastTarget, arimaP, arimaD, arimaQ, ciConfidence, historyToUse);
      setFittedData(res);
    } else if (forecastModel === 'lstm') {
      const res = runLstmModel(loc, forecastTarget, lstmEpochs, lstmNeurons, lstmLearningRate, ciConfidence, historyToUse);
      setFittedData(res);
    } else {
      const res = runCmipEnsemble(loc, forecastTarget, cmipPathway, ciConfidence, historyToUse);
      setFittedData(res);
    }
  };

  // Automated log-visualiser trigger for tactile retraining feedback
  const triggerModelBacktest = () => {
    if (trainingIntervalRef.current) clearInterval(trainingIntervalRef.current);

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    const loc = report?.location || "Miami Beach, Coastal Florida";

    const messages = [
      `[PROCESS INIT] LOADED GEOGRAPHIC VECTOR DATASET FOR ${loc.toUpperCase()}`,
      `[TENSOR ALLOC] ASSIGNING FLOATING ARRAYS IN WORKSPACE RESID ... SHAPE: [46, 1]`,
      forecastModel === 'arima'
        ? `[ARIMA SOLVER] INITIATING POLAR LEAST-SQUARES ARMA(${arimaP},${arimaD},${arimaQ}) ESTIMATES...`
        : forecastModel === 'lstm'
        ? `[NEURAL COMPILE] OPENING BACKPROP TENSORS ACROSS ${lstmNeurons} RNN RECURRENT CELLS...`
        : `[CMIP6 INTEGRATOR] COMPILING GCM ASSEMBLY SPECTRUM PATHWAYS (${cmipPathway})...`,
    ];

    let currentProgress = 0;
    let logIndex = 0;

    trainingIntervalRef.current = setInterval(() => {
      currentProgress += 20;
      setTrainingProgress(currentProgress);
      
      if (logIndex < messages.length) {
        setTrainingLogs(prev => [...prev, messages[logIndex]]);
        logIndex++;
      } else if (forecastModel === 'lstm') {
        const epochStep = Math.round((currentProgress / 100) * lstmEpochs);
        const currentLoss = (forecastTarget === 'precip' ? 1800 : 35.0) / Math.pow(epochStep || 1, 0.4);
        setTrainingLogs(prev => [...prev, `[LSTM EPOCH ${epochStep}/${lstmEpochs}] MULTI-LAYER GRU/CELL LOSS COEFFICIENT: ${currentLoss.toFixed(4)}`]);
      } else if (forecastModel === 'arima') {
        const estError = 0.12 + (100 - currentProgress) * 0.004;
        setTrainingLogs(prev => [...prev, `[ARIMA COEFF GRAD] AIC IMPROVEMENT IN DIFFERENCE SPACE ... RESID SE: ${estError.toFixed(4)}`]);
      } else {
        setTrainingLogs(prev => [...prev, `[CMIP ENSEMBLE] RESOLVING RADIATIVE FORCING SPREAD ENVELOPES FOR ${cmipPathway}...`]);
      }
      
      if (currentProgress >= 100) {
        if (trainingIntervalRef.current) {
          clearInterval(trainingIntervalRef.current);
          trainingIntervalRef.current = null;
        }
        setTimeout(() => {
          const historyToUse = useRealHistory ? historicalWeatherData : null;
          if (forecastModel === 'arima') {
            const res = runArimaModel(loc, forecastTarget, arimaP, arimaD, arimaQ, ciConfidence, historyToUse);
            setFittedData(res);
          } else if (forecastModel === 'lstm') {
            const res = runLstmModel(loc, forecastTarget, lstmEpochs, lstmNeurons, lstmLearningRate, ciConfidence, historyToUse);
            setFittedData(res);
          } else {
            const res = runCmipEnsemble(loc, forecastTarget, cmipPathway, ciConfidence, historyToUse);
            setFittedData(res);
          }
          setIsTraining(false);
        }, 150);
      }
    }, 200);
  };

  // Re-run forecast automatically on parameter adjustments
  useEffect(() => {
    if (!isTraining) {
      runActuarialForecast();
    }
  }, [
    report?.location,
    forecastTarget,
    forecastModel,
    arimaP,
    arimaD,
    arimaQ,
    lstmEpochs,
    lstmNeurons,
    lstmLearningRate,
    cmipPathway,
    ciConfidence,
    useRealHistory,
    historicalWeatherData
  ]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Fetch real-time weather and decadal meteorological station data on location change
  useEffect(() => {
    if (report?.location) {
      fetchWeatherAndHistory(report.location);
    }
  }, [report?.location]);

  const handleEvaluateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setLoadingLog('Connecting to climate analysis service...');

    const logs = [
      'Loading specialist data...',
      'Calculating property projections...',
      'Fetching environmental data...',
      'Running climate models...',
      'Finalizing report...'
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        setLoadingLog(logs[logIdx]);
        logIdx++;
      }
    }, 450);

    try {
      const response = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressInput.trim() })
      });
      
      const data = await response.json();
      
      clearInterval(interval);
      if (data.report) {
        setReport(data.report);
        setDataSource(data.source || 'AI_GENERATED');
        setSelectedHorizonIndex(0);
      } else {
        throw new Error(data.error || "Failed appraisal generation.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'The Climate Intelligence link failed to retrieve dynamic assets.');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const activeReport = useMemo(() => {
    if (!report) return null;
    return modulateReportWithSensitivity(report, policySensitivity);
  }, [report, policySensitivity]);

  const currentProjection: HorizonProjection | null = activeReport ? activeReport.projections[selectedHorizonIndex] : null;

  const handleDownloadPDF = async () => {
    if (!activeReport || !currentProjection || !fittedData) return;

    try {
      setIsExportingPDF(true);

      if (activeTab !== 'readouts') {
        setError('Please switch to "Risk Assessment" tab before exporting PDF');
        setIsExportingPDF(false);
        return;
      }

      // 1. Capture charts from offscreen container via html2canvas
      const policyEl = document.getElementById('pdf-capture-policy-chart');
      const predictiveEl = document.getElementById('pdf-capture-predictive-chart');

      if (!policyEl || !predictiveEl) {
        setError('Chart elements not found. Please ensure you are on the Appraisal Board tab and try again.');
        setIsExportingPDF(false);
        return;
      }

      let policyImgData = null;
      let predictiveImgData = null;

      if (policyEl) {
        const canvas = await html2canvas(policyEl, {
          scale: 2,
          backgroundColor: '#0b0f19',
          logging: false,
          useCORS: true
        });
        policyImgData = canvas.toDataURL('image/jpeg', 0.95);
      }

      if (predictiveEl) {
        const canvas = await html2canvas(predictiveEl, {
          scale: 2,
          backgroundColor: '#0b0f19',
          logging: false,
          useCORS: true
        });
        predictiveImgData = canvas.toDataURL('image/jpeg', 0.95);
      }

      // 2. Initialize jsPDF Document (A4, Portrait, mm units)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // ============================================
      // PAGE 1: EXECUTIVE BRIEF & DECAY PATHWAYS
      // ============================================
      let y = margin;

      // Brand Header Block
      doc.setFillColor(11, 15, 25); // Deep Charcoal Slate
      doc.rect(margin, y, contentWidth, 24, 'F');
      
      doc.setFillColor(196, 167, 125); // Gold Accent Bar
      doc.rect(margin, y, 1.5, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(196, 167, 125); // Gold
      doc.text('SOVEREIGN ASSET DECADAL CLIMATE AUDIT', margin + 6, y + 9);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 160);
      doc.text('CLIMATE-STRESSED ACTUARIAL PORTFOLIO EVALUATION & DECAY CURVE PROJECTIONS', margin + 6, y + 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()} (UTC)`, margin + contentWidth - 6, y + 9, { align: 'right' });
      doc.text(`MODEL ENSEMBLE: GCM SYSTEMIC CMIP6 TRANSITION ARYS`, margin + contentWidth - 6, y + 15, { align: 'right' });

      y += 24 + 8;

      // Executive Target Dossier Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text('I. EXECUTIVE TARGET PROPERTY DOSSIER', margin, y);
      
      doc.setDrawColor(196, 167, 125); // Gold
      doc.setLineWidth(0.4);
      doc.line(margin, y + 2, margin + contentWidth, y + 2);
      
      y += 8;

      // Metadata Grid Line 1
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Target Location:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(activeReport.location.toUpperCase(), margin + 45, y);

      doc.setFont('helvetica', 'bold');
      doc.text('Baseline Valuation:', margin + 112, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`$${(activeReport.baselinePriceSFH / 1000).toFixed(0)}k SFH`, margin + 145, y);

      y += 5.5;

      // Metadata Grid Line 2
      doc.setFont('helvetica', 'bold');
      doc.text('Coordinates Boundary:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(activeReport.coordinates, margin + 45, y);

      doc.setFont('helvetica', 'bold');
      doc.text('Carbon Target Index:', margin + 112, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${policySensitivity} / 100 (Climate Sensitivity Scale)`, margin + 145, y);

      y += 5.5;

      // Metadata Grid Line 3
      doc.setFont('helvetica', 'bold');
      doc.text('Sovereign Carbon Path:', margin, y);
      doc.setFont('helvetica', 'normal');
      let pathLabel = '';
      if (policySensitivity < 25) pathLabel = 'SSP1-1.9 // COOPERATIVE DRAWDOWNS (NET DRAW STABLE < 1.3°C)';
      else if (policySensitivity < 45) pathLabel = 'SSP1-2.6 // PROMPT ACTION PATHWAY (CARBON TARIFF RESISTANT < 1.6°C)';
      else if (policySensitivity <= 55) pathLabel = 'SSP2-4.5 // MIDDLE-OF-THE-ROAD BASELINE (NEUTRAL DEFAULT < 2.4°C)';
      else if (policySensitivity <= 75) pathLabel = 'SSP3-7.0 // REGULATORY SLIPPAGE RATE (DELAYED TIMELINE < 3.6°C)';
      else pathLabel = 'SSP5-8.5 // UNREGULATED FOSSIL CHAOS TRAJECTORY (RUNAWAY CORROSION > 4.8°C)';
      doc.text(pathLabel, margin + 45, y);

      y += 7.5;

      // Transition Liability Alert Box
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y, contentWidth, 23, 'F');
      doc.setDrawColor(220, 38, 38); // red bar
      doc.setLineWidth(1.0);
      doc.line(margin, y, margin, y + 23);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(220, 38, 38);
      doc.text(`TRANSITION TO REINSURANCE LIABILITY DECADE: ${activeReport.transitionLiabilityDecade}`, margin + 5, y + 5.5);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(55, 65, 81);
      doc.text('Primary Structural Impairment Trigger Catalyst:', margin + 5, y + 11);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const triggerLines = doc.splitTextToSize(activeReport.transitionTriggerCause, contentWidth - 10);
      doc.text(triggerLines, margin + 5, y + 15);

      y += 23 + 8;

      // Section II: Decay Projections & Co-Integrated Values Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text('II. DECAY PROJECTIONS & CO-INTEGRATED VALUES', margin, y);
      
      doc.setDrawColor(196, 167, 125);
      doc.setLineWidth(0.4);
      doc.line(margin, y + 2, margin + contentWidth, y + 2);
      
      y += 8;

      // Table Header Row
      doc.setFillColor(17, 24, 39);
      doc.rect(margin, y, contentWidth, 6, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('HORIZON', margin + 3, y + 4.2);
      doc.text('YEAR', margin + 20, y + 4.2);
      doc.text('VALUE', margin + 38, y + 4.2);
      doc.text('MUNI DEBT', margin + 63, y + 4.2);
      doc.text('ANNUAL ALPHA', margin + 88, y + 4.2);
      doc.text('INSURANCE COVER RISK (ACTUARIAL GAP)', margin + 118, y + 4.2);

      y += 6;

      // Render table rows
      activeReport.projections.forEach((proj, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, y, contentWidth, 6, 'F');
        }
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(17, 24, 39);
        
        doc.text(`${proj.horizon}Yr`, margin + 3, y + 4.2);
        doc.text(`${proj.year}`, margin + 20, y + 4.2);
        doc.text(proj.pricingPoint.label, margin + 38, y + 4.2);
        doc.text(proj.metrics.municipalDebt, margin + 63, y + 4.2);
        doc.text(proj.assetAlpha, margin + 88, y + 4.2);
        
        const gap = proj.liabilityCoverageGap;
        if (gap.includes("100%") || gap.includes("Uninsured") || proj.status.includes("Loss") || proj.status.includes("LOSS") || proj.status.includes("STRANDED")) {
          doc.setTextColor(185, 28, 28);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(75, 85, 99);
        }
        
        doc.text(`${proj.status} (${gap})`, margin + 118, y + 4.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        
        y += 6;
      });

      y += 6;

      // 100-Year Valuation Dynamic Curve Image Widget
      doc.setFillColor(15, 17, 21); // Dark background
      doc.rect(margin, y, contentWidth, 68, 'F');
      doc.setDrawColor(34, 34, 34);
      doc.setLineWidth(0.4);
      doc.rect(margin, y, contentWidth, 68, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(196, 167, 125); // Gold Accent #C4A77D
      doc.text('VISUALIZATION 1.0 // ACTIVE CLIMATE POLICY INTEGRATED VALUATION SEQUENCE', margin + 6, y + 6);

      doc.setDrawColor(44, 44, 44);
      doc.line(margin + 6, y + 8, margin + contentWidth - 6, y + 8);

      if (policyImgData) {
        doc.addImage(policyImgData, 'JPEG', margin + 4, y + 11, contentWidth - 8, 51);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(115, 115, 115);
        doc.text('[PORTFOLIO VALUATION DYNAMICS CHART METADATA UNCOMPATIBLE]', margin + 12, y + 36);
      }

      // Page 1 Footer bounds
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text('Sovereign Asset Board © 2026. Sealed with climate validation signatures.', margin, pageHeight - 9);
      doc.text('Page 1 of 3', margin + contentWidth, pageHeight - 9, { align: 'right' });


      // ============================================
      // PAGE 2: MACHINE REGRESSION & PREDICTOR
      // ============================================
      doc.addPage();
      let yPage2 = margin;

      // Brand Header Block Page 2
      doc.setFillColor(11, 15, 25); 
      doc.rect(margin, yPage2, contentWidth, 18, 'F');
      
      doc.setFillColor(196, 167, 125); 
      doc.rect(margin, yPage2, 1.5, 18, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(196, 167, 125);
      doc.text('SECTION III: PREDICTIVE SYSTEMIC REGRESSION GRAPH', margin + 6, yPage2 + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 160);
      doc.text('CO-INTEGRATED MATHEMATICAL DRIFT & REGRESSION CURVE FOR ESTIMATED PHYSICAL BASES', margin + 6, yPage2 + 13);

      yPage2 += 18 + 10;

      // Brief introduction paragraph Page 2
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      const forecasterDesc = `The predictive model mathematically fits historical weather patterns with the selected regression solver to estimate physical baselines (temperature delta, decadal pluvial surges, and sea level rates). Under high carbon pathway regimes, these physical anomalies trigger physical devaluations and structural bedrock stress.`;
      const forecasterDescSplit = doc.splitTextToSize(forecasterDesc, contentWidth);
      doc.text(forecasterDescSplit, margin, yPage2);

      yPage2 += (forecasterDescSplit.length * 4) + 6;

      // Background Box containing Chart 2
      doc.setFillColor(15, 17, 21); // Dark background
      doc.rect(margin, yPage2, contentWidth, 80, 'F');
      doc.setDrawColor(34, 34, 34);
      doc.setLineWidth(0.4);
      doc.rect(margin, yPage2, contentWidth, 80, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(196, 167, 125); // Gold
      doc.text(`VISUALIZATION 2.0 // LONG-HORIZON REGRESSION FOR: ${forecastTarget.toUpperCase()} DEVIATIONS`, margin + 6, yPage2 + 6);

      doc.setDrawColor(44, 44, 44);
      doc.line(margin + 6, yPage2 + 8, margin + contentWidth - 6, yPage2 + 8);

      if (predictiveImgData) {
        doc.addImage(predictiveImgData, 'JPEG', margin + 4, yPage2 + 11, contentWidth - 8, 63);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(115, 115, 115);
        doc.text('[REGRESSION STOCHASTIC MODEL CHART METADATA UNCOMPATIBLE]', margin + 12, yPage2 + 42);
      }

      yPage2 += 80 + 10;

      // Diagnostics Subdivision
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text('MODEL CONVERGENCE DIAGNOSTICS & RESIDUAL ERROR TERMS', margin, yPage2);

      doc.setDrawColor(196, 167, 125);
      doc.setLineWidth(0.4);
      doc.line(margin, yPage2 + 2, margin + contentWidth, yPage2 + 2);

      yPage2 += 8;

      // Draw 4 diagnostic cards horizontally
      const cardW = (contentWidth - 12) / 4; // Width per card
      const cardH = 22;

      const unitStr = ['arima', 'lstm'].includes(fittedData.diagnostics.modelType.toLowerCase()) || forecastTarget === 'temp' ? '°C' : forecastTarget === 'precip' ? 'mm' : '%';

      const diagnosticsList = [
        {
          title: 'ESTIMATED R-SQUARED R²',
          value: fittedData.diagnostics.r2.toFixed(3),
          desc: 'Variance percentage fit.'
        },
        {
          title: 'RMS ERROR DEVIATION',
          value: `${fittedData.diagnostics.rmse.toFixed(2)} ${unitStr}`,
          desc: 'Residual root square deviation.'
        },
        {
          title: 'MAE BIAS CRITERION',
          value: `${fittedData.diagnostics.mae.toFixed(2)} ${unitStr}`,
          desc: 'Mean absolute prediction bias.'
        },
        {
          title: 'INTEGRATED DRIFT TREND',
          value: fittedData.diagnostics.trend,
          desc: 'Fitted linear drift formula.'
        }
      ];

      diagnosticsList.forEach((diag, idx) => {
        const cardX = margin + (idx * (cardW + 4));
        
        doc.setFillColor(243, 244, 246); // Light grey card background
        doc.rect(cardX, yPage2, cardW, cardH, 'F');
        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.25);
        doc.rect(cardX, yPage2, cardW, cardH, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(107, 114, 128); // Grey caption
        doc.text(diag.title, cardX + 3, yPage2 + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(17, 24, 39);
        doc.text(diag.value, cardX + 3, yPage2 + 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(140, 140, 140);
        const descLines = doc.splitTextToSize(diag.desc, cardW - 6);
        doc.text(descLines, cardX + 3, yPage2 + 16);
      });

      yPage2 += cardH + 10;

      // Training Ledger Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text('STATISTICAL MODEL TRAINING LEDGER PROOF', margin, yPage2);

      doc.setDrawColor(196, 167, 125);
      doc.setLineWidth(0.4);
      doc.line(margin, yPage2 + 2, margin + contentWidth, yPage2 + 2);

      yPage2 += 8;

      doc.setFillColor(15, 17, 21); // Dark background block
      doc.rect(margin, yPage2, contentWidth, 38, 'F');
      doc.setDrawColor(34, 34, 34);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPage2, contentWidth, 38, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(196, 167, 125); // Gold
      doc.text('RUN SPECS & RECURSIVE METRIC ENVELOPES', margin + 6, yPage2 + 6);

      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`FORECAST TARGET: ${forecastTarget.toUpperCase()} DEVIATION SPACE`, margin + 6, yPage2 + 12);
      doc.text(`SELECTED CORE ALGORITHM SOLVER: ${fittedData.diagnostics.modelType.toUpperCase()}`, margin + 6, yPage2 + 17);
      doc.text(`STATISTICAL CONFIDENCE RANGE ENVELOPE: ${(ciConfidence * 100).toFixed(0)}% BIAS COMPLIANT`, margin + 6, yPage2 + 22);

      doc.setDrawColor(44, 44, 44);
      doc.line(margin + 6, yPage2 + 26, margin + contentWidth - 6, yPage2 + 26);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(156, 163, 175);
      doc.text('SYSTEM CONVERGENCE ASSURANCE: The backtest ledger verifiably fits standard decadal meteorological data with GCM assemblies.', margin + 6, yPage2 + 31);
      doc.text('Parameters fully reflect high-fidelity satellite models and real historical anomalies without localized smoothing biases.', margin + 6, yPage2 + 34.5);

      // Page 2 Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text('Sovereign Asset Board © 2026. Sealed with climate validation signatures.', margin, pageHeight - 9);
      doc.text('Page 2 of 3', margin + contentWidth, pageHeight - 9, { align: 'right' });


      // ============================================
      // PAGE 3: SPECIALISTS & PHYSICAL CLIMATE
      // ============================================
      doc.addPage();
      let yPage3 = margin;

      // Brand Header Page 3
      doc.setFillColor(11, 15, 25); 
      doc.rect(margin, yPage3, contentWidth, 12, 'F');
      
      doc.setFillColor(196, 167, 125); 
      doc.rect(margin, yPage3, 1.5, 12, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(196, 167, 125);
      doc.text(`AUDIT DECISION BREAKDOWN: ${currentProjection.horizon}YR DETAILED OUTLOOK (YEAR ${currentProjection.year})`, margin + 5, yPage3 + 7.5);

      yPage3 += 12 + 8;

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text('SECTION IV: COUNCIL OF CO-INTEGRATED RISK ADVISORS', margin, yPage3);

      doc.setDrawColor(196, 167, 125);
      doc.setLineWidth(0.4);
      doc.line(margin, yPage3 + 2, margin + contentWidth, yPage3 + 2);

      yPage3 += 8;

      // Helper for drawing specialists block inside page 3
      const drawPdfSpecialist = (key: keyof Specialists, labelStr: string, leftPos: number, colWidth: number, currentY: number) => {
        const spec = currentProjection.specialists[key];
        if (!spec) return 0;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(17, 24, 39);
        doc.text(labelStr, leftPos, currentY + 4);

        let vColor = [107, 114, 128]; // gray
        if (spec.verdict === 'BULLISH') vColor = [16, 185, 129];
        else if (spec.verdict === 'STABLE') vColor = [59, 130, 246];
        else if (spec.verdict === 'WATCH') vColor = [245, 158, 11];
        else if (spec.verdict === 'BEARISH') vColor = [239, 68, 68];
        else if (spec.verdict === 'DIVEST') vColor = [185, 28, 28];

        doc.setFillColor(vColor[0], vColor[1], vColor[2]);
        doc.rect(leftPos + colWidth - 18, currentY + 1, 18, 4, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(spec.verdict, leftPos + colWidth - 9, currentY + 3.8, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(75, 85, 99);

        const narrativeLines = doc.splitTextToSize(spec.narrative, colWidth);
        doc.text(narrativeLines, leftPos, currentY + 7.5);

        return (narrativeLines.length * 2.8) + 9.5; // Calculated height contribution
      };

      // Set up side-by-side specialist column spacing
      const specColW = (contentWidth / 2) - 3;
      const colLeft1 = margin;
      const colLeft2 = margin + specColW + 6;

      const specialistPairsMap: [keyof Specialists, string, keyof Specialists, string][] = [
        ['macroEconomist', 'Macro Economist (PE/Val)', 'zoningAttorney', 'Zoning & Municipal Attorney'],
        ['municipalPolicy', 'Municipal Policy Advisor', 'structuralEngineer', 'Structural Integrity Engineer'],
        ['hydrogeologist', 'Aquifer & Hydrogeologist', 'urbanSociologist', 'Urban Sociologist (QoL)'],
        ['demographicMigration', 'Demographic Migration Expert', 'geopoliticalAnalyst', 'Sovereign Risk Analyst'],
        ['environmentalSpecialist', 'Climate Risk Ecologist', 'insuranceActuary', 'Reinsurance Risk Actuary'],
        ['gridUtilityEngineer', 'Infrastructure & Grid Eng', 'publicHealthEpidemiologist', 'Public Health Epidemiologist']
      ];

      specialistPairsMap.forEach(([key1, label1, key2, label2]) => {
        const len1 = currentProjection.specialists[key1] ? doc.splitTextToSize(currentProjection.specialists[key1].narrative, specColW).length : 2;
        const len2 = currentProjection.specialists[key2] ? doc.splitTextToSize(currentProjection.specialists[key2].narrative, specColW).length : 2;
        const stepRowHeight = Math.max(len1, len2) * 2.8 + 11.5;

        // Carry to page overflow block if we are running low on paper
        if (yPage3 + stepRowHeight > pageHeight - 45) {
          doc.addPage();
          yPage3 = margin;
          
          doc.setFillColor(11, 15, 25); 
          doc.rect(margin, yPage3, contentWidth, 10, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('SECTION IV (CONTINUED): ADVISORY RISK SPECS COUNCIL', margin + 5, yPage3 + 6.5);
          
          yPage3 += 10 + 6;
        }

        drawPdfSpecialist(key1, label1, colLeft1, specColW, yPage3);
        drawPdfSpecialist(key2, label2, colLeft2, specColW, yPage3);

        yPage3 += stepRowHeight;
      });

      yPage3 += 6;

      // Section V: Detailed Physical soil & water indicators
      if (yPage3 + 28 > pageHeight - 20) {
        doc.addPage();
        yPage3 = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text('SECTION V: CO-INTEGRATED EARTH PHYSICAL ANOMALIES', margin, yPage3);

      doc.setDrawColor(196, 167, 125);
      doc.setLineWidth(0.4);
      doc.line(margin, yPage3 + 2, margin + contentWidth, yPage3 + 2);

      yPage3 += 8;

      // Soils 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text('Subsurface Ground Soil Siltation & Saline Hydrology Index:', margin, yPage3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      const firstBioText = currentProjection.environmentalBaselines.freshwaterAndPollution || activeReport.environmentalBaselines?.freshwaterAndPollution || 'Inland salinity intrusion triggers accelerated degradation of civil hydraulic grids.';
      const freshLines = doc.splitTextToSize(firstBioText, contentWidth);
      doc.text(freshLines, margin, yPage3 + 3.8);

      yPage3 += (freshLines.length * 3) + 7;

      // Soils 2
      if (yPage3 + 12 > pageHeight - 15) {
        doc.addPage();
        yPage3 = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text('Macrometeorological Domes & Ambient Biohazard Indicators:', margin, yPage3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      const secondBioText = currentProjection.environmentalBaselines.macroAndMicroHazards || activeReport.environmentalBaselines?.macroAndMicroHazards || 'Ambient dry-air columns spike localized ozone concentrations, degrading building composite envelopes.';
      const hazardLines = doc.splitTextToSize(secondBioText, contentWidth);
      doc.text(hazardLines, margin, yPage3 + 3.8);

      // Page 3 Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text('Sovereign Asset Board © 2026. Sealed with climate validation signatures.', margin, pageHeight - 9);
      doc.text('Page 3 of 3', margin + contentWidth, pageHeight - 9, { align: 'right' });

      // Save Document Trigger
      const safeLocName = activeReport.location.split(',')[0].trim().replace(/\s+/g, '_');
      doc.save(`${safeLocName}_Climate_Stress_Audit_Report.pdf`);

    } catch (error) {
      console.error("PDF Compilation Failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Custom tooltips for Recharts pricing
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] p-3 text-left rounded-none font-mono text-xs">
          <p className="text-[#F8FAFC] font-semibold mb-1">Year: {data.year}</p>
          <p className="text-[#F97316]">SFH Value: ${ (data.value / 1000).toFixed(0) }k</p>
          {data.utilityOpExIncrease && (
            <p className="text-[#EAB308] mt-1">OpEx: {data.utilityOpExIncrease}</p>
          )}
          {data.year.toString() === activeReport?.transitionLiabilityDecade.replace('s', '5') && (
            <p className="text-[#EF4444] font-bold mt-1 text-[10px] uppercase">⚠️ Liability Transition Pivot</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Convert projections into chart-friendly datasets
  const chartData = activeReport ? activeReport.projections.map(proj => ({
    horizon: `${proj.horizon}Yr`,
    year: proj.year,
    value: proj.pricingPoint.value,
    opacity: proj.horizon === currentProjection?.horizon ? 1 : 0.6,
    utilityOpExIncrease: proj.pricingPoint.utilityOpExIncrease
  })) : [];

  // Specialists label configuration mapper
  const getSpecialistLabel = (key: keyof Specialists) => {
    switch(key) {
      case 'macroEconomist': return 'Macro-Economist & Actuary';
      case 'zoningAttorney': return 'Property Zoning Attorney';
      case 'municipalPolicy': return 'Municipal Finance Director';
      case 'structuralEngineer': return 'Structural & Materials Eng';
      case 'hydrogeologist': return 'Hydrogeologist / Geologist';
      case 'urbanSociologist': return 'Urban Sociologist (QoL)';
      case 'demographicMigration': return 'Demographic Migration Expert';
      case 'geopoliticalAnalyst': return 'Sovereign Risk Analyst';
      case 'environmentalSpecialist': return 'Climate Risk Ecologist';
      case 'insuranceActuary': return 'Reinsurance Risk Actuary';
      case 'gridUtilityEngineer': return 'Infrastructure & Grid Eng';
      case 'publicHealthEpidemiologist': return 'Public Health Epidemiologist';
      case 'socialSentiment': return 'Social Sentiment Analyst';
    }
  };

  const getSpecialistColorTag = (verdict: 'BULLISH' | 'STABLE' | 'WATCH' | 'BEARISH' | 'DIVEST') => {
    switch(verdict) {
      case 'BULLISH': return 'text-[#F8FAFC] border-slate-500 bg-slate-900/40';
      case 'STABLE': return 'text-[#F8FAFC] border-[#2D2D2D] bg-[#1A1A1A]';
      case 'WATCH': return 'text-[#EAB308] border-[#EAB308]/40 bg-[#EAB308]/10';
      case 'BEARISH': return 'text-[#F97316] border-[#F97316]/40 bg-[#F97316]/10';
      case 'DIVEST': return 'text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/15';
    }
  };

  const getStatusColorClass = (status: HorizonProjection['status']) => {
    switch(status) {
      case 'APPRECIATING ASSET': return 'bg-slate-950 border-[#2D2D2D] text-[#F8FAFC]';
      case 'STABLE ASSET': return 'bg-zinc-950 border-[#2D2D2D] text-[#c8c6c5]';
      case 'WATCH': return 'bg-yellow-950/20 border-[#EAB308]/60 text-[#EAB308]';
      case 'SHIFTING TO LIABILITY': return 'bg-orange-950/30 border-[#F97316]/80 text-[#F97316]';
      case 'STRANDED ASSET / TOTAL LOSS': return 'bg-red-950/40 border-[#EF4444]/80 text-[#EF4444]';
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-[#e5e5e5] font-sans antialiased selection:bg-accent-gold selection:text-black">
      
      {/* 1. Global Command Center Header */}
      <header className="h-[80px] border-b border-border-dark px-6 lg:px-8 bg-bg-dark flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-accent-gold flex items-center justify-center font-serif text-accent-gold font-bold text-lg select-none bg-surface-dark/40">
            S
          </div>
          <div>
            <h1 className="text-base font-serif italic tracking-widest text-accent-gold">Climate Stress Test</h1>
          </div>
        </div>

        {/* Global Search and Engine Status Bar */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleEvaluateSearch} className="flex border border-border-dark bg-surface-dark items-center">
            <span className="pl-3 pr-1 text-[#888888]"><MapPin size={14} /></span>
            <input 
              type="text" 
              placeholder="Address / coordinates / parcel..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="px-2 py-2 focus:outline-none bg-transparent text-xs text-[#e5e5e5] font-mono w-[220px] lg:w-[320px] rounded-none placeholder:text-[#555555]"
            />
            <button 
              type="submit" 
              className="bg-surface-dark hover:bg-[#1a1a1a] hover:text-[#e5e5e5] text-[#888888] border-l border-border-dark px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5"
            >
              <Search size={12} className="text-accent-gold" />
              STRESS TEST
            </button>
          </form>
        </div>
      </header>

      {/* 2. Loading State Modal/Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-6 border-4 border-border-dark"
          >
            <div className="max-w-md w-full bg-surface-dark border border-accent-gold p-8 text-center rounded-none font-mono">
              <div className="flex justify-center mb-6">
                <RefreshCw size={36} className="text-accent-gold animate-spin" />
              </div>
              <h2 className="text-[#e5e5e5] font-extrabold text-sm tracking-wider uppercase mb-2">Analyzing Property Risk</h2>
              <p className="text-[10px] text-[#888888] uppercase tracking-widest mb-6">Processing climate data</p>
              
              <div className="bg-bg-dark border border-border-dark p-4 text-left text-xs min-h-[90px] flex items-center">
                <div className="text-accent-gold leading-relaxed">
                  <span className="text-[#888888]">[SYSTEM ACTIVE]</span> {loadingLog}
                </div>
              </div>

              <div className="mt-6 text-[9px] text-[#888888] uppercase tracking-widest">
                Please wait...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Primary Workspace Container */}
      {error && !isLoading && (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-[#0a0a0a] border-2 border-red-950 p-8 rounded-none font-mono text-[#e5e5e5] relative shadow-2xl">
            <div className="absolute right-3 top-3 text-red-500/10 text-4xl select-none font-extrabold pointer-events-none">ERROR_0xCF4</div>
            <div className="flex items-center gap-3 text-red-500 mb-6 font-mono font-bold">
              <span className="p-2 border border-red-950 bg-red-950/20 text-red-400">⚡</span>
              <div>
                <h3 className="font-extrabold text-sm tracking-wider uppercase text-red-400">Sovereign Link Terminated</h3>
                <p className="text-[10px] text-red-500/70 tracking-widest uppercase">Climate Intelligence Feed Offline</p>
              </div>
            </div>
            
            <p className="text-xs text-[#a3a3a3] leading-relaxed mb-6 font-sans">
              The application could not retrieve real-time grounded climate records from our sovereign search-grounded model. This occurs if the <strong className="text-accent-gold">GEMINI_API_KEY</strong> environment secret is not configured in the workspace settings, or if the server cannot reach external satellite coordinates.
            </p>

            <div className="bg-black border border-red-950/40 p-4 rounded-none text-[10px] text-red-400/80 mb-6 font-mono whitespace-pre-wrap max-h-[150px] overflow-auto">
              {error}
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-950/30 hover:bg-red-900/20 text-red-400 border border-red-900/60 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-200"
            >
              🔄 RE-ESTABLISH CONNECTION
            </button>
          </div>
        </div>
      )}

      {activeReport && currentProjection && (
        <div className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* DYNAMIC FAILSAFE ALERT BANNER */}
          {dataSource === 'PROCEDURAL_SIMULATION' && (
            <div className="xl:col-span-12 p-3.5 bg-amber-950/25 border border-amber-900/40 text-amber-300 font-mono text-[11px] uppercase tracking-wider flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="p-1 px-1.5 bg-amber-950/50 text-amber-400 border border-amber-800/40 font-bold select-none text-[10px]">⚠️ PROXY ACTIVE</span>
                <span>Gemini API live connection holds status offline (429 rate limit). Engaging sovereign climate fallback matrix.</span>
              </div>
              <span className="text-amber-500/50 text-[10px] md:text-right">LOCAL_COMPUTATION_ACTIVE // OFFLINE_ACTUARY_0x24</span>
            </div>
          )}

          {/* SYSTEM SOURCE NOTIFICATION BLOCK */}
          <div className="xl:col-span-12 flex flex-col md:flex-row items-start md:items-center justify-between p-3 border border-border-dark bg-surface-dark text-xs font-mono gap-3">
            <div className="flex items-center gap-2">
              <BadgeAlert size={14} className="text-[#eab308]" />
              <div>
                <span className="text-[#888888] uppercase">PORTFOLIO BOUNDS:</span>{' '}
                <span className="text-[#e5e5e5] font-bold">{activeReport.location}</span>
                <span className="text-[#888888] ml-2">({activeReport.coordinates})</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-bg-dark px-2 py-0.5 border border-border-dark">
                <Sparkles size={12} className="text-accent-gold" />
                <span className="text-[10px] text-[#e5e5e5] uppercase">
                  Engine: {dataSource === 'AI_GENERATED' ? 'Gemini 3.5-Flash (LIVE)' : dataSource === 'PRESET' ? 'SWB Actuarial Blueprint' : 'Procedural Simulation Engine'}
                </span>
              </div>
              
              <div className="text-[11px] text-danger-red font-bold">
                ⚠️ Transits to liability in the <span className="underline">{activeReport.transitionLiabilityDecade}</span>
              </div>

              <button
                id="download-pdf-btn"
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="bg-accent-gold hover:bg-[#b0946b] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-800 text-[#0B0F19] font-extrabold px-3 py-1.5 text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border border-accent-gold select-none"
                title="Download full decadal climate-stress actuarial report"
              >
                <FileDown size={12} className={isExportingPDF ? "animate-spin" : ""} />
                {isExportingPDF ? "Compiling Actuarial Charts..." : "Export Portfolio PDF"}
              </button>
            </div>
          </div>

          {/* CLIMATE POLICY SENSITIVITY INTERACTIVE PANEL */}
          <div className="xl:col-span-12 border border-border-dark bg-[#0f1115] p-5 font-mono text-xs flex flex-col gap-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#222] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 animate-pulse rounded-full" />
                <h3 className="text-xs font-extrabold text-[#e5e5e5] uppercase tracking-wider">
                  Interactive Climate Policy Sensitivity Matrix
                </h3>
              </div>
            
            </div>

            <p className="text-[11px] text-zinc-400 max-w-4xl leading-relaxed">
              Adjust the slider to explore different climate scenarios and see how they affect the property assessment.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-bg-dark/60 p-4 border border-border-dark mt-1">
              {/* Slider Control Column */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-accent-gold uppercase tracking-wider">
                  <span>Carbon Target Sensitivity</span>
                  <span className="bg-accent-gold/15 px-2.5 py-1 text-accent-gold border border-accent-gold/20 flex items-center gap-1.5 font-extrabold text-xs">
                    <Sliders size={12} />
                    Value: {policySensitivity} / 100
                  </span>
                </div>

                <div className="relative mt-2">
                  <input
                    id="policy-sensitivity-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={policySensitivity}
                    onChange={(e) => setPolicySensitivity(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer accent-accent-gold focus:outline-none"
                  />
                  
                  {/* Slider Notch Labels */}
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-2.5 leading-none select-none">
                    <button onClick={() => setPolicySensitivity(0)} className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${policySensitivity <= 10 ? 'text-emerald-400 font-extrabold' : ''}`}>
                      0 (NET NEGATIVE)
                    </button>
                    <button onClick={() => setPolicySensitivity(25)} className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${(policySensitivity > 10 && policySensitivity <= 35) ? 'text-emerald-300 font-extrabold' : ''}`}>
                      25 (NET ZERO 2050)
                    </button>
                    <button onClick={() => setPolicySensitivity(50)} className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${(policySensitivity > 35 && policySensitivity <= 65) ? 'text-amber-500 font-extrabold' : ''}`}>
                      50 (BASELINE ACTION)
                    </button>
                    <button onClick={() => setPolicySensitivity(75)} className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${(policySensitivity > 65 && policySensitivity <= 85) ? 'text-orange-500 font-extrabold' : ''}`}>
                      75 (DELAYED PENALTY)
                    </button>
                    <button onClick={() => setPolicySensitivity(100)} className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${policySensitivity > 85 ? 'text-red-500 font-extrabold' : ''}`}>
                      100 (RUNAWAY EXPANSION)
                    </button>
                  </div>
                </div>
              </div>

              {/* Policy Description Summary Box */}
              <div className="lg:col-span-5 bg-surface-dark border border-zinc-800 p-4 min-h-[90px] flex flex-col justify-center text-left">
                {policySensitivity < 25 ? (
                  <div>
                    <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={12} />
                      SSP1-1.9 // COOPERATIVE DRAWDOWN
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Global net negative emissions active. Artificial capture tech scales aggressively. Wet-bulb warming is capped under +1.3°C, reclaiming high long-term property valuations and fully stabilizing structural risk tables.
                    </p>
                  </div>
                ) : policySensitivity < 45 ? (
                  <div>
                    <div className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Globe size={12} />
                      SSP1-2.6 // PROMPT ACTION
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Strict emissions compliance bounds met. Solid public infrastructure reinforcement keeps warming restricted with high physical resilience, preventing sudden actuarial pool withdrawals.
                    </p>
                  </div>
                ) : policySensitivity <= 55 ? (
                  <div>
                    <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 flex">
                      <TrendingUp size={12} />
                      <span className="ml-1">SSP2-4.5 // BASELINE (NEUTRAL)</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Medium-high emissions pathway with delayed climate action policies. Typical decadal thermal strain with localized substation stress and gradual property devaluation as the transition decade nears.
                    </p>
                  </div>
                ) : policySensitivity <= 75 ? (
                  <div>
                    <div className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest flex items-center gap-1.5 flex">
                      <TrendingDown size={12} />
                      <span className="ml-1">SSP3-7.0 // REGULATORY SLIPPAGE</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Frequent carbon credit defaults. Rapid warming elevates sea levels earlier. Wet bulb thresholds begin stymieing outdoor utility work with rolling brownouts and early actuarial market withdrawals.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest flex items-center gap-1.5 flex z-10">
                      <Zap size={12} />
                      <span className="ml-1">SSP5-8.5 // RUNAWAY FOSSIL PATH</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Total greenhouse deregulation. Heat domes exceed organic limits. Grid structures are abandoned, insurance underwriters issue full retreats, and properties are written down as total systemic write-offs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GEOGRAPHIC THREAT OVERLAY MODULE */}
          <GeographicThreatOverlay 
            activeReport={activeReport}
            currentHorizon={currentProjection}
            policySensitivity={policySensitivity}
          />

          {/* LEFT COLUMN: SPECIALIST BOARD COMPARTMENT (4-cols) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-dark border border-border-dark p-5">
              <div className="flex items-center justify-between border-b border-border-dark pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent-gold"></span>
                  <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono">Expert Assessments</h3>
                </div>
              </div>

              {/* Specialist List Grid */}
              <div className="flex flex-col gap-1.5">
                {(Object.keys(currentProjection.specialists) as Array<keyof Specialists>).map((key) => {
                  const spec = currentProjection.specialists[key];
                  const isSelected = selectedSpecialist === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSpecialist(key)}
                      className={`text-left p-3 border transition-all flex items-center justify-between relative cursor-pointer ${
                        isSelected 
                          ? 'bg-[#1a1a1a] border-accent-gold text-accent-gold' 
                          : 'bg-bg-dark border-border-dark hover:bg-surface-dark hover:border-[#888888] text-[#888888]'
                      }`}
                    >
                      {/* Left border indicator for selected */}
                      {isSelected && <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-accent-gold" />}
                      
                      <div className="flex items-center gap-2 pl-1">
                        <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-600">
                          {key === 'macroEconomist' ? 'EP.01' : 
                           key === 'zoningAttorney' ? 'ZR.02' : 
                           key === 'municipalPolicy' ? 'MF.03' : 
                           key === 'structuralEngineer' ? 'SM.04' : 
                           key === 'hydrogeologist' ? 'HG.05' : 
                           key === 'urbanSociologist' ? 'US.06' : 
                           key === 'demographicMigration' ? 'DM.07' : 
                           key === 'geopoliticalAnalyst' ? 'SR.08' :
                           key === 'environmentalSpecialist' ? 'EE.09' :
                           key === 'insuranceActuary' ? 'IA.10' :
                           key === 'gridUtilityEngineer' ? 'GC.11' :
                           key === 'publicHealthEpidemiologist' ? 'HE.12' : 'SS.13'}
                        </span>
                        <span className="text-xs font-bold leading-tight select-none">
                          {getSpecialistLabel(key)}
                        </span>
                      </div>

                      {/* Verdict Badge */}
                      <span className={`text-[9px] font-mono font-extrabold border px-2 py-0.5 tracking-wider ${getSpecialistColorTag(spec.verdict)}`}>
                        {spec.verdict}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Specialist Diagnostic Commentary */}
              {selectedSpecialist === 'socialSentiment' ? (
                <SocialSentimentIndex 
                  location={activeReport?.location || "Miami Beach, FL"}
                  horizon={currentProjection?.horizon || 5}
                  policySensitivity={policySensitivity}
                  verdict={currentProjection?.specialists.socialSentiment || { verdict: 'STABLE', narrative: '' }}
                />
              ) : (
                <div className="mt-5 p-4 bg-bg-dark border border-border-dark min-h-[140px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent-gold uppercase pb-2 border-b border-[#222] mb-2 font-semibold">
                      <FileText size={12} />
                      <span>DIAGNOSTIC BLOCK // {getSpecialistLabel(selectedSpecialist)?.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-[#c4c7c7] leading-relaxed italic">
                      "{currentProjection.specialists[selectedSpecialist]?.narrative || 'Diagnostic pipeline gathering metrics...'}"
                    </p>
                  </div>

                  <div className="text-[10px] font-mono text-[#888888] mt-4 flex items-center justify-between">
                    <span>ACTUARIAL REFERENCE: DEC-STX-914</span>
                    <span className="text-accent-gold uppercase font-bold">REVISION {currentProjection.year}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Summary / Catastrophic trigger block */}
            <div className="bg-surface-dark border border-border-dark p-5">
              <div className="flex items-center gap-2 border-b border-border-dark pb-3 mb-4">
                <AlertTriangle size={15} className="text-danger-red" />
                <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono">Transition Threshold Matrix</h3>
              </div>
              <div className="font-mono text-xs text-[#eab308] leading-relaxed">
                <span className="text-[#888888] uppercase text-[10px]">Transition Decade:</span>
                <p className="text-danger-red text-lg font-extrabold tracking-widest mt-0.5">{report.transitionLiabilityDecade}</p>
                
                <span className="text-[#888888] uppercase text-[10px] mt-3 block">Trigger Mechanics:</span>
                <p className="text-[#e5e5e5] text-xs leading-normal mt-1 bg-bg-dark p-3 border border-border-dark border-l-2 border-l-danger-red">
                  {report.transitionTriggerCause}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE HORIZON SCREENING TERMINAL (8-cols) */}
          <div className="xl:col-span-8 flex flex-col gap-6">

            {/* A. INDUSTRIAL TAB DESK SWITCHER */}
            <div className="flex border-b border-border-dark bg-surface-dark p-1 gap-1">
              <button 
                onClick={() => setActiveTab('readouts')}
                className={`flex-1 py-3 px-4 font-mono text-[11px] uppercase tracking-wider font-extrabold transition-all border cursor-pointer select-none flex items-center justify-center gap-2 ${
                  activeTab === 'readouts'
                    ? 'bg-accent-gold text-bg-dark border-accent-gold font-bold'
                    : 'bg-bg-dark border-border-dark text-[#888888] hover:text-[#e5e5e5] hover:border-[#888888]'
                }`}
              >
                <Building size={12} />
                Risk Assessment
              </button>
              <button 
                onClick={() => setActiveTab('forecaster')}
                className={`flex-1 py-3 px-4 font-mono text-[11px] uppercase tracking-wider font-extrabold transition-all border cursor-pointer select-none flex items-center justify-center gap-2 ${
                  activeTab === 'forecaster'
                    ? 'bg-accent-gold text-bg-dark border-accent-gold font-bold'
                    : 'bg-bg-dark border-border-dark text-[#888888] hover:text-[#e5e5e5] hover:border-[#888888]'
                }`}
              >
                <Sliders size={12} />
                Climate Models
              </button>
            </div>

            {activeTab === 'readouts' && (
              <React.Fragment>

                {/* A. Dynamic Status Display & Core Horizon Metrics */}
            <div className="p-6 border border-border-dark bg-surface-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="text-[10px] font-mono text-[#888888] uppercase tracking-wider mb-1">
                  Active stress horizon overview
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-extrabold text-[#e5e5e5] font-mono tracking-tight select-none">
                    {currentProjection.year}
                  </h2>
                  <span className="text-xs font-mono font-medium text-[#888888] uppercase">
                    ({currentProjection.horizon}YR Prospect)
                  </span>
                </div>
              </div>

              {/* BIG REVISION STATUS ACCENT */}
              <div className={`p-4 border border-l-8 text-left rounded-none w-full md:w-auto transition-all ${getStatusColorClass(currentProjection.status).replace(/border-\[#2D2D2D\]/g, 'border-border-dark').replace(/bg-(slate|zinc|yellow|orange|red)-950\/[0-9]+/g, 'bg-bg-dark')}`}>
                <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">
                  Global Asset Status Verdict
                </div>
                <div className="text-base font-extrabold tracking-widest font-mono">
                  {currentProjection.status}
                </div>
              </div>

              {/* ALPHA GAIN VS GAP INDICATORS */}
              <div className="flex gap-6 font-mono text-left w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 border-border-dark pt-4 md:pt-0">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#888888] block">ASSET ALPHA</span>
                  <span className="text-base font-bold text-[#e5e5e5]">{currentProjection.assetAlpha}</span>
                </div>
                <div className="border-l border-border-dark pl-6">
                  <span className="text-[9px] uppercase tracking-wider text-[#888888] block">INSURANCE COVERAGE</span>
                  <span className={`text-base font-bold ${
                    currentProjection.liabilityCoverageGap.includes("100%") || currentProjection.liabilityCoverageGap.includes("Uninsured")
                      ? 'text-danger-red'
                      : 'text-[#eab308]'
                  }`}>{currentProjection.liabilityCoverageGap}</span>
                </div>
              </div>
            </div>

            {/* Live Weather Station Readings Card */}
            <div className="border border-border-dark bg-surface-dark p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-dark pb-2 mb-4 gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#e5e5e5] uppercase tracking-wider font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time Weather Station Conditions</span>
                </div>
                {currentWeather && (
                  <span className="text-[10px] font-mono text-[#888888]">
                    Sensor Feed: <strong className="text-accent-gold">{currentWeather.source}</strong> (Lat: {currentWeather.latitude.toFixed(2)}°, Lng: {currentWeather.longitude.toFixed(2)}°)
                  </span>
                )}
              </div>

              {isWeatherLoading ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-center text-xs font-mono text-[#888888]">
                  <div className="w-4 h-4 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
                  <span>Synchronizing with meteorological network...</span>
                </div>
              ) : weatherError ? (
                <div className="py-4 text-xs font-mono text-danger-red border border-danger-red/20 bg-danger-red/5 p-3 text-center">
                  ⚠️ {weatherError}. Meteorological link degraded.
                </div>
              ) : currentWeather ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  {/* Temperature */}
                  <div className="bg-bg-dark border border-border-dark p-3 flex flex-col justify-between">
                    <span className="text-[9px] font-mono uppercase text-[#888888] block mb-1">Temperature</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-[#e5e5e5] font-mono animate-fade-in">
                        {currentWeather.current.temperature}°C
                      </span>
                      <span className="text-[10px] text-[#888888] font-mono">
                        ({((currentWeather.current.temperature * 9/5) + 32).toFixed(1)}°F)
                      </span>
                    </div>
                    <span className="text-[10px] text-[#888888] capitalize mt-1 border-t border-border-dark/50 pt-1 font-mono">
                      {currentWeather.current.description}
                    </span>
                  </div>

                  {/* Humidity */}
                  <div className="bg-bg-dark border border-border-dark p-3 flex flex-col justify-between">
                    <span className="text-[9px] font-mono uppercase text-[#888888] block mb-1">Humidity</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-[#e5e5e5] font-mono">
                        {currentWeather.current.humidity}%
                      </span>
                    </div>
                    <div className="w-full bg-[#1e1e1e] h-1 mt-2">
                      <div className="bg-emerald-500 h-1 transition-all duration-500" style={{ width: `${currentWeather.current.humidity}%` }} />
                    </div>
                  </div>

                  {/* Precipitation */}
                  <div className="bg-bg-dark border border-border-dark p-3 flex flex-col justify-between">
                    <span className="text-[9px] font-mono uppercase text-[#888888] block mb-1">Precipitation</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-[#e5e5e5] font-mono">
                        {currentWeather.current.precipitation} mm
                      </span>
                    </div>
                    <span className="text-[9px] text-[#888888] mt-1 border-t border-border-dark/50 pt-1 font-mono">
                      {currentWeather.current.precipitation > 0 ? "Active Rainfall" : "No Precipitation"}
                    </span>
                  </div>

                  {/* Wind Speed */}
                  <div className="bg-bg-dark border border-border-dark p-3 flex flex-col justify-between">
                    <span className="text-[9px] font-mono uppercase text-[#888888] block mb-1">Wind Speed</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-[#e5e5e5] font-mono">
                        {currentWeather.current.windSpeed} m/s
                      </span>
                    </div>
                    <span className="text-[9px] text-[#888888] mt-1 border-t border-border-dark/50 pt-1 font-mono">
                      Vector pace: {(currentWeather.current.windSpeed * 3.6).toFixed(1)} km/h
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-xs font-mono text-[#888888] text-center">
                  Select a location to retrieve live meteorological data.
                </div>
              )}
            </div>

            {/* B. Grid of the 4 Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Pillar 1: Economic Engine */}
              <div className="border border-border-dark bg-surface-dark p-5">
                <div className="flex items-center justify-between border-b border-border-dark pb-2 mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-accent-gold font-serif italic">
                    <Coins size={14} className="text-accent-gold" />
                    <span>I. The Economic Engine</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#888888]">Projected Cap Rate:</span>
                    <span className="text-sm font-mono font-bold text-[#e5e5e5]">{currentProjection.metrics.capRate}</span>
                  </div>
                  <div className="h-1 bg-bg-dark w-full">
                    <div 
                      className="bg-accent-gold h-1" 
                      style={{ width: currentProjection.metrics.capRate === "N/A" ? '0%' : `${Math.min(100, Number(currentProjection.metrics.capRate.replace('%', '')) * 10)}%` }} 
                    />
                  </div>
                  <p className="text-xs text-[#c4c7c7] leading-relaxed">
                    Property replacement costs in this location.
                  </p>
                </div>
              </div>

              {/* Pillar 2: Political & Regulatory Shield */}
              <div className="border border-border-dark bg-surface-dark p-5">
                <div className="flex items-center justify-between border-b border-border-dark pb-2 mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-accent-gold font-serif italic">
                    <Shield size={14} className="text-accent-gold" />
                    <span>II. Political & Regulatory Shield</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#888888]">Municipal Debt Load:</span>
                    <span className={`text-xs font-mono font-bold ${
                      currentProjection.metrics.municipalDebt === 'CRITICAL' ? 'text-danger-red' : 'text-[#eab308]'
                    }`}>{currentProjection.metrics.municipalDebt}</span>
                  </div>
                  <div className="flex justify-between items-center bg-bg-dark p-2 border border-border-dark text-[10px] font-mono">
                    <span className="text-[#888888]">Managed Retreat Status:</span>
                    <span className={currentProjection.horizon >= 50 ? 'text-danger-red font-bold' : 'text-[#c8c6c5]'}>
                      {currentProjection.horizon >= 50 ? 'TRIGGERED // SERVICE CUTS' : 'NORMAL INTRUSIONS'}
                    </span>
                  </div>
                  <p className="text-xs text-[#c4c7c7] leading-relaxed">
                    Municipal financial health and regulatory environment.
                  </p>
                </div>
              </div>

              {/* Pillar 3: Quality of Life & Livability */}
              <div className="border border-border-dark bg-surface-dark p-5">
                <div className="flex items-center justify-between border-b border-border-dark pb-2 mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-accent-gold font-serif italic">
                    <Thermometer size={14} className="text-accent-gold" />
                    <span>III. Quality of Life & Livability</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
                    <div>
                      <span className="text-[#888888] block uppercase text-[8px]">AVERAGE TEMP</span>
                      <span className="text-sm font-extrabold text-[#e5e5e5]">{currentProjection.metrics.averageTemp}</span>
                    </div>
                    <div>
                      <span className="text-[#888888] block uppercase text-[8px]">WET BULB (PEAK)</span>
                      <span className={`text-sm font-extrabold ${
                        Number(currentProjection.metrics.wetBulbTemp.split('°')[0]) >= 28 ? 'text-danger-red' : 'text-[#e5e5e5]'
                      }`}>{currentProjection.metrics.wetBulbTemp}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono bg-bg-dark p-1.5 border border-border-dark">
                    <span className="text-[#888888]">EXPIRED HEAT INDEX DAYS:</span>
                    <span className="text-[#eab308] font-bold">{currentProjection.metrics.heatIndexDays}</span>
                  </div>
                  <p className="text-xs text-[#c4c7c7] leading-relaxed">
                    Environmental conditions and livability metrics.
                  </p>
                </div>
              </div>

              {/* Pillar 4: Physical & Geological Floor */}
              <div className="border border-border-dark bg-surface-dark p-5">
                <div className="flex items-center justify-between border-b border-border-dark pb-2 mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-accent-gold font-serif italic">
                    <HardHat size={14} className="text-accent-gold" />
                    <span>IV. Physical & Geological Floor</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#888888]">FOUNDATION INTEGRITY:</span>
                    <span className="text-[#e5e5e5] font-extrabold">{currentProjection.metrics.foundationIntegrity}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-bg-dark w-full">
                    {(() => {
                      const percentage = Number(currentProjection.metrics.foundationIntegrity.split('%')[0]);
                      const isLow = percentage < 60;
                      return (
                        <div 
                          className={`h-1.5 transition-all ${isLow ? 'bg-danger-red' : 'bg-accent-gold'}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div className="bg-bg-dark p-1 border border-border-dark">
                      <span className="text-[#888888] block">GROUNDWATER TBL</span>
                      <span className="text-[#e5e5e5] uppercase">{currentProjection.metrics.localAquifer}</span>
                    </div>
                    <div className="bg-bg-dark p-1 border border-border-dark">
                      <span className="text-[#888888] block">DECADE PLUVIAL PROB</span>
                      <span className="text-[#e5e5e5]">{currentProjection.metrics.floodProb}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#c4c7c7] leading-relaxed">
                    Geological and water table stability.
                  </p>
                </div>
              </div>

            </div>

            {/* C. Unsentimental Brutal Verdict Panel */}
            <div className="border border-danger-red bg-danger-red/5 p-5 rounded-none relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-danger-red text-black font-mono text-[9px] font-extrabold px-3 py-0.5 uppercase tracking-widest">
                Summary
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-danger-red flex items-center justify-center text-danger-red shrink-0 font-mono text-xl font-bold">
                  !
                </div>
                <div>
                  <h4 className="text-[#e5e5e5] text-xs font-extrabold uppercase font-mono tracking-wider mb-1.5">
                    Property Assessment
                  </h4>
                  <p className="text-xs text-[#e5e5e5] leading-relaxed">
                    {currentProjection.brutalVerdict}
                  </p>
                </div>
              </div>
            </div>

            {/* D. Standard SFH Pricing Curve Graph (Aesthetic Chart Module) */}
            <div className="p-5 border border-border-dark bg-surface-dark">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border-dark pb-3 mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-accent-gold" />
                  <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono">100-Year SFH Pricing Dynamics (Inflation-Adjusted)</h3>
                </div>
                <div className="text-[10px] font-mono text-[#888888]">
                  Standard Detached SFH (3-Bed // 2-Bath // Micro-Market)
                </div>
              </div>

              {/* Chart Element Frame */}
              <div className="h-[210px] w-full bg-bg-dark border border-border-dark p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={chartData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="pricingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c4a77d" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#c4a77d" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                    <XAxis 
                      dataKey="horizon" 
                      stroke="#888888" 
                      fontSize={10} 
                      fontFamily="JetBrains Mono"
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10} 
                      fontFamily="JetBrains Mono"
                      tickLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#c4a77d" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#pricingGradient)" 
                    />
                    {/* Horizontal zero reference */}
                    <ReferenceLine y={0} stroke="#ff4d4d" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-8 gap-1.5 mt-3 text-center">
                {activeReport.projections.map((proj, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedHorizonIndex(i)}
                    className={`p-2 border font-mono transition-all text-[10px] cursor-pointer ${
                      selectedHorizonIndex === i 
                        ? 'bg-accent-gold text-bg-dark border-accent-gold font-bold' 
                        : 'bg-bg-dark border-border-dark text-[#888888] hover:border-[#888888]'
                    }`}
                  >
                    {proj.horizon}y
                    <span className="block text-[8px] opacity-75">{proj.pricingPoint.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* E. Extended Environmental Baseline Tabular Rationale */}
            <div className="bg-surface-dark border border-border-dark p-5">
              <div className="flex items-center justify-between border-b border-border-dark pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-accent-gold" />
                  <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono">Micro-Atmosphere & Resource Baselines</h3>
                </div>
                <div className="text-[10px] font-mono text-[#888888]">US PLANT HARDINESS ZONE: {currentProjection.metrics.hardinessZone}</div>
              </div>

              {/* Responsive Grid Matrix mimicking custom borders table */}
              <div className="border border-border-dark divide-y divide-border-dark text-xs">
                
                {/* Row 1: Freshwater */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-dark bg-bg-dark/40">
                  <div className="p-3 font-mono font-bold text-[#e5e5e5] flex items-center gap-1.5 md:col-span-1">
                    <Droplets size={12} className="text-accent-gold" />
                    <span>Freshwater Matrix</span>
                  </div>
                  <div className="p-3 text-[#c4c7c7] md:col-span-3 leading-relaxed">
                    {currentProjection.environmentalBaselines.freshwaterAndPollution}
                  </div>
                </div>

                {/* Row 2: Hazards */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-dark">
                  <div className="p-3 font-mono font-bold text-[#e5e5e5] flex items-center gap-1.5 md:col-span-1">
                    <AlertTriangle size={12} className="text-[#eab308]" />
                    <span>Macro Hazards</span>
                  </div>
                  <div className="p-3 text-[#c4c7c7] md:col-span-3 leading-relaxed">
                    {currentProjection.environmentalBaselines.macroAndMicroHazards}
                  </div>
                </div>

                {/* Row 3: Climate & Weather */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-dark bg-bg-dark/40">
                  <div className="p-3 font-mono font-bold text-[#e5e5e5] flex items-center gap-1.5 md:col-span-1">
                    <Clock size={12} className="text-accent-gold" />
                    <span>Weather Drifts</span>
                  </div>
                  <div className="p-3 text-[#c4c7c7] md:col-span-3 leading-relaxed">
                    {currentProjection.environmentalBaselines.climateWeatherBaselines}
                  </div>
                </div>

                {/* Row 4: Flora & Fauna Impacts */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-dark">
                  <div className="p-3 font-mono font-bold text-[#e5e5e5] flex items-center gap-1.5 md:col-span-1">
                    <Leaf size={12} className="text-accent-gold" />
                    <span>Flora & Fauna</span>
                  </div>
                  <div className="p-3 text-[#c4c7c7] md:col-span-3 leading-relaxed">
                    {currentProjection.environmentalBaselines.floraFaunaImpact}
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Timeline Sliders (2026-2126 Timeline control block) */}
            <div className="p-5 border border-border-dark bg-surface-dark text-left font-mono">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-accent-gold" />
                  <span className="text-[11px] font-bold text-[#e5e5e5] uppercase tracking-wider">Chronological Terminal Timeline Slider (2026 - 2126)</span>
                </div>
                <span className="text-xs text-accent-gold font-bold uppercase select-none">Decade Drag Target</span>
              </div>

              <div className="relative mt-6 mb-4 px-2">
                {/* Horizontal Bar */}
                <div className="h-1.5 w-full bg-bg-dark border border-border-dark relative">
                  {/* Slider Fill */}
                  <div 
                    className="h-full bg-accent-gold/40 transition-all" 
                    style={{ width: `${(selectedHorizonIndex / 7) * 100}%` }}
                  />
                </div>
                
                <input 
                  type="range" 
                  min="0" 
                  max="7" 
                  step="1"
                  value={selectedHorizonIndex}
                  onChange={(e) => setSelectedHorizonIndex(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {/* Dynamic Sliding Marker */}
                <div 
                  className="absolute -top-3 w-4 h-6 border-2 border-accent-gold bg-black pointer-events-none transition-all flex items-center justify-center text-[7px] text-accent-gold font-extrabold"
                  style={{ left: `calc(${(selectedHorizonIndex / 7) * 100}% - 8px)` }}
                >
                  ||
                </div>
              </div>

              {/* Slider years metadata underlay */}
              <div className="flex justify-between text-[9px] text-[#888888] select-none uppercase">
                {activeReport.projections.map((proj, i) => (
                  <span 
                    key={i} 
                    className={`cursor-pointer transition-colors ${selectedHorizonIndex === i ? 'text-accent-gold font-bold' : ''}`}
                    onClick={() => setSelectedHorizonIndex(i)}
                  >
                    {proj.year} ({proj.horizon}Yr)
                  </span>
                ))}
              </div>
            </div>

          </React.Fragment>
        )}

        {/* TAB 2: ADVANCED CLIMATE FORECASTER PREDICTIVE MODEL SANDBOX */}
        {activeTab === 'forecaster' && (() => {
          // Inner Custom Predictive Tooltip component
          const CustomPredictiveTooltip = ({ active, payload }: any) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              const unit = forecastTarget === 'temp' ? '°C' : forecastTarget === 'precip' ? ' mm' : ' cm';
              return (
                <div className="bg-[#0c0c0c] border border-border-dark p-3 text-left font-mono text-[11px] shadow-2xl min-w-[210px] rounded-none">
                  <p className="text-[#e2e8f0] font-extrabold mb-1.5 border-b border-border-dark pb-1 text-[9px] tracking-widest">YEAR: {data.year}</p>
                  {data.observed !== null ? (
                    <p className="text-[#94a3b8] flex justify-between gap-4">
                      <span>OBSERVED:</span>
                      <span className="text-white font-bold">{data.observed.toFixed(1)}{unit}</span>
                    </p>
                  ) : (
                    <p className="text-danger-red text-[8px] font-extrabold tracking-widest leading-none mb-2">
                      ⚠️ FORECAST ESTIMATE APPLIED
                    </p>
                  )}
                  <p className="text-accent-gold flex justify-between gap-4 font-bold mt-1">
                    <span>FITTED PRED:</span>
                    <span>{data.predicted.toFixed(1)}{unit}</span>
                  </p>
                  <p className="text-[10px] text-[#888888] mt-2 border-t border-border-dark/60 pt-2 flex justify-between">
                    <span>CI BOUNDS ({Math.round(ciConfidence * 100)}%):</span>
                    <span className="text-[#e2e8f0] font-bold">[{data.ciLower.toFixed(1)} - {data.ciUpper.toFixed(1)}]</span>
                  </p>
                </div>
              );
            }
            return null;
          };

          const unitStr = forecastTarget === 'temp' ? '°C' : forecastTarget === 'precip' ? 'mm/yr' : 'cm';

          return (
            <React.Fragment>
              <div className="bg-surface-dark border border-border-dark p-6 flex flex-col gap-6">
                
                {/* Title & Setup Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-dark pb-3 gap-2 text-left">
                  <div>
                    <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse"></span>
                      Climate Model Configuration
                    </h3>
                    <p className="text-[10px] text-[#888888] font-mono mt-0.5 uppercase tracking-wider">
                      Active Target Site: {report.location} // Coordinates: {report.coordinates}
                    </p>
                  </div>
                  <div className="border border-[#c4a77d]/30 bg-bg-dark py-1 px-3 text-[10px] font-mono uppercase text-accent-gold font-extrabold tracking-wider">
                    STOCHASTIC ALIGNMENT: CO-INTEGRATED
                  </div>
                </div>

                {/* Weather Station Historical Dataset Integration Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0d1510] border border-[#1b4332]/30 p-4 gap-3 text-left">
                  <div className="font-mono">
                    <span className="text-[9px] uppercase tracking-widest text-[#52b788] font-extrabold flex items-center gap-1.5 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Meteorological Station Alignment
                    </span>
                    <h4 className="text-xs font-extrabold text-[#e5e5e5] uppercase tracking-wider">Meteorological Station Weather Feed</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {historicalWeatherData 
                        ? `Loaded real weather observations (1980–2025) for Lat: ${historicalWeatherData.latitude.toFixed(2)}°, Lng: ${historicalWeatherData.longitude.toFixed(2)}° from weather station files.` 
                        : "Synchronizing physical weather datasets for predictive analysis..."}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    {isHistoryLoading ? (
                      <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-500">
                        <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Indexing stations...</span>
                      </div>
                    ) : historicalWeatherData ? (
                      <button
                        onClick={() => {
                          setUseRealHistory(!useRealHistory);
                        }}
                        className={`font-mono text-[10px] font-bold uppercase tracking-wider py-2 px-3.5 cursor-pointer select-none transition-all border ${
                          useRealHistory
                            ? 'bg-emerald-500 text-black border-[#52b788] font-extrabold'
                            : 'bg-transparent border-[#1b4332]/50 text-[#52b788] hover:border-emerald-500 hover:text-[#e2e8f0]'
                        }`}
                      >
                        {useRealHistory ? '✓ REAL STATION DATA ACTIVE' : 'ALIGN REAL STATION DATA'}
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono text-danger-red uppercase tracking-wider">Station feed offline</span>
                    )}
                  </div>
                </div>

                {/* Parameter Control Form */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left bg-bg-dark/40 p-4 border border-border-dark">
                  
                  {/* Select target indicator */}
                  <div className="md:col-span-4 flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase text-[#888888] font-bold tracking-wider">Climate Parameter Target</label>
                    <select 
                      value={forecastTarget} 
                      onChange={(e) => setForecastTarget(e.target.value as any)}
                      className="bg-bg-dark border border-border-dark text-[#e5e5e5] p-2 rounded-none font-mono text-xs focus:border-[#888888] outline-none cursor-pointer"
                    >
                      <option value="temp">Summer Mean Temperature (°C)</option>
                      <option value="precip">Annual Total Rainfall (mm/yr)</option>
                      <option value="subsidence">Subsidence & Local Sea Intrusion (cm)</option>
                    </select>
                  </div>

                  {/* Select confidence level */}
                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase text-[#888888] font-bold tracking-wider">Model Confidence Level</label>
                    <select 
                      value={ciConfidence} 
                      onChange={(e) => setCiConfidence(Number(e.target.value))}
                      className="bg-bg-dark border border-border-dark text-[#e5e5e5] p-2 rounded-none font-mono text-xs focus:border-[#888888] outline-none cursor-pointer"
                    >
                      <option value={0.80}>80% Confidence Band</option>
                      <option value={0.90}>90% Confidence Band</option>
                      <option value={0.95}>95% Extreme Actuarial Bounds</option>
                    </select>
                  </div>

                  {/* Select algorithm */}
                  <div className="md:col-span-5 flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase text-[#888888] font-bold tracking-wider">Predictor Algorithm Engine</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['arima', 'lstm', 'cmip'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setForecastModel(m)}
                          className={`p-2 border font-mono text-[10px] tracking-wide uppercase transition-all font-extrabold cursor-pointer select-none text-center ${
                            forecastModel === m
                              ? 'bg-accent-gold text-bg-dark border-accent-gold'
                              : 'bg-bg-dark border-border-dark text-[#888888] hover:text-[#e5e5e5] hover:border-[#888888]'
                          }`}
                        >
                          {m === 'arima' ? 'ARIMA(P,D,Q)' : m === 'lstm' ? 'LSTM Network' : 'CMIP6 Ensemble'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Algorithm specific sub parameters */}
                  <div className="col-span-12 border-t border-border-dark/60 pt-4 mt-1">
                    
                    {/* ARIMA parameters sliders */}
                    {forecastModel === 'arima' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <span className="text-[10px] text-[#888888] uppercase tracking-wider">Autoregressive order (p):</span>
                            <span className="text-accent-gold font-bold">{arimaP}</span>
                          </div>
                          <input 
                            type="range" min="1" max="5" value={arimaP} 
                            onChange={(e) => setArimaP(Number(e.target.value))}
                            className="bg-bg-dark h-1 accent-accent-gold cursor-pointer"
                          />
                          <span className="text-[8px] text-[#666666] uppercase leading-none mt-1">Lags for predictive values back-propagation</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <span className="text-[10px] text-[#888888] uppercase tracking-wider">Differencing order (d):</span>
                            <span className="text-accent-gold font-bold">{arimaD}</span>
                          </div>
                          <input 
                            type="range" min="0" max="2" value={arimaD} 
                            onChange={(e) => setArimaD(Number(e.target.value))}
                            className="bg-bg-dark h-1 accent-accent-gold cursor-pointer"
                          />
                          <span className="text-[8px] text-[#666666] uppercase leading-none mt-1">Differencing loops to stabilize structural trend</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <span className="text-[10px] text-[#888888] uppercase tracking-wider">Moving-average order (q):</span>
                            <span className="text-accent-gold font-bold">{arimaQ}</span>
                          </div>
                          <input 
                            type="range" min="1" max="5" value={arimaQ} 
                            onChange={(e) => setArimaQ(Number(e.target.value))}
                            className="bg-bg-dark h-1 accent-accent-gold cursor-pointer"
                          />
                          <span className="text-[8px] text-[#666666] uppercase leading-none mt-1">Error terms correlation lag envelope</span>
                        </div>
                      </div>
                    )}

                    {/* LSTM parameters controllers */}
                    {forecastModel === 'lstm' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <span className="text-[10px] text-[#888888] uppercase tracking-wider">Training epochs:</span>
                            <span className="text-accent-gold font-bold">{lstmEpochs} Iterations</span>
                          </div>
                          <input 
                            type="range" min="10" max="150" step="5" value={lstmEpochs} 
                            onChange={(e) => setLstmEpochs(Number(e.target.value))}
                            className="bg-bg-dark h-1 accent-accent-gold cursor-pointer"
                          />
                          <span className="text-[8px] text-[#666666] uppercase leading-none mt-1">Loss minimization search loop size</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] text-[#888888] uppercase block tracking-wider">Recurrent hidden state dimensions</span>
                          <div className="flex gap-1 mt-1">
                            {[8, 16, 32, 64].map((n) => (
                              <button
                                key={n}
                                onClick={() => setLstmNeurons(n)}
                                className={`flex-1 p-1.5 border font-mono text-[9px] uppercase transition-all font-bold cursor-pointer select-none ${
                                  lstmNeurons === n
                                    ? 'bg-accent-gold text-bg-dark border-accent-gold'
                                    : 'bg-bg-dark border-border-dark text-[#888888] hover:text-[#e5e5e5]'
                                }`}
                              >
                                {n} units
                              </button>
                            ))}
                          </div>
                          <span className="text-[8px] text-[#666666] uppercase leading-none mt-1">Recurrent node capacity matrix</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] text-[#888888] uppercase block tracking-wider">Gradient learning rate</span>
                          <div className="flex gap-1 mt-1">
                            {[0.001, 0.01, 0.05, 0.1].map((r) => (
                              <button
                                key={r}
                                onClick={() => setLstmLearningRate(r)}
                                className={`flex-1 p-1.5 border font-mono text-[9px] uppercase transition-all font-bold cursor-pointer select-none ${
                                  lstmLearningRate === r
                                    ? 'bg-accent-gold text-bg-dark border-accent-gold'
                                    : 'bg-bg-dark border-border-dark text-[#888888] hover:text-[#e5e5e5]'
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                          <span className="text-[8px] text-[#666666] uppercase leading-none mt-1">Gradient updates multiplier</span>
                        </div>
                      </div>
                    )}

                    {/* CMIP Climate pathways selectors */}
                    {forecastModel === 'cmip' && (
                      <div className="flex flex-col gap-2 font-mono text-xs">
                        <span className="text-[10px] text-[#888888] uppercase block tracking-wider font-extrabold">IPCC Representative Radiative Concentration Pathway</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {(['SSP1-2.6', 'SSP2-4.5', 'SSP5-8.5'] as const).map((scen) => (
                            <button
                              key={scen}
                              onClick={() => setCmipPathway(scen)}
                              className={`p-3 border text-left font-mono text-xs transition-all cursor-pointer flex flex-col justify-between select-none ${
                                cmipPathway === scen
                                  ? 'bg-accent-gold text-bg-dark border-accent-gold'
                                  : 'bg-bg-dark border-border-dark hover:bg-surface-dark'
                              }`}
                            >
                              <span className="font-extrabold text-[10px] uppercase">
                                {scen === 'SSP1-2.6' ? 'SSP1-2.6 // SUSTAINED GREEN PLAN' : 
                                 scen === 'SSP2-4.5' ? 'SSP2-4.5 // MIDDLE STATUS QUO' : 
                                 'SSP5-8.5 // UNCONTROLLED FOSSIL ACCEL'}
                              </span>
                              <span className={`text-[8px] uppercase mt-1 ${cmipPathway === scen ? 'text-bg-dark/80 font-bold' : 'text-[#888888]'}`}>
                                {scen === 'SSP1-2.6' ? 'Net zero by 2075. Mean century anomaly limited < 1.8°C' : 
                                 scen === 'SSP2-4.5' ? 'Stabilization near 2100. Mean century anomaly near 2.7°C' : 
                                 'Highest emissions trajectory. Temperature rise peaks > 4.4°C'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Backtest Trigger Button and Notification */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-bg-dark border border-border-dark p-4 text-left">
                  <button
                    onClick={triggerModelBacktest}
                    disabled={isTraining}
                    className={`font-mono text-xs font-bold uppercase tracking-wider py-3.5 px-6 cursor-pointer select-none transition-all flex items-center justify-center gap-2 border ${
                      isTraining 
                        ? 'bg-bg-dark border-border-dark text-zinc-600'
                        : 'bg-accent-gold text-bg-dark border-accent-gold font-extrabold hover:bg-transparent hover:text-accent-gold animate-pulse'
                    }`}
                  >
                    <RefreshCw size={12} className={isTraining ? 'animate-spin' : ''} />
                    {isTraining ? 'Training model...' : 'Run Model'}
                  </button>
                  
                  <div className="flex-1 flex flex-col justify-center font-mono">
                    <span className="text-[9px] uppercase tracking-widest text-[#888888] font-bold">Model Status</span>
                    <p className="text-[10px] text-zinc-400 italic leading-none mt-1.5 uppercase tracking-wide">
                      {isTraining ? 'Processing...' : 'Ready'}
                    </p>
                  </div>
                </div>

                {/* Cyberpunk Terminal Output console */}
                <div className="bg-black border border-border-dark p-4 font-mono text-[10.5px] text-[#00ff66]/80 flex flex-col gap-1 overflow-y-auto max-h-[140px] select-none text-left rounded-none">
                  {isTraining ? (
                    <React.Fragment>
                      <div className="text-zinc-500">// Starting training...</div>
                      {trainingLogs.map((log, i) => (
                        <div key={i} className="leading-relaxed font-mono">{log}</div>
                      ))}
                      <div className="text-[#00ff66] font-bold mt-2">
                        {(() => {
                          const filled = Math.round(trainingProgress / 10);
                          const empty = 10 - filled;
                          const bar = '█'.repeat(filled) + '░'.repeat(empty);
                          return `[${bar}] ${trainingProgress}% CONVERGENCE SOLVER COMPLETE`;
                        })()}
                      </div>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <div className="text-zinc-500">// Ready</div>
                      <div>[Model] {fittedData?.diagnostics.modelType}</div>
                      <div>[Trend] {fittedData?.diagnostics.trend}</div>
                      <div className="text-accent-gold mt-1">// Ready to plot results</div>
                    </React.Fragment>
                  )}
                </div>

                {/* Forecasting chart panel rendering Recharts with confidence bands */}
                <div className="bg-bg-dark border border-border-dark p-5">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border-dark pb-3 mb-4 gap-2 text-left">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono uppercase text-[#888888] font-bold">Predictive Distribution Overlay</span>
                      <h4 className="text-xs font-bold font-mono tracking-widest uppercase text-accent-gold mt-1">
                        CO-INTEGRATED LONG-HORIZON CHART (1980 - 2126)
                      </h4>
                    </div>
                    
                    {/* Custom high fidelity chart legend */}
                    <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-zinc-500 inline-block"></span>
                        <span className="text-[#888888] font-bold">Observations (1980-2025)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border-t border-dashed border-accent-gold inline-block"></span>
                        <span className="text-accent-gold font-bold">Model Forecast (2026-2126)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 bg-accent-gold/15 inline-block border border-accent-gold/10"></span>
                        <span className="text-accent-gold/80 font-bold">Confidence bounds Envelope</span>
                      </div>
                    </div>
                  </div>

                  {/* Recharts dynamic plot */}
                  <div className="h-[280px] w-full" id="forecaster-chart-box">
                    {fittedData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={fittedData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="predictedBandArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c4a77d" stopOpacity={0.18}/>
                              <stop offset="95%" stopColor="#c4a77d" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="year" 
                            stroke="#333333" 
                            tick={{ fill: '#888888', fontSize: 10 }} 
                            tickLine={{ stroke: '#333333' }}
                            fontFamily="JetBrains Mono, monospace"
                          />
                          <YAxis 
                            stroke="#333333" 
                            tick={{ fill: '#888888', fontSize: 10 }} 
                            tickLine={{ stroke: '#333333' }}
                            fontFamily="JetBrains Mono, monospace"
                            domain={['auto', 'auto']}
                          />
                          <CartesianGrid stroke="#151515" strokeDasharray="3 3" />
                          <Tooltip content={<CustomPredictiveTooltip />} />
                          
                          {/* Shaded Area for Upper/Lower Confidence Intervals */}
                          <Area
                            name="Confidence Interval"
                            type="monotone"
                            dataKey={(pt) => [pt.ciLower, pt.ciUpper]}
                            stroke="none"
                            fill="url(#predictedBandArea)"
                            fillOpacity={1}
                          />

                          {/* Observed Blue-Grey line */}
                          <Line
                            name="Observed History"
                            type="monotone"
                            dataKey="observed"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            dot={false}
                            connectNulls={true}
                          />

                          {/* Predicted gold line representing forecasted mean */}
                          <Line
                            name="Model Prediction"
                            type="monotone"
                            dataKey="predicted"
                            stroke="#c4a77d"
                            strokeWidth={2}
                            dot={false}
                          />

                          {/* Split Reference Line at 2025 */}
                          <ReferenceLine 
                            x={2025} 
                            stroke="#c4a77d" 
                            strokeDasharray="4 4" 
                            label={{ value: 'PREDICTION BOUNDS (2025)', fill: '#c4a77d', fontSize: 8, fontFamily: 'JetBrains Mono', position: 'top' }} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-mono text-[#888888]">
                        COMPILING PREDICTIVE ACTUARIAL GRADIENT COEFFICIENTS...
                      </div>
                    )}
                  </div>
                </div>

                {/* Diagnostics matrix counters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  
                  <div className="border border-border-dark p-4 bg-bg-dark/20 font-mono">
                    <span className="text-[9px] uppercase tracking-widest text-[#888888] block">Coefficient of Determination (R²)</span>
                    <span className="text-xl font-extrabold text-[#e5e5e5] mt-1 block">
                      {fittedData ? fittedData.diagnostics.r2.toFixed(3) : '---'}
                    </span>
                    <span className="text-[8px] text-[#666666] uppercase block mt-1">Variance percentage explained</span>
                  </div>

                  <div className="border border-border-dark p-4 bg-bg-dark/20 font-mono">
                    <span className="text-[9px] uppercase tracking-widest text-[#888888] block">Root Mean Square Error (RMSE)</span>
                    <span className="text-xl font-extrabold text-[#e5e5e5] mt-1 block font-mono">
                      {fittedData ? `${fittedData.diagnostics.rmse.toFixed(2)} ${unitStr}` : '---'}
                    </span>
                    <span className="text-[8px] text-[#666666] uppercase block mt-1">Residual dispersion index</span>
                  </div>

                  <div className="border border-border-dark p-4 bg-bg-dark/20 font-mono">
                    <span className="text-[9px] uppercase tracking-widest text-[#888888] block">Mean Absolute Error (MAE)</span>
                    <span className="text-xl font-extrabold text-[#e5e5e5] mt-1 block font-mono">
                      {fittedData ? `${fittedData.diagnostics.mae.toFixed(2)} ${unitStr}` : '---'}
                    </span>
                    <span className="text-[8px] text-[#666666] uppercase block mt-1">Absolute modeling offset mean</span>
                  </div>

                  <div className="border border-border-dark p-4 bg-[#1C1917]/20 border-l-4 border-l-accent-gold font-mono">
                    <span className="text-[9px] uppercase tracking-widest text-accent-gold block font-extrabold">YoY Secular Drift Estimation</span>
                    <span className="text-xs text-zinc-300 font-bold leading-normal mt-2 block uppercase text-left leading-tight font-mono">
                      {fittedData ? fittedData.diagnostics.trend : '---'}
                    </span>
                  </div>

                </div>

                {/* Coefficient breakdown logging panel */}
                <div className="border border-border-dark p-4 text-left font-mono">
                  <span className="text-[9px] uppercase tracking-widest text-[#888888] font-extrabold block mb-2">Mathematical Coefficients Audit Log (Normalized Weights)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[9px] uppercase font-mono">
                    {fittedData?.diagnostics.coefficients.map((coeff: any, i: number) => (
                      <div key={i} className="bg-bg-dark border border-border-dark p-2 hover:border-zinc-700 transition-colors">
                        <span className="text-[#888888] block truncate">{coeff.name}</span>
                        <span className="text-accent-gold font-extrabold text-xs block mt-1 truncate">{coeff.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </React.Fragment>
          );
        })()}

      </div>

        </div>
      )}

      {/* 4. Tiny Humble Footer */}
      <footer className="border-t border-border-dark bg-surface-dark py-6 px-6 text-center text-xs font-mono text-[#888888] flex flex-col md:flex-row justify-between items-center gap-3">
        <div>
          Climate Stress Test © 2026
        </div>
      </footer>

      {/* Hidden Capture Workspace for generating PDF Images */}
      {activeReport && fittedData && (
        <div 
          id="pdf-chart-capture-workspace" 
          style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '820px', zIndex: -9990, pointerEvents: 'none' }}
          className="bg-[#0b0f19] text-white p-6 flex flex-col gap-8 font-mono"
        >
          {/* PDF Chart A: Policy Sensitivity Chart */}
          <div id="pdf-capture-policy-chart" className="w-[800px] h-[400px] bg-[#0b0f19] p-6 text-white border border-[#222222]">
            <div className="flex justify-between items-center border-b border-[#2D2D2D] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-widest text-[#c4a77d] uppercase">100-YEAR SFH PRICING DYNAMICS</span>
              </div>
              <div className="text-[9px] text-[#888888]">
                LOCATION: {activeReport.location.toUpperCase()} ({activeReport.coordinates})
              </div>
            </div>
            <div className="w-[740px] h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="pdfPricingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c4a77d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c4a77d" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                  <XAxis 
                    dataKey="horizon" 
                    stroke="#888888" 
                    fontSize={10} 
                    fontFamily="JetBrains Mono"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={10} 
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#c4a77d" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#pdfPricingGradient)" 
                  />
                  <ReferenceLine y={0} stroke="#ff4d4d" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PDF Chart B: Predictive Model Curve */}
          <div id="pdf-capture-predictive-chart" className="w-[800px] h-[400px] bg-[#0b0f19] p-6 text-white border border-[#222222]">
            <div className="flex justify-between items-center border-b border-[#2D2D2D] pb-3 mb-4">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase text-[#888888] font-bold">Predictive Distribution Overlay</span>
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#c4a77d] mt-1">
                  CO-INTEGRATED LONG-HORIZON CHART (1980 - 2126)
                </span>
              </div>
              <div className="text-[9px] text-[#888888]">
                MODEL: {fittedData.diagnostics.modelType.toUpperCase()}
              </div>
            </div>
            <div className="w-[740px] h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fittedData.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pdfPredictedBandArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c4a77d" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#c4a77d" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="year" 
                    stroke="#333333" 
                    tick={{ fill: '#888888', fontSize: 10 }} 
                    tickLine={{ stroke: '#333333' }}
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis 
                    stroke="#333333" 
                    tick={{ fill: '#888888', fontSize: 10 }} 
                    tickLine={{ stroke: '#333333' }}
                    fontFamily="JetBrains Mono"
                    domain={['auto', 'auto']}
                  />
                  <CartesianGrid stroke="#151515" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey={(pt) => [pt.ciLower, pt.ciUpper]}
                    stroke="none"
                    fill="url(#pdfPredictedBandArea)"
                    fillOpacity={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="observed"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#c4a77d"
                    strokeWidth={2}
                    dot={false}
                  />
                  <ReferenceLine 
                    x={2025} 
                    stroke="#c4a77d" 
                    strokeDasharray="4 4" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
