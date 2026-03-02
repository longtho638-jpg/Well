/**
 * Performance Monitoring Utilities — barrel re-exporting web vitals collection, device metrics, timing capture, debounce, and throttle
 * Phase 3: Scale Optimization
 */

export {
    collectWebVitals,
    ratePerformance,
    getDeviceType,
    getConnectionType,
    createPerformanceReport,
} from './performance-web-vitals-and-device-metrics-collector';

export {
    captureException,
    captureMessage,
    measureAsync,
    debounce,
    throttle,
} from './performance-timing-capture-debounce-and-throttle';
