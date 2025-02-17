import React, { useState, useEffect } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, Provider, web3 } from "@project-serum/anchor";
import idl from "../idl.json"; // Import your IDL file
import { PublicKey } from "@solana/web3.js";
const { SystemProgram, Keypair } = web3;
const programID = new PublicKey("7cpyWot5Ngskx5Ut9a16YL85VYZjf5Ea2SZ8Nf5aUK8i");

export const TodoList = () => {
  const [todoListId, setTodoListId] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    endDate: "",
  });
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const getProvider = () => {
    if (!wallet) return null;
    return new Provider(connection, wallet, { commitment: "confirmed" });
  };

  const program = new Program(idl, programID, getProvider());

  const initializeTodoList = async () => {
    if (!wallet) return;
    const todoListAccount = Keypair.generate();
    await program.rpc.initializeTodoList(new anchor.BN(todoListId), {
      accounts: {
        signer: wallet.publicKey,
        todoList: todoListAccount.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [todoListAccount],
    });
    setTodoListId(todoListAccount.publicKey.toString());
  };

  const addTodo = async () => {
    if (!wallet || !todoListId) return;
    await program.rpc.addTodo(
      new anchor.BN(todoListId),
      newTodo.title,
      newTodo.description,
      new anchor.BN(newTodo.endDate),
      {
        accounts: {
          signer: wallet.publicKey,
          todoList: todoListId,
          systemProgram: SystemProgram.programId,
        },
      }
    );
    fetchTodos();
  };

  const fetchTodos = async () => {
    if (!wallet || !todoListId) return;
    const todoListAccount = await program.account.todoList.fetch(todoListId);
    setTodos(todoListAccount.todos);
  };

  useEffect(() => {
    if (wallet && todoListId) {
      fetchTodos();
    }
  }, [wallet, todoListId]);

  return (
    <div>
      <h1>Todo List</h1>
      <button onClick={initializeTodoList}>Initialize Todo List</button>
      <div>
        <input
          type="text"
          placeholder="Title"
          value={newTodo.title}
          onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newTodo.description}
          onChange={(e) =>
            setNewTodo({ ...newTodo, description: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="End Date"
          value={newTodo.endDate}
          onChange={(e) => setNewTodo({ ...newTodo, endDate: e.target.value })}
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      <ul>
        {todos.map((todo, index) => (
          <li key={index}>
            <h3>{todo.title}</h3>
            <p>{todo.description}</p>
            <p>End Date: {todo.endDate.toString()}</p>
            <p>{todo.isCompleted ? "Completed" : "Pending"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
