import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { DigitalSignature, SignatureCreate } from '../types';

// IndexedDB configuration
const DB_NAME = 'ClockWiseSignaturesDB';
const DB_VERSION = 1;
const STORE_NAME = 'signatures';

// Legacy localStorage keys (for migration)
const LOCAL_STORAGE_PREFIX = 'clockwise_signatures_';
const LOCAL_STORAGE_INDEX_KEY = 'clockwise_signatures_index';

// Migrate old localStorage signatures to IndexedDB
const migrateLocalStorageToIndexedDB = async (): Promise<void> => {
  try {
    // Check if there's old data in localStorage
    const indexStr = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    if (!indexStr) return; // No old data to migrate

    const pdfIds: string[] = JSON.parse(indexStr);
    if (pdfIds.length === 0) return;

    console.log(`Migrating ${pdfIds.length} signatures from localStorage to IndexedDB...`);
    
    const db = await initDB();
    let migrated = 0;
    
    // First, check which signatures already exist in IndexedDB
    const existingSignatures = await getAllSignaturesFromIndexedDB();
    const existingPdfIds = new Set(existingSignatures.map(sig => sig.payroll_pdf_id));
    
    // Then migrate the ones that don't exist
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    for (const pdfId of pdfIds) {
      try {
        // Skip if already exists in IndexedDB
        if (existingPdfIds.has(pdfId)) {
          continue;
        }
        
        const dataStr = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${pdfId}`);
        if (dataStr) {
          const signature: DigitalSignature = JSON.parse(dataStr);
          store.put(signature);
          migrated++;
        }
      } catch (error) {
        console.error(`Error migrating signature ${pdfId}:`, error);
      }
    }
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        if (migrated > 0) {
          console.log(`Successfully migrated ${migrated} signatures to IndexedDB`);
          // Clear old localStorage data after successful migration
          try {
            pdfIds.forEach(pdfId => {
              localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${pdfId}`);
            });
            localStorage.removeItem(LOCAL_STORAGE_INDEX_KEY);
          } catch (error) {
            console.warn('Error clearing old localStorage data:', error);
          }
        }
        resolve();
      };
      transaction.onerror = () => {
        reject(new Error('Migration transaction failed'));
      };
    });
  } catch (error) {
    console.error('Error during localStorage migration:', error);
  }
};

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'payroll_pdf_id' });
        objectStore.createIndex('employee_id', 'employee_id', { unique: false });
        objectStore.createIndex('tenant_id', 'tenant_id', { unique: false });
        objectStore.createIndex('signed_at', 'signed_at', { unique: false });
      }
    };
  });
};

// Helper functions for IndexedDB
const saveSignatureToIndexedDB = async (signature: DigitalSignature): Promise<DigitalSignature> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(signature);

      request.onsuccess = () => {
        console.log('Signature saved to IndexedDB:', signature.payroll_pdf_id);
        resolve(signature);
      };

      request.onerror = () => {
        reject(new Error('Failed to save signature to IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error saving signature to IndexedDB:', error);
    throw error;
  }
};

const getSignatureFromIndexedDB = async (pdfId: string): Promise<DigitalSignature | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(pdfId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get signature from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting signature from IndexedDB:', error);
    return null;
  }
};

const getAllSignaturesFromIndexedDB = async (): Promise<DigitalSignature[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get signatures from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting signatures from IndexedDB:', error);
    return [];
  }
};

const getSignaturesByEmployeeId = async (employeeId: string): Promise<DigitalSignature[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('employee_id');
      const request = index.getAll(employeeId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get signatures by employee ID from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error getting signatures by employee ID from IndexedDB:', error);
    return [];
  }
};

const saveSignatureToLocalStorage = (data: SignatureCreate): DigitalSignature => {
  const pdfId = data.payroll_pdf_id;
  const signatureId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Extract employee_id and tenant_id from metadata if available
  const metadata = data.signature_metadata || {};
  const employeeId = (metadata as any).employee_id || '';
  const tenantId = (metadata as any).tenant_id || '';
  
  // Clean metadata to remove temporary fields
  const { employee_id, tenant_id, ...cleanMetadata } = metadata as any;
  
  const signature: DigitalSignature = {
    id: signatureId,
    employee_id: employeeId,
    tenant_id: tenantId,
    payroll_pdf_id: pdfId,
    signature_type: data.signature_type,
    signature_data: data.signature_data,
    signature_metadata: cleanMetadata || {
      device: navigator.userAgent,
      ip_address: 'Unknown',
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    },
    signed_at: new Date().toISOString(),
    is_valid: true,
  };

  return signature;
};

// Run migration once after DB is initialized (on first use)
let migrationRun = false;
const ensureMigration = async () => {
  if (!migrationRun) {
    migrationRun = true;
    try {
      // Initialize DB first
      await initDB();
      // Then migrate
      await migrateLocalStorageToIndexedDB();
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
};

export const signaturesService = {
  signDocument: async (data: SignatureCreate): Promise<DigitalSignature> => {
    // Ensure migration has run
    await ensureMigration();
    
    try {
      // Try backend first
      const response = await api.post(API_ENDPOINTS.SIGN_DOCUMENT, data);
      return response.data;
    } catch (error: any) {
      // If backend fails (404, 500, network error), save to IndexedDB
      if (error?.response?.status === 404 || error?.response?.status >= 500 || !error?.response) {
        console.warn('Backend not available, saving signature to IndexedDB:', error?.message);
        const signature = saveSignatureToLocalStorage(data);
        return await saveSignatureToIndexedDB(signature);
      }
      // For other errors (400, 401, 403), rethrow
      throw error;
    }
  },

  getEmployeeSignatures: async (employeeId: string, validOnly?: boolean): Promise<DigitalSignature[]> => {
    try {
      const params: any = {};
      if (validOnly !== undefined) params.valid_only = validOnly;

      const response = await api.get(`${API_ENDPOINTS.EMPLOYEE_SIGNATURES}/${employeeId}`, { params });
      return response.data;
    } catch (error: any) {
      // If backend fails, try to get from IndexedDB
      console.warn('Backend not available for getEmployeeSignatures, checking IndexedDB');
      const signatures = await getSignaturesByEmployeeId(employeeId);
      if (validOnly) {
        return signatures.filter(sig => sig.is_valid);
      }
      return signatures;
    }
  },

  getSignatureById: async (signatureId: string): Promise<DigitalSignature> => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SIGNATURE_BY_ID}/${signatureId}`);
      return response.data;
    } catch (error: any) {
      // Try to find in IndexedDB by checking all stored signatures
      if (error?.response?.status === 404 || error?.response?.status >= 500 || !error?.response) {
        const allSignatures = await getAllSignaturesFromIndexedDB();
        const signature = allSignatures.find(sig => sig.id === signatureId);
        if (signature) {
          return signature;
        }
      }
      throw error;
    }
  },

  getPDFSignature: async (pdfFilename: string): Promise<DigitalSignature> => {
    // Ensure migration has run
    await ensureMigration();
    
    try {
      const response = await api.get(`${API_ENDPOINTS.PDF_SIGNATURE}/${pdfFilename}`);
      return response.data;
    } catch (error: any) {
      // If backend fails, try IndexedDB
      if (error?.response?.status === 404 || error?.response?.status >= 500 || !error?.response) {
        const localSignature = await getSignatureFromIndexedDB(pdfFilename);
        if (localSignature) {
          return localSignature;
        }
        // If not found in IndexedDB either, throw 404
        const notFoundError: any = new Error('Signature not found');
        notFoundError.response = { status: 404, data: { detail: 'Signature not found' } };
        throw notFoundError;
      }
      throw error;
    }
  },

  invalidateSignature: async (signatureId: string, invalidationReason: string): Promise<DigitalSignature> => {
    try {
      const response = await api.post(`${API_ENDPOINTS.INVALIDATE_SIGNATURE}/${signatureId}/invalidate`, {
        invalidation_reason: invalidationReason,
      });
      return response.data;
    } catch (error: any) {
      // Try to invalidate in IndexedDB
      if (error?.response?.status === 404 || error?.response?.status >= 500 || !error?.response) {
        const allSignatures = await getAllSignaturesFromIndexedDB();
        const signature = allSignatures.find(sig => sig.id === signatureId);
        if (signature) {
          signature.is_valid = false;
          signature.invalidated_at = new Date().toISOString();
          signature.invalidation_reason = invalidationReason;
          await saveSignatureToIndexedDB(signature);
          return signature;
        }
        const notFoundError: any = new Error('Signature not found');
        notFoundError.response = { status: 404, data: { detail: 'Signature not found' } };
        throw notFoundError;
      }
      throw error;
    }
  },

  getSignatureMetadata: (): any => {
    return {
      device: navigator.userAgent,
      ip_address: 'Unknown',
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
  },

  // Export function to download all signatures as JSON backup
  exportSignatures: async (): Promise<Blob> => {
    const signatures = await getAllSignaturesFromIndexedDB();
    const dataStr = JSON.stringify(signatures, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    return blob;
  },

  // Import function to restore signatures from JSON backup
  importSignatures: async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const signatures: DigitalSignature[] = JSON.parse(e.target?.result as string);
          const db = await initDB();
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          for (const signature of signatures) {
            store.put(signature);
          }
          
          transaction.oncomplete = () => {
            console.log('Signatures imported successfully');
            resolve();
          };
          
          transaction.onerror = () => {
            reject(new Error('Failed to import signatures'));
          };
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};
