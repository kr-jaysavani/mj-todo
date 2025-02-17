import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// You would need to import your IDL and set your program ID
import idl from './idl.json';
const programId = new PublicKey('YOUR_PROGRAM_ID');

const TodoApp = () => {
  const wallet = useWallet();
  const [program, setProgram] = useState(null);
  const [todoList, setTodoList] = useState(null);
  const [todos, setTodos] = useState([]);
  const [todoListId, setTodoListId] = useState(1); // Example todoListId
  
  // Form states
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [newTodoEndDate, setNewTodoEndDate] = useState('');
  
  const [editingTodo, setEditingTodo] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  useEffect(() => {
    if (wallet.connected) {
      const provider = new AnchorProvider(
        new Connection('https://api.devnet.solana.com'),
        wallet,
        { preflightCommitment: 'processed' }
      );
      const program = new Program(idl, programId, provider);
      setProgram(program);
      fetchTodoList();
    }
  }, [wallet.connected]);

  const fetchTodoList = async () => {
    if (!program) return;
    try {
      const [todoListPda] = await PublicKey.findProgramAddress(
        [Buffer.from('todo_list'), Buffer.from(todoListId.toString())],
        programId
      );
      const todoListAccount = await program.account.todoList.fetch(todoListPda);
      setTodoList(todoListAccount);
      setTodos(todoListAccount.todos || []);
    } catch (error) {
      console.error("Error fetching todo list:", error);
      toast.error("Failed to load todo list");
    }
  };

  const initializeTodoList = async () => {
    if (!program) return;
    try {
      const [todoListPda] = await PublicKey.findProgramAddress(
        [Buffer.from('todo_list'), Buffer.from(todoListId.toString())],
        programId
      );
      await program.methods.initializeTodoList(new web3.BN(todoListId))
        .accounts({
          signer: wallet.publicKey,
          todoList: todoListPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      toast.success("Todo list initialized!");
      fetchTodoList();
    } catch (error) {
      console.error("Error initializing todo list:", error);
      toast.error("Failed to initialize todo list");
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!program || !newTodoTitle) return;
    try {
      const [todoListPda] = await PublicKey.findProgramAddress(
        [Buffer.from('todo_list'), Buffer.from(todoListId.toString())],
        programId
      );
      
      // Convert date string to Unix timestamp (milliseconds)
      const endDateTimestamp = new Date(newTodoEndDate).getTime();
      
      await program.methods.addTodo(
        new web3.BN(todoListId),
        newTodoTitle,
        newTodoDescription,
        new web3.BN(endDateTimestamp)
      )
        .accounts({
          signer: wallet.publicKey,
          todoList: todoListPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      toast.success("Todo added successfully!");
      setNewTodoTitle('');
      setNewTodoDescription('');
      setNewTodoEndDate('');
      fetchTodoList();
    } catch (error) {
      console.error("Error adding todo:", error);
      toast.error("Failed to add todo");
    }
  };

  const startEditTodo = (todo, index) => {
    setEditingTodo({ ...todo, index });
    setEditDescription(todo.description);
    // Convert timestamp to date string
    const date = new Date(parseInt(todo.endDate.toString()));
    setEditEndDate(date.toISOString().split('T')[0]);
  };

  const updateTodo = async (e) => {
    e.preventDefault();
    if (!program || !editingTodo) return;
    try {
      const [todoListPda] = await PublicKey.findProgramAddress(
        [Buffer.from('todo_list'), Buffer.from(todoListId.toString())],
        programId
      );
      
      // Convert date string to Unix timestamp (milliseconds)
      const endDateTimestamp = new Date(editEndDate).getTime();
      
      await program.methods.updateTodo(
        new web3.BN(todoListId),
        new web3.BN(editingTodo.index), // Assuming index corresponds to todoId
        editDescription,
        new web3.BN(endDateTimestamp)
      )
        .accounts({
          signer: wallet.publicKey,
          todoList: todoListPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      toast.success("Todo updated successfully!");
      setEditingTodo(null);
      fetchTodoList();
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update todo");
    }
  };

  const finishTodo = async (index) => {
    if (!program) return;
    try {
      const [todoListPda] = await PublicKey.findProgramAddress(
        [Buffer.from('todo_list'), Buffer.from(todoListId.toString())],
        programId
      );
      
      await program.methods.finishTodo(
        new web3.BN(todoListId),
        new web3.BN(index) // Assuming index corresponds to todoId
      )
        .accounts({
          signer: wallet.publicKey,
          todoList: todoListPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      toast.success("Todo marked as finished!");
      fetchTodoList();
    } catch (error) {
      console.error("Error finishing todo:", error);
      toast.error("Failed to finish todo");
    }
  };

  const deleteTodoList = async () => {
    if (!program) return;
    try {
      const [todoListPda] = await PublicKey.findProgramAddress(
        [Buffer.from('todo_list'), Buffer.from(todoListId.toString())],
        programId
      );
      
      await program.methods.deleteTodo(new web3.BN(todoListId))
        .accounts({
          signer: wallet.publicKey,
          todoList: todoListPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      toast.success("Todo list deleted!");
      setTodos([]);
      setTodoList(null);
    } catch (error) {
      console.error("Error deleting todo list:", error);
      toast.error("Failed to delete todo list");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-right" />
      <h1 className="text-3xl font-bold mb-6">Solana Todo App</h1>
      
      {/* <div className="mb-6">
        <WalletMultiButton className="mb-4" />
        {wallet.connected && !todoList && (
          <button 
            onClick={initializeTodoList}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Initialize Todo List
          </button>
        )}
      </div> */}

      {wallet.connected && todoList && (
        <>
          {/* Add Todo Form */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Todo</h2>
            <form onSubmit={addTodo}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTodoDescription}
                  onChange={(e) => setNewTodoDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={newTodoEndDate}
                  onChange={(e) => setNewTodoEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Add Todo
              </button>
            </form>
          </div>

          {/* Edit Todo Form */}
          {editingTodo && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Edit Todo</h2>
              <form onSubmit={updateTodo}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Title (cannot be changed)</label>
                  <input
                    type="text"
                    value={editingTodo.title}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-100"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Update Todo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTodo(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Todo List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Todos</h2>
              <div>
                <span className="mr-4">
                  Finished: {todoList.finishedTodos.toString()}, Pending: {todoList.pendingTodos.toString()}
                </span>
                <button
                  onClick={deleteTodoList}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Delete All Todos
                </button>
              </div>
            </div>
            
            {todos.length === 0 ? (
              <p className="text-gray-500">No todos yet. Add your first todo above!</p>
            ) : (
              <ul className="space-y-4">
                {todos.map((todo, index) => (
                  <li 
                    key={index} 
                    className={`border p-4 rounded ${todo.isCompleted ? 'bg-green-50' : 'bg-white'}`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{todo.title}</h3>
                        <p className="text-gray-600 mt-1">{todo.description}</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Due: {new Date(parseInt(todo.endDate.toString())).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {!todo.isCompleted && (
                          <button
                            onClick={() => startEditTodo(todo, index)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {!todo.isCompleted && (
                          <button
                            onClick={() => finishTodo(index)}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                          >
                            Finish
                          </button>
                        )}
                        {todo.isCompleted && (
                          <span className="bg-green-200 text-green-800 px-3 py-1 rounded">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {!wallet.connected && (
        <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
          <p className="text-yellow-800">
            Please connect your wallet to use the Todo App
          </p>
        </div>
      )}
    </div>
  );
};

export default TodoApp;