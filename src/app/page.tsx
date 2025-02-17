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
import { Anchor, LoaderCircleIcon } from "lucide-react";
import dynamic from "next/dynamic";
import AddTodoForm from "@/components/AddTodoForm";
import TodoList from "@/components/TodoList";
import BN from "bn.js";

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
  const [input, setInput] = useState("");
  const [program, setProgram] = useState<Program<Idl>>();
  const [todoPDA, setTodoPDA] = useState<PublicKey>();
  const [isTodoInitialized, setIsTodoInitialized] = useState(false);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const todo_id = 1;
  const todoIdBN = new BN(todo_id);

  const wallet = useAnchorWallet();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  //   const [isTodoListLoading, setIsTodoListLoading] = useState(false);
  //   const [loadingState, setLoadingState] = useState<{
  //     isToogleLoading: boolean;
  //     isDeleteLoading: boolean;
  //     publickey: PublicKey | null;
  //   }>();

  const initialize_todo_list = async () => {
    if (!program || !publicKey) return;
    if (isTodoInitialized) return;

    try {
      const [todoPDA] = await PublicKey.findProgramAddressSync(
        [todoIdBN.toArrayLike(Buffer, "le", 8), publicKey.toBuffer()],
        program.programId
      );
      setTodoPDA(todoPDA);
      try {
        const todos = await program.account.todoList.fetch(todoPDA);
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

  //   const fetchTodos = async () => {
  //     if (!program || !publicKey || !todoPDA) return;
  //     // setIsTodoListLoading(true);
  //     try {
  //       const todos = await program.account.TodoList.fetch(todoPDA);

  //       console.log("🚀 ~ fetchTodos ~ todos:", todos);
  //       setTodos(todos);
  //     } catch (err) {
  //       console.error("Error fetching todos:", err);
  //     } finally {
  //       //   setIsTodoListLoading(false);
  //     }
  //   };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addTodo = async (e: any) => {
    e.preventDefault();
    console.log("Adding todo with state:", {
      program: !!program,
      publicKey: !!publicKey,
      input,
      userState: userState?.toString(),
    });

    if (!program || !publicKey || !input || !userState) {
      console.log("Missing required state:", {
        program: !!program,
        publicKey: !!publicKey,
        input: !!input,
        userState: !!userState,
      });
      return;
    }

    try {
      setIsAddLoading(true);

      const userStateAccount = await program.account.userState.fetch(userState);
      console.log("User state account:", userStateAccount);
      const todoCount = userStateAccount.todoCount;
      // Todo : check later
      // # SOLDEVS

      // | Aspect         | Using PDAs                          | Without PDAs                               |
      // |----------------|-------------------------------------|--------------------------------------------|
      // | Uniqueness     | Guaranteed by PDA derivation        | Requires manual logic to ensure uniqueness |
      // | Security       | PDAs are owned by the program       | Accounts may be owned by users, increasing risk |
      // | Scalability    | Each Todo is a separate account, scalable | Limited by account size or manual management |
      // | Ease of Lookup | Easy to calculate addresses using seeds | Requires additional logic to find accounts |
      // | Complexity     | Simple and idiomatic in Anchor      | More complex and error-prone               |

      // little-endian => least significant byte is stored first
      const [todoPDA] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from("todo"),
          userState.toBuffer(),
          new Uint8Array(todoCount.toArrayLike(Buffer, "le", 8)),
        ],
        program.programId
      );

      // # SOLDEVS
      // yes
      // authority => auth // The field name can be anything valid in Rust

      // console.log("Todo PDA:", todoPDA.toString());

      const txHash = await program.methods
        .addTodo(input)
        .accounts({
          todo: todoPDA,
          userState: userState,
          user: publicKey,
          authority: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      // 'processed': Query the most recent block which has reached 1 confirmation by the connected node
      // 'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
      // 'finalized': Query the most recent block which has been finalized by the cluster
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockhash,
        },
        "finalized"
      );
      setInput("");
      fetchTodos();
    } catch (err) {
      console.error("Error adding todo:", err);
    } finally {
      setIsAddLoading(false);
    }
  };
  const toggleTodo = async (todoPublicKey: web3.PublicKey) => {
    if (!program || !publicKey) return;

    try {
      setLoadingState({
        isToogleLoading: true,
        isDeleteLoading: false,
        publickey: todoPublicKey,
      });
      const txHash = await program.methods
        .toggleCompleted()
        .accounts({
          todo: todoPublicKey,
          authority: publicKey,
        })
        .rpc();
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockhash,
        },
        "finalized"
      );

      fetchTodos();
    } catch (err) {
      console.error("Error toggling todo:", err);
    } finally {
      setLoadingState({
        isToogleLoading: false,
        isDeleteLoading: false,
        publickey: null,
      });
    }
  };

  const deleteTodo = async (todoPublicKey: web3.PublicKey) => {
    if (!program || !publicKey) return;

    try {
      setLoadingState({
        isToogleLoading: false,
        isDeleteLoading: true,
        publickey: todoPublicKey,
      });
      const txHash = await program.methods
        .deleteTodo()
        .accounts({
          todo: todoPublicKey,
          authority: publicKey,
        })
        .rpc();

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockhash,
        },
        "finalized"
      );

      fetchTodos();
    } catch (err) {
      console.error("Error deleting todo:", err);
    } finally {
      setLoadingState({
        isToogleLoading: false,
        isDeleteLoading: false,
        publickey: null,
      });
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
      console.log("Available instructions:", Object.keys(program.methods));
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
        <main className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Todo App</h1>
          {/* <AddTodoForm />
          <TodoList initialTodos={todos} /> */}
        </main>
      </div>
    </div>
  );
}
