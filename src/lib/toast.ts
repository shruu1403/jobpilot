import hotToast, { ToastOptions, Renderable } from 'react-hot-toast';

const calculateDuration = (msg: Renderable) => {
  if (typeof msg === 'string') {
    const wordCount = msg.split(/\s+/).filter(Boolean).length;
    // 5 seconds for <= 7 words, 8 seconds for > 7 words
    return wordCount > 7 ? 8000 : 5000;
  }
  return 5000; 
};

// Create a wrapper function that mimics the signature of react-hot-toast
export const toast = (message: Renderable, options?: ToastOptions) => {
  return hotToast(message, {
    duration: calculateDuration(message),
    ...options,
  });
};

// Attach the sub-methods
toast.success = (message: Renderable, options?: ToastOptions) => {
  return hotToast.success(message, {
    duration: calculateDuration(message),
    ...options,
  });
};

toast.error = (message: Renderable, options?: ToastOptions) => {
  return hotToast.error(message, {
    duration: calculateDuration(message),
    ...options,
  });
};

toast.loading = (message: Renderable, options?: ToastOptions) => {
  return hotToast.loading(message, { ...options });
};

toast.promise = hotToast.promise;
toast.custom = hotToast.custom;
toast.dismiss = hotToast.dismiss;
toast.remove = hotToast.remove;
