import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        // STEP 1: NLP Intent Parsing
        // This is the ONLY LLM call for filters.
        const { object: filters } = await generateObject({
            model: google('gemini-2.5-flash'),
            system: 'You are an intent parser for a Bangalore restaurant app. Extract filters from the user query. If a filter is not mentioned, leave it null.',
            prompt: query,
            schema: z.object({
                location: z.string().nullable(),
                cuisines: z.array(z.string()).nullable(),
                min_rating: z.number().nullable(),
                pure_veg: z.boolean().nullable(),
            })
        });

        // STEP 2: Stream-filter the 50K+ row CSV dataset (no LLM needed)
        const csvPath = path.join(process.cwd(), '../phase_1_data_pipeline/zomato_cleaned.csv');
        const results: any[] = [];

        const matchesLoc = (r: any, target: string) =>
            !target || (typeof r.location === 'string' && r.location.toLowerCase().includes(target));
        const matchesCuisine = (r: any, target: string[]) => {
            if (!target || target.length === 0) return true;
            const t = target[0].toLowerCase();
            return typeof r.cuisines === 'string' && r.cuisines.toLowerCase().includes(t);
        };
        const matchesRating = (r: any, target: number | null) =>
            !target || parseFloat(r.rating) >= target;

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(parse({ columns: true, skip_empty_lines: true }))
                .on('data', (row) => {
                    if (results.length >= 4) return; // Stop collecting after 4 hits
                    if (
                        matchesLoc(row, filters.location?.toLowerCase() || '') &&
                        matchesCuisine(row, filters.cuisines || []) &&
                        matchesRating(row, filters.min_rating)
                    ) {
                        results.push(row);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Select top 4 matched restaurant records to enrich
        const topResults = results.slice(0, 4).map((r: any) => ({
            id: r.url,
            name: r.name,
            rating: parseFloat(r.rating) || 4.0,
            cuisines: typeof r.cuisines === 'string'
                ? r.cuisines.split(',').map((c: string) => c.trim()).slice(0, 3)
                : [],
            location: r.location || ''
        }));

        // STEP 3: Generate ALL vibe summaries in ONE single LLM call
        // This replaces the 4 separate /api/summarize calls from individual cards
        let restaurantsWithVibes = topResults;
        if (topResults.length > 0) {
            const restaurantList = topResults.map((r, i) =>
                `${i + 1}. ${r.name} in ${r.location} (${r.cuisines.join(', ')}) - Rated ${r.rating}`
            ).join('\n');

            const { object: vibeResult } = await generateObject({
                model: google('gemini-2.5-flash'),
                system: `You are a professional culinary critic in Bangalore. Your task is to write a punchy, engaging 1-sentence \"vibe summary\" for the restaurants provided. Focus strictly on their cuisine, reputation, ambiance, and location. DO NOT mention the user's search query or \"perfect match\" phrasing. Be objective yet enticing.`,
                prompt: `Write a short 1-sentence vibe summary for each restaurant listed based ONLY on their name, location, cuisine, and rating. Return them in order. Keep each under 18 words.\n\n${restaurantList}`,
                schema: z.object({
                    vibes: z.array(z.string()).describe('Array of vibe summaries, one per restaurant in order')
                })
            });

            restaurantsWithVibes = topResults.map((r, i) => ({
                ...r,
                vibe_summary: vibeResult.vibes[i] || ''
            }));
        }

        return NextResponse.json({
            active_filters: filters,
            restaurants: restaurantsWithVibes
        });

    } catch (error: any) {
        console.error("Recommend Endpoint Error", error);
        return NextResponse.json({ error: "Failed to process recommendation" }, { status: 500 });
    }
}
