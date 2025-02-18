"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
interface EditModalProps {
  todo: Todo;
  onClose: () => void;
  onUpdate: (updatedTodo: Todo) => void;
}

export default function EditModal({ todo, onClose, onUpdate }: EditModalProps) {
  const [description, setDescription] = useState(todo.description);
  const [endDate, setEndDate] = useState(todo.endDate);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTodo = await updateTodo({ ...todo, description, endDate });
    onUpdate(updatedTodo);
    router.refresh();
  };

  return (
   
  );
}
