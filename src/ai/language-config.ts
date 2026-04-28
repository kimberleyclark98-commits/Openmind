/**
 * @fileOverview Language Support Configuration for Lightning Code Generator
 *
 * Defines language-specific rules, patterns, and best practices for accurate code generation.
 */

export interface LanguageConfig {
  name: string;
  extensions: string[];
  frameworks: string[];
  patterns: {
    imports: string[];
    functions: string[];
    classes: string[];
    comments: string[];
  };
  conventions: {
    naming: {
      variables: string;
      functions: string;
      classes: string;
      constants: string;
    };
    indentation: string;
    brackets: string;
  };
  bestPractices: string[];
}

export const languageConfigs: Record<string, LanguageConfig> = {
  typescript: {
    name: 'TypeScript',
    extensions: ['.ts', '.tsx'],
    frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'NestJS'],
    patterns: {
      imports: [
        "import { useState, useEffect } from 'react'",
        "import type { NextPage } from 'next'",
        "import { z } from 'zod'"
      ],
      functions: [
        'const functionName = (param: Type): ReturnType => {}',
        'function functionName(param: Type): ReturnType {}',
        'export const functionName = async (param: Type): Promise<ReturnType> => {}'
      ],
      classes: [
        'export class ClassName implements Interface {}',
        'export interface InterfaceName {}'
      ],
      comments: [
        '// Single line comment',
        '/* Multi-line comment */',
        '/** JSDoc comment */'
      ]
    },
    conventions: {
      naming: {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        constants: 'UPPER_SNAKE_CASE'
      },
      indentation: '2 spaces',
      brackets: 'same line for functions, next line for classes'
    },
    bestPractices: [
      'Use strict TypeScript configuration',
      'Prefer interfaces over types for object shapes',
      'Use enum for fixed values',
      'Implement proper error handling with try/catch',
      'Use async/await over Promises when possible',
      'Add JSDoc comments for public APIs'
    ]
  },

  javascript: {
    name: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs'],
    frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'Vue.js'],
    patterns: {
      imports: [
        "import { useState, useEffect } from 'react'",
        "const express = require('express')",
        "import axios from 'axios'"
      ],
      functions: [
        'const functionName = (param) => {}',
        'function functionName(param) {}',
        'export const functionName = async (param) => {}'
      ],
      classes: [
        'export class ClassName {}',
        'class ClassName extends ParentClass {}'
      ],
      comments: [
        '// Single line comment',
        '/* Multi-line comment */',
        '/** JSDoc comment */'
      ]
    },
    conventions: {
      naming: {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        constants: 'UPPER_SNAKE_CASE'
      },
      indentation: '2 spaces',
      brackets: 'same line for functions and classes'
    },
    bestPractices: [
      'Use ES6+ features when possible',
      'Implement proper error handling',
      'Use async/await over Promises',
      'Add JSDoc comments for complex functions',
      'Follow modular architecture',
      'Use meaningful variable names'
    ]
  },

  python: {
    name: 'Python',
    extensions: ['.py'],
    frameworks: ['Django', 'FastAPI', 'Flask', 'Pandas', 'TensorFlow'],
    patterns: {
      imports: [
        'import os',
        'from typing import List, Dict',
        'import pandas as pd'
      ],
      functions: [
        'def function_name(param: Type) -> ReturnType:',
        'async def function_name(param: Type) -> ReturnType:'
      ],
      classes: [
        'class ClassName:',
        'class ClassName(BaseClass):'
      ],
      comments: [
        '# Single line comment',
        '"""Multi-line docstring"""'
      ]
    },
    conventions: {
      naming: {
        variables: 'snake_case',
        functions: 'snake_case',
        classes: 'PascalCase',
        constants: 'UPPER_SNAKE_CASE'
      },
      indentation: '4 spaces',
      brackets: 'not applicable'
    },
    bestPractices: [
      'Follow PEP 8 style guide',
      'Use type hints for function parameters and return values',
      'Write comprehensive docstrings',
      'Handle exceptions properly',
      'Use list comprehensions when appropriate',
      'Follow the principle of least surprise'
    ]
  },

  rust: {
    name: 'Rust',
    extensions: ['.rs'],
    frameworks: ['Tokio', 'Axum', 'Rocket', 'Diesel'],
    patterns: {
      imports: [
        'use std::collections::HashMap;',
        'use tokio::time::{sleep, Duration};',
        'use serde::{Serialize, Deserialize};'
      ],
      functions: [
        'fn function_name(param: Type) -> ReturnType {}',
        'async fn function_name(param: Type) -> ReturnType {}',
        'pub fn function_name(param: Type) -> ReturnType {}'
      ],
      classes: [
        'struct StructName {}',
        'enum EnumName {}',
        'impl StructName {}'
      ],
      comments: [
        '// Single line comment',
        '/* Multi-line comment */',
        '/// Documentation comment'
      ]
    },
    conventions: {
      naming: {
        variables: 'snake_case',
        functions: 'snake_case',
        classes: 'PascalCase',
        constants: 'UPPER_SNAKE_CASE'
      },
      indentation: '4 spaces',
      brackets: 'same line'
    },
    bestPractices: [
      'Embrace zero-cost abstractions',
      'Use Result and Option types for error handling',
      'Write comprehensive unit tests',
      'Follow ownership and borrowing principles',
      'Use meaningful variable names',
      'Document public APIs with rustdoc'
    ]
  },

  go: {
    name: 'Go',
    extensions: ['.go'],
    frameworks: ['Gin', 'Echo', 'Fiber', 'GORM'],
    patterns: {
      imports: [
        'import "fmt"',
        'import ("net/http"; "encoding/json")',
        'import "github.com/gin-gonic/gin"'
      ],
      functions: [
        'func functionName(param Type) ReturnType {}',
        'func (r *Receiver) methodName(param Type) ReturnType {}'
      ],
      classes: [
        'type StructName struct {}',
        'type InterfaceName interface {}'
      ],
      comments: [
        '// Single line comment',
        '/* Multi-line comment */'
      ]
    },
    conventions: {
      naming: {
        variables: 'camelCase',
        functions: 'PascalCase (exported), camelCase (unexported)',
        classes: 'PascalCase',
        constants: 'camelCase or PascalCase'
      },
      indentation: 'tabs',
      brackets: 'same line'
    },
    bestPractices: [
      'Follow Go naming conventions',
      'Use gofmt for formatting',
      'Handle errors explicitly',
      'Use channels for concurrency',
      'Write comprehensive tests',
      'Document exported functions and types'
    ]
  }
};

export function getLanguageConfig(language: string): LanguageConfig | null {
  return languageConfigs[language.toLowerCase()] || null;
}

export function getSupportedLanguages(): string[] {
  return Object.keys(languageConfigs);
}