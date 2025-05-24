import React from 'react';
import { BsFillArrowUpCircleFill } from "react-icons/bs";
import { GrStatusPlaceholder } from "react-icons/gr";
import { MdOutlineAttachFile, MdOutlineLightbulb } from "react-icons/md";
import { RiImageAddFill } from "react-icons/ri";
import { IoGlobeOutline } from "react-icons/io5";
import { AiFillFilePdf } from "react-icons/ai";

const ChatInputArea = ({
  inputMessage,
  setInputMessage,
  handleSubmit,
  isLoading,
  stopGenerating,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  showFileDropdown,
  setShowFileDropdown,
  handleFileTypeSelect,
  showFileModal,
  setShowFileModal,
  webSearchMode,
  setWebSearchMode,
  aiSummarizeMode,
  setAiSummarizeMode
}) => (
  <div className="">
    <div className="relative max-w-5xl mx-auto">
      <div className="relative">
        <form onSubmit={handleSubmit} className="px-4">
          <div className="relative rounded-xl border border-orange-300 dark:border-orange-300 shadow-inner bg-white dark:bg-gray-600">
            {selectedFile && (
              <div className="px-3 pt-2">
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-600">
                  <AiFillFilePdf className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                  <button
                    type="button"
                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.fileToProcess = null;
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <textarea
              className={`w-full px-3 ${selectedFile ? 'pt-2' : 'pt-5'} pb-3 pr-8 bg-transparent text-gray-800 dark:text-gray-200 resize-none focus:outline-none pl-5`}
              rows="1"
              placeholder="Ask anything..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={false}
            ></textarea>
            <button 
              type={isLoading ? "button" : "submit"}
              className="absolute right-2 top-2.5 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-600 rounded touch-manipulation"
              disabled={!inputMessage.trim() && !isLoading && !selectedFile}
              onClick={isLoading ? (e) => { e.preventDefault(); stopGenerating(); } : undefined}
            >
              {isLoading ? (
                <GrStatusPlaceholder className="h-7 w-7 text-gray-400 dark:text-gray-100 border border-gray-600 dark:border-gray-100 rounded-md bg-gray-300" />
              ) : (
                <BsFillArrowUpCircleFill className="h-8 w-8 text-gray-400 dark:text-gray-100" />
              )}
            </button>
            <div className="px-3 py-2">
              <div className="flex items-center space-x-1">
                {/* File upload button with dropdown */}
                <div className="relative group">
                  <button
                    type="button"
                    className="p-1 transition-colors rounded-md"
                    onClick={() => setShowFileDropdown(!showFileDropdown)}
                    disabled={isLoading}
                  >
                    <MdOutlineAttachFile className="h-7 w-7 text-gray-400 dark:text-gray-200" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Attach file
                  </div>
                  {/* File type dropdown */}
                  {showFileDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[120px]">
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        onClick={() => handleFileTypeSelect()}
                      >
                        <AiFillFilePdf className="h-4 w-4" />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}
                </div>
                {/* Image upload button */}
                <div className="relative group">
                  <button
                    type="button"
                    className="p-1 transition-colors rounded-md"
                    onClick={() => {/* TODO: Implement image upload */}}
                    disabled={isLoading}
                  >
                    <RiImageAddFill className="h-7 w-7 text-gray-400 dark:text-gray-200" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Upload image
                  </div>
                </div>
                {/* Web search button */}
                <div className="relative group">
                  <button
                    type="button"
                    className={`p-1 transition-colors rounded-md
                      ${webSearchMode ? '' : ''}
                      ${!isLoading ? 'hover:bg-gray-400' : ''}
                    `}
                    onClick={() => setWebSearchMode(v => !v)}
                    disabled={isLoading}
                    style={{
                      background: 'transparent',
                    }}
                  >
                    <IoGlobeOutline
                      className={`h-7 w-7
                        ${webSearchMode
                          ? 'text-gray-700 dark:text-white'
                          : 'text-gray-100 dark:text-gray-800'}
                      `}
                    />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Search the web
                  </div>
                </div>
                {/* AI Summarize button */}
                <div className="relative group">
                  <button
                    type="button"
                    className={`p-1 transition-colors rounded-md
                      ${aiSummarizeMode ? '' : ''}
                      ${!isLoading ? 'hover:bg-yellow-300' : ''}
                    `}
                    onClick={() => setAiSummarizeMode(v => !v)}
                    disabled={isLoading}
                    style={{
                      background: 'transparent',
                    }}
                  >
                    <MdOutlineLightbulb
                      className={`h-7 w-7
                        ${aiSummarizeMode
                          ? 'text-yellow-500 dark:text-yellow-300'
                          : 'text-gray-200 dark:text-gray-700'}
                      `}
                    />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    AI Summarize
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export default ChatInputArea; 