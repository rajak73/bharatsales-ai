'use client';

import { useState, useEffect } from 'react';
import { ImportsService } from '@bharatsales/api-client';
import { ImportHistoryItem, ImportTypeConfig } from '@bharatsales/shared-types';
import { Loader2 } from 'lucide-react';

export default function ImportsPage() {
  const [activeImport, setActiveImport] = useState('products');
  const [uploadStep, setUploadStep] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [importTypes, setImportTypes] = useState<ImportTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [history, types] = await Promise.all([
        ImportsService.getImportHistory(),
        ImportsService.getImportTypes()
      ]);
      setImportHistory(history || []);
      setImportTypes(types || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStep(3); // Proceed to validate/confirm
    }
  };

  const handleCompleteImport = async () => {
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Extract base64 part from data URL
        const base64String = (e.target?.result as string).split(',')[1];
        
        const result = await ImportsService.uploadFile(activeImport, base64String);
        
        setSuccessMessage(result.message);
        setUploadStep(1);
        setFile(null);
        fetchData(); // Refresh history
      } catch (err) {
        console.error('Upload failed', err);
        alert('Upload failed. Check console for details.');
      } finally {
        setIsUploading(false);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><span className="text-green-600">✅</span><span className="text-sm text-green-800 font-medium">{successMessage}</span></div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      <div><h1 className="text-2xl font-bold text-gray-900">Import Center</h1><p className="text-gray-500">Bulk import data with validation and error handling</p></div>

      {/* Import Types */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : importTypes.map((type) => (
          <button key={type.id} onClick={() => { setActiveImport(type.id); setUploadStep(1); }} className={`card text-center transition-all ${activeImport === type.id ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'}`}>
            <div className="text-2xl mb-2">{type.icon}</div>
            <div className="text-sm font-medium text-gray-900">{type.name}</div>
            <div className="text-xs text-gray-500 mt-1">{type.count} records</div>
          </button>
        ))}
      </div>

      {/* Import Wizard */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Import {importTypes.find(t => t.id === activeImport)?.name}</h3>
        
        {/* Steps */}
        <div className="flex items-center space-x-4 mb-6">
          {[
            { step: 1, label: 'Download Template' },
            { step: 2, label: 'Upload File' },
            { step: 3, label: 'Validate' },
            { step: 4, label: 'Confirm & Import' },
          ].map((s) => (
            <div key={s.step} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${uploadStep >= s.step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s.step}</div>
              <span className={`text-sm ${uploadStep >= s.step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s.label}</span>
              {s.step < 4 && <div className={`w-8 h-0.5 ${uploadStep > s.step ? 'bg-primary-600' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {uploadStep === 1 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📄</div>
            <h4 className="font-medium text-gray-900 mb-2">Download Template</h4>
            <p className="text-sm text-gray-500 mb-4">Download the Excel template with required columns</p>
            <button className="btn-secondary">Download Template (.xlsx)</button>
          </div>
        )}

        {uploadStep === 2 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📤</div>
            <h4 className="font-medium text-gray-900 mb-2">Upload File</h4>
            <p className="text-sm text-gray-500 mb-4">Upload the completed template file (.csv)</p>
            
            <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
              Browse File
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </label>
            <div className="mt-4 text-xs text-gray-400">Supported formats: .csv (Max 10MB)</div>
          </div>
        )}

        {uploadStep === 3 && (
          <div className="py-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start space-x-3 mb-6">
              <span className="text-xl">ℹ️</span>
              <div>
                <h4 className="font-medium">Ready to validate</h4>
                <p className="text-sm mt-1 text-blue-700">File selected: {file?.name} ({(file?.size || 0) / 1024} KB). Click continue to validate structure and data.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setUploadStep(2)} className="btn-secondary">Back</button>
              <button onClick={() => setUploadStep(4)} className="btn-primary">Validate Data</button>
            </div>
          </div>
        )}

        {uploadStep === 4 && (
          <div className="py-6">
            <div className="bg-green-50 text-green-800 p-4 rounded-xl flex flex-col items-center justify-center py-8 mb-6 text-center border border-green-100">
              <span className="text-4xl mb-2">✅</span>
              <h4 className="font-medium text-lg">Validation Successful</h4>
              <p className="text-sm mt-1 text-green-700">All records passed validation. Ready to import.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setUploadStep(3)} className="btn-secondary" disabled={isUploading}>Back</button>
              <button onClick={handleCompleteImport} className="btn-primary" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Confirm & Import'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import History */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Import History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="px-6 py-3 font-medium">ID</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">File</th><th className="px-6 py-3 font-medium">Rows</th><th className="px-6 py-3 font-medium">Valid</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></td>
                </tr>
              ) : importHistory.length > 0 ? (
                importHistory.map((imp) => (
                  <tr key={imp.id} className="border-t border-gray-100">
                    <td className="px-6 py-3 font-medium text-primary-600">{imp.id}</td>
                    <td className="px-6 py-3 text-gray-900">{imp.type}</td>
                    <td className="px-6 py-3 text-gray-600">{imp.fileName}</td>
                    <td className="px-6 py-3 text-gray-600">{imp.rows}</td>
                    <td className="px-6 py-3 text-green-600">{imp.valid}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${imp.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{imp.status}</span></td>
                    <td className="px-6 py-3 text-gray-500">{imp.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No import history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
