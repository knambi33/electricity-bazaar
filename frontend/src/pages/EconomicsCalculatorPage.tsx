import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingDown, 
  Download, 
  Printer, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  DollarSign,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { LandedCostInputs, LandedCostOutputs, StateRegulatoryProfile } from '../types';

export const EconomicsCalculatorPage: React.FC = () => {
  // Configurable Inputs with defaults matching Tamil Nadu launch customer benchmark
  const [selectedStatePreset, setSelectedStatePreset] = useState<string>('Tamil Nadu');
  const [commercialModel, setCommercialModel] = useState<'GROUP_CAPTIVE' | 'THIRD_PARTY_OPEN_ACCESS' | 'IEX_EXCHANGE'>('GROUP_CAPTIVE');
  const [annualConsumptionKwh, setAnnualConsumptionKwh] = useState<number>(10200000); // 10.2 MU / yr
  const [currentLandedTariff, setCurrentLandedTariff] = useState<number>(8.75); // ₹8.75/kWh
  const [proposedEnergyTariff, setProposedEnergyTariff] = useState<number>(3.70); // ₹3.70/kWh
  const [contractedGreenSharePercent, setContractedGreenSharePercent] = useState<number>(85);

  // Market Intermediation & Exchange Fees (IEX Specific)
  const [exchangeFeePs, setExchangeFeePs] = useState<number>(2.0); // 2 ps / kWh base
  const [traderMarginPs, setTraderMarginPs] = useState<number>(2.0); // Min 2 ps / kWh floor
  const [ctuPOCChargePerKwh, setCtuPOCChargePerKwh] = useState<number>(0.38); // Inter-state CTU POC

  // Network & Regulatory Surcharges
  const [transmissionChargePerKwh, setTransmissionChargePerKwh] = useState<number>(0.34);
  const [wheelingChargePerKwh, setWheelingChargePerKwh] = useState<number>(0.88);
  const [crossSubsidySurchargePerKwh, setCrossSubsidySurchargePerKwh] = useState<number>(0.0); // 0 for Group Captive
  const [additionalSurchargePerKwh, setAdditionalSurchargePerKwh] = useState<number>(0.0);
  const [bankingChargesPerKwh, setBankingChargesPerKwh] = useState<number>(0.28);
  const [stuLossPercent, setStuLossPercent] = useState<number>(3.9);
  const [ctuLossPercent, setCtuLossPercent] = useState<number>(0.0);
  const [baseSldcChargePerKwh, setBaseSldcChargePerKwh] = useState<number>(0.05);

  // Output
  const [results, setResults] = useState<LandedCostOutputs | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Load state preset charges
  const applyStatePreset = async (
    stateName: string, 
    model: 'GROUP_CAPTIVE' | 'THIRD_PARTY_OPEN_ACCESS' | 'IEX_EXCHANGE' = commercialModel
  ) => {
    setSelectedStatePreset(stateName);
    setCommercialModel(model);
    try {
      const profile = await api.getStateRates(stateName);
      const vData = profile.voltageLevels[0];

      setCurrentLandedTariff(vData.typicalIndustrialTariffRsPerKwh);
      const isCaptive = model === 'GROUP_CAPTIVE';
      const isIex = model === 'IEX_EXCHANGE';

      if (isIex) {
        if (proposedEnergyTariff === 3.70 || proposedEnergyTariff === 4.50) {
          setProposedEnergyTariff(4.20);
        }
        setCtuLossPercent(3.2);
        setCtuPOCChargePerKwh(0.38);
      } else {
        if (model === 'GROUP_CAPTIVE' && (proposedEnergyTariff === 4.20 || proposedEnergyTariff === 4.50)) {
          setProposedEnergyTariff(3.70);
        }
        if (model === 'THIRD_PARTY_OPEN_ACCESS' && (proposedEnergyTariff === 4.20 || proposedEnergyTariff === 3.70)) {
          setProposedEnergyTariff(4.50);
        }
        setCtuLossPercent(0);
        setCtuPOCChargePerKwh(0);
      }

      setTransmissionChargePerKwh(profile.transmissionChargeRsPerKwh);
      setWheelingChargePerKwh(vData.wheelingChargeRsPerKwh);
      setCrossSubsidySurchargePerKwh(isCaptive ? 0 : vData.crossSubsidySurchargeRsPerKwh);
      setAdditionalSurchargePerKwh(isCaptive ? 0 : profile.additionalSurchargeRsPerKwh);
      setBankingChargesPerKwh(profile.bankingChargesRsPerKwh);
      setStuLossPercent(vData.stuTransmissionLossPercent);
      setBaseSldcChargePerKwh(profile.sldcChargesRsPerKwh);
    } catch (err) {
      console.error("Failed to load preset", err);
    }
  };

  const runCalculation = async () => {
    setIsCalculating(true);
    try {
      const isIex = commercialModel === 'IEX_EXCHANGE';
      const isCaptive = commercialModel === 'GROUP_CAPTIVE';
      
      // IEX Fee: 2 ps/kWh (₹0.0200) + 18% GST (₹0.0036) = ₹0.0236/kWh
      const iexWithGst = isIex ? ((exchangeFeePs / 100) * 1.18) : 0;
      // Trader Margin: min 2 ps/kWh + 18% GST
      const traderWithGst = isIex ? ((traderMarginPs / 100) * 1.18) : 0;
      
      const totalTransmission = transmissionChargePerKwh + (isIex ? ctuPOCChargePerKwh : 0);
      const totalSldcAndIntermediation = baseSldcChargePerKwh + iexWithGst + traderWithGst;
      const effectiveBanking = isIex ? 0 : bankingChargesPerKwh;
      const effectiveCtuLoss = isIex ? 3.2 : ctuLossPercent;

      const inputs: LandedCostInputs = {
        annualConsumptionKwh,
        currentLandedTariff,
        proposedEnergyTariff,
        transmissionChargePerKwh: totalTransmission,
        wheelingChargePerKwh,
        crossSubsidySurchargePerKwh: isCaptive ? 0 : crossSubsidySurchargePerKwh,
        additionalSurchargePerKwh: isCaptive ? 0 : additionalSurchargePerKwh,
        bankingChargesPerKwh: effectiveBanking,
        stuLossPercent,
        ctuLossPercent: effectiveCtuLoss,
        sldcAndSchedulingChargePerKwh: totalSldcAndIntermediation,
        contractedGreenSharePercent
      };
      const res = await api.evaluateLandedCost(inputs);
      setResults(res);
    } catch (err: any) {
      console.error(`Calculation error: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // Run on mount and parameter changes
  useEffect(() => {
    runCalculation();
  }, [
    commercialModel,
    annualConsumptionKwh,
    currentLandedTariff,
    proposedEnergyTariff,
    transmissionChargePerKwh,
    wheelingChargePerKwh,
    crossSubsidySurchargePerKwh,
    additionalSurchargePerKwh,
    bankingChargesPerKwh,
    stuLossPercent,
    ctuLossPercent,
    baseSldcChargePerKwh,
    exchangeFeePs,
    traderMarginPs,
    ctuPOCChargePerKwh,
    contractedGreenSharePercent
  ]);

  const exportCsv = () => {
    if (!results) return;
    const isIex = commercialModel === 'IEX_EXCHANGE';
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Parameter,Value,Unit\n" +
      `Commercial Structure,${commercialModel},Model\n` +
      `Annual Consumption,${annualConsumptionKwh},kWh\n` +
      `Current Landed Tariff,${currentLandedTariff},INR/kWh\n` +
      `Proposed Energy Tariff / MCP,${proposedEnergyTariff},INR/kWh\n` +
      (isIex ? `IEX Exchange Fee (with 18% GST),${((exchangeFeePs / 100) * 1.18).toFixed(4)},INR/kWh\n` : '') +
      (isIex ? `Trader Margin (with 18% GST),${((traderMarginPs / 100) * 1.18).toFixed(4)},INR/kWh\n` : '') +
      `Contracted Sourcing Share,${contractedGreenSharePercent},%\n` +
      `Blended Landed Tariff,${results.blendedLandedTariffPerKwh},INR/kWh\n` +
      `Cost Difference,${results.costDifferencePerKwh},INR/kWh\n` +
      `Annual Savings,${results.annualSavingsInr},INR\n` +
      `Savings Percentage,${results.savingsPercentage},%\n` +
      `Break-even PPA Tariff,${results.breakEvenEnergyTariffPerKwh},INR/kWh\n` +
      `Loss Gross-up Multiplier,${results.effectiveLossFactor},x\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Electricity_Bazaar_Economics_${selectedStatePreset}_${commercialModel}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
            <Calculator className="w-3.5 h-3.5" />
            <span>Tariff Modeling & Sensitivity</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 brand-font">
            Procurement Economics Calculator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compute true landed costs for Third-Party Open Access and Group Captive arrangements with accurate loss gross-ups.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCsv}
            disabled={!results}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* State Presets Quick Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
          Pre-Loaded SERC Regulatory Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Tamil Nadu', label: 'Tamil Nadu (TNERC) — Pilot' },
            { name: 'Telangana', label: 'Telangana (TSERC) — Pilot' },
            { name: 'Puducherry', label: 'Puducherry (JERC / PED) — Pilot' },
            { name: 'Gujarat', label: 'Gujarat (GERC)' },
            { name: 'Maharashtra', label: 'Maharashtra (MERC)' },
            { name: 'Rajasthan', label: 'Rajasthan (RERC)' }
          ].map(preset => (
            <button
              key={preset.name}
              onClick={() => applyStatePreset(preset.name, commercialModel)}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                selectedStatePreset === preset.name
                  ? 'bg-navy-900 text-teal-300 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Structure Toggle: Group Captive vs Third Party vs IEX Power Exchange */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Commercial Model:</span>
        <div className="inline-flex p-1 bg-slate-200 rounded-xl text-xs font-bold gap-1 flex-wrap">
          <button
            onClick={() => applyStatePreset(selectedStatePreset, 'GROUP_CAPTIVE')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              commercialModel === 'GROUP_CAPTIVE' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Group Captive (0 CSS & 0 AS)
          </button>
          <button
            onClick={() => applyStatePreset(selectedStatePreset, 'THIRD_PARTY_OPEN_ACCESS')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              commercialModel === 'THIRD_PARTY_OPEN_ACCESS' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Third-Party Open Access (Full CSS)
          </button>
          <button
            onClick={() => applyStatePreset(selectedStatePreset, 'IEX_EXCHANGE')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              commercialModel === 'IEX_EXCHANGE' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            IEX Power Exchange (DAM/RTM)
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs + Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configurable Inputs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Procurement Inputs</span>
            <Sliders className="w-4 h-4 text-teal-600" />
          </h2>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Annual Consumption (kWh)
            </label>
            <input
              type="number"
              value={annualConsumptionKwh}
              onChange={(e) => setAnnualConsumptionKwh(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {(annualConsumptionKwh / 1000000).toFixed(2)} Million Units (MU) / annum
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Current Utility Landed Tariff (₹/kWh)
            </label>
            <input
              type="number"
              step="0.05"
              value={currentLandedTariff}
              onChange={(e) => setCurrentLandedTariff(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              {commercialModel === 'IEX_EXCHANGE' ? 'IEX Market Clearing Price (MCP) (₹/kWh)' : 'Proposed Generation Ex-Bus Tariff (₹/kWh)'}
            </label>
            <input
              type="number"
              step="0.05"
              value={proposedEnergyTariff}
              onChange={(e) => setProposedEnergyTariff(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {commercialModel === 'IEX_EXCHANGE' ? 'Average Day-Ahead / Real-Time clearing price on IEX' : 'Ex-busbar generation tariff from IPP/SPV'}
            </span>
          </div>

          {/* IEX & Electricity Trader Intermediation (with 18% GST) */}
          {commercialModel === 'IEX_EXCHANGE' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/60">
                <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">
                  Exchange & Trader Intermediation (18% GST)
                </span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                  +18% GST Mandated
                </span>
              </div>

              {/* IEX Exchange Fee */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-[11px] font-bold text-slate-700">IEX Exchange Fee</span>
                  <span className="text-xs font-mono font-bold text-blue-800">
                    {exchangeFeePs.toFixed(1)} ps/u + 18% GST = ₹{((exchangeFeePs / 100) * 1.18).toFixed(4)}/kWh
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Base: ₹{(exchangeFeePs / 100).toFixed(4)}/kWh • 18% GST: ₹{((exchangeFeePs / 100) * 0.18).toFixed(4)}/kWh
                </div>
              </div>

              {/* Trader Margin */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-[11px] font-bold text-slate-700">Electricity Trader Margin</span>
                  <span className="text-xs font-mono font-bold text-blue-800">
                    {traderMarginPs.toFixed(1)} ps/u + 18% GST = ₹{((traderMarginPs / 100) * 1.18).toFixed(4)}/kWh
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="8.0"
                  step="0.5"
                  value={traderMarginPs}
                  onChange={(e) => setTraderMarginPs(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-blue-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>2.0 ps (Min Floor)</span>
                  <span>4.0 ps (Standard)</span>
                  <span>8.0 ps</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Base: ₹{(traderMarginPs / 100).toFixed(4)}/kWh • 18% GST: ₹{((traderMarginPs / 100) * 0.18).toFixed(4)}/kWh
                </div>
              </div>

              {/* Combined Intermediation Total */}
              <div className="p-2 bg-white rounded-lg border border-blue-200 text-[11px] flex justify-between font-bold text-navy-950">
                <span>Total Trading & Exchange Intermediation:</span>
                <span className="text-blue-700 font-mono">₹{(((exchangeFeePs + traderMarginPs) / 100) * 1.18).toFixed(4)} / kWh</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {commercialModel === 'IEX_EXCHANGE' ? 'Exchange Procurement Share' : 'Renewable Replacement Share'}
              </label>
              <span className="text-xs font-bold text-teal-700">{contractedGreenSharePercent}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={contractedGreenSharePercent}
              onChange={(e) => setContractedGreenSharePercent(parseInt(e.target.value))}
              className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Collapsible/Granular Regulatory Network Surcharges */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-navy-900">SERC Network Charges & Surcharges</h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500">Transmission (₹/u)</label>
                <input
                  type="number"
                  step="0.01"
                  value={transmissionChargePerKwh}
                  onChange={(e) => setTransmissionChargePerKwh(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500">Wheeling (₹/u)</label>
                <input
                  type="number"
                  step="0.01"
                  value={wheelingChargePerKwh}
                  onChange={(e) => setWheelingChargePerKwh(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500">Cross-Subsidy (CSS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={crossSubsidySurchargePerKwh}
                  onChange={(e) => setCrossSubsidySurchargePerKwh(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500">Addl. Surcharge (AS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={additionalSurchargePerKwh}
                  onChange={(e) => setAdditionalSurchargePerKwh(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500">Banking Fee (₹/u)</label>
                <input
                  type="number"
                  step="0.01"
                  value={bankingChargesPerKwh}
                  onChange={(e) => setBankingChargesPerKwh(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500">STU Loss (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={stuLossPercent}
                  onChange={(e) => setStuLossPercent(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Outputs, Waterfall & Sensitivity Table */}
        <div className="lg:col-span-2 space-y-6">
          {results && (
            <>
              {/* Top Banner KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Proposed Blended Tariff
                  </span>
                  <div className="text-3xl font-black text-navy-900 mt-1">
                    ₹{results.blendedLandedTariffPerKwh.toFixed(2)}
                    <span className="text-xs font-normal text-slate-400"> / kWh</span>
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Spread: <strong className="text-teal-600">₹{results.costDifferencePerKwh.toFixed(2)} / unit</strong>
                  </span>
                </div>

                <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-navy-950 rounded-2xl p-5 shadow-lg">
                  <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                    Net Annual Cost Savings
                  </span>
                  <div className="text-3xl font-black mt-1">
                    ₹{(results.annualSavingsInr / 10000000).toFixed(2)} Cr
                  </div>
                  <span className="text-xs font-bold block mt-0.5">
                    {results.savingsPercentage.toFixed(1)}% Annual Expenditure Reduction
                  </span>
                </div>

                <div className="bg-navy-900 text-white rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                    Break-even PPA Tariff
                  </span>
                  <div className="text-3xl font-black text-white mt-1">
                    ₹{results.breakEvenEnergyTariffPerKwh.toFixed(2)}
                    <span className="text-xs font-normal text-slate-300"> / kWh</span>
                  </div>
                  <span className="text-[11px] text-slate-300 mt-0.5 block">
                    Max viable PPA rate before savings equal 0
                  </span>
                </div>
              </div>

              {/* Itemized Delivered Cost Breakdown Waterfall */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                      Itemized Landed Cost Breakdown
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      commercialModel === 'GROUP_CAPTIVE' 
                        ? 'bg-teal-100 text-teal-800' 
                        : commercialModel === 'IEX_EXCHANGE' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {commercialModel === 'GROUP_CAPTIVE' 
                        ? 'Group Captive SPV' 
                        : commercialModel === 'IEX_EXCHANGE' 
                        ? 'IEX Power Exchange' 
                        : 'Third-Party Open Access'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    Loss Multiplier: {results.effectiveLossFactor}x
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Row 1: Energy / MCP Base */}
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">
                      {commercialModel === 'IEX_EXCHANGE' 
                        ? `IEX Clearing Price (MCP grossed up for CTU 3.2% + STU ${stuLossPercent}% losses)`
                        : `Base Energy Tariff (Grossed up for STU ${stuLossPercent}% loss)`}
                    </span>
                    <span className="font-semibold text-slate-900">₹{results.openAccessEnergyTariffGrossedUp.toFixed(4)} / kWh</span>
                  </div>

                  {/* Row 2: IEX Fee (Only for IEX) */}
                  {commercialModel === 'IEX_EXCHANGE' && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">IEX Exchange Fee (2.0 ps/kWh + 18% GST)</span>
                      <span className="font-semibold text-slate-900">₹{((exchangeFeePs / 100) * 1.18).toFixed(4)} / kWh</span>
                    </div>
                  )}

                  {/* Row 3: Trader Margin (Only for IEX) */}
                  {commercialModel === 'IEX_EXCHANGE' && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Electricity Trader Margin ({traderMarginPs.toFixed(1)} ps/kWh + 18% GST)</span>
                      <span className="font-semibold text-slate-900">₹{((traderMarginPs / 100) * 1.18).toFixed(4)} / kWh</span>
                    </div>
                  )}

                  {/* Row 4: CTU POC Transmission (Only for IEX) */}
                  {commercialModel === 'IEX_EXCHANGE' && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Inter-State CTU (POC) Transmission Charges</span>
                      <span className="font-semibold text-slate-900">₹{ctuPOCChargePerKwh.toFixed(4)} / kWh</span>
                    </div>
                  )}

                  {/* Row 5: STU Transmission & Wheeling */}
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">
                      {commercialModel === 'IEX_EXCHANGE' ? 'Intra-State (STU) Transmission & Wheeling Charges' : 'State Transmission & Wheeling Charges'}
                    </span>
                    <span className="font-semibold text-slate-900">
                      ₹{(transmissionChargePerKwh + wheelingChargePerKwh).toFixed(4)} / kWh
                    </span>
                  </div>

                  {/* Row 6: Cross-Subsidy Surcharge (CSS) */}
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Cross-Subsidy Surcharge (CSS)</span>
                    <span className={`font-semibold ${commercialModel === 'GROUP_CAPTIVE' ? 'text-teal-600' : 'text-slate-900'}`}>
                      {commercialModel === 'GROUP_CAPTIVE' 
                        ? '₹0.0000 (Statutory Exemption)' 
                        : `₹${crossSubsidySurchargePerKwh.toFixed(4)} / kWh`}
                    </span>
                  </div>

                  {/* Row 7: Additional Surcharge (AS) */}
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Additional Surcharge (AS)</span>
                    <span className={`font-semibold ${commercialModel === 'GROUP_CAPTIVE' ? 'text-teal-600' : 'text-slate-900'}`}>
                      {commercialModel === 'GROUP_CAPTIVE' 
                        ? '₹0.0000 (Exempt)' 
                        : `₹${additionalSurchargePerKwh.toFixed(4)} / kWh`}
                    </span>
                  </div>

                  {/* Row 8: Banking & SLDC */}
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">
                      {commercialModel === 'IEX_EXCHANGE' 
                        ? 'NLDC / RLDC / SLDC Operating & Scheduling Charges' 
                        : 'Banking Charges & SLDC Scheduling'}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {commercialModel === 'IEX_EXCHANGE' 
                        ? `₹${baseSldcChargePerKwh.toFixed(4)} / kWh`
                        : `₹${(bankingChargesPerKwh + baseSldcChargePerKwh).toFixed(4)} / kWh`}
                    </span>
                  </div>

                  {/* Total 100% Landed Cost */}
                  <div className="flex justify-between py-2.5 bg-slate-50 font-bold text-slate-900 px-3 rounded-lg border border-slate-200 mt-2">
                    <span>Total 100% {commercialModel === 'IEX_EXCHANGE' ? 'IEX Exchange' : commercialModel === 'GROUP_CAPTIVE' ? 'Group Captive' : 'Open Access'} Landed Cost</span>
                    <span className="text-teal-700 text-sm">₹{results.totalOpenAccessLandedCostPerKwh.toFixed(2)} / kWh</span>
                  </div>
                </div>
              </div>

              {/* Annual Expenditure Comparison */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                  Annual Expenditure Comparison
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Current Grid Annual Electricity Spend</span>
                      <span className="text-slate-900">₹{(results.existingAnnualExpenditureInr / 10000000).toFixed(2)} Crores</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full w-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-teal-700">
                        Proposed Sourcing Expenditure ({commercialModel === 'GROUP_CAPTIVE' ? 'Group Captive' : commercialModel === 'IEX_EXCHANGE' ? 'IEX Power Exchange' : 'Third-Party Open Access'})
                      </span>
                      <span className="text-teal-700">₹{(results.proposedAnnualExpenditureInr / 10000000).toFixed(2)} Crores</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, Math.min(100, (results.proposedAnnualExpenditureInr / results.existingAnnualExpenditureInr) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sensitivity Analysis Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Tariff Sensitivity Analysis (+/- 10% Variations)</span>
                  <span className="text-[10px] text-slate-500 normal-case font-normal">Deterministic simulation across PPA rates</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-bold">Scenario</th>
                        <th className="py-2.5 px-3 font-bold">PPA Tariff (₹/u)</th>
                        <th className="py-2.5 px-3 font-bold">Blended Landed (₹/u)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Est. Annual Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.sensitivityAnalysis.map((s, idx) => (
                        <tr key={idx} className={s.scenario.includes('Base') ? 'bg-teal-50/60 font-bold' : ''}>
                          <td className="py-2 px-3 text-slate-800">{s.scenario}</td>
                          <td className="py-2 px-3">₹{s.proposedEnergyTariff.toFixed(2)}</td>
                          <td className="py-2 px-3">₹{s.blendedLandedTariff.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-teal-700 font-bold">
                            ₹{(s.annualSavingsInr / 100000).toFixed(2)} Lakhs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assumptions & Disclaimers */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2 text-xs text-slate-600">
                <div className="flex items-center space-x-2 font-bold text-slate-800">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Important Modeling Assumptions & Regulatory Disclaimers</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-slate-500">
                  {results.assumptions.map((assump, idx) => (
                    <li key={idx}>{assump}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
