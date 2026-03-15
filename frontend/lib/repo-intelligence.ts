/**
 * KanClaw Repo Intelligence Service
 * 
 * Manages repository/workspace context:
 * - Index structure and important paths
 * - File metadata and patterns
 * - Prepare context without confusing remote vs local
 * - Support Files and Board layers
 */

import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export interface WorkspaceFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  isEditable?: boolean;
}

export interface WorkspaceIndex {
  projectSlug: string;
  rootPath: string;
  files: WorkspaceFile[];
  lastIndexed: string;
  totalFiles: number;
  totalDirs: number;
}

// Important file patterns
const IMPORTANT_PATTERNS = [
  '**/package.json',
  '**/tsconfig.json',
  '**/next.config.*',
  '**/.env*',
  '**/README*',
  '**/CHANGELOG*',
  '**/*.md',
  '**/prisma/**/*.prisma',
  '**/app/api/**',
  '**/components/**',
  '**/lib/**',
  '**/hooks/**',
  '**/utils/**',
];

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  '*.log',
  '.DS_Store',
  'coverage/**',
];

// Get workspace root path for a project
export function getProjectWorkspacePath(projectSlug: string): string {
  // In production, this would be a configured path
  // For now, use a convention
  return `/home/smouj/projects/${projectSlug}`;
}

// Check if path is important
function isImportantFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.endsWith('.md') ||
    lower.endsWith('.json') ||
    lower.endsWith('.ts') ||
    lower.endsWith('.tsx') ||
    lower.endsWith('.js') ||
    lower.endsWith('.jsx') ||
    lower.includes('config') ||
    lower.includes('package')
  );
}

// Check if path should be ignored
function shouldIgnore(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.includes('node_modules') ||
    lower.includes('.git') ||
    lower.includes('dist') ||
    lower.includes('build') ||
    lower.includes('.next') ||
    lower.includes('coverage') ||
    lower.endsWith('.log') ||
    lower.endsWith('.lock')
  );
}

// Index workspace files
export async function indexWorkspace(projectSlug: string): Promise<WorkspaceIndex> {
  const rootPath = getProjectWorkspacePath(projectSlug);
  
  const files: WorkspaceFile[] = [];
  let totalDirs = 0;
  
  // Recursive walk (simplified, depth-limited)
  function walkDir(dir: string, depth: number = 0) {
    if (depth > 5) return; // Max depth
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootPath, fullPath);
        
        if (shouldIgnore(relativePath)) continue;
        
        if (entry.isDirectory()) {
          totalDirs++;
          walkDir(fullPath, depth + 1);
        } else {
          try {
            const stats = fs.statSync(fullPath);
            files.push({
              path: relativePath,
              name: entry.name,
              type: 'file',
              size: stats.size,
              modified: stats.mtime.toISOString(),
              isEditable: isEditableFile(relativePath)
            });
          } catch {}
        }
      }
    } catch {
      // Permission or other error, skip
    }
  }
  
  try {
    walkDir(rootPath);
  } catch {
    // Root doesn't exist, return empty
  }
  
  return {
    projectSlug,
    rootPath,
    files,
    lastIndexed: new Date().toISOString(),
    totalFiles: files.length,
    totalDirs
  };
}

// Check if file is editable
function isEditableFile(filePath: string): boolean {
  const editable = /\.(ts|tsx|js|jsx|md|txt|json|yaml|yml|css|scss|prisma)$/i;
  return editable.test(filePath);
}

// Get file tree structure (for UI)
export async function getWorkspaceTree(
  projectSlug: string,
  maxDepth: number = 3
): Promise<WorkspaceFile[]> {
  const rootPath = getProjectWorkspacePath(projectSlug);
  const result: WorkspaceFile[] = [];
  
  function buildTree(dir: string, depth: number = 0) {
    if (depth > maxDepth) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => {
          // Directories first, then files
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootPath, fullPath);
        
        if (shouldIgnore(relativePath)) continue;
        
        const file: WorkspaceFile = {
          path: relativePath,
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file'
        };
        
        if (!entry.isDirectory()) {
          try {
            const stats = fs.statSync(fullPath);
            file.size = stats.size;
            file.modified = stats.mtime.toISOString();
            file.isEditable = isEditableFile(relativePath);
          } catch {}
        }
        
        result.push(file);
        
        if (entry.isDirectory()) {
          buildTree(fullPath, depth + 1);
        }
      }
    } catch {}
  }
  
  try {
    buildTree(rootPath);
  } catch {}
  
  return result;
}

// Search files by pattern
export async function searchWorkspace(
  projectSlug: string,
  query: string,
  options: {
    extensions?: string[];
    limit?: number;
  } = {}
): Promise<WorkspaceFile[]> {
  const { extensions, limit = 50 } = options;
  const tree = await getWorkspaceTree(projectSlug, 4);
  const q = query.toLowerCase();
  
  return tree
    .filter(f => {
      // Filter by extension if specified
      if (extensions?.length) {
        const ext = path.extname(f.path).slice(1);
        if (!extensions.includes(ext)) return false;
      }
      
      // Filter by query
      return f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
    })
    .slice(0, limit);
}

// Read file content (safe)
export async function readWorkspaceFile(
  projectSlug: string,
  filePath: string,
  maxBytes: number = 50000
): Promise<string> {
  const rootPath = getProjectWorkspacePath(projectSlug);
  const fullPath = path.join(rootPath, filePath);
  
  // Security: prevent directory traversal
  if (!fullPath.startsWith(rootPath)) {
    throw new Error('Invalid path');
  }
  
  const stats = await fs.promises.stat(fullPath);
  if (stats.size > maxBytes) {
    return `[File too large: ${stats.size} bytes, max ${maxBytes}]`;
  }
  
  return fs.readFileSync(fullPath, 'utf-8');
}

// Get file metadata
export async function getFileMetadata(
  projectSlug: string,
  filePath: string
): Promise<WorkspaceFile | null> {
  const rootPath = getProjectWorkspacePath(projectSlug);
  const fullPath = path.join(rootPath, filePath);
  
  if (!fullPath.startsWith(rootPath)) {
    return null;
  }
  
  try {
    const stats = await fs.promises.stat(fullPath);
    return {
      path: filePath,
      name: path.basename(filePath),
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      modified: stats.mtime.toISOString(),
      isEditable: stats.isFile() && isEditableFile(filePath)
    };
  } catch {
    return null;
  }
}

// Get important paths for context
export async function getImportantPaths(projectSlug: string): Promise<string[]> {
  const tree = await getWorkspaceTree(projectSlug, 4);
  
  return tree
    .filter(f => f.isEditable && isImportantFile(f.path))
    .map(f => f.path);
}
