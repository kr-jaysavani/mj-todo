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
import { LoaderCircleIcon } from "lucide-react";
import dynamic from "next/dynamic";

// Good Practice: store the program ID in a constant
const programID = new PublicKey("BxGog9Jhza4jQU5msNtPivi65Y3GLPFpGPotrAmxR9gn");

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
  const [userState, setUserState] = useState<PublicKey>();
  const [isAddLoading, setIsAddLoading] = useState(false);

  const wallet = useAnchorWallet();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [isTodoListLoading, setIsTodoListLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<{
    isToogleLoading: boolean;
    isDeleteLoading: boolean;
    publickey: PublicKey | null;
  }>();

  const initializeUserState = async () => {
    if (!program || !publicKey) return;

    try {
      // Program Derived Address (PDA) for user state
      // Using a program derived address:

      // You can give a program the authority over an account.
      // Later transfer that authority to another.
      // This is possible because the program can act as the signer in the transaction that gives it the authority.

      const [userStatePDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("user-state"), publicKey.toBuffer()],
        program.programId
      );

      // Set userState PDA immediately
      setUserState(userStatePDA);
      // console.log(
      //   "🚀 ~ initializeUserState ~ userStatePDA",
      //   await PublicKey.findProgramAddressSync(
      //     [Buffer.from("user-state"), publicKey.toBuffer()],
      //     program.programId
      //   )
      // );

      // Check if the account exists
      try {
        await program.account.userState.fetch(userStatePDA);
      } catch (error) {
        console.log("Error fetching user state:", error);
        // If user state doesn't exist, create it
        await program.methods
          .initializeUser()
          .accounts({
            userState: userStatePDA,
            authority: publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .rpc();
      }
    } catch (err) {
      console.error("Error initializing user state:", err);
    }
  };

  //   const fetchTodos = async () => {
  //     if (!program || !publicKey || !userState) return;
  //     setIsTodoListLoading(true);
  //     try {
  //       const account = await program.account.todo.all([
  //         {
  //           // # SOLDEVS
  //           // discriminator is an 8-byte identifier that Anchor automatically adds to the beginning of each account's data. It is used to uniquely identify the type of account (e.g., UserState, Todo) and ensure type safety when interacting with accounts on-chain.
  //           // Type Safety:ensures that you are working with the correct account type
  //           // Serialization/Deserialization: Anchor automatically serializes and deserializes account data into a Rust struct
  //           // Filtering Accounts: when fetching accounts using program.account.<type>.all() Anchor automatically filters accounts based on the discriminator
  //           memcmp: {
  //             offset: 8, // start comparing after the discriminator
  //             bytes: publicKey.toBase58(), // compare the public key
  //           },
  //         },
  //       ]);
  //       console.log("🚀 ~ fetchTodos ~ account:", account);
  //       setTodos(account);
  //     } catch (err) {
  //       console.error("Error fetching todos:", err);
  //     } finally {
  //       setIsTodoListLoading(false);
  //     }
  //   };

  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   const addTodo = async (e: any) => {
  //     e.preventDefault();
  //     console.log("Adding todo with state:", {
  //       program: !!program,
  //       publicKey: !!publicKey,
  //       input,
  //       userState: userState?.toString(),
  //     });

  //     if (!program || !publicKey || !input || !userState) {
  //       console.log("Missing required state:", {
  //         program: !!program,
  //         publicKey: !!publicKey,
  //         input: !!input,
  //         userState: !!userState,
  //       });
  //       return;
  //     }

  //     try {
  //       setIsAddLoading(true);

  //       const userStateAccount = await program.account.userState.fetch(userState);
  //       console.log("User state account:", userStateAccount);
  //       const todoCount = userStateAccount.todoCount;
  //       // Todo : check later
  //       // # SOLDEVS

  //       // | Aspect         | Using PDAs                          | Without PDAs                               |
  //       // |----------------|-------------------------------------|--------------------------------------------|
  //       // | Uniqueness     | Guaranteed by PDA derivation        | Requires manual logic to ensure uniqueness |
  //       // | Security       | PDAs are owned by the program       | Accounts may be owned by users, increasing risk |
  //       // | Scalability    | Each Todo is a separate account, scalable | Limited by account size or manual management |
  //       // | Ease of Lookup | Easy to calculate addresses using seeds | Requires additional logic to find accounts |
  //       // | Complexity     | Simple and idiomatic in Anchor      | More complex and error-prone               |

  //       // little-endian => least significant byte is stored first
  //       const [todoPDA] = await PublicKey.findProgramAddressSync(
  //         [
  //           Buffer.from("todo"),
  //           userState.toBuffer(),
  //           new Uint8Array(todoCount.toArrayLike(Buffer, "le", 8)),
  //         ],
  //         program.programId
  //       );

  //       // # SOLDEVS
  //       // yes
  //       // authority => auth // The field name can be anything valid in Rust

  //       // console.log("Todo PDA:", todoPDA.toString());

  //       const txHash = await program.methods
  //         .addTodo(input)
  //         .accounts({
  //           todo: todoPDA,
  //           userState: userState,
  //           user: publicKey,
  //           authority: publicKey,
  //           systemProgram: web3.SystemProgram.programId,
  //         })
  //         .rpc();
  //       // 'processed': Query the most recent block which has reached 1 confirmation by the connected node
  //       // 'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
  //       // 'finalized': Query the most recent block which has been finalized by the cluster
  //       const latestBlockhash = await connection.getLatestBlockhash();
  //       await connection.confirmTransaction(
  //         {
  //           signature: txHash,
  //           ...latestBlockhash,
  //         },
  //         "finalized"
  //       );
  //       setInput("");
  //       fetchTodos();
  //     } catch (err) {
  //       console.error("Error adding todo:", err);
  //     } finally {
  //       setIsAddLoading(false);
  //     }
  //   };
  //   const toggleTodo = async (todoPublicKey: web3.PublicKey) => {
  //     if (!program || !publicKey) return;

  //     try {
  //       setLoadingState({
  //         isToogleLoading: true,
  //         isDeleteLoading: false,
  //         publickey: todoPublicKey,
  //       });
  //       const txHash = await program.methods
  //         .toggleCompleted()
  //         .accounts({
  //           todo: todoPublicKey,
  //           authority: publicKey,
  //         })
  //         .rpc();
  //       const latestBlockhash = await connection.getLatestBlockhash();
  //       await connection.confirmTransaction(
  //         {
  //           signature: txHash,
  //           ...latestBlockhash,
  //         },
  //         "finalized"
  //       );

  //       fetchTodos();
  //     } catch (err) {
  //       console.error("Error toggling todo:", err);
  //     } finally {
  //       setLoadingState({
  //         isToogleLoading: false,
  //         isDeleteLoading: false,
  //         publickey: null,
  //       });
  //     }
  //   };

  //   const deleteTodo = async (todoPublicKey: web3.PublicKey) => {
  //     if (!program || !publicKey) return;

  //     try {
  //       setLoadingState({
  //         isToogleLoading: false,
  //         isDeleteLoading: true,
  //         publickey: todoPublicKey,
  //       });
  //       const txHash = await program.methods
  //         .deleteTodo()
  //         .accounts({
  //           todo: todoPublicKey,
  //           authority: publicKey,
  //         })
  //         .rpc();

  //       const latestBlockhash = await connection.getLatestBlockhash();
  //       await connection.confirmTransaction(
  //         {
  //           signature: txHash,
  //           ...latestBlockhash,
  //         },
  //         "finalized"
  //       );

  //       fetchTodos();
  //     } catch (err) {
  //       console.error("Error deleting todo:", err);
  //     } finally {
  //       setLoadingState({
  //         isToogleLoading: false,
  //         isDeleteLoading: false,
  //         publickey: null,
  //       });
  //     }
  //   };

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
      initializeUserState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, publicKey]);

  // Third useEffect to fetch todos when userState is set
  useEffect(() => {
    if (program && publicKey && userState) {
      fetchTodos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, publicKey, userState]);

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
        {/* <form onSubmit={addTodo} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-lg border p-2"
              placeholder="Add a new todo..."
            />
            <button
              type="submit"
              disabled={
                !input.trim() ||
                loadingState?.isDeleteLoading ||
                loadingState?.isToogleLoading
              }
              className={`${
                !input.trim() ||
                loadingState?.isDeleteLoading ||
                loadingState?.isToogleLoading
                  ? "opacity-50 rounded-lg bg-blue-500 px-4 py-2 text-white"
                  : "rounded-lg bg-blue-500 px-4 py-2 text-white"
              } `}
            >
              {isAddLoading ? (
                <LoaderCircleIcon className="animate-spin" size={20} />
              ) : (
                "Add"
              )}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {isTodoListLoading ? (
            <LoaderCircleIcon
              className="animate-spin flex w-full justify-center"
              size={15}
            />
          ) : (
            todos.map((todo) => (
              <div
                key={todo.publicKey.toString()}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  {loadingState?.isToogleLoading &&
                  loadingState.publickey?.equals(todo.publicKey) ? (
                    <LoaderCircleIcon className="animate-spin" size={20} />
                  ) : (
                    <input
                      type="checkbox"
                      checked={todo.account.markedCompleted}
                      onChange={() => toggleTodo(todo.publicKey)}
                      className="h-5 w-5"
                    />
                  )}
                  <span
                    className={`${
                      todo.account.markedCompleted ? "line-through" : ""
                    }`}
                  >
                    {todo.account.content}
                  </span>
                </div>
                <button
                  onClick={() => deleteTodo(todo.publicKey)}
                  disabled={
                    loadingState?.isDeleteLoading &&
                    loadingState.publickey?.equals(todo.publicKey)
                  }
                  className="flex justify-center items-center rounded bg-red-500 px-3 py-1 text-white w-20 h-9"
                >
                  {loadingState?.isDeleteLoading &&
                  loadingState.publickey?.equals(todo.publicKey) ? (
                    <LoaderCircleIcon className="animate-spin" size={20} />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            ))
          )}
        </div> */}
      </div>
    </div>
  );
}
