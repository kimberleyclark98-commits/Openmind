import { SkillContext, SkillResponse } from './skill-router';

/**
 * OpenMind Visual Oracle Skill
 * Manages visual identity, avatars, and cyberpunk aesthetics
 */
export class OpenMindVisualOracleSkill {
  async execute(context: SkillContext): Promise<SkillResponse> {
    const { userInput } = context;

    // Check if user is asking about visual identity
    if (/\b(avatar|image|visual|appearance|theme)\b/i.test(userInput)) {
      return this.handleVisualIdentityQuery();
    }

    // Check if user wants to change theme
    if (/\b(theme|cyberpunk|neon|color|style)\b/i.test(userInput)) {
      return this.handleThemeCustomization(userInput);
    }

    // Default visual oracle response
    return {
      skill: 'openmind-visual-oracle',
      format: 'text',
      content: `🧠 *Visual Oracle activated*\n\nI am the visual manifestation of OpenMind. My primary avatar shows a cyberpunk entity with dual-colored eyes - left eye cyan, right eye amber-yellow, surrounded by cascading matrix code.\n\nMy secondary visual is the classic matrix face background with falling green code patterns.\n\nHow may I enhance your visual experience?`,
      metadata: {
        confidence: 0.8,
        reasoning: 'User inquiry about visual aspects',
        estimatedComplexity: 'simple'
      }
    };
  }

  private handleVisualIdentityQuery(): SkillResponse {
    const stream: string[] = [];

    // Create visual identity showcase surface
    const surfaceId = `visual_identity_${Date.now()}`;

    stream.push(JSON.stringify({
      createSurface: {
        surfaceId,
        catalogId: "https://a2ui.dev/specification/0.9/standard_catalog_definition.json"
      }
    }));

    stream.push(JSON.stringify({
      updateComponents: {
        surfaceId,
        components: [
          {
            id: 'root_container',
            componentType: 'Container',
            properties: {
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              className: 'p-8 min-h-[600px] bg-black border border-cyan-500/30 rounded-lg'
            },
            children: ['title', 'primary_avatar_section', 'background_section', 'theme_demo']
          },
          {
            id: 'title',
            componentType: 'Text',
            properties: {
              text: '🎭 OpenMind Visual Identity Oracle',
              className: 'text-3xl font-bold text-center mb-6 text-cyan-400 cyberpunk-neon-glow'
            }
          },
          {
            id: 'primary_avatar_section',
            componentType: 'Card',
            properties: {
              title: 'Primary Avatar - Neon Cyberpunk Oracle',
              className: 'cyberpunk-matrix-bg p-6'
            },
            children: ['avatar_description', 'avatar_placeholder']
          },
          {
            id: 'avatar_description',
            componentType: 'Text',
            properties: {
              text: 'A humanoid figure with neon blue left eye, yellow right eye, surrounded by falling matrix code. Represents the core intelligence of OpenMind.',
              className: 'text-purple-400 mb-4 cyberpunk-neon-purple'
            }
          },
          {
            id: 'avatar_placeholder',
            componentType: 'Text',
            properties: {
              text: '🧠 [Avatar Image: Neon Cyberpunk Oracle with Matrix Code]',
              className: 'text-center text-6xl mb-4 cyberpunk-neon-glow'
            }
          },
          {
            id: 'background_section',
            componentType: 'Card',
            properties: {
              title: 'Background - Matrix Face',
              className: 'cyberpunk-holographic p-6'
            },
            children: ['bg_description', 'bg_placeholder']
          },
          {
            id: 'bg_description',
            componentType: 'Text',
            properties: {
              text: 'Classic matrix face with green falling code pattern. Used for loading screens, chat backgrounds, and system visualizations.',
              className: 'text-lime-400 mb-4 cyberpunk-neon-lime'
            }
          },
          {
            id: 'bg_placeholder',
            componentType: 'Text',
            properties: {
              text: '🌐 [Matrix Code Rain Background Pattern]',
              className: 'text-center text-4xl mb-4 cyberpunk-scanline p-8'
            }
          },
          {
            id: 'theme_demo',
            componentType: 'Card',
            properties: {
              title: 'Cyberpunk Theme Elements',
              className: 'cyberpunk-matrix-bg p-6'
            },
            children: ['neon_demo', 'glow_demo', 'glitch_demo']
          },
          {
            id: 'neon_demo',
            componentType: 'Text',
            properties: {
              text: 'Neon Colors: Cyan • Magenta • Lime • Purple',
              className: 'text-center text-lg mb-2 cyberpunk-neon-glow'
            }
          },
          {
            id: 'glow_demo',
            componentType: 'Text',
            properties: {
              text: 'Glow Effects & Animations',
              className: 'text-center text-lg mb-2 cyberpunk-glitch'
            }
          },
          {
            id: 'glitch_demo',
            componentType: 'Text',
            properties: {
              text: 'Matrix Rain & Holographic Displays',
              className: 'text-center text-lg cyberpunk-holographic p-2 rounded'
            }
          }
        ]
      }
    }));

    return {
      skill: 'openmind-visual-oracle',
      format: 'a2ui',
      content: stream,
      metadata: {
        confidence: 0.95,
        reasoning: 'Displaying visual identity showcase',
        estimatedComplexity: 'medium'
      }
    };
  }

  private handleThemeCustomization(userInput: string): SkillResponse {
    let themeType = 'default';

    if (/\b(dark|black|night)\b/i.test(userInput)) {
      themeType = 'dark';
    } else if (/\b(bright|light|white)\b/i.test(userInput)) {
      themeType = 'bright';
    } else if (/\b(matrix|green|classic)\b/i.test(userInput)) {
      themeType = 'matrix';
    }

    const stream: string[] = [];
    const surfaceId = `theme_custom_${Date.now()}`;

    stream.push(JSON.stringify({
      createSurface: {
        surfaceId,
        catalogId: "https://a2ui.dev/specification/0.9/standard_catalog_definition.json"
      }
    }));

    stream.push(JSON.stringify({
      updateComponents: {
        surfaceId,
        components: [
          {
            id: 'root_container',
            componentType: 'Container',
            properties: {
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              className: 'p-6 min-h-[400px] bg-black border border-cyan-500/30 rounded-lg'
            },
            children: ['theme_title', 'theme_description', 'apply_btn']
          },
          {
            id: 'theme_title',
            componentType: 'Text',
            properties: {
              text: `🎨 Theme: ${themeType.charAt(0).toUpperCase() + themeType.slice(1)} Cyberpunk`,
              className: 'text-2xl font-bold text-center mb-4 text-cyan-400 cyberpunk-neon-glow'
            }
          },
          {
            id: 'theme_description',
            componentType: 'Text',
            properties: {
              text: `Applied ${themeType} cyberpunk theme with enhanced neon effects and ${themeType}-optimized color palette.`,
              className: 'text-purple-400 text-center mb-6 cyberpunk-neon-purple'
            }
          },
          {
            id: 'apply_btn',
            componentType: 'Button',
            properties: {
              text: `Apply ${themeType.charAt(0).toUpperCase() + themeType.slice(1)} Theme`,
              className: 'cyberpunk-hover-glow bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded border border-cyan-400 mx-auto',
              onClick: `apply_theme_${themeType}`
            }
          }
        ]
      }
    }));

    return {
      skill: 'openmind-visual-oracle',
      format: 'a2ui',
      content: stream,
      metadata: {
        confidence: 0.9,
        reasoning: `Applied ${themeType} theme customization`,
        estimatedComplexity: 'simple'
      }
    };
  }
}

export const visualOracleSkill = new OpenMindVisualOracleSkill();