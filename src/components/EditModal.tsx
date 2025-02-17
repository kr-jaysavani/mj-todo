"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Todo } from "@/lib/types";
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
import { updateTodo } from "@/lib/actions";

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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Todo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
