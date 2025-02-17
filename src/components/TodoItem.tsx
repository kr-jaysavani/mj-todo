import type { Todo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onEdit: () => void;
}

export default function TodoItem({ todo, onEdit }: TodoItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h3 className="font-semibold">{todo.title}</h3>
        <p className="text-sm text-gray-600">{todo.description}</p>
        <p className="text-xs text-gray-500">Due: {todo.endDate}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
}
