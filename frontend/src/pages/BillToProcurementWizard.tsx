import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown, 
  Zap, 
  ShieldCheck, 
  Building2, 
  Layers, 
  Send,
  Sliders,
  DollarSign,
  Info,
  UploadCloud,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  X,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { MatchResult, MarketplaceListing, LandedCostOutputs, StateRegulatoryProfile, ExtractedBillData } from '../types';

interface BillWizardProps {
  setCurrentView: (view: string) => void;
  onSelectListing: (listingId: string) => void;
}

export const BillToProcurementWizard: React.FC<BillWizardProps> = ({ setCurrentView, onSelectListing }) => {
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);

  // Stage 1: Bill Diagnostics Inputs
  const [selectedState, setSelectedState] = useState<'Tamil Nadu' | 'Telangana' | string>('Tamil Nadu');
  const [discomName, setDiscomName] = useState('TANGEDCO (Tamil Nadu Generation & Distribution Corp)');
  const [voltageLevel, setVoltageLevel] = useState('11/22 kV (HT-I Industrial)');
  const [contractDemandKva, setContractDemandKva] = useState<number>(4200); // 4.2 MVA / ~3.5 MW
  const [monthlyUnitsKwh, setMonthlyUnitsKwh] = useState<number>(850000); // 850k units
  const [monthlyEnergyChargeInr, setMonthlyEnergyChargeInr] = useState<number>(6120000); // ~7.20/unit
  const [monthlyDemandChargeInr, setMonthlyDemandChargeInr] = useState<number>(1317500); // Demand + Duty
  const [derivedLandedTariff, setDerivedLandedTariff] = useState<number>(8.75); // Computed

  // State regulatory profile fetched from backend
  const [stateProfile, setStateProfile] = useState<StateRegulatoryProfile | null>(null);

  // Automated Bill Upload & Extraction State
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<ExtractedBillData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showRawDetails, setShowRawDetails] = useState<boolean>(false);
  const [consumerNumber, setConsumerNumber] = useState<string>('HT-SC-0392049182');
  const [consumerName, setConsumerName] = useState<string>('Coimbatore Precision Auto Components & Foundry Ltd');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processUploadedFile = async (file: File) => {
    setUploadError(null);
    setIsExtracting(true);
    setUploadedFile({ name: file.name, size: file.size, type: file.type });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = reader.result as string;
          const result = await api.extractBillData({
            fileName: file.name,
            fileType: file.type,
            base64Content
          });
          applyExtractedData(result);
        } catch (err: any) {
          setUploadError(err.message || 'Failed to parse bill contents. Please review values manually.');
        } finally {
          setIsExtracting(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Unable to read selected file.');
        setIsExtracting(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'Error processing bill document.');
      setIsExtracting(false);
    }
  };

  const handleSampleSelect = async (presetKey: string) => {
    setUploadError(null);
    setIsExtracting(true);
    try {
      const result = await api.extractBillData({ samplePreset: presetKey });
      setUploadedFile({
        name: `${result.discomName.split(' ')[0]}_${result.consumerNumber}_Bill.pdf`,
        size: 312000,
        type: 'application/pdf'
      });
      applyExtractedData(result);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to load sample bill.');
    } finally {
      setIsExtracting(false);
    }
  };

  const applyExtractedData = (data: ExtractedBillData) => {
    setExtractionResult(data);
    setSelectedState(data.state);
    setDiscomName(data.discomName);
    setVoltageLevel(data.voltageLevel);
    setContractDemandKva(data.contractDemandKva);
    setMonthlyUnitsKwh(data.monthlyUnitsKwh);
    setMonthlyEnergyChargeInr(data.monthlyEnergyChargeInr);
    setMonthlyDemandChargeInr(data.monthlyDemandChargeInr);
    setDerivedLandedTariff(data.derivedLandedTariff);
    setConsumerNumber(data.consumerNumber);
    setConsumerName(data.consumerName);
  };

  const clearUploadedBill = () => {
    setUploadedFile(null);
    setExtractionResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Stage 2: Landed Cost Engine Configuration
  const [commercialModel, setCommercialModel] = useState<'GROUP_CAPTIVE' | 'THIRD_PARTY_OPEN_ACCESS'>('GROUP_CAPTIVE');
  const [contractedGreenShare, setContractedGreenShare] = useState<number>(85);
  const [proposedPpaTariff, setProposedPpaTariff] = useState<number>(3.70);
  const [landedCostResults, setLandedCostResults] = useState<LandedCostOutputs | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Stage 3: Live Supplier Matches
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(false);

  // Stage 4: Comparison & Direct Enquiry
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [enquirySuccessMessage, setEnquirySuccessMessage] = useState<string | null>(null);
  const [enquiryMessageText, setEnquiryMessageText] = useState<string>('');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState<boolean>(false);
  const [enquiryListingId, setEnquiryListingId] = useState<string | null>(null);

  // Load state regulatory data whenever state changes
  useEffect(() => {
    async function loadRates() {
      try {
        const profile = await api.getStateRates(selectedState);
        setStateProfile(profile);
        if (profile.discoms.length > 0) {
          setDiscomName(profile.discoms[0]);
        }
        if (profile.voltageLevels.length > 0) {
          setVoltageLevel(profile.voltageLevels[0].level);
          setDerivedLandedTariff(profile.voltageLevels[0].typicalIndustrialTariffRsPerKwh);
        }
      } catch (err) {
        console.error("Failed to load state profile", err);
      }
    }
    loadRates();
  }, [selectedState]);

  // Recalculate derived bill landed tariff when bill inputs change
  useEffect(() => {
    if (monthlyUnitsKwh > 0) {
      const totalMonthlyInr = monthlyEnergyChargeInr + monthlyDemandChargeInr;
      const computedRate = totalMonthlyInr / monthlyUnitsKwh;
      setDerivedLandedTariff(Number(computedRate.toFixed(2)));
    }
  }, [monthlyEnergyChargeInr, monthlyDemandChargeInr, monthlyUnitsKwh]);

  // Execute Landed Cost Calculation in Stage 2
  const runEconomicsSimulation = async () => {
    setIsCalculating(true);
    try {
      const currentVoltageData = stateProfile?.voltageLevels.find(v => v.level === voltageLevel) || stateProfile?.voltageLevels[0];
      
      const isGroupCaptive = commercialModel === 'GROUP_CAPTIVE';
      const css = isGroupCaptive ? 0 : (currentVoltageData?.crossSubsidySurchargeRsPerKwh || 2.12);
      const as = isGroupCaptive ? 0 : (stateProfile?.additionalSurchargeRsPerKwh || 0.55);

      const outputs = await api.evaluateLandedCost({
        annualConsumptionKwh: monthlyUnitsKwh * 12,
        currentLandedTariff: derivedLandedTariff,
        proposedEnergyTariff: proposedPpaTariff,
        transmissionChargePerKwh: stateProfile?.transmissionChargeRsPerKwh || 0.34,
        wheelingChargePerKwh: currentVoltageData?.wheelingChargeRsPerKwh || 0.88,
        crossSubsidySurchargePerKwh: css,
        additionalSurchargePerKwh: as,
        bankingChargesPerKwh: stateProfile?.bankingChargesRsPerKwh || 0.28,
        stuLossPercent: currentVoltageData?.stuTransmissionLossPercent || 3.9,
        ctuLossPercent: 0,
        sldcAndSchedulingChargePerKwh: stateProfile?.sldcChargesRsPerKwh || 0.05,
        contractedGreenSharePercent: contractedGreenShare
      });

      setLandedCostResults(outputs);
    } catch (err) {
      console.error("Calculation failed", err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Query live supplier matches in Stage 3
  const findMatchingSuppliers = async () => {
    setIsLoadingMatches(true);
    try {
      const demandMw = contractDemandKva / 1000;
      const results = await api.guestMatch({
        state: selectedState,
        contractDemandMw: demandMw,
        targetRenewablePercent: contractedGreenShare,
        commercialModel
      });

      setMatches(results);
      if (results.length > 0) {
        // Pre-select top 2 for comparison
        setSelectedForComparison(results.slice(0, 2).map(r => r.listingId));
      }
    } catch (err) {
      console.error("Matching query failed", err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleStageAdvance = (nextStage: 1 | 2 | 3 | 4) => {
    if (nextStage === 2) {
      runEconomicsSimulation();
    } else if (nextStage === 3) {
      findMatchingSuppliers();
    }
    setCurrentStage(nextStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendEnquiry = async (listingId: string) => {
    setIsSubmittingEnquiry(true);
    setEnquirySuccessMessage(null);
    try {
      const targetListing = matches.find(m => m.listingId === listingId)?.listing;
      await api.createEnquiry({
        listingId,
        proposedCapacityMw: Number((contractDemandKva / 1000).toFixed(1)),
        message: enquiryMessageText || `Inquiry from verified industrial consumer in ${selectedState} for ${contractDemandKva} kVA off-take under ${commercialModel.replace(/_/g, ' ')}. Please provide indicative term sheet and open access injection schedule.`,
        buyerConsentGranted: true
      });

      setEnquirySuccessMessage(`Enquiry successfully transmitted to ${targetListing?.organisation.legalName}! The developer team has been alerted.`);
      setEnquiryMessageText('');
    } catch (err: any) {
      alert(`Enquiry transmission note: ${err.message || 'Please sign in or register to submit formal enquiries'}`);
      if (!localStorage.getItem('eb_token')) {
        setCurrentView('login');
      }
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Value Proposition */}
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-teal-200">
          <Zap className="w-3.5 h-3.5 text-teal-600" />
          <span>India's Power Procurement Intelligence Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight brand-font">
          From Electricity Bill to the Best-Fit Procurement Opportunity
        </h1>
        <p className="text-slate-600 mt-2 max-w-3xl text-sm leading-relaxed">
          Follow our 4-stage transparent journey: decompose your existing electricity tariff, simulate statutory SERC open-access economics, match active supplier capacity, and compare terms side-by-side.
        </p>
      </div>

      {/* 4-Stage Stepper Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { num: 1, label: '1. Bill Diagnostics', desc: 'Tariff & Demand decomposition' },
          { num: 2, label: '2. Landed Cost Engine', desc: 'CSS, AS, Wheeling & Losses' },
          { num: 3, label: '3. Supplier Matching', desc: 'Algorithmic compatibility' },
          { num: 4, label: '4. Compare & Connect', desc: 'Side-by-side & Enquiries' }
        ].map((stage) => {
          const isActive = currentStage === stage.num;
          const isDone = currentStage > stage.num;
          return (
            <div
              key={stage.num}
              onClick={() => stage.num <= currentStage ? setCurrentStage(stage.num as any) : null}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-navy-900 text-white border-navy-900 shadow-md ring-2 ring-teal-500/50'
                  : isDone
                  ? 'bg-teal-50/70 border-teal-200 text-teal-900 cursor-pointer'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isActive ? 'bg-teal-500 text-navy-900' : isDone ? 'bg-teal-200 text-teal-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  Stage {stage.num}
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
              </div>
              <div className="font-bold text-xs sm:text-sm truncate">{stage.label}</div>
              <div className={`text-[11px] truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                {stage.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================
          STAGE 1: BILL DIAGNOSTICS
      ============================================================ */}
      {currentStage === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900 brand-font">Stage 1: Deconstruct Existing Electricity Bill</h2>
              <p className="text-xs text-slate-500">Provide key numbers from your latest utility High-Tension (HT) bill.</p>
            </div>
          </div>

          {/* ============================================================
              AUTOMATED BILL UPLOAD & PARSER SECTION
          ============================================================ */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50 border border-teal-200/80 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Instant OCR & HT Bill Parser</span>
                </div>
                <h3 className="text-lg font-bold text-navy-900 brand-font">
                  Upload Electricity Bill (PDF, JPG, PNG)
                </h3>
                <p className="text-xs text-slate-600">
                  Drop your latest High-Tension (HT) utility bill to instantly extract DISCOM, Contract Demand, Monthly Units, and Landed Cost.
                </p>
              </div>

              {/* Reset button if extracted */}
              {extractionResult && (
                <button
                  type="button"
                  onClick={clearUploadedBill}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-red-600 font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-red-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Another Bill</span>
                </button>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            {!extractionResult && !isExtracting && (
              <div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) processUploadedFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl p-6 text-center cursor-pointer bg-white hover:bg-teal-50/30 transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) processUploadedFile(e.target.files[0]);
                    }}
                  />
                  <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-navy-900 mb-1">
                    Click to browse or drag and drop your electricity bill
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    Supports high-tension utility bills in <span className="font-semibold text-slate-700">PDF, JPG, PNG, WEBP</span> (up to 15 MB)
                  </div>
                  <div className="inline-flex items-center space-x-2 text-[11px] text-teal-700 font-medium bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confidentiality Guaranteed: Used exclusively for landed cost simulation</span>
                  </div>
                </div>

                {uploadError && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Quick Presets Bar */}
                <div className="mt-4 pt-4 border-t border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                      <span>⚡ Or test immediately with authentic sample HT bills:</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-slate-400">Download PDFs to test upload:</span>
                      <a
                        href="/samples/TANGEDCO_TamilNadu_HT1_SampleBill.pdf"
                        download="TANGEDCO_TamilNadu_HT1_SampleBill.pdf"
                        className="inline-flex items-center text-teal-700 hover:text-teal-900 font-semibold underline decoration-teal-300"
                      >
                        <Download className="w-3 h-3 mr-0.5" />
                        TN PDF
                      </a>
                      <span className="text-slate-300">•</span>
                      <a
                        href="/samples/TSSPDCL_Telangana_HT1_SampleBill.pdf"
                        download="TSSPDCL_Telangana_HT1_SampleBill.pdf"
                        className="inline-flex items-center text-teal-700 hover:text-teal-900 font-semibold underline decoration-teal-300"
                      >
                        <Download className="w-3 h-3 mr-0.5" />
                        TG PDF
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSampleSelect('sample_tn_tangedco')}
                      className="text-left p-2.5 rounded-lg border border-teal-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 transition-all text-xs shadow-2xs group"
                    >
                      <div className="font-bold text-navy-900 group-hover:text-teal-700 flex items-center justify-between">
                        <span>Tamil Nadu (TANGEDCO)</span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono">Pilot</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">Coimbatore Precision Auto</div>
                      <div className="text-[10px] text-teal-600 font-semibold mt-1">4,200 kVA • 850k kWh • ₹8.75/u</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSampleSelect('sample_tg_tsspdcl')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 transition-all text-xs shadow-2xs group"
                    >
                      <div className="font-bold text-navy-900 group-hover:text-teal-700 flex items-center justify-between">
                        <span>Telangana (TSSPDCL)</span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono">Flagship</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">Hyderabad Bulk Drugs Ltd</div>
                      <div className="text-[10px] text-teal-600 font-semibold mt-1">3,500 kVA • 720k kWh • ₹10.39/u</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSampleSelect('sample_gj_guvnl')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 transition-all text-xs shadow-2xs group"
                    >
                      <div className="font-bold text-navy-900 group-hover:text-teal-700 flex items-center justify-between">
                        <span>Gujarat (GUVNL/MGVCL)</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">Western</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">Vadodara Castings LLP</div>
                      <div className="text-[10px] text-teal-600 font-semibold mt-1">2,800 kVA • 540k kWh • ₹8.15/u</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSampleSelect('sample_mh_msedcl')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 transition-all text-xs shadow-2xs group"
                    >
                      <div className="font-bold text-navy-900 group-hover:text-teal-700 flex items-center justify-between">
                        <span>Maharashtra (MSEDCL)</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">Western</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">Pune Auto Forgings Ltd</div>
                      <div className="text-[10px] text-teal-600 font-semibold mt-1">5,000 kVA • 1.10 MU • ₹9.80/u</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scanning In Progress State */}
            {isExtracting && (
              <div className="p-8 text-center bg-white rounded-xl border border-teal-200">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin flex items-center justify-center"></div>
                  <Sparkles className="w-6 h-6 text-teal-600 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-base font-bold text-navy-900 mb-1">
                  Scanning HT Electricity Bill...
                </div>
                <div className="text-xs text-slate-600 max-w-md mx-auto">
                  Extracting utility identifiers, contracted demand (CMD), active consumption, energy charges, and landed cost rate...
                </div>
              </div>
            )}

            {/* Extracted Bill Verification Card */}
            {extractionResult && (
              <div className="bg-white rounded-xl border border-teal-300 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-navy-900">{extractionResult.consumerName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {extractionResult.confidenceScore}% Confidence
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {extractionResult.consumerNumber} • {extractionResult.billingMonth} • {uploadedFile?.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowRawDetails(!showRawDetails)}
                      className="inline-flex items-center space-x-1.5 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-medium transition-colors border border-teal-200"
                    >
                      {showRawDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showRawDetails ? 'Hide Extraction Trace' : 'View Extracted Fields'}</span>
                    </button>
                  </div>
                </div>

                {/* 4 Key Extracted Metrics Banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jurisdiction</div>
                    <div className="text-sm font-bold text-navy-900 mt-0.5">{extractionResult.state}</div>
                    <div className="text-[11px] text-teal-700 truncate font-medium">{extractionResult.discomName.split(' ')[0]}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contract Demand (CMD)</div>
                    <div className="text-sm font-bold text-navy-900 mt-0.5">{extractionResult.contractDemandKva.toLocaleString('en-IN')} kVA</div>
                    <div className="text-[11px] text-slate-500">~{(extractionResult.contractDemandKva / 1000).toFixed(2)} MW Peak</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Units</div>
                    <div className="text-sm font-bold text-navy-900 mt-0.5">{extractionResult.monthlyUnitsKwh.toLocaleString('en-IN')} kWh</div>
                    <div className="text-[11px] text-slate-500">{(extractionResult.monthlyUnitsKwh / 1000000).toFixed(2)} MU / month</div>
                  </div>

                  <div className="p-3 bg-teal-50/70 rounded-lg border border-teal-200">
                    <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Landed Grid Tariff</div>
                    <div className="text-sm font-extrabold text-teal-800 mt-0.5">₹{extractionResult.derivedLandedTariff.toFixed(2)} / kWh</div>
                    <div className="text-[11px] text-teal-700 font-medium">₹{(extractionResult.totalBillInr / 100000).toFixed(1)}L / month</div>
                  </div>
                </div>

                {/* Expandable Trace of Extracted Fields */}
                {showRawDetails && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
                      <FileCode className="w-3.5 h-3.5 text-teal-600" />
                      <span>Extracted Parameters & Regulatory Mapping:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      {extractionResult.extractedFields.map((field, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-200/80 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-700">{field.field}:</span>{' '}
                            <span className="text-navy-900 font-bold">{field.value}</span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                            {field.confidence}
                          </span>
                        </div>
                      ))}
                    </div>
                    {extractionResult.rawTextPreview && (
                      <div className="mt-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Document OCR / Stream Snippet
                        </div>
                        <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                          {extractionResult.rawTextPreview}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Consumer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Consumer / Enterprise Name</span>
                {extractionResult && <span className="text-[10px] text-teal-600 font-semibold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Extracted</span>}
              </label>
              <input
                type="text"
                value={consumerName}
                onChange={(e) => setConsumerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="e.g. Coimbatore Precision Foundry Ltd"
              />
            </div>

            {/* HT Service Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>HT Service / Connection No.</span>
                {extractionResult && <span className="text-[10px] text-teal-600 font-semibold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Extracted</span>}
              </label>
              <input
                type="text"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                placeholder="e.g. HT-SC-0392049182"
              />
            </div>

            {/* Pilot State Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>State / Jurisdiction <span className="text-teal-600 font-semibold">(Pilot)</span></span>
                {extractionResult && <span className="text-[10px] text-teal-600 font-semibold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Extracted</span>}
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Tamil Nadu">Tamil Nadu (TNERC / TANGEDCO) — Launch Pilot</option>
                <option value="Telangana">Telangana (TSERC / TSSPDCL) — Flagship Pilot</option>
                <option value="Gujarat">Gujarat (GERC / GUVNL)</option>
                <option value="Maharashtra">Maharashtra (MERC / MSEDCL)</option>
                <option value="Rajasthan">Rajasthan (RERC)</option>
              </select>
              <p className="text-[11px] text-teal-700 mt-1 font-medium">
                {selectedState === 'Tamil Nadu' && '⭐ First customer focus. Verified TNERC HT-I & HT-III schedules.'}
                {selectedState === 'Telangana' && '⭐ Active TSERC bi-annual additional surcharge benchmark.'}
              </p>
            </div>

            {/* Distribution Licensee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Distribution Licensee (DISCOM)</span>
                {extractionResult && <span className="text-[10px] text-teal-600 font-semibold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Extracted</span>}
              </label>
              <select
                value={discomName}
                onChange={(e) => setDiscomName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {stateProfile?.discoms.map(d => (
                  <option key={d} value={d}>{d}</option>
                )) || <option value={discomName}>{discomName}</option>}
              </select>
            </div>

            {/* Voltage Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Interconnection / Tariff Category</span>
                {extractionResult && <span className="text-[10px] text-teal-600 font-semibold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Extracted</span>}
              </label>
              <select
                value={voltageLevel}
                onChange={(e) => setVoltageLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {stateProfile?.voltageLevels.map(v => (
                  <option key={v.level} value={v.level}>{v.level} (Base ~₹{v.typicalIndustrialTariffRsPerKwh}/kWh)</option>
                )) || <option value={voltageLevel}>{voltageLevel}</option>}
              </select>
            </div>

            {/* Contract Demand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Contracted Maximum Demand (CMD)</span>
                {extractionResult && <span className="text-[10px] text-teal-600 font-semibold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Extracted</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={contractDemandKva}
                  onChange={(e) => setContractDemandKva(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. 4200"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">kVA</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Approx. {(contractDemandKva / 1000).toFixed(2)} MW peak demand
              </span>
            </div>

            {/* Monthly Consumption */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Average Monthly Consumption</span>
                {extractionResult && <span className="text-[10px] text-teal-600 font-semibold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Extracted</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyUnitsKwh}
                  onChange={(e) => setMonthlyUnitsKwh(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. 850000"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">kWh (Units)</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {(monthlyUnitsKwh / 1000000).toFixed(2)} Million Units (MU) / month
              </span>
            </div>

            {/* Monthly Energy Charges */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Monthly Energy Charges (₹)</span>
                {extractionResult && <span className="text-[10px] text-teal-600 font-semibold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Extracted</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyEnergyChargeInr}
                  onChange={(e) => setMonthlyEnergyChargeInr(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">INR</span>
              </div>
            </div>

            {/* Monthly Demand Charges & Taxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Fixed Demand + Taxes & Duty (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyDemandChargeInr}
                  onChange={(e) => setMonthlyDemandChargeInr(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">INR</span>
              </div>
            </div>

            {/* Derived Landed Rate Output */}
            <div className="md:col-span-2 bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl p-5 text-white flex flex-col justify-between shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                    Derived Baseline Landed Tariff
                  </span>
                  <div className="text-3xl font-extrabold mt-1 text-white flex items-baseline space-x-1">
                    <span>₹{derivedLandedTariff.toFixed(2)}</span>
                    <span className="text-xs font-normal text-slate-300">/ kWh (all-in)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Total Monthly Electricity Spend</span>
                  <div className="text-lg font-bold text-teal-300">
                    ₹{((monthlyEnergyChargeInr + monthlyDemandChargeInr) / 100000).toFixed(2)} Lakhs
                  </div>
                  <span className="text-[10px] text-slate-400">
                    (₹{(((monthlyEnergyChargeInr + monthlyDemandChargeInr) * 12) / 10000000).toFixed(2)} Cr / yr)
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-300 mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                <span>Energy Component: ₹{(monthlyEnergyChargeInr / monthlyUnitsKwh).toFixed(2)}/u</span>
                <span>Demand & Tax Load: ₹{(monthlyDemandChargeInr / monthlyUnitsKwh).toFixed(2)}/u</span>
              </div>
            </div>
          </div>

          {/* Action to advance to Stage 2 */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => handleStageAdvance(2)}
              className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-6 py-3 rounded-xl text-sm flex items-center space-x-2 transition shadow-md shadow-teal-600/20"
            >
              <span>Proceed to Stage 2: Calculate Landed Cost</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STAGE 2: LANDED COST ENGINE
      ============================================================ */}
      {currentStage === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900 brand-font">Stage 2: Open Access & Group Captive Economics</h2>
              <p className="text-xs text-slate-500">
                Simulating statutory charges under {selectedState} ({stateProfile?.regulatoryAuthority}).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Control Column */}
            <div className="space-y-6">
              {/* Procurement Model Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Procurement Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setCommercialModel('GROUP_CAPTIVE'); }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition ${
                      commercialModel === 'GROUP_CAPTIVE'
                        ? 'bg-teal-600 text-navy-900 border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Group Captive (0 CSS)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCommercialModel('THIRD_PARTY_OPEN_ACCESS'); }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition ${
                      commercialModel === 'THIRD_PARTY_OPEN_ACCESS'
                        ? 'bg-teal-600 text-navy-900 border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Third-Party OA
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {commercialModel === 'GROUP_CAPTIVE' ? (
                    <span className="text-teal-700 font-medium">
                      ✓ Statutorily exempt from Cross-Subsidy Surcharge (CSS) & Additional Surcharge under Electricity Act Sec 42(2). Requires 26% equity subscription in generator SPV.
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">
                      ⚠ Applicable CSS (₹{stateProfile?.voltageLevels[0]?.crossSubsidySurchargeRsPerKwh || '2.12'}/kWh) and Additional Surcharge apply.
                    </span>
                  )}
                </p>
              </div>

              {/* Proposed PPA Generation Tariff Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Generator Ex-Busbar PPA Tariff
                  </label>
                  <span className="text-sm font-bold text-teal-700">₹{proposedPpaTariff.toFixed(2)} / kWh</span>
                </div>
                <input
                  type="range"
                  min="2.80"
                  max="5.50"
                  step="0.05"
                  value={proposedPpaTariff}
                  onChange={(e) => setProposedPpaTariff(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>₹2.80 (Aggressive)</span>
                  <span>₹3.70 (Market avg in {selectedState})</span>
                  <span>₹5.50</span>
                </div>
              </div>

              {/* Green Replacement Percentage Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Target Renewable Share
                  </label>
                  <span className="text-sm font-bold text-teal-700">{contractedGreenShare}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="5"
                  value={contractedGreenShare}
                  onChange={(e) => setContractedGreenShare(parseInt(e.target.value))}
                  className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Remaining {100 - contractedGreenShare}% will be balanced from {discomName.split(' ')[0]} at ₹{derivedLandedTariff}/kWh.
                </span>
              </div>

              {/* Recalculate button */}
              <button
                onClick={runEconomicsSimulation}
                className="w-full bg-navy-800 hover:bg-navy-900 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                {isCalculating ? 'Computing Formula...' : 'Update Simulation Parameters'}
              </button>
            </div>

            {/* Results / Breakdown Column */}
            <div className="lg:col-span-2 space-y-6">
              {landedCostResults && (
                <>
                  {/* Highlight metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        New Blended Landed Cost
                      </span>
                      <div className="text-2xl font-extrabold text-navy-900 mt-1">
                        ₹{landedCostResults.blendedLandedTariffPerKwh.toFixed(2)}
                        <span className="text-xs font-normal text-slate-500"> / kWh</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        vs. current ₹{derivedLandedTariff.toFixed(2)}/kWh
                      </span>
                    </div>

                    <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl">
                      <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                        Unit Savings Spread
                      </span>
                      <div className="text-2xl font-extrabold text-teal-700 mt-1">
                        ₹{landedCostResults.costDifferencePerKwh.toFixed(2)}
                        <span className="text-xs font-normal text-teal-700"> / unit</span>
                      </div>
                      <span className="text-[11px] text-teal-800 font-semibold">
                        {landedCostResults.savingsPercentage.toFixed(1)}% Cost Reduction
                      </span>
                    </div>

                    <div className="bg-gradient-to-br from-navy-900 to-teal-900 text-white p-4 rounded-xl shadow-md">
                      <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">
                        Estimated Annual Savings
                      </span>
                      <div className="text-2xl font-extrabold text-white mt-1">
                        ₹{(landedCostResults.annualSavingsInr / 10000000).toFixed(2)} Cr
                      </div>
                      <span className="text-[10px] text-slate-300">
                        (₹{(landedCostResults.annualSavingsInr / 100000).toFixed(2)} Lakhs per annum)
                      </span>
                    </div>
                  </div>

                  {/* Landed Cost Waterfall Breakdown */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <h3 className="text-sm font-bold text-navy-900 mb-3 flex items-center space-x-2">
                      <span>Itemized Delivered Cost Breakdown ({commercialModel.replace(/_/g, ' ')})</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Loss Multiplier: {landedCostResults.effectiveLossFactor}x
                      </span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Base Energy Tariff (Grossed up for STU {stateProfile?.voltageLevels[0]?.stuTransmissionLossPercent || 3.9}% loss)</span>
                        <span className="font-semibold text-slate-900">₹{landedCostResults.openAccessEnergyTariffGrossedUp.toFixed(4)} / kWh</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">State Transmission & Wheeling Charges</span>
                        <span className="font-semibold text-slate-900">
                          ₹{((stateProfile?.transmissionChargeRsPerKwh || 0.34) + (stateProfile?.voltageLevels[0]?.wheelingChargeRsPerKwh || 0.88)).toFixed(2)} / kWh
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Cross-Subsidy Surcharge (CSS)</span>
                        <span className={`font-semibold ${commercialModel === 'GROUP_CAPTIVE' ? 'text-teal-600' : 'text-slate-900'}`}>
                          {commercialModel === 'GROUP_CAPTIVE' ? '₹0.00 (Statutory Exemption)' : `₹${stateProfile?.voltageLevels[0]?.crossSubsidySurchargeRsPerKwh || '2.12'} / kWh`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Additional Surcharge (AS)</span>
                        <span className={`font-semibold ${commercialModel === 'GROUP_CAPTIVE' ? 'text-teal-600' : 'text-slate-900'}`}>
                          {commercialModel === 'GROUP_CAPTIVE' ? '₹0.00 (Exempt)' : `₹${stateProfile?.additionalSurchargeRsPerKwh || '0.55'} / kWh`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Banking Charges & SLDC Scheduling</span>
                        <span className="font-semibold text-slate-900">
                          ₹{((stateProfile?.bankingChargesRsPerKwh || 0.28) + (stateProfile?.sldcChargesRsPerKwh || 0.05)).toFixed(2)} / kWh
                        </span>
                      </div>
                      <div className="flex justify-between py-2 bg-slate-50 font-bold text-slate-900 px-3 rounded-lg">
                        <span>Total 100% Open Access Landed Cost</span>
                        <span className="text-teal-700">₹{landedCostResults.totalOpenAccessLandedCostPerKwh.toFixed(2)} / kWh</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
            <button
              onClick={() => handleStageAdvance(1)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bill Diagnostics</span>
            </button>
            <button
              onClick={() => handleStageAdvance(3)}
              className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-6 py-3 rounded-xl text-sm flex items-center space-x-2 transition shadow-md shadow-teal-600/20"
            >
              <span>Proceed to Stage 3: Match Active Suppliers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STAGE 3: LIVE SUPPLIER MATCHMAKING
      ============================================================ */}
      {currentStage === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900 brand-font">Stage 3: Verified Supplier Compatibility Match</h2>
              <p className="text-xs text-slate-500">
                Searching active generator capacity for {(contractDemandKva / 1000).toFixed(1)} MW in {selectedState} ({commercialModel.replace(/_/g, ' ')}).
              </p>
            </div>
          </div>

          {isLoadingMatches ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Running deterministic matchmaking algorithms against verified listings...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Direct Intra-State Matches Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No active supplier in {selectedState} exactly matched all criteria. Try switching commercial model or checking inter-state (CTU) options.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-600">
                Found {matches.length} compatible opportunities meeting your load profile:
              </div>

              <div className="grid grid-cols-1 gap-4">
                {matches.map((match) => {
                  const listing = match.listing;
                  const isSelected = selectedForComparison.includes(listing.id);

                  return (
                    <div
                      key={listing.id}
                      className={`p-5 rounded-xl border transition-all ${
                        match.scorePercent >= 85
                          ? 'border-teal-300 bg-gradient-to-r from-teal-50/40 to-white shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                              DEMO DATA
                            </span>
                            <span className="text-xs font-mono font-semibold text-slate-500">
                              {listing.listingCode}
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                              {listing.category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3 text-teal-600" />
                              <span>{listing.organisation.verificationStatus.replace(/_/g, ' ')}</span>
                            </span>
                          </div>

                          <h3 
                            onClick={() => onSelectListing(listing.id)}
                            className="text-base font-bold text-navy-900 hover:text-teal-600 cursor-pointer transition brand-font"
                          >
                            {listing.title}
                          </h3>

                          <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Supplier: <strong className="text-slate-800">{listing.organisation.legalName}</strong></span>
                            <span>Location: <strong className="text-slate-800">{listing.projectLocation}</strong></span>
                            <span>Grid: <strong className="text-slate-800">{listing.interconnectionType.replace(/_/g, ' ')}</strong></span>
                          </div>

                          {/* Match Reasons */}
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                            {match.matchReasons.map((reason, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-xs text-teal-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Metrics & Action */}
                        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 min-w-[200px] space-y-2">
                          <div className="text-right">
                            <div className="text-2xl font-black text-teal-600 brand-font">
                              {match.scorePercent}% Match
                            </div>
                            <div className="text-xs text-slate-600 font-semibold">
                              Available: {listing.availableCapacityMw} MW of {listing.totalCapacityMw} MW
                            </div>
                            <div className="text-sm font-bold text-navy-900">
                              {listing.indicativePricePerKwh ? `₹${listing.indicativePricePerKwh.toFixed(2)}/kWh` : 'Custom Tariff'}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedForComparison(selectedForComparison.filter(id => id !== listing.id));
                                } else {
                                  if (selectedForComparison.length >= 5) {
                                    alert("You can compare up to 5 opportunities side by side.");
                                    return;
                                  }
                                  setSelectedForComparison([...selectedForComparison, listing.id]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                isSelected
                                  ? 'bg-teal-600 text-navy-900 border-teal-600 font-bold'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                              }`}
                            >
                              {isSelected ? '✓ Selected to Compare' : '+ Add to Compare'}
                            </button>

                            <button
                              onClick={() => {
                                setEnquiryListingId(listing.id);
                                handleStageAdvance(4);
                              }}
                              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                            >
                              Connect
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
            <button
              onClick={() => handleStageAdvance(2)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Economics</span>
            </button>
            <button
              onClick={() => handleStageAdvance(4)}
              className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-6 py-3 rounded-xl text-sm flex items-center space-x-2 transition shadow-md shadow-teal-600/20"
            >
              <span>Proceed to Stage 4: Compare & Transmit Enquiry ({selectedForComparison.length} selected)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STAGE 4: SIDE-BY-SIDE COMPARISON & DIRECT ENQUIRY
      ============================================================ */}
      {currentStage === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900 brand-font">Stage 4: Side-by-Side Comparison & Direct Enquiry</h2>
              <p className="text-xs text-slate-500">
                Compare up to 5 opportunities side-by-side on commercial parameters, technical details, and verification status.
              </p>
            </div>
          </div>

          {/* Side-by-Side Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 font-bold text-slate-600 w-48">Parameter</th>
                  {selectedForComparison.map(id => {
                    const candidate = matches.find(m => m.listingId === id)?.listing;
                    if (!candidate) return null;
                    return (
                      <th key={id} className="py-3 px-4 font-bold text-navy-900 min-w-[240px]">
                        <div className="font-bold truncate text-sm">{candidate.title}</div>
                        <span className="text-[11px] font-mono text-teal-600 font-semibold">{candidate.listingCode}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Supplier Organisation</td>
                  {selectedForComparison.map(id => (
                    <td key={id} className="py-3 px-4 font-bold text-slate-900">
                      {matches.find(m => m.listingId === id)?.listing.organisation.legalName}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Verification Status</td>
                  {selectedForComparison.map(id => (
                    <td key={id} className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 text-teal-800 bg-teal-100 px-2 py-0.5 rounded text-[11px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-teal-600" />
                        <span>{matches.find(m => m.listingId === id)?.listing.organisation.verificationStatus.replace(/_/g, ' ')}</span>
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Generation Technology</td>
                  {selectedForComparison.map(id => {
                    const l = matches.find(m => m.listingId === id)?.listing;
                    return (
                      <td key={id} className="py-3 px-4 font-medium">
                        {l?.renewableDetails?.technology || l?.category.replace(/_/g, ' ')}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Available Capacity</td>
                  {selectedForComparison.map(id => (
                    <td key={id} className="py-3 px-4 font-bold text-teal-700">
                      {matches.find(m => m.listingId === id)?.listing.availableCapacityMw} MW (Total: {matches.find(m => m.listingId === id)?.listing.totalCapacityMw} MW)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Indicative PPA Tariff</td>
                  {selectedForComparison.map(id => (
                    <td key={id} className="py-3 px-4 font-extrabold text-navy-900 text-sm">
                      ₹{matches.find(m => m.listingId === id)?.listing.indicativePricePerKwh?.toFixed(2) || 'Custom'} / kWh
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Commercial Structure</td>
                  {selectedForComparison.map(id => (
                    <td key={id} className="py-3 px-4 font-medium">
                      {matches.find(m => m.listingId === id)?.listing.commercialModel.replace(/_/g, ' ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Interconnection & Grid</td>
                  {selectedForComparison.map(id => (
                    <td key={id} className="py-3 px-4">
                      {matches.find(m => m.listingId === id)?.listing.interconnectionType.replace(/_/g, ' ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Pricing Conditions</td>
                  {selectedForComparison.map(id => (
                    <td key={id} className="py-3 px-4 text-[11px] text-slate-600 leading-relaxed">
                      {matches.find(m => m.listingId === id)?.listing.priceBasisConditions || 'Standard PPA terms'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-500 bg-slate-50/50">Plant Status & Readiness</td>
                  {selectedForComparison.map(id => (
                    <td key={id} className="py-3 px-4 font-semibold text-slate-900">
                      {matches.find(m => m.listingId === id)?.listing.projectStatus}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Direct Enquiry Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-base font-bold text-navy-900 brand-font mb-2 flex items-center space-x-2">
              <Send className="w-4 h-4 text-teal-600" />
              <span>Submit Direct Procurement Enquiry</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Send a structured, private RFP message. Confidential consumption records will only be revealed upon explicit consent.
            </p>

            {enquirySuccessMessage && (
              <div className="p-4 bg-teal-50 border border-teal-300 text-teal-900 rounded-xl text-xs font-semibold mb-4 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span>{enquirySuccessMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Recipient Supplier
                </label>
                <select
                  value={enquiryListingId || (selectedForComparison[0] || '')}
                  onChange={(e) => setEnquiryListingId(e.target.value)}
                  className="w-full sm:w-1/2 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {selectedForComparison.map(id => {
                    const l = matches.find(m => m.listingId === id)?.listing;
                    return (
                      <option key={id} value={id}>
                        {l?.organisation.legalName} — {l?.title} ({l?.listingCode})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Enquiry Message & Term Sheet Request
                </label>
                <textarea
                  rows={3}
                  value={enquiryMessageText}
                  onChange={(e) => setEnquiryMessageText(e.target.value)}
                  placeholder={`We are an industrial consumer in ${selectedState} requiring ${(contractDemandKva / 1000).toFixed(1)} MW capacity under ${commercialModel.replace(/_/g, ' ')}. Please provide indicative term sheet and open access injection schedule.`}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  id="buyerConsent"
                  defaultChecked
                  className="accent-teal-600 rounded"
                />
                <label htmlFor="buyerConsent">
                  I give consent to share our facility state ({selectedState}) and capacity requirement ({(contractDemandKva / 1000).toFixed(1)} MW) with the selected supplier.
                </label>
              </div>

              <button
                onClick={() => handleSendEnquiry(enquiryListingId || selectedForComparison[0])}
                disabled={isSubmittingEnquiry || selectedForComparison.length === 0}
                className="bg-teal-600 hover:bg-teal-500 text-navy-900 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition shadow-md shadow-teal-600/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingEnquiry ? 'Sending...' : 'Transmit Enquiry to Supplier'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-200 flex justify-between">
            <button
              onClick={() => handleStageAdvance(3)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Matches</span>
            </button>
            <button
              onClick={() => setCurrentView('marketplace')}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Browse All Listings in Explorer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
