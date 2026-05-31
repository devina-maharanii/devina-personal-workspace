"use client";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Code,
  Table as TableIcon,
} from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("Enter link URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-900/60 border-b border-zinc-900">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("bold") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("italic") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("underline") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("strike") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-zinc-850 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("heading", { level: 1 }) ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("heading", { level: 2 }) ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("heading", { level: 3 }) ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-zinc-850 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("bulletList") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("orderedList") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("taskList") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Task List"
      >
        <CheckSquare className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-zinc-850 mx-1" />
      <button
        type="button"
        onClick={addLink}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("link") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Insert Link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded hover:bg-zinc-800 transition-colors cursor-pointer ${
          editor.isActive("codeBlock") ? "bg-zinc-800 text-indigo-400" : "text-zinc-400"
        }`}
        title="Insert Code Block"
      >
        <Code className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={addTable}
        className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        title="Insert Table"
      >
        <TableIcon className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-zinc-850 mx-1" />
      {/* UploadThing button helper for inline editor images */}
      <div className="scale-85 origin-left flex items-center">
        <UploadButton
          endpoint="blogImage"
          onClientUploadComplete={(res) => {
            if (res?.[0]) {
              editor.chain().focus().setImage({ src: res[0].url }).run();
            }
          }}
          onUploadError={(err) => {
            alert(`Image upload error: ${err.message}`);
          }}
        />
      </div>
    </div>
  );
}
