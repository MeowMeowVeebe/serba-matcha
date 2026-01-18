"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tabs } from "@/components/ui/Tabs";
import { FileUpload } from "@/components/ui/FileUpload";
import { SearchInput, highlightText } from "@/components/ui/SearchInput";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ComponentsDemo() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Searching for:", query);
  };

  const handleFileUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
    showToast(`${files.length} file(s) uploaded successfully`, "success");
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Component Showcase</h1>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
        Demonstrasi semua komponen UI baru
      </p>

      <Breadcrumbs showHome />

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Modal & Toast Demo */}
        <Card variant="bordered">
          <CardHeader title="Modal & Toast" description="Dialog dan notification system" />
          <CardBody>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Open Modal
              </Button>
              <Button variant="danger" onClick={() => setShowConfirm(true)}>
                Confirm Action
              </Button>
              <Button variant="success" onClick={() => showToast("Success message!", "success")}>
                Show Success
              </Button>
              <Button variant="secondary" onClick={() => showToast("Error occurred!", "error")}>
                Show Error
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Dropdown Demo */}
        <Card variant="bordered">
          <CardHeader title="Dropdown Menu" description="Context menu dan actions" />
          <CardBody>
            <Dropdown
              trigger={<Button variant="secondary">Open Menu ▾</Button>}
              items={[
                { key: "edit", label: "Edit", icon: "✏️", onClick: () => showToast("Edit clicked", "info") },
                { key: "copy", label: "Copy", icon: "📋", onClick: () => showToast("Copied!", "success") },
                "divider",
                { key: "delete", label: "Delete", icon: "🗑️", danger: true, onClick: () => showToast("Deleted", "error") },
              ]}
            />
          </CardBody>
        </Card>

        {/* Tabs Demo */}
        <Card variant="bordered">
          <CardHeader title="Tabs Navigation" description="Organize content dalam tabs" />
          <CardBody>
            <Tabs
              tabs={[
                {
                  key: "overview",
                  label: "Overview",
                  icon: "📊",
                  content: <div>Overview content here</div>,
                },
                {
                  key: "settings",
                  label: "Settings",
                  icon: "⚙️",
                  badge: "3",
                  content: <div>Settings content here</div>,
                },
                {
                  key: "help",
                  label: "Help",
                  icon: "❓",
                  content: <div>Help content here</div>,
                },
              ]}
              variant="pills"
            />
          </CardBody>
        </Card>

        {/* Search Demo */}
        <Card variant="bordered">
          <CardHeader title="Search Input" description="Debounced search dengan highlighting" />
          <CardBody>
            <SearchInput onSearch={handleSearch} placeholder="Search something..." />
            <div style={{ marginTop: "16px" }}>
              <p>Sample text: {highlightText("This is a sample text with highlighting", searchQuery)}</p>
            </div>
          </CardBody>
        </Card>

        {/* File Upload Demo */}
        <Card variant="bordered">
          <CardHeader title="File Upload" description="Drag & drop file uploader" />
          <CardBody>
            <FileUpload
              accept="image/*"
              multiple
              maxSize={5 * 1024 * 1024}
              onFilesSelected={handleFileUpload}
              helperText="Max 5MB per file. Supports images only."
            />
          </CardBody>
        </Card>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        description="This is a demo modal"
        footer={
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowModal(false)}>
              Save
            </Button>
          </div>
        }
      >
        <p>Modal content goes here. You can put any components inside.</p>
      </Modal>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          showToast("Action confirmed!", "success");
          setShowConfirm(false);
        }}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action?"
        variant="danger"
      />
    </div>
  );
}
