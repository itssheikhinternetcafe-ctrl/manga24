/**
 * Manga24 Admin AI Writing Studio - Gemini API Integration
 * 
 * NOTE: Uses @google/genai SDK with gemini-3.8-flash model.
 * In development / static client mode, reads from VITE_GEMINI_API_KEY.
 * In production environments, client API keys should be proxied through a serverless backend.
 */

import { GoogleGenAI } from '@google/genai';

function getApiKey(): string {
  // Check VITE_GEMINI_API_KEY, fallback to stored admin session key or process env
  const key =
    import.meta.env.VITE_GEMINI_API_KEY ||
    localStorage.getItem('manga24_admin_gemini_key') ||
    '';
  return key;
}

export function hasGeminiApiKey(): boolean {
  const k = getApiKey();
  return Boolean(k && !k.includes('MY_VITE_GEMINI_API_KEY') && k.length > 10);
}

export function saveAdminGeminiKey(key: string): void {
  localStorage.setItem('manga24_admin_gemini_key', key.trim());
}

export interface StoryIdeaParams {
  genre: string;
  tone: string;
  themes: string;
  targetAudience: string;
  format: string; // Manga, Manhwa, Webtoon, Novel
}

export interface WorldBuildingParams {
  storyPremise: string;
  genre: string;
  magicOrTechSystem?: string;
}

export interface ChapterOutlineParams {
  storyTitle: string;
  synopsis: string;
  characters: string;
  targetChapterCount: number;
}

export interface FullChapterDraftParams {
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle?: string;
  outlineOrScenePrompt: string;
  writingStyle: 'Web Novel Prose' | 'Cinematic Manga Script' | 'Light Novel Style' | 'Gritty Realism';
  length: 'Short (~800 words)' | 'Standard (~1,500 words)' | 'Detailed (~2,500 words)';
}

export interface SeriesMetadataParams {
  concept: string;
  type: string;
  tone: string;
}

export const aiWriter = {
  /**
   * Helper to invoke Gemini safely with strict original creative content guardrails
   */
  async invokeGemini(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey || apiKey.includes('MY_VITE_GEMINI_API_KEY')) {
      throw new Error(
        'Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file or enter your API key in the AI Studio settings.'
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const combinedPrompt = `${systemPrompt}\n\nSTRICT CREATIVE MANDATE: All output must be 100% original creative writing. Never imitate or reproduce existing copyrighted stories, characters, or text from commercial manga, anime, or books.\n\nUSER REQUEST:\n${userPrompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: combinedPrompt,
    });

    const outputText = response.text?.trim();
    if (!outputText) {
      throw new Error('Received an empty response from Gemini.');
    }
    return outputText;
  },

  /**
   * 1. Generate Original Story Ideas
   */
  async generateStoryIdea(params: StoryIdeaParams): Promise<string> {
    const system = `You are a visionary narrative designer and creative director specializing in original manga, webtoons, and serial fiction.`;
    const user = `Generate 3 completely ORIGINAL story pitches with the following criteria:
- Genre: ${params.genre}
- Tone: ${params.tone}
- Format: ${params.format}
- Target Demographic: ${params.targetAudience}
- Core Themes / Keywords: ${params.themes || 'High stakes, unique twist, personal growth'}

For each story pitch, provide:
1. Catchy Working Title & Alternative Title
2. Logline / High-Concept Hook (1-2 punchy sentences)
3. The Protagonist & Their Unique Flaw/Ability
4. The Central Conflict & Antagonistic Force
5. The "Unfair Advantage" / Hook that hooks readers by chapter 3`;

    return this.invokeGemini(system, user);
  },

  /**
   * 2. Generate Character Profiles and World Lore
   */
  async generateCharacterAndWorld(params: WorldBuildingParams): Promise<string> {
    const system = `You are a master worldbuilder and character architect for serialized fiction.`;
    const user = `Based on this story premise:
"${params.storyPremise}"
Genre: ${params.genre}
Additional elements: ${params.magicOrTechSystem || 'Organic progression system'}

Create a comprehensive World & Cast Bible:
1. Protagonist: Name, archetype, driving desire, secret vulnerability, signature move/trait.
2. Primary Antagonist or Counterpart: Name, conflicting philosophy, why they believe they are right.
3. Key Supporting Allies: 2 distinct companions with memorable personality contrasts.
4. Setting & World Lore: The governing laws, societal factions, and visual aesthetic.
5. Power System / Rules: The limits, costs, and unique mechanics of how powers or special abilities function (preventing overpowered tropes).`;

    return this.invokeGemini(system, user);
  },

  /**
   * 3. Generate Chapter-by-Chapter Outline
   */
  async generateChapterOutline(params: ChapterOutlineParams): Promise<string> {
    const system = `You are an expert story pacing and serialization outline consultant.`;
    const user = `Create a ${params.targetChapterCount}-chapter episodic arc outline for:
Title: ${params.storyTitle}
Premise: ${params.synopsis}
Key Characters: ${params.characters}

For each chapter (from Chapter 1 to Chapter ${params.targetChapterCount}), outline:
- Chapter Title: (e.g. Chapter 1: The Shattered Crucible)
- Inciting Hook: How the chapter grabs attention immediately
- Escalation: Key dialogue or action beat
- The Cliffhanger / Page-Turner: The unresolved question that forces the reader to continue to the next chapter`;

    return this.invokeGemini(system, user);
  },

  /**
   * 4. Write a Full Chapter Draft (Prose or Script)
   */
  async generateFullChapterDraft(params: FullChapterDraftParams): Promise<string> {
    const system = `You are a bestselling serial novelist and narrative writer. Write immersive, highly engaging, dynamic chapter prose with crisp pacing and evocative sensory details.`;
    const user = `Write a complete, publication-ready chapter draft:
Series: "${params.seriesTitle}"
Chapter ${params.chapterNumber}: ${params.chapterTitle || 'The Turning Point'}
Style: ${params.writingStyle}
Target Word Length: ${params.length}

Scene Outline / Directive:
${params.outlineOrScenePrompt}

Structure instructions:
- Begin with an arresting opening sensory detail or immediate in-media-res moment.
- Weave fluid dialogue with distinctive character voices.
- Use natural paragraph breaks for high readability on desktop and mobile screens.
- Build up to an intense mid-chapter climax and culminate in an authentic cliffhanger.
- Deliver ONLY the creative story text ready for publishing.`;

    return this.invokeGemini(system, user);
  },

  /**
   * 5. Generate Series Metadata (Synopsis, Alt Titles, Tags)
   */
  async generateSeriesMetadata(params: SeriesMetadataParams): Promise<{ synopsis: string; altTitles: string[]; tags: string[]; genres: string[] }> {
    const system = `You are a publishing metadata editor for manga, manhwa, and web novel platforms.`;
    const user = `Given this series concept:
"${params.concept}"
Format: ${params.type}
Tone: ${params.tone}

Output a clean JSON object ONLY (without markdown code fences) with the exact keys:
{
  "synopsis": "A compelling 3-4 sentence blurb designed to hook readers on browse pages",
  "altTitles": ["Title 1", "Title 2 (Transliterated)", "Title 3"],
  "genres": ["Genre1", "Genre2", "Genre3"],
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"]
}`;

    const raw = await this.invokeGemini(system, user);
    try {
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        synopsis: raw,
        altTitles: ['Original Chronicle', 'The Chosen Path'],
        genres: ['Action', 'Fantasy'],
        tags: ['Original', 'Adventure', 'Epic', 'Progression', 'Mystery'],
      };
    }
  },

  /**
   * 6. Generate Cover Art Visual Prompt for Image Generators
   */
  async generateCoverArtPrompt(title: string, synopsis: string, style = 'Modern Korean Webtoon'): Promise<string> {
    const system = `You are an art director crafting descriptive visual prompts for digital illustrators and AI image generators.`;
    const user = `Create a prompt for a high-impact cover illustration:
Series Title: "${title}"
Synopsis: "${synopsis}"
Visual Style: ${style}

Provide:
1. A rich Midjourney/DALL-E prompt string including focal character pose, lighting, atmospheric color palette, background environment, and dynamic camera angle.
2. Suggested Color Palette Hex codes (Primary, Accent, Background).
3. Composition advice for title typography placement.`;

    return this.invokeGemini(system, user);
  },

  /**
   * 7. Refine / Modify Generated Text (Longer, Improve Dialogue, Translate)
   */
  async refineText(text: string, action: 'longer' | 'dialogue' | 'translate_hindi' | 'translate_english' | 'polish'): Promise<string> {
    const system = `You are an expert creative editor and bilingual translator.`;

    let instruction = '';
    switch (action) {
      case 'longer':
        instruction = 'Expand this chapter draft significantly with deeper internal monologue, atmospheric world sensory details, and extended dialogue tension while maintaining the narrative voice.';
        break;
      case 'dialogue':
        instruction = 'Sharpen and elevate all character dialogue in this text. Make each line punchier, subtext-rich, distinctive, and emotionally resonant.';
        break;
      case 'translate_hindi':
        instruction = 'Translate this creative fiction text into natural, evocative Hindi (Devanagari script), preserving the poetic flair, character tone, and heroic tension.';
        break;
      case 'translate_english':
        instruction = 'Translate or adapt this creative fiction text into polished, evocative, publication-standard English.';
        break;
      case 'polish':
      default:
        instruction = 'Line-edit and polish this text for supreme literary flow, vivid pacing, and flawless grammar.';
    }

    const user = `Directive: ${instruction}\n\nOriginal Text:\n${text}`;
    return this.invokeGemini(system, user);
  },
};
