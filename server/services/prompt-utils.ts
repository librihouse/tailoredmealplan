/**
 * Prompt Utilities
 * Utilities for prompt building, token estimation, and optimization
 */

/**
 * Estimate token count for a string (rough approximation)
 * OpenAI uses ~4 characters per token on average for English text
 */
export function estimateTokens(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // Rough estimation: ~4 characters per token
  // This is a simplified approximation; actual tokenization is more complex
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  return estimatedTokens;
}

/**
 * Estimate total tokens for a prompt including system and user messages
 */
export function estimatePromptTokens(systemMessage: string, userMessage: string): number {
  const systemTokens = estimateTokens(systemMessage);
  const userTokens = estimateTokens(userMessage);
  
  // Add overhead for message formatting (role, content structure, etc.)
  const overhead = 10;
  
  return systemTokens + userTokens + overhead;
}

/**
 * Check if prompt is too long (exceeds safe limits)
 * GPT-4o-mini has context window of 128k tokens, but we want to stay well under
 */
export function isPromptTooLong(systemMessage: string, userMessage: string, maxTokens: number = 100000): boolean {
  const totalTokens = estimatePromptTokens(systemMessage, userMessage);
  return totalTokens > maxTokens;
}

/**
 * Compress prompt by removing redundant sections
 * This is a basic implementation - can be enhanced
 */
export function compressPrompt(prompt: string, maxLength: number = 50000): string {
  if (prompt.length <= maxLength) {
    return prompt;
  }

  // If prompt is too long, try to compress by:
  // 1. Removing excessive whitespace
  let compressed = prompt.replace(/\n{4,}/g, '\n\n');
  compressed = compressed.replace(/[ \t]{3,}/g, '  ');

  // 2. If still too long, truncate less critical sections
  if (compressed.length > maxLength) {
    // Keep the first part (critical requirements) and last part (output format)
    const criticalPart = compressed.substring(0, maxLength * 0.6);
    const formatPart = compressed.substring(compressed.length - maxLength * 0.3);
    compressed = criticalPart + '\n\n[... sections omitted for brevity ...]\n\n' + formatPart;
  }

  return compressed;
}

/**
 * Validate prompt structure before sending to API
 */
export function validatePrompt(prompt: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!prompt || typeof prompt !== 'string') {
    errors.push('Prompt is empty or invalid');
    return { valid: false, errors };
  }

  if (prompt.length < 100) {
    errors.push('Prompt is too short (minimum 100 characters)');
  }

  if (prompt.length > 200000) {
    errors.push('Prompt is too long (maximum 200,000 characters)');
  }

  // Check for required sections
  const requiredSections = [
    'USER PROFILE',
    'DIETARY REQUIREMENTS',
    'OUTPUT FORMAT',
  ];

  requiredSections.forEach(section => {
    if (!prompt.includes(section)) {
      errors.push(`Missing required section: ${section}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get prompt statistics for monitoring
 */
export function getPromptStats(prompt: string): {
  length: number;
  estimatedTokens: number;
  lineCount: number;
  sectionCount: number;
} {
  const lines = prompt.split('\n');
  const sections = prompt.match(/^[A-Z][A-Z\s&]+$/gm) || [];

  return {
    length: prompt.length,
    estimatedTokens: estimateTokens(prompt),
    lineCount: lines.length,
    sectionCount: sections.length,
  };
}

