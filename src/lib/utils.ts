import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "react-hot-toast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export const compressImage = (base64Str: string, maxWidth = 1920, maxHeight = 1920, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (!base64Str || typeof base64Str !== "string" || !base64Str.startsWith("data:image/")) {
        resolve(base64Str);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          } else {
            resolve(base64Str);
          }
        } catch (innerErr) {
          console.error("Canvas compression failed, using raw base64:", innerErr);
          resolve(base64Str);
        }
      };
      img.onerror = (e) => {
        console.error("Image load failed, using raw base64:", e);
        resolve(base64Str);
      };
      img.src = base64Str;
    } catch (outerErr) {
      console.error("compressImage outer error, using raw base64:", outerErr);
      resolve(base64Str);
    }
  });
};

export const uploadOrFallback = async (
  file: File,
  base64Data: string,
  onSuccess: (url: string) => void,
  toastId: string,
  successMsg = "Uploaded successfully!"
) => {
  const isVercel = window.location.hostname.includes("vercel") || window.location.hostname.includes("amplify") || window.location.hostname.includes("netlify");

  if (isVercel) {
    onSuccess(base64Data);
    toast.success("Uploaded successfully!", { id: toastId });
    return;
  }

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        base64: base64Data,
      }),
    });

    if (!response.ok) {
      throw new Error("Upload response not ok");
    }

    const data = await response.json();
    onSuccess(data.url);
    toast.success(successMsg, { id: toastId });
  } catch (error) {
    console.warn("Express serverless limit or offline detected. Activating direct client-side persistent bypass:", error);
    onSuccess(base64Data);
    toast.success(successMsg, { id: toastId });
  }
};

export const handleFileUploadFlow = async (
  file: File,
  onSuccess: (url: string) => void,
  toastId: string,
  successMsg = "Uploaded successfully!"
) => {
  if (!file) return;

  // Generous file input limit of 50MB
  if (file.size > 50 * 1024 * 1024) {
    toast.error("File is too large. Please upload files under 50MB.", { id: toastId });
    return;
  }

  const isImage = file.type?.startsWith("image/");

  toast.loading(isImage ? "Processing and uploading document..." : "Uploading document...", { id: toastId });

  const reader = new FileReader();
  reader.onloadend = async () => {
    try {
      const rawBase64 = reader.result as string;
      let finalData = rawBase64;
      
      if (isImage) {
        // High-res crisp compression (1920px max dimension, high quality 0.7)
        finalData = await compressImage(rawBase64, 1920, 1920, 0.7);
      }

      // Allow up to 25MB payload
      if (finalData.length > 25 * 1024 * 1024) {
        toast.error("File is too large for database transmission. Please choose a smaller file.", { id: toastId });
        return;
      }

      await uploadOrFallback(file, finalData, onSuccess, toastId, successMsg);
    } catch (err) {
      console.error("Upload flow error:", err);
      toast.error("Failed to complete upload. Please try a different photo/file.", { id: toastId });
    }
  };
  reader.onerror = () => {
    toast.error("Failed to read the file.", { id: toastId });
  };
  reader.readAsDataURL(file);
};
