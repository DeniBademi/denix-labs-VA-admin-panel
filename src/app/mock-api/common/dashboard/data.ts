/* eslint-disable */
import { DateTime } from 'luxon';

/* Get the current instant */
const now = DateTime.now();

// Helper function to generate random data
function generateTimeSeriesData(days: number, min: number, max: number) {
    return Array.from({ length: days }, (_, i) => ({
        x: now.minus({ days: days - i }).toJSDate(),
        y: Math.floor(Math.random() * (max - min + 1)) + min
    }));
}

export const dashboard = {
    usage: {
        timeframe: 'day',
        series: [
            {
                name: 'Uses',
                data: generateTimeSeriesData(30, 100, 500)
            },
            {
                name: 'Products Recommended',
                data: generateTimeSeriesData(30, 50, 200)
            },
            {
                name: 'FAQs Answered',
                data: generateTimeSeriesData(30, 20, 100)
            }
        ]
    },
    campaignPerformance: {
        categories: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty'],
        series: [
            {
                name: 'Agent Recommendations',
                data: [120, 85, 95, 70, 110]
            },
            {
                name: 'Impressions',
                data: [320, 285, 195, 170, 210]
            }
        ]
    },
    frustration: {
        timeframe: 'day',
        series: [
            {
                name: 'Frustration Score',
                data: generateTimeSeriesData(30, 1, 10)
            }
        ]
    }
};