"use client";
import React from "react";
import type { TemplateFolder } from "@/features/playground/libs/path-to-json";

interface PlaygroundEditorClientProps {
  templateData: TemplateFolder;
}

const PlaygroundEditorClient: React.FC<PlaygroundEditorClientProps> = ({
  templateData: _templateData,
}) => {
  return null;
};

export default PlaygroundEditorClient;