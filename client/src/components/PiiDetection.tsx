import React, { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { piiDetectionService, type PiiDetectionLog } from "../services/piiDetection";

interface PiiDetectionProps {
  onPiiDetected?: (hasPii: boolean, types: string[]) => void;
}

export const PiiDetection: React.FC<PiiDetectionProps> = ({ onPiiDetected }) => {
  const [sessionId] = useState(() => nanoid());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastDetection, setLastDetection] = useState<PiiDetectionLog | null>(null);

  useEffect(() => {
    const startMonitoring = () => {
      setIsMonitoring(true);
    };

    const stopMonitoring = () => {
      setIsMonitoring(false);
    };

    // Start monitoring when component mounts
    startMonitoring();

    // Cleanup when component unmounts
    return () => {
      stopMonitoring();
    };
  }, []);

  const detectPii = async (text: string) => {
    if (!isMonitoring) return;

    try {
      // Simple PII detection patterns
      const patterns = {
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        phone: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
        ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
        creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
      };

      const detectedTypes: string[] = [];
      let hasPii = false;

      // Check each pattern
      Object.entries(patterns).forEach(([type, pattern]) => {
        if (pattern.test(text)) {
          detectedTypes.push(type);
          hasPii = true;
        }
      });

      // Log the detection
      const log = await piiDetectionService.logDetection({
        sessionId,
        promptLength: text.length,
        hasPii,
        piiTypesDetected: detectedTypes,
        promptText: text,
      });

      setLastDetection(log);
      onPiiDetected?.(hasPii, detectedTypes);

      return { hasPii, types: detectedTypes };
    } catch (error) {
      console.error("Error detecting PII:", error);
      return { hasPii: false, types: [] };
    }
  };

  return (
    <div className="pii-detection">
      {lastDetection && (
        <div className={`pii-status ${lastDetection.hasPii ? "has-pii" : "no-pii"}`}>
          <h3>PII Detection Status</h3>
          <p>
            {lastDetection.hasPii
              ? `PII detected: ${lastDetection.piiTypesDetected.join(", ")}`
              : "No PII detected"}
          </p>
          <p>Prompt length: {lastDetection.promptLength} characters</p>
          <p>Detected at: {new Date(lastDetection.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}; 