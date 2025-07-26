
import React, { useState, useRef } from 'react';
import PaperclipIcon from './icons/PaperclipIcon';
import SendIcon from './icons/SendIcon';

interface MessageInputProps {
  onSendMessage: (text: string, image?: File) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Reset file input value to allow re-uploading the same file
      e.target.value = '';
    }
  };
  
  const removeImage = () => {
    setImageFile(null);
    if(imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  }

  const handleSend = () => {
    if ((text.trim() || imageFile) && !isLoading) {
      onSendMessage(text.trim(), imageFile || undefined);
      setText('');
      removeImage();
      if(textareaRef.current){
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <div className="max-w-4xl mx-auto">
        {imagePreview && (
            <div className="relative inline-block mb-2">
                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                <button 
                    onClick={removeImage} 
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold focus:outline-none"
                    aria-label="Remove image"
                >
                    &times;
                </button>
            </div>
        )}
        <div className="flex items-end gap-2 p-2 bg-slate-800 rounded-xl border border-slate-700 focus-within:border-purple-500 transition-all duration-200">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-purple-400 transition-colors duration-200 rounded-full hover:bg-slate-700 disabled:opacity-50"
            disabled={isLoading}
            aria-label="Attach file"
          >
            <PaperclipIcon />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={1}
            placeholder="Send a message or upload a moodboard..."
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 resize-none focus:outline-none max-h-40"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && !imageFile)}
            className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
    </div>
  );
};

export default MessageInput;
