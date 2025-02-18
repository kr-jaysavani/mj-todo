"use client";
import { useEffect, useState } from "react";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  Program,
  AnchorProvider,
  web3,
  Idl,
  ProgramAccount,
} from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl.json";
import { ClipboardCheck, Edit, LoaderCircleIcon, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import BN from "bn.js";
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

// Good Practice: store the program ID in a constant
const programID = new PublicKey("7cpyWot5Ngskx5Ut9a16YL85VYZjf5Ea2SZ8Nf5aUK8i");

// for fix hydration error
const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  const IDL = JSON.parse(JSON.stringify(idl));
  const [todos, setTodos] = useState<ProgramAccount[]>([]);
  const [program, setProgram] = useState<Program<Idl>>();
  const [todoPDA, setTodoPDA] = useState<PublicKey>();
  const [isTodoInitialized, setIsTodoInitialized] = useState(false);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  let todo_id = 1;
  let todoIdBN = new BN(todo_id);
  const [isLoading, setIsLoading] = useState(false);
  const wallet = useAnchorWallet();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  console.log("🚀 ~ Home ~ editingTodo:", editingTodo);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  //   const [isTodoListLoading, setIsTodoListLoading] = useState(false);
  //   const [loadingState, setLoadingState] = useState<{
  //     isToogleLoading: boolean;
  //     isDeleteLoading: boolean;
  //     publickey: PublicKey | null;
  //   }>();

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const initialize_todo_list = async () => {
    if (!program || !publicKey) return;
    if (isTodoInitialized) return;
    try {
      const [todoPDA] = PublicKey.findProgramAddressSync(
        [todoIdBN.toArrayLike(Buffer, "le", 8), publicKey.toBuffer()],
        program.programId
      );
      setTodoPDA(todoPDA);
      try {
        const todos = await program.account.todoList.fetch(todoPDA);
        setTodos(todos || []);
        console.log("🚀 ~ constinitialize_todo_list= ~ todos:", todos);
        setIsTodoInitialized(true);
      } catch (error) {
        console.log("Error fetching user state:", error);
        // If user state doesn't exist, create it
        const txHash = await program.methods
          .initializeTodoList(todoIdBN)
          .accounts({
            signer: publicKey,
            todoList: todoPDA,
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc();

        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            signature: txHash,
            ...latestBlockhash,
          },
          "confirmed"
        );
        setIsTodoInitialized(true);
      }
    } catch (err) {
      console.error("Error initializing Todo:", err);
    }
  };

  const fetchTodos = async () => {
    if (!program || !publicKey || !todoPDA) return;
    try {
      const todos = await program.account.todoList.fetch(todoPDA);
      setTodos(todos);
    } catch (err) {
      console.error("Error fetching todos:", err);
    } finally {
      // setIsTodoListLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!program || !publicKey || !todoPDA) {
      console.log("Missing required state");
      return;
    }
    setIsLoading(true);

    try {
      const txHash = await program.methods
        .deleteTodo(todoIdBN)
        .accounts({
          signer: publicKey,
          todoList: todoPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockhash,
        },
        "confirmed"
      );
      todo_id++;
      todoIdBN = new BN(todo_id);
      setTodos([]);
      setIsTodoInitialized(false);
    } catch (err) {
      console.error("Error adding todo:", err);
    } finally {
      setIsAddLoading(false);
      setEditingTodo(null);
      setEditIndex(null);
    }
  };

  const handleFinished = async (index: number) => {
    if (!program || !publicKey || !todoPDA) {
      console.log("Missing required state");
      return;
    }
    setIsLoading(true);

    try {
      const txHash = await program.methods
        .finishTodo(todoIdBN, new BN(index))
        .accounts({
          signer: publicKey,
          todoList: todoPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockhash,
        },
        "confirmed"
      );
      fetchTodos();
    } catch (err) {
      console.error("Error adding todo:", err);
    } finally {
      setIsAddLoading(false);
      setEditingTodo(null);
      setEditIndex(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (e: any) => {
    e.preventDefault();

    if (
      !program ||
      !publicKey ||
      !editingTodo ||
      !todoPDA ||
      editIndex === null
    ) {
      console.log("Missing required state");
      return;
    }
    setIsLoading(true);

    try {
      const txHash = await program.methods
        .updateTodo(
          todoIdBN,
          new BN(editIndex),
          editingTodo.description,
          editingTodo.endDate
        )
        .accounts({
          signer: publicKey,
          todoList: todoPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockhash,
        },
        "confirmed"
      );
      fetchTodos();
    } catch (err) {
      console.error("Error adding todo:", err);
    } finally {
      setIsAddLoading(false);
      setEditingTodo(null);
      setEditIndex(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addTodo = async (e: any) => {
    e.preventDefault();

    if (
      !program ||
      !publicKey ||
      !title.trim() ||
      !description.trim() ||
      !endDate.trim() ||
      !todoPDA
    ) {
      console.log("Missing required state");
      return;
    }
    setIsLoading(true);

    try {
      setIsAddLoading(true);

      const txHash = await program.methods
        .addTodo(
          todoIdBN,
          title,
          description,
          new BN(new Date(endDate).getTime())
        )
        .accounts({
          signer: publicKey,
          todoList: todoPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockhash,
        },
        "confirmed"
      );
      fetchTodos();
    } catch (err) {
      console.error("Error adding todo:", err);
    } finally {
      setIsAddLoading(false);
    }
  };

  // First useEffect to set up program
  useEffect(() => {
    if (connected && wallet) {
      const provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
      );
      const program = new Program(IDL, programID, provider);
      setProgram(program);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, wallet, connection]);

  // Second useEffect to initialize user state when program is set
  useEffect(() => {
    if (program && publicKey) {
      initialize_todo_list();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, publicKey]);

  // Third useEffect to fetch todos when userState is set
  //   useEffect(() => {
  //     if (program && publicKey && todoPDA) {
  //       fetchTodos();
  //     }
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [program, publicKey, todoPDA]);

  if (!connected) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-24">
        <WalletMultiButtonDynamic />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-24 py-8">
      <div className="flex w-full justify-end mb-6">
        <WalletMultiButtonDynamic />
      </div>
      <div className="w-full max-w-2xl">
        <main className="container mx-auto p-4 w-full">
          {!isTodoInitialized ? (
            <div className="flex items-center justify-center mb-6 w-full">
              <Button onClick={() => initialize_todo_list()}>Initialize</Button>
            </div>
          ) : (
            <>
              <h1 className="flex justify-center text-3xl font-bold mb-6">
                Todo App
              </h1>
              <form onSubmit={addTodo} className="space-y-4 mb-8">
                <Input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
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
                <Button type="submit">Add Todo</Button>
              </form>
              {todos.todos.length !== 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      handleDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4" color="red" />
                  </Button>
                </div>
              )}
              <div className="bg-white rounded-lg shadow-md p-4 max-h-96 overflow-y-auto">
                {todos.todos.map((todo, index) => (
                  <div
                    className="flex items-center justify-between p-4 border-b"
                    key={index}
                  >
                    <div>
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold">{todo.title}</h3>
                        <p>
                          {todo.isCompleted ? (
                            <span className="text-green-500 text-xs">
                              Completed
                            </span>
                          ) : (
                            <span className="text-red-500 text-xs">
                              Pending
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {todo.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due:{" "}
                        {dateFormatter
                          .format(new Date(todo.endDate.toNumber()))
                          .replace(/\//g, "/")}
                      </p>
                    </div>
                    <div className="flex items-center ">
                      {!todo.isCompleted && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFinished(index)}
                          >
                            <ClipboardCheck className="h-4 w-4" color="green" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTodo(todo);
                          setEditIndex(index);
                        }}
                      >
                        <Edit className="h-4 w-4" color="brown" />
                      </Button>
                    </div>
                  </div>
                ))}
                {editingTodo && (
                  <Dialog
                    open={!!editingTodo}
                    onOpenChange={() => {
                      setEditingTodo(null);
                      setEditIndex(null);
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Todo</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdate}>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Description"
                            value={editingTodo.description}
                            onChange={(e) =>
                              setEditingTodo({
                                ...editingTodo,
                                description: e.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            type="date"
                            value={
                              new Date(editingTodo.endDate.toNumber())
                                .toISOString()
                                .split("T")[0]
                            }
                            onChange={(e) =>
                              setEditingTodo({
                                ...editingTodo,
                                endDate: new BN(
                                  new Date(e.target.value).getTime()
                                ),
                              })
                            }
                            required
                          />
                        </div>
                        <DialogFooter className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingTodo(null);
                              setEditIndex(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Save</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
