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
  const [annualConsumptionKwh, setAnnualConsumptionKwh] = useState<number>(10200000); // 10.2 MU / yr
  const [currentLandedTariff, setCurrentLandedTariff] = useState<number>(8.75); // ₹8.75/kWh
  const [proposedEnergyTariff, setProposedEnergyTariff] = useState<number>(3.70); // ₹3.70/kWh
  const [contractedGreenSharePercent, setContractedGreenSharePercent] = useState<number>(85);

  // Network & Regulatory Surcharges
  const [transmissionChargePerKwh, setTransmissionChargePerKwh] = useState<number>(0.34);
  const [wheelingChargePerKwh, setWheelingChargePerKwh] = useState<number>(0.88);
  const [crossSubsidySurchargePerKwh, setCrossSubsidySurchargePerKwh] = useState<number>(0.0); // 0 for Group Captive
  const [additionalSurchargePerKwh, setAdditionalSurchargePerKwh] = useState<number>(0.0);
  const [bankingChargesPerKwh, setBankingChargesPerKwh] = useState<number>(0.28);
  const [stuLossPercent, setStuLossPercent] = useState<number>(3.9);
  const [ctuLossPercent, setCtuLossPercent] = useState<number>(0.0);
  const [sldcAndSchedulingChargePerKwh, setSldcAndSchedulingChargePerKwh] = useState<number>(0.05);

  // Output
  const [results, setResults] = useState<LandedCostOutputs | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGroupCaptiveMode, setIsGroupCaptiveMode] = useState(true);

  // Load state preset charges
  const applyStatePreset = async (stateName: string, isCaptive: boolean = true) => {
    setSelectedStatePreset(stateName);
    setIsGroupCaptiveMode(isCaptive);
    try {
      const profile = await api.getStateRates(stateName);
      const vData = profile.voltageLevels[0];

      setCurrentLandedTariff(vData.typicalIndustrialTariffRsPerKwh);
      setTransmissionChargePerKwh(profile.transmissionChargeRsPerKwh);
      setWheelingChargePerKwh(vData.wheelingChargeRsPerKwh);
      setCrossSubsidySurchargePerKwh(isCaptive ? 0 : vData.crossSubsidySurchargeRsPerKwh);
      setAdditionalSurchargePerKwh(isCaptive ? 0 : profile.additionalSurchargeRsPerKwh);
      setBankingChargesPerKwh(profile.bankingChargesRsPerKwh);
      setStuLossPercent(vData.stuTransmissionLossPercent);
      setCtuLossPercent(0);
      setSldcAndSchedulingChargePerKwh(profile.sldcChargesRsPerKwh);
    } catch (err) {
      console.error("Failed to load preset", err);
    }
  };

  const runCalculation = async () => {
    setIsCalculating(true);
    try {
      const inputs: LandedCostInputs = {
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
        sldcAndSchedulingChargePerKwh,
        contractedGreenSharePercent
      };
      const res = await api.evaluateLandedCost(inputs);
      setResults(res);
    } catch (err: any) {
      alert(`Calculation error: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // Run on mount and parameter changes
  useEffect(() => {
    runCalculation();
  }, [
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
    sldcAndSchedulingChargePerKwh,
    contractedGreenSharePercent
  ]);

  const exportCsv = () => {
    if (!results) return;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Parameter,Value,Unit\n" +
      `Annual Consumption,${annualConsumptionKwh},kWh\n` +
      `Current Landed Tariff,${currentLandedTariff},INR/kWh\n` +
      `Proposed Energy Tariff,${proposedEnergyTariff},INR/kWh\n` +
      `Contracted Green Share,${contractedGreenSharePercent},%\n` +
      `Blended Landed Tariff,${results.blendedLandedTariffPerKwh},INR/kWh\n` +
      `Cost Difference,${results.costDifferencePerKwh},INR/kWh\n` +
      `Annual Savings,${results.annualSavingsInr},INR\n` +
      `Savings Percentage,${results.savingsPercentage},%\n` +
      `Break-even PPA Tariff,${results.breakEvenEnergyTariffPerKwh},INR/kWh\n` +
      `Loss Gross-up Multiplier,${results.effectiveLossFactor},x\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Electricity_Bazaar_Economics_${selectedStatePreset}_${Date.now()}.csv`);
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
            { name: 'Gujarat', label: 'Gujarat (GERC)' },
            { name: 'Maharashtra', label: 'Maharashtra (MERC)' },
            { name: 'Rajasthan', label: 'Rajasthan (RERC)' }
          ].map(preset => (
            <button
              key={preset.name}
              onClick={() => applyStatePreset(preset.name, isGroupCaptiveMode)}
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

      {/* Structure Toggle: Group Captive vs Third Party */}
      <div className="flex items-center space-x-4">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Commercial Model:</span>
        <div className="inline-flex p-1 bg-slate-200 rounded-xl text-xs font-bold">
          <button
            onClick={() => applyStatePreset(selectedStatePreset, true)}
            className={`px-4 py-1.5 rounded-lg transition ${
              isGroupCaptiveMode ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Group Captive (0 CSS & 0 AS)
          </button>
          <button
            onClick={() => applyStatePreset(selectedStatePreset, false)}
            className={`px-4 py-1.5 rounded-lg transition ${
              !isGroupCaptiveMode ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Third-Party Open Access (Full CSS)
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
              Proposed Generation Ex-Bus Tariff (₹/kWh)
            </label>
            <input
              type="number"
              step="0.05"
              value={proposedEnergyTariff}
              onChange={(e) => setProposedEnergyTariff(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Renewable Replacement Share
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
                      <span className="text-teal-700">Proposed Sourcing Expenditure ({isGroupCaptiveMode ? 'Group Captive' : 'Open Access'})</span>
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
