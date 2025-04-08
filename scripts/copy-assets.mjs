#!/usr/bin/env node

/**
 * This script copies assets from the content directory to the public directory
 * making them available to the web application.
 * 
 * It specifically looks for image files referenced in content using ![[image.png]] syntax,
 * ensuring they're correctly copied to the public directory with the appropriate path structure.
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Define directories
const contentDir = path.join(projectRoot, 'content');
const publicAssetsDir = path.join(projectRoot, 'public', 'content', 'assets');

// Supported image file extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];
// Additional file extensions to support (documents, etc.)
const ADDITIONAL_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
const SUPPORTED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...ADDITIONAL_EXTENSIONS];

/**
 * Find all image file references in content Markdown files
 * @param {string} dir - Directory to scan
 * @param {Set<string>} fileRefs - Set to collect file references
 */
async function findEmbedReferences(dir, fileRefs) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        await findEmbedReferences(fullPath, fileRefs);
      } else if (entry.name.endsWith('.md')) {
        // Read Markdown files to find embed references
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          
          // Look for ![[file.ext]] syntax
          const embedRegex = /!\[\[([^\]]+)\]\]/g;
          let match;
          
          while ((match = embedRegex.exec(content)) !== null) {
            const [_, ref] = match;
            // Only add files with supported extensions
            const ext = path.extname(ref).toLowerCase();
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
              fileRefs.add(ref);
            }
          }
          
          // Also look for [[file.ext]] syntax (might be links to assets)
          const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
          
          while ((match = wikiLinkRegex.exec(content)) !== null) {
            const [_, ref] = match;
            const ext = path.extname(ref).toLowerCase();
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
              fileRefs.add(ref);
            }
          }
        } catch (error) {
          console.error(`Error reading ${fullPath}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
}

/**
 * Find actual asset files in the content directory
 * @param {string} dir - Directory to scan
 * @param {Map<string, string>} assetFiles - Map of asset filenames to full paths
 */
async function findAssetFiles(dir, assetFiles) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        await findAssetFiles(fullPath, assetFiles);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          // Store both the filename and the full path
          assetFiles.set(entry.name, fullPath);
          
          // Also store path variants (with subdirectories)
          const relativePath = path.relative(contentDir, fullPath);
          assetFiles.set(relativePath, fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning for assets in ${dir}:`, error.message);
  }
}

/**
 * Copy asset files to the public directory
 * @param {Set<string>} fileRefs - References to files to copy
 * @param {Map<string, string>} assetFiles - Map of asset filenames to full paths
 */
async function copyAssets(fileRefs, assetFiles) {
  // Ensure the public assets directory exists
  if (!existsSync(publicAssetsDir)) {
    mkdirSync(publicAssetsDir, { recursive: true });
  }
  
  const copied = new Set();
  const notFound = new Set();
  
  for (const ref of fileRefs) {
    // Look for the asset file by name or relative path
    const assetPath = assetFiles.get(ref);
    
    if (assetPath) {
      try {
        // Create the target path
        const targetPath = path.join(publicAssetsDir, ref);
        
        // Ensure the target directory exists
        const targetDir = path.dirname(targetPath);
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy the file
        await fs.copyFile(assetPath, targetPath);
        copied.add(ref);
      } catch (error) {
        console.error(`Error copying ${ref}:`, error.message);
      }
    } else {
      notFound.add(ref);
    }
  }
  
  return { copied, notFound };
}

/**
 * Main function to copy assets
 */
async function main() {
  console.log('🔍 Scanning content for asset references...');
  
  // Step 1: Find all asset references in content files
  const fileRefs = new Set();
  await findEmbedReferences(contentDir, fileRefs);
  
  console.log(`Found ${fileRefs.size} asset references in content files.`);
  
  // Step 2: Find all asset files in the content directory
  const assetFiles = new Map();
  await findAssetFiles(contentDir, assetFiles);
  
  console.log(`Found ${assetFiles.size} asset files in the content directory.`);
  
  // Step 3: Copy referenced asset files to the public directory
  console.log('📋 Copying assets to public directory...');
  const { copied, notFound } = await copyAssets(fileRefs, assetFiles);
  
  console.log(`✅ Successfully copied ${copied.size} assets to public directory.`);
  
  if (notFound.size > 0) {
    console.warn(`⚠️ ${notFound.size} referenced assets were not found:`);
    // Show first 5 not found assets
    [...notFound].slice(0, 5).forEach(file => console.warn(`   - ${file}`));
    if (notFound.size > 5) {
      console.warn(`   and ${notFound.size - 5} more...`);
    }
  }
  
  console.log('✨ Asset copy process complete!');
}

// Run the main function
main().catch(error => {
  console.error('Error copying assets:', error);
  process.exit(1);
});
