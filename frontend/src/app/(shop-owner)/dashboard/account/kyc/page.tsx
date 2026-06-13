"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { 
  ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle, 
  User, Building, FileText, Upload, ArrowRight, Loader2, Sparkles
} from 'lucide-react';

interface KYCRecord {
  id: number;
  shop: number;
  document_type: string;
  document_front: string;
  document_back?: string;
  kyc_type: 'personal' | 'business';
  business_certificate?: string;
  pan_vat_certificate?: string;
  father_name: string;
  mother_name: string;
  permanent_address: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  admin_notes?: string;
}

interface Shop {
  id: number;
  name: string;
  pan_vat_number?: string;
  verification_tier: string;
}

export default function SellerKYCPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [kyc, setKyc] = useState<KYCRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form States
  const [kycType, setKycType] = useState<'personal' | 'business'>('personal');
  const [documentType, setDocumentType] = useState('citizenship');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [panVatNumber, setPanVatNumber] = useState('');

  // File States
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [businessCert, setBusinessCert] = useState<File | null>(null);
  const [panVatCert, setPanVatCert] = useState<File | null>(null);

  // Previews
  const [docFrontPreview, setDocFrontPreview] = useState('');
  const [docBackPreview, setDocBackPreview] = useState('');
  const [businessCertPreview, setBusinessCertPreview] = useState('');
  const [panVatCertPreview, setPanVatCertPreview] = useState('');

  useEffect(() => {
    fetchShopAndKYC();
  }, []);

  const fetchShopAndKYC = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Get Shop
      const shopRes = await api.get('/shops/my_shop/');
      setShop(shopRes.data);
      if (shopRes.data.pan_vat_number) {
        setPanVatNumber(shopRes.data.pan_vat_number);
      }

      // 2. Get KYC application
      const kycRes = await api.get('/kyc/');
      const records = Array.isArray(kycRes.data) ? kycRes.data : kycRes.data.results || [];
      if (records.length > 0) {
        setKyc(records[0]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Failed to fetch details. Please verify your shop is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!shop) {
      setErrorMessage('No shop found. You must configure your shop first.');
      return;
    }

    if (!docFront) {
      setErrorMessage('Identity Document Front Side is required.');
      return;
    }

    if (kycType === 'business' && (!businessCert || !panVatCert || !panVatNumber)) {
      setErrorMessage('For business verification, PAN/VAT Number, Business Certificate, and PAN/VAT Certificate are required.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. If business verification, update shop PAN/VAT number
      if (kycType === 'business' && panVatNumber !== shop.pan_vat_number) {
        await api.patch(`/shops/${shop.id}/`, { pan_vat_number: panVatNumber });
      }

      // 2. Prepare KYC Form Data
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('kyc_type', kycType);
      formData.append('father_name', fatherName);
      formData.append('mother_name', motherName);
      formData.append('permanent_address', permanentAddress);
      
      formData.append('document_front', docFront);
      if (docBack) {
        formData.append('document_back', docBack);
      }

      if (kycType === 'business') {
        if (businessCert) formData.append('business_certificate', businessCert);
        if (panVatCert) formData.append('pan_vat_certificate', panVatCert);
      }

      // 3. Post KYC details
      await api.post('/kyc/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage('KYC documents submitted successfully! Our administrators will review them shortly.');
      fetchShopAndKYC();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.non_field_errors?.[0] || 
        err.response?.data?.detail || 
        'Failed to submit KYC documents. Please verify all fields are filled.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Define styling and icon for status
  const getStatusBanner = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left mb-8 shadow-sm">
            <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0 animate-pulse">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h3 className="font-bold text-gray-950">KYC Verification Approved!</h3>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {kyc?.kyc_type === 'business' ? 'Business Verified' : 'Identity Verified'}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Your shop is fully verified and permitted to accept orders and setup payments. Trust badges have been applied to your store profiles.
              </p>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left mb-8 shadow-sm">
            <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0 animate-pulse">
              <Clock size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-950">KYC Submission Under Review</h3>
              <p className="text-gray-500 text-xs mt-1">
                We have received your verification documents. Our review board is examining your submittals. This process generally completes within 24 to 48 hours.
              </p>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left mb-8 shadow-sm">
            <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0">
              <XCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-950">KYC Verification Rejected</h3>
              <p className="text-red-700 text-xs mt-1">
                Reason: {kyc?.admin_notes || 'Uploaded documents were blurry or invalid.'}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Please review the feedback and submit corrected documentation below.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Seller Identity</p>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight flex items-center gap-2">
          Shop Verification (KYC)
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Verify your identity or registered company status to display trust badges and secure processing status.
        </p>
      </div>

      {/* Render Status Details */}
      {kyc && getStatusBanner(kyc.kyc_status)}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Submission Form (Only show if not submitted, or rejected) */}
      {(!kyc || kyc.kyc_status === 'rejected') && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-lg font-bold text-gray-950">New KYC Application</h2>
            <p className="text-gray-500 text-xs mt-0.5">Please provide accurate details according to governmental credentials.</p>
          </div>

          {/* 1. KYC Type Choice */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Level</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => setKycType('personal')}
                className={`border-2 rounded-2xl p-5 cursor-pointer flex gap-4 transition ${
                  kycType === 'personal' ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  kycType === 'personal' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    Personal Identity Verification
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full uppercase">Silver Badges</span>
                  </h4>
                  <p className="text-gray-500 text-xs mt-1">Requires standard citizenship card, driving license, or passport. Quick clearance.</p>
                </div>
              </div>

              <div 
                onClick={() => setKycType('business')}
                className={`border-2 rounded-2xl p-5 cursor-pointer flex gap-4 transition ${
                  kycType === 'business' ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  kycType === 'business' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Building size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    Business Registration
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full uppercase">Gold Badges</span>
                  </h4>
                  <p className="text-gray-500 text-xs mt-1">Requires PAN/VAT certificate, company registrations, and personal ID. Allows high trust seals.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Information Fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <User size={14} /> Personal Identity Info (Store Owner)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Father's Full Name</label>
                <input
                  type="text"
                  required
                  value={fatherName}
                  onChange={e => setFatherName(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-sm transition"
                  placeholder="Father's Name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Mother's Full Name</label>
                <input
                  type="text"
                  required
                  value={motherName}
                  onChange={e => setMotherName(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-sm transition"
                  placeholder="Mother's Name"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-600">Permanent Address (as per ID document)</label>
                <textarea
                  required
                  rows={2}
                  value={permanentAddress}
                  onChange={e => setPermanentAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-sm transition resize-none"
                  placeholder="Ward No, Municipality/City, District, Province"
                />
              </div>
            </div>
          </div>

          {/* 3. Company PAN/VAT Details if Business Type */}
          {kycType === 'business' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <Building size={14} /> Registered Company Info
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">PAN or VAT Registration Number</label>
                <input
                  type="text"
                  required={kycType === 'business'}
                  value={panVatNumber}
                  onChange={e => setPanVatNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-sm transition"
                  placeholder="9-digit PAN/VAT registration number"
                />
              </div>
            </div>
          )}

          {/* 4. Documents Upload Fields */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <FileText size={14} /> Document Upload
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document Type selection */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-600">Select Personal ID Type</label>
                <select
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-sm transition capitalize bg-white"
                >
                  <option value="citizenship">Citizenship Certificate</option>
                  <option value="national_id">National ID Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>

              {/* Personal ID Front */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600">Personal ID (Front Side)</label>
                <div className="relative border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl h-44 transition flex flex-col items-center justify-center p-4 bg-gray-50/50 cursor-pointer overflow-hidden group">
                  {docFrontPreview ? (
                    <img src={docFrontPreview} alt="Front preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400 group-hover:text-indigo-500 transition mb-2" />
                      <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600">Click to upload Front image</span>
                      <span className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileChange(e, setDocFront, setDocFrontPreview)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Personal ID Back */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600">Personal ID (Back Side, optional)</label>
                <div className="relative border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl h-44 transition flex flex-col items-center justify-center p-4 bg-gray-50/50 cursor-pointer overflow-hidden group">
                  {docBackPreview ? (
                    <img src={docBackPreview} alt="Back preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400 group-hover:text-indigo-500 transition mb-2" />
                      <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600">Click to upload Back image</span>
                      <span className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileChange(e, setDocBack, setDocBackPreview)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Company Registration Details if Business */}
              {kycType === 'business' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">Company Registration Certificate</label>
                    <div className="relative border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl h-44 transition flex flex-col items-center justify-center p-4 bg-gray-50/50 cursor-pointer overflow-hidden group">
                      {businessCertPreview ? (
                        <img src={businessCertPreview} alt="Cert preview" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <Upload size={24} className="text-gray-400 group-hover:text-indigo-500 transition mb-2" />
                          <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600">Upload Registration Certificate</span>
                          <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileChange(e, setBusinessCert, setBusinessCertPreview)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600">PAN / VAT Registration Certificate</label>
                    <div className="relative border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl h-44 transition flex flex-col items-center justify-center p-4 bg-gray-50/50 cursor-pointer overflow-hidden group">
                      {panVatCertPreview ? (
                        <img src={panVatCertPreview} alt="PAN preview" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <Upload size={24} className="text-gray-400 group-hover:text-indigo-500 transition mb-2" />
                          <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600">Upload PAN/VAT Certificate</span>
                          <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileChange(e, setPanVatCert, setPanVatCertPreview)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-150 hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Documents…
                </>
              ) : (
                <>
                  <span>Submit Verification Request</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Document Review Preview for Pending / Approved status */}
      {kyc && kyc.kyc_status !== 'rejected' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-lg font-bold text-gray-950">Submitted KYC Records</h2>
            <p className="text-gray-500 text-xs mt-0.5">Below are the credentials currently on file for your store.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Application Status', value: kyc.kyc_status },
              { label: 'Verification Type', value: kyc.kyc_type === 'business' ? 'Business Registration' : 'Personal ID Card' },
              { label: "Father's Name", value: kyc.father_name },
              { label: 'Permanent Address', value: kyc.permanent_address },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">{item.label}</p>
                <p className="text-xs font-bold text-gray-900 capitalize">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identity Document Uploads</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kyc.document_front && (
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <img src={kyc.document_front} alt="Front ID" className="w-full h-40 object-cover rounded-lg" />
                  <p className="text-center text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide">ID Card Front Side</p>
                </div>
              )}
              {kyc.document_back && (
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <img src={kyc.document_back} alt="Back ID" className="w-full h-40 object-cover rounded-lg" />
                  <p className="text-center text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide">ID Card Back Side</p>
                </div>
              )}
              {kyc.kyc_type === 'business' && kyc.business_certificate && (
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <img src={kyc.business_certificate} alt="Biz Cert" className="w-full h-40 object-cover rounded-lg" />
                  <p className="text-center text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide">Registration Certificate</p>
                </div>
              )}
              {kyc.kyc_type === 'business' && kyc.pan_vat_certificate && (
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <img src={kyc.pan_vat_certificate} alt="PAN Cert" className="w-full h-40 object-cover rounded-lg" />
                  <p className="text-center text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide">PAN/VAT Document</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
