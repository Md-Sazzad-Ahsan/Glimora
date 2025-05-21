import { NextResponse } from 'next/server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Ensure tmp directory exists
    const tmpDir = join(process.cwd(), 'tmp');
    try {
      await mkdir(tmpDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Error creating tmp directory:', mkdirError);
    }

    // Create a temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join(process.cwd(), 'tmp', file.name);
    
    console.log('Processing PDF file:', {
      name: file.name,
      size: buffer.length,
      tempPath
    });

    try {
      await writeFile(tempPath, buffer);
      console.log('Successfully wrote temp file to:', tempPath);
      
      // Extract text from PDF
      const pdfLoader = new PDFLoader(tempPath);
      const pdfDocs = await pdfLoader.load();
      const text = pdfDocs.map(doc => doc.pageContent).join('\n');
      console.log('PDF processing complete, extracted text length:', text.length);

      // Clean up the temporary file
      try {
        await unlink(tempPath);
        console.log('Temporary file cleaned up successfully');
      } catch (unlinkError) {
        console.error('Error cleaning up temp file:', unlinkError);
      }

      return NextResponse.json({ text });
    } catch (error) {
      console.error('Error processing PDF:', {
        error: error.message,
        stack: error.stack
      });

      // Clean up the temporary file in case of error
      try {
        await unlink(tempPath);
        console.log('Cleaned up temp file after error');
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Top level error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
} 