"use client"

import { useState } from "react"
import type { Todo } from "@/lib/types"
import TodoItem from "./TodoItem"
import EditModal from "./EditModal"

interface TodoListProps {
  initialTodos: Todo[]
}

export default function TodoList({ initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState(initialTodos)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
  }

  const handleUpdate = (updatedTodo: Todo) => {
    setTodos(todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)))
    setEditingTodo(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-h-96 overflow-y-auto">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onEdit={() => handleEdit(todo)} />
      ))}
      {editingTodo && <EditModal todo={editingTodo} onClose={() => setEditingTodo(null)} onUpdate={handleUpdate} />}
    </div>
  )
}

