/**
 * File Upload Testing Script
 *
 * This script tests all file upload functionality as specified in:
 * needs-testing.md - Section 13: File Upload Testing
 *
 * Run with: npx tsx scripts/test-file-uploads.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import FormData from 'form-data';
import axios, { AxiosError } from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';
const TEST_FILES_DIR = path.join(__dirname, 'test-files');

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  section: string;
}

const results: TestResult[] = [];

function logTest(section: string, name: string, passed: boolean, message: string) {
  results.push({ section, name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} ${name}: ${message}`);
}

// ============================================================
// TEST FILE CREATION
// ============================================================

async function createTestFiles() {
  console.log('\n📁 Creating test files...\n');

  if (!fs.existsSync(TEST_FILES_DIR)) {
    fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
  }

  // 1. Valid JPG - minimal valid JPEG (1x1 red pixel)
  const validJpg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xB8, 0x1E, 0xDF, 0xFF,
    0xD9
  ]);
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'valid-image.jpg'), validJpg);
  console.log('  Created: valid-image.jpg (valid JPEG)');

  // 2. Valid PNG - minimal valid PNG (1x1 white pixel)
  const validPng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR length + type
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0xFF, // compressed data
    0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
    0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'valid-image.png'), validPng);
  console.log('  Created: valid-image.png (valid PNG)');

  // 3. Valid WebP - minimal valid WebP (1x1 pixel)
  const validWebP = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x24, 0x00, 0x00, 0x00, // File size - 8
    0x57, 0x45, 0x42, 0x50, // WEBP
    0x56, 0x50, 0x38, 0x4C, // VP8L
    0x17, 0x00, 0x00, 0x00, // Chunk size
    0x2F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'valid-image.webp'), validWebP);
  console.log('  Created: valid-image.webp (valid WebP)');

  // 4. Valid GIF - minimal valid GIF (1x1 pixel)
  const validGif = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
    0x01, 0x00, 0x01, 0x00, // 1x1 dimensions
    0x00, 0x00, 0x00, // No global color table
    0x2C, 0x00, 0x00, 0x00, 0x00, // Image descriptor
    0x01, 0x00, 0x01, 0x00, 0x00, // 1x1 image
    0x02, 0x02, 0x44, 0x01, 0x00, // LZW encoded data
    0x3B // GIF trailer
  ]);
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'valid-image.gif'), validGif);
  console.log('  Created: valid-image.gif (valid GIF)');

  // 5. Invalid PDF - fake PDF
  const fakePdf = Buffer.from('%PDF-1.4\nThis is a fake PDF file for testing.\n%%EOF');
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'invalid-file.pdf'), fakePdf);
  console.log('  Created: invalid-file.pdf (PDF file)');

  // 6. Invalid EXE (PE header)
  const fakeExe = Buffer.from([
    0x4D, 0x5A, // MZ header
    0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
    0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF
  ]);
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'invalid-file.exe'), fakeExe);
  console.log('  Created: invalid-file.exe (EXE file)');

  // 7. Invalid PHP file
  const fakePhp = Buffer.from('<?php echo "malicious code"; ?>');
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'invalid-file.php'), fakePhp);
  console.log('  Created: invalid-file.php (PHP file)');

  // 8. Spoofed file - text content with .jpg extension (should fail magic byte check)
  const spoofedJpg = Buffer.from('This is not a real JPEG image, it is just plain text!');
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'spoofed-image.jpg'), spoofedJpg);
  console.log('  Created: spoofed-image.jpg (text with .jpg extension)');

  // 9. File exactly at 5MB limit (5 * 1024 * 1024 bytes)
  // We create a valid JPEG header and pad it to exactly 5MB
  const size5MB = 5 * 1024 * 1024;
  const file5MB = Buffer.alloc(size5MB);
  // Copy JPEG header
  validJpg.copy(file5MB, 0);
  // Fill the rest with repeated JPEG padding
  for (let i = validJpg.length; i < size5MB - 2; i++) {
    file5MB[i] = 0xFF;
  }
  // Add JPEG end marker
  file5MB[size5MB - 2] = 0xFF;
  file5MB[size5MB - 1] = 0xD9;
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'size-5mb.jpg'), file5MB);
  console.log('  Created: size-5mb.jpg (exactly 5MB - at limit)');

  // 10. File over 5MB limit (6MB)
  const size6MB = 6 * 1024 * 1024;
  const file6MB = Buffer.alloc(size6MB);
  validJpg.copy(file6MB, 0);
  for (let i = validJpg.length; i < size6MB - 2; i++) {
    file6MB[i] = 0xFF;
  }
  file6MB[size6MB - 2] = 0xFF;
  file6MB[size6MB - 1] = 0xD9;
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'size-6mb.jpg'), file6MB);
  console.log('  Created: size-6mb.jpg (6MB - over limit)');

  console.log('\n  All test files created!\n');
}

// ============================================================
// AUTHENTICATION
// ============================================================

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

async function login(email: string, password: string): Promise<AuthTokens> {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    // Login returns { user, accessToken, refreshToken } directly in data
    const { accessToken, refreshToken } = response.data.data;
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(`Failed to login as ${email}: ${(error as Error).message}`);
  }
}

// ============================================================
// TEST HELPERS
// ============================================================

async function uploadFile(
  token: string,
  entityType: string,
  entityId: string,
  filePath: string,
  filename?: string
): Promise<{ success: boolean; status: number; data?: any; error?: string }> {
  const form = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const finalFilename = filename || path.basename(filePath);

  form.append('file', fileBuffer, {
    filename: finalFilename,
    contentType: getMimeType(finalFilename)
  });

  try {
    const response = await axios.post(
      `${API_BASE}/media/${entityType}/${entityId}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      status: axiosError.response?.status || 500,
      error: (axiosError.response?.data as any)?.error?.message || axiosError.message
    };
  }
}

async function uploadBatchFiles(
  token: string,
  entityType: string,
  entityId: string,
  filePaths: string[]
): Promise<{ success: boolean; status: number; data?: any; error?: string }> {
  const form = new FormData();

  for (const filePath of filePaths) {
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    form.append('files', fileBuffer, {
      filename,
      contentType: getMimeType(filename)
    });
  }

  try {
    const response = await axios.post(
      `${API_BASE}/media/${entityType}/${entityId}/batch`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      status: axiosError.response?.status || 500,
      error: (axiosError.response?.data as any)?.error?.message || axiosError.message
    };
  }
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.exe': 'application/x-msdownload',
    '.php': 'text/x-php'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function deleteMedia(token: string, mediaId: string): Promise<{ success: boolean; status: number; error?: string }> {
  try {
    const response = await axios.delete(`${API_BASE}/media/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true, status: response.status };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      status: axiosError.response?.status || 500,
      error: (axiosError.response?.data as any)?.error?.message || axiosError.message
    };
  }
}

async function getMediaUrl(url: string): Promise<{ success: boolean; status: number }> {
  try {
    const response = await axios.get(url);
    return { success: true, status: response.status };
  } catch (error) {
    const axiosError = error as AxiosError;
    return { success: false, status: axiosError.response?.status || 500 };
  }
}

// ============================================================
// TEST SECTIONS
// ============================================================

async function test13_1_ValidFileUploads(token: string, tourId: string) {
  console.log('\n--- 13.1 Valid File Uploads ---\n');

  // JPG
  const jpgResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'valid-image.jpg'));
  logTest('13.1', 'Upload JPG image', jpgResult.success,
    jpgResult.success ? 'Uploaded successfully' : `Failed: ${jpgResult.error}`);

  // PNG
  const pngResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'valid-image.png'));
  logTest('13.1', 'Upload PNG image', pngResult.success,
    pngResult.success ? 'Uploaded successfully' : `Failed: ${pngResult.error}`);

  // WebP
  const webpResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'valid-image.webp'));
  logTest('13.1', 'Upload WebP image', webpResult.success,
    webpResult.success ? 'Uploaded successfully' : `Failed: ${webpResult.error}`);

  // GIF
  const gifResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'valid-image.gif'));
  logTest('13.1', 'Upload GIF image', gifResult.success,
    gifResult.success ? 'Uploaded successfully' : `Failed: ${gifResult.error}`);
}

async function test13_2_InvalidFileUploads(token: string, tourId: string) {
  console.log('\n--- 13.2 Invalid File Uploads ---\n');

  // PDF
  const pdfResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'invalid-file.pdf'));
  logTest('13.2', 'Reject PDF file', !pdfResult.success && pdfResult.status === 400,
    !pdfResult.success ? `Correctly rejected: ${pdfResult.error}` : 'ERROR: PDF was accepted!');

  // EXE
  const exeResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'invalid-file.exe'));
  logTest('13.2', 'Reject EXE file', !exeResult.success && pdfResult.status === 400,
    !exeResult.success ? `Correctly rejected: ${exeResult.error}` : 'ERROR: EXE was accepted!');

  // PHP
  const phpResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'invalid-file.php'));
  logTest('13.2', 'Reject PHP file', !phpResult.success,
    !phpResult.success ? `Correctly rejected: ${phpResult.error}` : 'ERROR: PHP was accepted!');

  // Spoofed JPG (magic byte check)
  const spoofedResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'spoofed-image.jpg'));
  logTest('13.2', 'Reject spoofed .jpg (magic byte check)', !spoofedResult.success,
    !spoofedResult.success ? `Correctly rejected: ${spoofedResult.error}` : 'ERROR: Spoofed file was accepted!');
}

async function test13_3_FileSizeLimits(token: string, tourId: string) {
  console.log('\n--- 13.3 File Size Limits ---\n');

  // File at limit (5MB)
  const file5mbPath = path.join(TEST_FILES_DIR, 'size-5mb.jpg');
  if (fs.existsSync(file5mbPath)) {
    const result5MB = await uploadFile(token, 'tour', tourId, file5mbPath);
    logTest('13.3', 'Upload file at 5MB limit', result5MB.success,
      result5MB.success ? 'Uploaded successfully (at limit)' : `Failed: ${result5MB.error}`);
  } else {
    logTest('13.3', 'Upload file at 5MB limit', false, 'Test file not found');
  }

  // File over limit (6MB)
  const file6mbPath = path.join(TEST_FILES_DIR, 'size-6mb.jpg');
  if (fs.existsSync(file6mbPath)) {
    const result6MB = await uploadFile(token, 'tour', tourId, file6mbPath);
    logTest('13.3', 'Reject file over 5MB limit (6MB)', !result6MB.success,
      !result6MB.success ? `Correctly rejected: ${result6MB.error}` : 'ERROR: Over-limit file was accepted!');
  } else {
    logTest('13.3', 'Reject file over 5MB limit', false, 'Test file not found');
  }
}

async function test13_4_MultipleBatchUpload(token: string, tourId: string) {
  console.log('\n--- 13.4 Multiple File Upload ---\n');

  // Upload 5 files at once
  const fiveFiles = [
    path.join(TEST_FILES_DIR, 'valid-image.jpg'),
    path.join(TEST_FILES_DIR, 'valid-image.png'),
    path.join(TEST_FILES_DIR, 'valid-image.webp'),
    path.join(TEST_FILES_DIR, 'valid-image.gif'),
    path.join(TEST_FILES_DIR, 'valid-image.jpg'), // duplicate is fine
  ];

  const batch5Result = await uploadBatchFiles(token, 'tour', tourId, fiveFiles);
  logTest('13.4', 'Upload 5 images at once', batch5Result.success,
    batch5Result.success ? 'All 5 uploaded successfully' : `Failed: ${batch5Result.error}`);

  // Upload 15 files (should enforce 10 max)
  const fifteenFiles = Array(15).fill(path.join(TEST_FILES_DIR, 'valid-image.jpg'));
  const batch15Result = await uploadBatchFiles(token, 'tour', tourId, fifteenFiles);

  // Check if limit enforced (either rejected or only 10 processed)
  const limitEnforced = !batch15Result.success ||
    (batch15Result.data?.data?.results?.length <= 10);
  logTest('13.4', 'Enforce 10 file limit on batch (15 files)', limitEnforced,
    limitEnforced
      ? (batch15Result.success ? 'Limit enforced (max 10 processed)' : `Correctly rejected: ${batch15Result.error}`)
      : 'ERROR: More than 10 files were accepted!');
}

async function test13_5_FileAccess(token: string, tourId: string) {
  console.log('\n--- 13.5 File Access ---\n');

  // Upload a file
  const uploadResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'valid-image.jpg'));

  if (!uploadResult.success || !uploadResult.data?.data) {
    logTest('13.5', 'Upload file for access test', false, 'Failed to upload test file');
    return;
  }

  const media = uploadResult.data.data;
  logTest('13.5', 'Upload file for access test', true, `Uploaded: ${media.id}`);

  // Check URL format (should contain UUID)
  const uuidRegex = /[0-9a-f]{8}/i;
  const hasUuid = uuidRegex.test(media.url);
  logTest('13.5', 'URL format contains UUID', hasUuid,
    hasUuid ? `URL: ${media.url}` : 'URL does not contain UUID pattern');

  // Try to access file (construct full URL)
  const fullUrl = media.url.startsWith('http')
    ? media.url
    : `http://localhost:8000${media.url}`;

  const accessResult = await getMediaUrl(fullUrl);
  logTest('13.5', 'File accessible via URL', accessResult.success && accessResult.status === 200,
    accessResult.success ? 'File is publicly accessible' : `Access failed: ${accessResult.status}`);

  return media.id; // Return for deletion test
}

async function test13_6_FileDeletion(token: string, tourId: string, mediaIdToDelete?: string) {
  console.log('\n--- 13.6 File Deletion ---\n');

  let mediaId = mediaIdToDelete;

  // If no media ID provided, upload a new file
  if (!mediaId) {
    const uploadResult = await uploadFile(token, 'tour', tourId, path.join(TEST_FILES_DIR, 'valid-image.jpg'));
    if (uploadResult.success && uploadResult.data?.data) {
      mediaId = uploadResult.data.data.id;
    }
  }

  if (!mediaId) {
    logTest('13.6', 'Prepare file for deletion', false, 'No file to delete');
    return;
  }

  logTest('13.6', 'Prepare file for deletion', true, `Media ID: ${mediaId}`);

  // Delete the file
  const deleteResult = await deleteMedia(token, mediaId);
  logTest('13.6', 'Delete file', deleteResult.success,
    deleteResult.success ? 'File deleted successfully' : `Delete failed: ${deleteResult.error}`);

  // Verify file is removed (try to get it)
  if (deleteResult.success) {
    try {
      const response = await axios.get(`${API_BASE}/media/tour/${tourId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const media = response.data.data || [];
      const stillExists = media.some((m: any) => m.id === mediaId);
      logTest('13.6', 'Verify file removed from entity', !stillExists,
        !stillExists ? 'File removed from gallery' : 'ERROR: File still exists in gallery');
    } catch {
      logTest('13.6', 'Verify file removed from entity', false, 'Failed to check gallery');
    }
  }
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         FILE UPLOAD TESTING - Section 13                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Create test files
    await createTestFiles();

    // Login as company owner (who can create tours and upload)
    console.log('🔐 Logging in as company@test.com...');
    const tokens = await login('company@test.com', 'Test@123!');
    console.log('  ✅ Logged in successfully\n');

    // Get or create a tour for testing
    console.log('🔍 Finding or creating test tour...');

    // Get the company's user ID and company ID
    const companyUser = await prisma.user.findUnique({
      where: { email: 'company@test.com' },
      include: { companyProfile: true }
    });

    if (!companyUser?.companyProfile) {
      throw new Error('Company account not found. Run setup-test-accounts.ts first.');
    }

    // Find or create a test tour
    let testTour = await prisma.tour.findFirst({
      where: { ownerId: companyUser.id }
    });

    if (!testTour) {
      testTour = await prisma.tour.create({
        data: {
          ownerId: companyUser.id,
          title: 'File Upload Test Tour',
          price: 100,
          currency: 'GEL',
          summary: 'A test tour for file upload testing',
          isActive: true
        }
      });
      console.log(`  ✅ Created test tour: ${testTour.id}\n`);
    } else {
      console.log(`  ✅ Using existing tour: ${testTour.id}\n`);
    }

    // Run all tests
    await test13_1_ValidFileUploads(tokens.accessToken, testTour.id);
    await test13_2_InvalidFileUploads(tokens.accessToken, testTour.id);
    await test13_3_FileSizeLimits(tokens.accessToken, testTour.id);
    await test13_4_MultipleBatchUpload(tokens.accessToken, testTour.id);
    const mediaId = await test13_5_FileAccess(tokens.accessToken, testTour.id);
    await test13_6_FileDeletion(tokens.accessToken, testTour.id, mediaId);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST RESULTS SUMMARY                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    // Group by section
    const sections = new Map<string, TestResult[]>();
    results.forEach(r => {
      const arr = sections.get(r.section) || [];
      arr.push(r);
      sections.set(r.section, arr);
    });

    sections.forEach((tests, section) => {
      const sectionPassed = tests.filter(t => t.passed).length;
      const sectionTotal = tests.length;
      console.log(`  ${section}: ${sectionPassed}/${sectionTotal} passed`);
    });

    console.log('\n  ────────────────────────────────────────');
    console.log(`  TOTAL: ${passed}/${total} passed (${failed} failed)`);
    console.log('  ────────────────────────────────────────\n');

    if (failed > 0) {
      console.log('❌ FAILED TESTS:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  • [${r.section}] ${r.name}: ${r.message}`);
      });
      console.log('');
    }

    if (passed === total) {
      console.log('🎉 All file upload tests passed!\n');
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run tests
runTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
